<?php

declare(strict_types=1);

namespace Kaptas\Services;

use DomainException;
use Kaptas\Core\Config;
use RuntimeException;
use SimpleXMLElement;

final class VakifBank
{
    public static function settings(): array
    {
        $s = (array) Config::get('payment.vakifbank', []);
        if (($s['environment'] ?? 'test') === 'test') {
            // Public sandbox credentials from the bank's v1.3 guide, not live secrets.
            return ['environment' => 'test', 'merchant_id' => '000100000013506', 'terminal_no' => 'VP000579', 'password' => '123456'];
        }
        if (($s['environment'] ?? '') !== 'live' || empty($s['live_enabled'])
            || !preg_match('/^\d{1,32}$/', (string) ($s['merchant_id'] ?? ''))
            || !preg_match('/^[A-Za-z0-9]{1,32}$/', (string) ($s['terminal_no'] ?? ''))
            || (string) ($s['password'] ?? '') === '' || $s['merchant_id'] === '000100000013506') {
            throw new RuntimeException('Canli VakifBank ayarlari tamamlanmamis.');
        }
        return $s;
    }

    public static function available(?array $user): bool
    {
        if (Config::get('payment.provider') !== 'vakifbank') return false;
        try {
            $s = self::settings();
            return $s['environment'] === 'live' || in_array($user['role'] ?? '', ['ADMIN', 'SUPER_ADMIN'], true);
        } catch (RuntimeException) { return false; }
    }

    public static function endpoint(string $operation, string $environment): string
    {
        if (!in_array($environment, ['test', 'live'], true)) throw new DomainException('Odeme ortami gecersiz.');
        $threeD = $environment === 'test' ? 'https://inbound.apigatewaytest.vakifbank.com.tr:8443' : 'https://inbound.apigateway.vakifbank.com.tr:8443';
        $financial = $environment === 'test' ? $threeD : 'https://apigw.vakifbank.com.tr:8443';
        return match ($operation) {
            'enroll' => $threeD . '/threeDGateway/ProcessEnrollment',
            'challenge' => $threeD . '/threeDGateway/startThreeDFlow',
            'sale' => $financial . '/virtualPos/Vposreq',
            'search' => $financial . '/virtualPos/Search',
            default => throw new DomainException('Odeme islemi gecersiz.'),
        };
    }

    public static function minor(string $amount): int
    {
        if (!preg_match('/^(0|[1-9]\d{0,8})(?:\.(\d{1,2}))?$/D', $amount, $m)) throw new DomainException('Tutar gecersiz.');
        return (int) $m[1] * 100 + (int) str_pad($m[2] ?? '', 2, '0');
    }

    public static function validateCard(array $input): array
    {
        $pan = preg_replace('/[ -]/', '', (string) ($input['cardNumber'] ?? ''));
        $month = (string) ($input['expiryMonth'] ?? '');
        $year = (string) ($input['expiryYear'] ?? '');
        if (!preg_match('/^\d{13,19}$/D', $pan) || !preg_match('/^(0[1-9]|1[0-2])$/D', $month)
            || !preg_match('/^20\d{2}$/D', $year) || $year . $month < date('Ym') || (int) $year > (int) date('Y') + 20) {
            throw new DomainException('Kart numarasi ve son kullanma tarihini kontrol edin.');
        }
        $sum = 0;
        for ($i = strlen($pan) - 1, $position = 0; $i >= 0; $i--, $position++) {
            $digit = (int) $pan[$i];
            if ($position % 2 === 1) { $digit *= 2; if ($digit > 9) $digit -= 9; }
            $sum += $digit;
        }
        if ($sum % 10 !== 0) throw new DomainException('Kart numarasini kontrol edin.');
        return ['Pan' => $pan, 'ExpiryDate' => substr($year, -2) . $month];
    }

