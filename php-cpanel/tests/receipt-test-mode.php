<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
require dirname(__DIR__) . '/app/Services/ReservationReceipt.php';

use Kaptas\Services\ReservationReceipt;

$receipt = ['reference' => 'TEST-RECEIPT', 'customerName' => '<script>alert(1)</script>',
    'vehicleTitle' => 'Renault Duster', 'pickupAt' => '07.10.2026 09:00', 'dropoffAt' => '10.10.2026 09:00',
    'pickupLocation' => 'Airport', 'dropoffLocation' => 'Airport', 'days' => 3, 'amount' => '3000.00',
    'currency' => 'TRY', 'hasAccount' => true];
$test = ReservationReceipt::html($receipt, 'https://example.test', true);
$normal = ReservationReceipt::html($receipt, 'https://example.test');
$checks = [
    str_contains($test, 'TEST - Rezervasyon'),
    str_contains($test, 'Para &ccedil;ekilmedi'),
    str_contains($test, 'tahsilat yok'),
    !str_contains($test, '&Ouml;demeniz al&#305;nd&#305;'),
    !str_contains($test, '?account=rentals'),
    !str_contains($test, '<script>'),
    str_contains($test, 'cid:kaptas-logo'),
    str_contains($test, 'Renault Duster'),
    str_contains($test, '3.000,00 TRY'),
    str_contains($normal, 'Rezervasyonunuz onayland&#305;'),
    str_contains($normal, 'Tahsil edilen toplam'),
    str_contains($normal, '&Ouml;demeniz al&#305;nd&#305;'),
    str_contains($normal, '?account=rentals'),
    !str_contains($normal, 'Bu test mesaj'),
];
foreach ($checks as $index => $ok) if (!$ok) throw new RuntimeException('Receipt check failed: ' . $index);
echo 'OK: ' . count($checks) . " receipt checks; no SMTP, DB or bank calls.\n";
