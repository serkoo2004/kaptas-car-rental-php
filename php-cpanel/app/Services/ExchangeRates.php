<?php

declare(strict_types=1);

namespace Kaptas\Services;

use Kaptas\Core\Config;
use RuntimeException;
use SimpleXMLElement;

final class ExchangeRates
{
    private const CACHE_SECONDS = 1800;
    private const STALE_SECONDS = 86400;

    public static function snapshot(bool $allowEmergencyFallback = true): array
    {
        $cachePath = KAPTAS_ROOT . '/storage/cache/exchange-rates.json';
        $cached = self::readCache($cachePath);
        if ($cached && time() - (int) $cached['fetchedAt'] < self::CACHE_SECONDS) {
            return $cached['snapshot'];
        }

        foreach (['tcmb', 'frankfurter'] as $provider) {
            try {
                $snapshot = $provider === 'tcmb' ? self::fromTcmb() : self::fromFrankfurter();
                self::writeCache($cachePath, $snapshot);
                return $snapshot;
            } catch (\Throwable $error) {
                error_log('Kur servisi hatasi (' . $provider . '): ' . $error->getMessage());
            }
        }

        if ($cached && time() - (int) $cached['fetchedAt'] < self::STALE_SECONDS) {
            return [...$cached['snapshot'], 'stale' => true];
        }
        if ($allowEmergencyFallback) {
            return [
                'asOf' => '2026-08-16',
                'provider' => 'Frankfurter son bilinen kur',
                'rates' => [
                    ['buying' => 47.192, 'code' => 'USD', 'selling' => 47.192],
                    ['buying' => 53.937, 'code' => 'EUR', 'selling' => 53.937],
                ],
                'stale' => true,
            ];
        }
        throw new RuntimeException('Doviz kuru servisine ulasilamadi.');
    }

    public static function currency(?string $value): string
    {
        $currency = strtoupper(trim((string) $value));
        return in_array($currency, ['TRY', 'USD', 'EUR'], true) ? $currency : 'TRY';
    }

    public static function convertUsd(float $amount, string $currency, ?array $snapshot = null): float
    {
        if ($amount < 0 || !is_finite($amount)) {
            throw new RuntimeException('Gecersiz USD tutari.');
        }
        if ($currency === 'USD') {
            return round($amount, 2);
        }
        $snapshot ??= self::snapshot();
        $rates = [];
        foreach ($snapshot['rates'] as $rate) {
            $rates[$rate['code']] = (float) $rate['selling'];
        }
        if (($rates['USD'] ?? 0) <= 0 || ($rates['EUR'] ?? 0) <= 0) {
            throw new RuntimeException('Kur bilgisi eksik.');
        }
        $converted = $currency === 'TRY'
            ? $amount * $rates['USD']
            : ($amount * $rates['USD']) / $rates['EUR'];
        return round($converted, 2);
    }

    private static function fromTcmb(): array
    {
        $xml = self::get('https://www.tcmb.gov.tr/kurlar/today.xml', 'application/xml');
        $document = new SimpleXMLElement($xml);
        $rates = [];
        foreach ($document->Currency as $currency) {
            $code = (string) $currency['CurrencyCode'];
            if (!in_array($code, ['USD', 'EUR'], true)) {
                continue;
            }
            $buying = (float) str_replace(',', '.', (string) $currency->ForexBuying);
            $selling = (float) str_replace(',', '.', (string) $currency->ForexSelling);
            if ($buying <= 0 || $selling <= 0) {
                throw new RuntimeException('TCMB kur verisi gecersiz.');
            }
            $rates[] = compact('buying', 'code', 'selling');
        }
        if (count($rates) !== 2) {
            throw new RuntimeException('TCMB kur verisi eksik.');
        }
        return [
            'asOf' => (string) ($document['Date'] ?: date('Y-m-d')),
            'provider' => 'TCMB',
            'rates' => $rates,
            'stale' => false,
        ];
    }

    private static function fromFrankfurter(): array
    {
        $payload = json_decode(
            self::get('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=TRY,USD', 'application/json'),
            true,
            32,
            JSON_THROW_ON_ERROR,
        );
        $eurTry = (float) ($payload['rates']['TRY'] ?? 0);
        $eurUsd = (float) ($payload['rates']['USD'] ?? 0);
        if ($eurTry <= 0 || $eurUsd <= 0) {
            throw new RuntimeException('Referans kur verisi gecersiz.');
        }
        $usdTry = $eurTry / $eurUsd;
        return [
            'asOf' => (string) ($payload['date'] ?? date('Y-m-d')),
            'provider' => 'Frankfurter',
            'rates' => [
                ['buying' => $usdTry, 'code' => 'USD', 'selling' => $usdTry],
                ['buying' => $eurTry, 'code' => 'EUR', 'selling' => $eurTry],
            ],
            'stale' => false,
        ];
    }

    private static function get(string $url, string $accept): string
    {
        if (function_exists('curl_init')) {
            $curl = curl_init($url);
            curl_setopt_array($curl, [
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTPHEADER => ['Accept: ' . $accept],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_USERAGENT => 'KAPTAS-Car-Rental/1.0',
            ]);
            $body = curl_exec($curl);
            $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
            $error = curl_error($curl);
            curl_close($curl);
            if (!is_string($body) || $status < 200 || $status >= 300) {
                throw new RuntimeException($error !== '' ? $error : 'HTTP ' . $status);
            }
            return $body;
        }

        $context = stream_context_create(['http' => [
            'header' => "Accept: {$accept}\r\nUser-Agent: KAPTAS-Car-Rental/1.0\r\n",
            'timeout' => 10,
        ]]);
        $body = @file_get_contents($url, false, $context);
        if (!is_string($body)) {
            throw new RuntimeException('Uzak servise ulasilamadi.');
        }
        return $body;
    }

    private static function readCache(string $path): ?array
    {
        if (!is_file($path)) {
            return null;
        }
        $value = json_decode((string) file_get_contents($path), true);
        return is_array($value) && isset($value['fetchedAt'], $value['snapshot']) ? $value : null;
    }

    private static function writeCache(string $path, array $snapshot): void
    {
        file_put_contents(
            $path,
            json_encode(['fetchedAt' => time(), 'snapshot' => $snapshot], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            LOCK_EX,
        );
    }
}