    public static function enrollment(array $attempt, array $card, string $returnUrl): array
    {
        $s = self::matchingSettings($attempt);
        if ($s['environment'] === 'test' && !in_array($card['Pan'], ['4938410109068353', '4938410157705591', '5421190122944522', '5521010140829928', '6501700122153568'], true)) {
            throw new DomainException('Test ortaminda yalnizca bankanin kilavuzundaki test kartlarini kullanin.');
        }
        $snapshot = json_decode($attempt['snapshot'], true, 512, JSON_THROW_ON_ERROR);
        $payload = $card + [
            'PurchaseAmount' => (float) $snapshot['amount'], 'Currency' => '949',
            'VerifyEnrollmentRequestId' => $attempt['transactionId'],
            'MerchantId' => $s['merchant_id'], 'MerchantPassword' => $s['password'],
            'SuccessUrl' => $returnUrl, 'FailureUrl' => $returnUrl,
        ];
        $body = self::post('enroll', $s['environment'], 'application/json', json_encode($payload, JSON_THROW_ON_ERROR));
        $response = json_decode($body, true, 32, JSON_THROW_ON_ERROR);
        return self::challenge($response['ProcessEnrollmentResult'] ?? [], $attempt);
    }

    public static function challenge(array $response, array $attempt): array
    {
        $action = self::endpoint('challenge', $attempt['environment']);
        // Sandbox also returns the same bank endpoint on standard HTTPS (443).
        $allowedActions = [$action, str_replace(':8443/', '/', $action)];
        // EMV responses omit ResultCode and report success through MessageErrorCode.
        $messageCode = $response['MessageErrorCode'] ?? null;
        $messageOk = $messageCode === '200' || $messageCode === 200;
        $resultOk = array_key_exists('ResultCode', $response)
            ? $response['ResultCode'] === '0000'
            : $messageOk;
        if (($response['Status'] ?? '') !== 'Y' || !$resultOk
            || (array_key_exists('MessageErrorCode', $response) && !$messageOk)
            || ($response['ErrorMessage'] ?? '') !== ''
            || ($response['VerifyEnrollmentRequestId'] ?? '') !== $attempt['transactionId']
            || !in_array($response['ACSUrl'] ?? '', $allowedActions, true)
            || !is_string($response['Pareq'] ?? null) || $response['Pareq'] === '' || strlen($response['Pareq']) > 200000
            || !is_string($response['MD'] ?? null) || $response['MD'] === '' || strlen($response['MD']) > 20000) {
            $code = preg_replace('/[^A-Za-z0-9_-]/', '', substr((string) ($response['ResultCode'] ?? 'MISSING'), 0, 32));
            $status = preg_replace('/[^A-Za-z0-9_-]/', '', substr((string) ($response['Status'] ?? 'MISSING'), 0, 8));
            throw new DomainException('Banka 3D dogrulamasini baslatamadi. Kod=' . $code . ' durum=' . $status);
        }
        // startThreeDFlow requires Base64URL even when enrollment returned standard Base64.
        // Re-encode the same bytes; never render the enclosed HTML/scripts in our origin.
        $pareq = self::challengeEncoding($response['Pareq']);
        return ['action' => $response['ACSUrl'], 'fields' => ['PaReq' => $pareq, 'MD' => $response['MD']]];
    }

    private static function challengeEncoding(string $value): string
    {
        if (!preg_match('/^[A-Za-z0-9+\/_-]+={0,2}$/D', $value)) {
            throw new DomainException('Banka 3D formunun kodlamasi gecersiz.');
        }
        $standard = strtr($value, '-_', '+/');
        $decoded = base64_decode($standard, true);
        if ($decoded === false || $decoded === '' || rtrim(base64_encode($decoded), '=') !== rtrim($standard, '=')) {
            throw new DomainException('Banka 3D formu dogrulanamadi.');
        }
        return rtrim(strtr(base64_encode($decoded), '+/', '-_'), '=');
    }

