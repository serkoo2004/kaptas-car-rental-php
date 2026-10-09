<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);

// Render the real view with isolated presentation fixtures, without auth/DB/bank calls.
$isResult = false;
$paymentConfigured = ($argv[1] ?? '') !== 'disabled';
$testMode = $paymentConfigured;
$vehicle = ['brandName' => 'Renault', 'modelName' => 'Kangoo Multix', 'title' => 'Renault Kangoo Multix Equilibre 1.3 TCe 130 hp', 'dailyPrice' => 85, 'image' => '/images/fleet-hero.png', 'contactName' => '', 'contactEmail' => '', 'contactPhone' => ''];
$_GET = ['leadId' => 'ui-test', 'vehicleId' => 'ui-vehicle', 'pickupLocationId' => 'ui-branch', 'pickupLocation' => 'Trabzon Havalimanı'];
if (($argv[1] ?? '') === 'prefilled') $_GET += ['pickupDate' => date('Y-m-d', time() + 10 * 86400), 'dropoffDate' => date('Y-m-d', time() + 13 * 86400)];
$source = file_get_contents(dirname(__DIR__) . '/public_html/checkout/index.php');
$start = strpos($source, 'function e(');
if ($start === false) throw new RuntimeException('View boundary missing');
eval(substr($source, $start));
