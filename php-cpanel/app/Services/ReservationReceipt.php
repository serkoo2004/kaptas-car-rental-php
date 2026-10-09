<?php

declare(strict_types=1);

namespace Kaptas\Services;

use DateTimeImmutable;
use DateTimeZone;
use InvalidArgumentException;

final class ReservationReceipt
{
    public static function reference(string $id): string
    {
        // Use the complete database ID: shortened suffixes can collide.
        return strtoupper($id);
    }

    public static function snapshot(array $row): array
    {
        if ($row['status'] !== 'CONFIRMED' || $row['paymentStatus'] !== 'PAID') {
            throw new InvalidArgumentException('Rezervasyon ve odeme onaylanmamis.');
        }
        $zone = new DateTimeZone('Europe/Istanbul');
        $pickup = new DateTimeImmutable($row['pickupAt'], $zone);
        $dropoff = new DateTimeImmutable($row['dropoffAt'], $zone);
        if ($dropoff <= $pickup || !preg_match('/^\d+\.\d{2}$/', (string) $row['amount'])
            || (float) $row['amount'] <= 0 || !preg_match('/^[A-Z]{3}$/', $row['currency'])
            || !filter_var($row['customerEmail'], FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Rezervasyon ozeti gecersiz.');
        }
        return [
            'reference' => self::reference($row['id']),
            'customerName' => $row['customerName'],
            'vehicleTitle' => $row['title'],
            'pickupAt' => $pickup->format('d.m.Y H:i'),
            'dropoffAt' => $dropoff->format('d.m.Y H:i'),
            'pickupLocation' => $row['pickupLocation'] ?: '-',
            'dropoffLocation' => $row['dropoffLocation'] ?: '-',
            'days' => RentalPeriod::days($pickup, $dropoff),
            'amount' => (string) $row['amount'],
            'currency' => $row['currency'],
            'hasAccount' => !empty($row['userId']),
        ];
    }

    public static function html(array $receipt, string $appUrl, bool $test = false): string
    {
        if (!filter_var($appUrl, FILTER_VALIDATE_URL) || !in_array(parse_url($appUrl, PHP_URL_SCHEME), ['http', 'https'], true)) {
            throw new InvalidArgumentException('Uygulama adresi gecersiz.');
        }
        $e = static fn (mixed $value): string => htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $rows = [
            'Rezervasyon numaras&#305;' => $receipt['reference'],
            'Ara&ccedil;' => $receipt['vehicleTitle'],
            'Al&#305;&#351; tarihi / saati' => $receipt['pickupAt'],
            'Al&#305;&#351; noktas&#305;' => $receipt['pickupLocation'],
            '&#304;ade tarihi / saati' => $receipt['dropoffAt'],
            '&#304;ade noktas&#305;' => $receipt['dropoffLocation'],
            'Kiralama s&uuml;resi (g&uuml;n)' => $receipt['days'],
            ($test ? '&Ouml;rnek toplam (tahsilat yok)' : 'Tahsil edilen toplam') => number_format((float) $receipt['amount'], 2, ',', '.') . ' ' . $receipt['currency'],
        ];
        $details = '';
        foreach ($rows as $label => $value) {
            $details .= '<tr><td style="padding:12px 8px;border-bottom:1px solid #e7e7e7;color:#555;vertical-align:top">'
                . $label . '</td><td style="padding:12px 8px;border-bottom:1px solid #e7e7e7;font-weight:bold;word-break:break-word">'
                . $e($value) . '</td></tr>';
        }
        $account = $test ? '<p>Bu &ouml;rnek rezervasyon hesab&#305;n&#305;zda veya ara&ccedil; takviminde olu&#351;turulmad&#305;.</p>' : ($receipt['hasAccount']
            ? '<p><a style="display:inline-block;padding:14px 20px;background:#ffc81b;color:#202020;text-decoration:none;font-weight:bold" href="'
                . $e(rtrim($appUrl, '/') . '/?account=rentals') . '">Kiralad&#305;klar&#305;m</a></p>'
            : '<p>Misafir olarak yapt&#305;&#287;&#305;n&#305;z rezervasyon i&ccedil;in bu e-postay&#305; saklay&#305;n. Destek ekibimize rezervasyon numaran&#305;zla ula&#351;abilirsiniz.</p>');
        $heading = $test ? 'TEST - Rezervasyon e-postas&#305;' : 'Rezervasyonunuz onayland&#305;';
        $intro = $test
            ? '<strong>Bu bir e-posta g&ouml;nderim testidir. Para &ccedil;ekilmedi ve ger&ccedil;ek rezervasyon olu&#351;turulmad&#305;.</strong> A&#351;a&#287;&#305;daki bilgiler yaln&#305;zca &ouml;rnektir.'
            : '&Ouml;demeniz al&#305;nd&#305; ve ara&ccedil; rezervasyonunuz kesinle&#351;ti.';
        $footer = $test ? 'Bu test mesaj&#305; rezervasyon onay&#305; veya fatura de&#287;ildir.'
            : 'Bu e-posta rezervasyon onay&#305;d&#305;r, fatura yerine ge&ccedil;mez.';
        return '<!doctype html><html lang="tr"><body style="margin:0;padding:20px 8px;background:#f4f4f4;font-family:Arial,sans-serif;color:#242424">'
            . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">'
            . '<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:white;border-top:4px solid #ffc81b">'
            . '<tr><td style="padding:24px;text-align:center"><img src="cid:kaptas-logo" width="240" alt="KAPTAS Car Rental" style="width:240px;max-width:100%;height:auto"></td></tr>'
            . '<tr><td style="padding:0 24px 24px;line-height:1.6"><h1 style="font-size:24px;margin:0 0 16px">' . $heading . '</h1>'
            . '<p>Merhaba ' . $e($receipt['customerName']) . ',</p><p>' . $intro . '</p>'
            . '<table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;table-layout:fixed">' . $details . '</table>'
            . '<p style="font-size:13px;color:#555">T&uuml;m saatler T&uuml;rkiye saatidir (UTC+3). Kiralama g&uuml;n&uuml; 24 saat &uuml;zerinden, kalan s&uuml;re yukar&#305; yuvarlanarak hesaplan&#305;r.</p>'
            . $account
            . '<p>Sorular&#305;n&#305;z i&ccedil;in <a href="tel:+905550456261">0 (555) 045 62 61</a><br>'
            . '<a href="mailto:kaptascarrental@gmail.com">kaptascarrental@gmail.com</a></p>'
            . '<p style="font-size:12px;color:#666">' . $footer . ' Kart bilgilerinizi e-posta ile g&ouml;ndermeyin.</p>'
            . '</td></tr></table></td></tr></table></body></html>';
    }
}