    public static function verifiedCallback(array $input, array $attempt): array
    {
        $s = self::matchingSettings($attempt);
        $fields = [];
        foreach ($input as $key => $value) {
            if (!is_scalar($value) || strlen((string) $value) > 16384) throw new DomainException('Banka cevabi gecersiz.');
            $name = strtolower((string) $key);
            if (array_key_exists($name, $fields)) throw new DomainException('Tekrarlanan banka alani.');
            $fields[$name] = (string) $value;
        }
        $required = ['verifyenrollmentrequestid', 'merchantid', 'purchcurrency', 'purchamount', 'eci', 'cavv', 'mdstatus', 'status', 'hash'];
        foreach ($required as $key) if (!isset($fields[$key])) throw new DomainException('Banka cevabi eksik.');
        $snapshot = json_decode($attempt['snapshot'], true, 512, JSON_THROW_ON_ERROR);
        $amount = self::callbackMinor($fields['purchamount']);
        $eci = str_pad($fields['eci'], 2, '0', STR_PAD_LEFT);
        if ($fields['verifyenrollmentrequestid'] !== $attempt['transactionId']) throw new DomainException('Banka islem numarasi eslesmiyor.');
        if ($fields['merchantid'] !== $s['merchant_id']) throw new DomainException('Banka isyeri bilgisi eslesmiyor.');
        if ($fields['purchcurrency'] !== '949') throw new DomainException('Banka para birimi eslesmiyor.');
        if ($amount !== self::minor($snapshot['amount'])) throw new DomainException('Banka tutari eslesmiyor.');
        $text = $fields['verifyenrollmentrequestid'] . $fields['merchantid'] . $fields['purchcurrency']
            . $amount . $eci . $fields['cavv'] . $fields['mdstatus'] . $fields['status'] . $s['password'];
        $bytes = iconv('UTF-8', 'ISO-8859-9', $text);
        if ($bytes === false || !hash_equals(base64_encode(hash('sha256', $bytes, true)), $fields['hash'])) {
            throw new DomainException('Banka imzasi dogrulanamadi.');
        }
        return ['ECI' => $eci, 'CAVV' => $fields['cavv'], 'authenticated' => $fields['status'] === 'Y'
            && $fields['mdstatus'] === '1' && in_array($eci, ['02', '05'], true) && $fields['cavv'] !== ''];
    }

    private static function callbackMinor(string $amount): int
    {
        // MPI callbacks use integer minor units; the newer hash guide also shows
        // decimal major units. An integer is NEVER multiplied by 100 here.
        // Enrollment, quotes and Search still use minor() for decimal major units.
        if (preg_match('/^(0|[1-9][0-9]{0,10})$/D', $amount)) return (int) $amount;
        if (preg_match('/^(0|[1-9][0-9]{0,8})\.[0-9]{2}$/D', $amount)) return self::minor($amount);
        throw new DomainException('Banka donus tutarinin bicimi gecersiz.');
    }

    public static function sale(array $attempt, array $security): void
    {
        if (($security['authenticated'] ?? false) !== true) throw new DomainException('3D dogrulamasi olmadan tahsilat yapilamaz.');
        $s = self::matchingSettings($attempt);
        $payload = self::xml('VposRequest', [
            'TransactionType' => 'Sale', 'MerchantId' => $s['merchant_id'], 'TerminalNo' => $s['terminal_no'],
            'Password' => $s['password'], 'TransactionId' => $attempt['transactionId'], 'OrderId' => $attempt['reservationId'],
            'ClientIp' => $attempt['clientIp'], 'CAVV' => $security['CAVV'], 'ECI' => $security['ECI'],
            'MpiTransactionId' => $attempt['transactionId'], 'TransactionDeviceSource' => '0',
        ]);
        // Search is authoritative even when this request times out after the bank charged the card.
        self::post('sale', $s['environment'], 'application/xml', $payload);
    }

    public static function search(array $attempt): ?array
    {
        $s = self::matchingSettings($attempt);
        $xml = new SimpleXMLElement('<SearchRequest/>');
        $merchant = $xml->addChild('MerchantCriteria');
        self::addXml($merchant, ['HostMerchantId' => $s['merchant_id'], 'MerchantPassword' => $s['password']]);
        self::addXml($xml->addChild('TransactionCriteria'), ['TransactionId' => $attempt['transactionId']]);
        return self::verifiedSearch(self::post('search', $s['environment'], 'application/xml', $xml->asXML()), $attempt);
    }

    public static function verifiedSearch(string $body, array $attempt): ?array
    {
        if (stripos($body, '<!DOCTYPE') !== false || stripos($body, '<!ENTITY') !== false) throw new RuntimeException('Banka XML cevabi gecersiz.');
        $previous = libxml_use_internal_errors(true);
        try { $xml = simplexml_load_string($body, SimpleXMLElement::class, LIBXML_NONET); }
        finally { libxml_clear_errors(); libxml_use_internal_errors($previous); }
        if (!$xml || $xml->getName() !== 'SearchResponse' || (string) $xml->ResponseInfo->ResponseCode !== '0000') {
            throw new RuntimeException('Banka sorgusu tamamlanamadi.');
        }
        $matches = $xml->xpath('//TransactionSearchResultInfo[TransactionId]') ?: [];
        if (count($matches) === 0) return null;
        if (count($matches) !== 1) throw new RuntimeException('Banka sorgusu birden fazla islem dondurdu.');
        $r = $matches[0];
        $snapshot = json_decode($attempt['snapshot'], true, 512, JSON_THROW_ON_ERROR);
        if ((string) $r->TransactionId !== $attempt['transactionId'] || (string) $r->MerchantId !== $attempt['merchantId']
            || (string) $r->OrderId !== $attempt['reservationId'] || (string) $r->TransactionType !== 'Sale'
            || (string) $r->AmountCode !== '949' || self::minor((string) $r->Amount) !== self::minor($snapshot['amount'])) {
            throw new RuntimeException('Banka sorgusu odemeyle eslesmiyor.');
        }
        if ((string) $r->ResultCode !== '0000') return ['paid' => false, 'code' => substr((string) $r->ResultCode, 0, 32)];
        foreach (['IsCanceled', 'IsRefunded', 'IsReversed'] as $flag) {
            if ((string) $r->$flag !== 'false') throw new RuntimeException('Banka islemi iptal/iade veya belirsiz durumda.');
        }
        if (!in_array((string) $r->ECI, ['02', '05'], true) || (string) $r->AuthCode === '') {
            throw new RuntimeException('Banka tahsilat dogrulamasi eksik.');
        }
        return ['paid' => true, 'code' => '0000'];
    }

    private static function matchingSettings(array $attempt): array
    {
        $s = self::settings();
        if ($attempt['environment'] !== $s['environment'] || $attempt['merchantId'] !== $s['merchant_id'] || $attempt['terminalNo'] !== $s['terminal_no']) {
            throw new RuntimeException('Odeme ortami veya isyeri bilgileri degismis.');
        }
        return $s;
    }

    private static function xml(string $root, array $values): string
    {
        $xml = new SimpleXMLElement('<' . $root . '/>');
        self::addXml($xml, $values);
        return $xml->asXML();
    }

    private static function addXml(SimpleXMLElement $xml, array $values): void
    {
        foreach ($values as $key => $value) $xml->addChild($key, htmlspecialchars((string) $value, ENT_XML1 | ENT_QUOTES, 'UTF-8'));
    }

    private static function post(string $operation, string $environment, string $type, string $payload): string
    {
        if (!function_exists('curl_init')) throw new RuntimeException('Sunucuda cURL etkin olmali.');
        $curl = curl_init(self::endpoint($operation, $environment));
        $body = '';
        curl_setopt_array($curl, [
            CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: ' . $type, 'Accept: application/json, application/xml'],
            CURLOPT_FOLLOWLOCATION => false, CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
            CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_TIMEOUT => 35,
            CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$body): int {
                if (strlen($body) + strlen($chunk) > 524288) return 0;
                $body .= $chunk;
                return strlen($chunk);
            },
        ]);
        if (PHP_OS_FAMILY === 'Windows' && defined('CURLSSLOPT_NATIVE_CA')) {
            curl_setopt($curl, CURLOPT_SSL_OPTIONS, CURLSSLOPT_NATIVE_CA);
        }
        try {
            $ok = curl_exec($curl);
            $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
            if ($ok === false || $status !== 200) throw new RuntimeException('Banka servisine ulasilamadi. HTTP=' . $status . ' transport=' . curl_errno($curl));
            return $body;
        } finally { curl_close($curl); }
    }
}
