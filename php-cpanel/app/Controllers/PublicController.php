<?php

declare(strict_types=1);

namespace Kaptas\Controllers;

use DateTimeImmutable;
use Kaptas\Core\Auth;
use Kaptas\Core\Database;
use Kaptas\Core\Id;
use Kaptas\Core\RateLimiter;
use Kaptas\Core\Request;
use Kaptas\Core\Response;
use Kaptas\Services\ExchangeRates;
use Kaptas\Services\Privacy;
use Kaptas\Services\RentalPeriod;
use PDO;

final class PublicController
{
    public static function media(string $vehicleId, string $fileName): never
    {
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $vehicleId) || !preg_match('/^[a-zA-Z0-9._-]+$/', $fileName)) {
            Response::json(['error' => 'Dosya bulunamadi.'], 404);
        }
        $url = '/api/media/vehicles/' . $vehicleId . '/' . $fileName;
        $statement = Database::connection()->prepare('SELECT id FROM VehicleImage WHERE vehicleId = ? AND url = ? LIMIT 1');
        $statement->execute([$vehicleId, $url]);
        if (!$statement->fetchColumn()) {
            Response::json(['error' => 'Dosya bulunamadi.'], 404);
        }
        $path = KAPTAS_ROOT . '/storage/vehicle-images/' . $vehicleId . '/' . $fileName;
        if (!is_file($path)) {
            Response::json(['error' => 'Dosya bulunamadi.'], 404);
        }
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($path) ?: 'application/octet-stream';
        Response::file($path, $mime);
    }

    public static function vehicles(): never
    {
        $currency = ExchangeRates::currency($_GET['currency'] ?? null);
        $period = self::optionalPeriod($_GET);
        try {
            $snapshot = $currency === 'USD' ? null : ExchangeRates::snapshot();
        } catch (\Throwable) {
            Response::json(['error' => 'Guncel doviz kuru alinamadi. Lutfen tekrar deneyin.'], 503, ['Cache-Control' => 'no-store']);
        }

        $pdo = Database::connection();
        $where = ["v.status = 'PUBLISHED'", 'v.isPublishedWeb = 1', 'v.stockCount > 0'];
        $params = [];
        self::likeFilter($where, $params, 'b.name', $_GET['brand'] ?? null);
        self::likeFilter($where, $params, 'm.name', $_GET['model'] ?? null);
        $fuel = self::fuel($_GET['fuelType'] ?? null);
        if ($fuel) {
            $where[] = 'v.fuelType = ?';
            $params[] = $fuel;
        }
        $transmission = self::transmission($_GET['transmission'] ?? null);
        if ($transmission) {
            $where[] = 'v.transmission = ?';
            $params[] = $transmission;
        }
        $statement = $pdo->prepare(
            'SELECT v.*, b.name AS brandName, m.name AS modelName FROM Vehicle v '
            . 'JOIN VehicleBrand b ON b.id = v.brandId JOIN VehicleModel m ON m.id = v.modelId '
            . 'WHERE ' . implode(' AND ', $where) . ' ORDER BY v.isFeatured DESC, v.createdAt DESC'
        );
        $statement->execute($params);
        $vehicles = $statement->fetchAll(PDO::FETCH_ASSOC);
        $ids = array_column($vehicles, 'id');
        $images = self::related('VehicleImage', $ids, 'ORDER BY isCover DESC, sortOrder ASC');
        $features = self::related('VehicleFeature', $ids, 'ORDER BY sortOrder ASC');
        $reserved = $period ? RentalPeriod::availability($ids, $period['pickup'], $period['dropoff']) : [];

        $data = [];
        foreach ($vehicles as $vehicle) {
            $available = max(0, (int) $vehicle['stockCount'] - ($reserved[$vehicle['id']] ?? 0));
            if ($period && $available <= 0) {
                continue;
            }
            $dailyUsd = $vehicle['dailyPrice'] !== null ? (float) $vehicle['dailyPrice'] : 0.0;
            $dailyAmount = $dailyUsd > 0 ? ExchangeRates::convertUsd($dailyUsd, $currency, $snapshot) : null;
            $vehicleFeatures = $features[$vehicle['id']] ?? [];
            $door = '5';
            foreach ($vehicleFeatures as $feature) {
                $label = self::lower((string) $feature['label']);
                if (in_array($label, ['kapi', 'kapı', 'door', 'doors'], true) && preg_match('/\d+/', (string) $feature['value'], $match)) {
                    $door = $match[0];
                }
            }
            $minimumAge = str_contains(self::lower((string) $vehicle['segment']), 'suv') ? 27
                : (str_contains(self::lower((string) $vehicle['bodyType']), 'van') ? 25 : 21);
            $cover = $images[$vehicle['id']][0]['url'] ?? '/images/fleet-hero.png';
            $data[] = [
                'age' => (string) $minimumAge,
                'backendId' => $vehicle['id'],
                'availableCount' => $available,
                'capacity' => self::lower((string) $vehicle['bodyType']) === 'van' ? '4 Kişi' : '5 Kişi',
                'canBook' => $dailyAmount !== null,
                'currency' => $currency,
                'dailyPriceAmount' => $dailyAmount,
                'dailyPriceUsd' => $dailyUsd > 0 ? $dailyUsd : null,
                'driveType' => $vehicle['driveType'],
                'fuel' => self::fuelLabel((string) $vehicle['fuelType']),
                'features' => array_map(static fn (array $feature): array => [
                    'group' => $feature['group'] ?? 'Donanım', 'label' => $feature['label'], 'value' => $feature['value'],
                ], $vehicleFeatures),
                'gear' => $vehicle['transmission'] === 'AUTOMATIC' ? 'Otomatik' : 'Manuel',
                'group' => $vehicle['segment'] ?: ($vehicle['bodyType'] ?: 'Ekonomik'),
                'id' => $vehicle['id'],
                'image' => $cover,
                'license' => ($minimumAge >= 25 ? '3' : '1') . ' yıl',
                'doors' => $door . ' Kapı',
                'name' => $vehicle['brandName'] . ' ' . $vehicle['modelName'],
                'specialOffer' => (bool) $vehicle['isFeatured'],
                'stockCount' => (int) $vehicle['stockCount'],
                'type' => $vehicle['bodyType'] ?: ($vehicle['segment'] ?: 'Otomobil'),
            ];
        }

        Response::json([
            'availability' => $period ? [
                'dropoffAt' => $period['dropoff']->format(DATE_ATOM), 'filtered' => true,
                'pickupAt' => $period['pickup']->format(DATE_ATOM),
            ] : ['filtered' => false],
            'currency' => $currency,
            'data' => $data,
            'exchangeRate' => $snapshot ? [
                'asOf' => $snapshot['asOf'], 'provider' => $snapshot['provider'], 'stale' => (bool) ($snapshot['stale'] ?? false),
            ] : null,
            'source' => 'database',
        ], 200, ['Cache-Control' => 'no-store, max-age=0']);
    }

    public static function locations(): never
    {
        $language = in_array($_GET['lang'] ?? '', ['tr', 'en', 'ar'], true) ? (string) $_GET['lang'] : 'tr';
        $statement = Database::connection()->query(
            'SELECT * FROM BranchLocation WHERE isActive = 1 ORDER BY sortOrder ASC, name ASC'
        );
        $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        $locations = array_map(static fn (array $row): array => [
            'address' => self::localized($row, 'address', $language),
            'city' => $row['city'] ?: '',
            'district' => $row['district'] ?: '',
            'email' => $row['email'] ?: 'kaptascarrental@gmail.com',
            'id' => $row['id'],
            'image' => $row['imageUrl'] ?: '/images/fleet-hero.png',
            'name' => self::localized($row, 'name', $language),
            'phone' => $row['phone'] ?: '0 (555) 045 62 61',
            'rating' => $row['rating'] !== null ? number_format((float) $row['rating'], 1, ',', '') : '5,0',
            'subtitle' => self::localized($row, 'subtitle', $language),
            'type' => $row['type'],
        ], $rows);
        if ($locations === []) {
            $fallback = [
                'tr' => ['Merkez Ofis', 'Rezervasyon ve teslim koordinasyon merkezi', 'Merkez lokasyon, teslim ve iade operasyon noktası'],
                'en' => ['Main Office', 'Reservation and delivery coordination center', 'Central pick-up and return operations point'],
                'ar' => ['المكتب الرئيسي', 'مركز تنسيق الحجوزات والتسليم', 'نقطة العمليات المركزية للاستلام والإرجاع'],
            ][$language];
            $locations[] = [
                'address' => $fallback[2], 'city' => '', 'district' => '', 'email' => 'kaptascarrental@gmail.com',
                'id' => 'fallback-merkez', 'image' => '/images/fleet-hero.png', 'name' => $fallback[0],
                'phone' => '0 (555) 045 62 61', 'rating' => '5,0', 'subtitle' => $fallback[1], 'type' => 'city',
            ];
        }
        Response::json(['locations' => $locations], 200, ['Cache-Control' => 'no-store, max-age=0']);
    }

    public static function exchangeRates(): never
    {
        try {
            Response::json(ExchangeRates::snapshot(), 200, ['Cache-Control' => 'public, max-age=1800, stale-while-revalidate=86400']);
        } catch (\Throwable) {
            Response::json(['error' => 'Doviz kuru servisine ulasilamadi.'], 503, ['Cache-Control' => 'no-store']);
        }
    }

    public static function contact(): never
    {
        RateLimiter::enforce('contact', 5, 600);
        $input = Request::json();
        $name = self::text($input, 'contactName') ?: self::text($input, 'name');
        $email = strtolower(self::text($input, 'contactEmail') ?: self::text($input, 'email'));
        $phone = self::text($input, 'contactPhone') ?: self::text($input, 'phone');
        $company = self::text($input, 'companyName');
        $message = self::text($input, 'message');
        Privacy::requireNotice($input);
        if (mb_strlen($name) < 2 || mb_strlen($name) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)
            || strlen($email) > 190 || !preg_match('/^\+?[0-9\s()\-]{10,20}$/', $phone)
            || mb_strlen($company) > 120 || mb_strlen($message) < 10 || mb_strlen($message) > 2000) {
            Response::json(['error' => 'Ad soyad, e-posta, telefon ve mesaj zorunludur.'], 422);
        }
        $id = Id::make('lead_');
        $commercial = ($input['commercialConsent'] ?? false) === true;
        Database::transaction(static function (PDO $pdo) use ($id, $company, $name, $email, $phone, $message, $commercial): void {
            $statement = $pdo->prepare(
                "INSERT INTO QuoteRequest (id, userType, status, source, contactName, contactEmail, contactPhone, companyName, note, kvkkAcceptedAt, commercialConsentAt, createdAt, updatedAt) "
                . "VALUES (?, ?, 'RECEIVED', 'seko-front-contact', ?, ?, ?, ?, ?, NOW(3), IF(?, NOW(3), NULL), NOW(3), NOW(3))"
            );
            $statement->execute([
                $id, $company ? 'CORPORATE' : 'INDIVIDUAL', $name, $email, $phone,
                $company ?: null, $message, $commercial ? 1 : 0,
            ]);
            Privacy::record($pdo, null, $email, 'PRIVACY_NOTICE_ACKNOWLEDGED', Privacy::NOTICE_VERSION);
            if ($commercial) {
                Privacy::record(
                    $pdo, null, $email, 'COMMERCIAL_COMMUNICATION_CONSENT', Privacy::COMMERCIAL_CONSENT_VERSION
                );
            }
        });
        Response::json(['id' => $id, 'ok' => true]);
    }

    public static function rentalIntent(): never
    {
        RateLimiter::enforce('rental-intent', 10, 600);
        $input = Request::json();
        $vehicleId = self::text($input, 'vehicleId');
        $name = self::text($input, 'contactName');
        $email = strtolower(self::text($input, 'contactEmail'));
        $phone = self::text($input, 'contactPhone');
        Privacy::requireNotice($input);
        if ($vehicleId === '' || mb_strlen($name) < 2 || mb_strlen($name) > 100
            || !filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^\+?[0-9\s()\-]{10,20}$/', $phone)) {
            Response::json(['error' => 'Arac ve iletisim bilgileri zorunludur.'], 422);
        }
        $rentalFields = [
            self::text($input, 'pickupDate'), self::text($input, 'pickupTime'),
            self::text($input, 'dropoffDate'), self::text($input, 'dropoffTime'),
        ];
        $filled = count(array_filter($rentalFields, static fn (string $value): bool => $value !== ''));
        if ($filled > 0 && $filled < 4) {
            Response::json(['error' => 'Tarih secilecekse alis ve birakis tarihi ile saatleri eksiksiz girilmelidir.'], 422);
        }
        $period = null;
        if ($filled === 4) {
            try {
                $period = RentalPeriod::parse(...$rentalFields);
            } catch (\InvalidArgumentException $error) {
                Response::json(['error' => $error->getMessage()], 422);
            }
        }
        $pdo = Database::connection();
        $vehicleStatement = $pdo->prepare(
            "SELECT v.id, v.dailyPrice, b.name AS brandName, m.name AS modelName FROM Vehicle v JOIN VehicleBrand b ON b.id = v.brandId "
            . "JOIN VehicleModel m ON m.id = v.modelId WHERE v.id = ? AND v.status = 'PUBLISHED' AND v.isPublishedWeb = 1 AND v.stockCount > 0 LIMIT 1"
        );
        $vehicleStatement->execute([$vehicleId]);
        $vehicle = $vehicleStatement->fetch(PDO::FETCH_ASSOC);
        if (!$vehicle) Response::json(['error' => 'Secilen arac kiralamaya uygun degil.'], 404);
        if ((float) ($vehicle['dailyPrice'] ?? 0) <= 0) Response::json(['error' => 'Bu arac icin gunluk kiralama fiyati henuz tanimlanmadi.'], 409);
        $location = self::selectedLocation($input);
        $locationName = (string) $location['name'];
        $leadId = Id::make('lead_');
        $user = Auth::user();
        $note = [
            'Odeme oncesi kiralama talebi olusturuldu. Bu kayit kesin rezervasyon degildir.',
            'Alis: ' . $locationName,
            $period ? null : 'Kiralama tarihi odeme adiminda secilecek.',
            'Birakis: ' . $locationName,
            $period ? 'Alis zamani: ' . $rentalFields[0] . ' ' . $rentalFields[1] : null,
            $period ? 'Birakis zamani: ' . $rentalFields[2] . ' ' . $rentalFields[3] : null,
        ];
        try {
            Database::transaction(static function (PDO $pdo) use ($leadId, $user, $name, $email, $phone, $vehicle, $vehicleId, $note): void {
                $pdo->prepare(
                    "INSERT INTO QuoteRequest (id, userId, userType, status, source, contactName, contactEmail, contactPhone, note, kvkkAcceptedAt, commercialConsentAt, createdAt, updatedAt) "
                    . "VALUES (?, ?, 'INDIVIDUAL', 'RECEIVED', 'seko-front-rental', ?, ?, ?, ?, NOW(3), NULL, NOW(3), NOW(3))"
                )->execute([$leadId, $user['id'] ?? null, $name, $email, $phone, implode("\n", array_filter($note))]);
                $pdo->prepare(
                    'INSERT INTO QuoteRequestItem (id, quoteRequestId, vehicleId, brandText, modelText, quantity) VALUES (?, ?, ?, ?, ?, 1)'
                )->execute([Id::make('item_'), $leadId, $vehicleId, $vehicle['brandName'], $vehicle['modelName']]);
                Privacy::record(
                    $pdo, $user['id'] ?? null, $email, 'PRIVACY_NOTICE_ACKNOWLEDGED', Privacy::NOTICE_VERSION
                );
            });
            if ($period) {
                RentalPeriod::hold([
                    'vehicleId' => $vehicleId, 'userId' => $user['id'] ?? null, 'quoteRequestId' => $leadId,
                    'pickup' => $period['pickup'], 'dropoff' => $period['dropoff'], 'pickupLocation' => $locationName,
                    'dropoffLocation' => $locationName, 'customerName' => $name, 'customerEmail' => $email, 'customerPhone' => $phone,
                ]);
            }
        } catch (\Throwable $error) {
            $pdo->prepare('DELETE FROM QuoteRequest WHERE id = ?')->execute([$leadId]);
            Response::json(['error' => $error->getMessage()], str_contains($error->getMessage(), 'musait') ? 409 : 500);
        }
        $params = [
            'vehicleId' => $vehicleId, 'leadId' => $leadId, 'currency' => ExchangeRates::currency($input['currency'] ?? null),
            'pickupLocationId' => $location['id'], 'pickupLocation' => $locationName, 'dropoffLocation' => $locationName,
        ];
        if ($period) {
            $params += [
                'pickupDate' => $rentalFields[0], 'pickupTime' => $rentalFields[1],
                'dropoffDate' => $rentalFields[2], 'dropoffTime' => $rentalFields[3],
            ];
        }
        $checkoutLeads = (array) ($_SESSION['checkout_lead_ids'] ?? []);
        $checkoutLeads[] = $leadId;
        $_SESSION['checkout_lead_ids'] = array_slice(array_unique($checkoutLeads), -50);
        Response::json(['leadId' => $leadId, 'ok' => true, 'redirectUrl' => '/satin-al?' . http_build_query($params)]);
    }

    private static function optionalPeriod(array $input): ?array
    {
        $keys = ['startDate', 'startTime', 'endDate', 'endTime'];
        $values = array_map(static fn (string $key): string => trim((string) ($input[$key] ?? '')), $keys);
        $filled = count(array_filter($values, static fn (string $value): bool => $value !== ''));
        if ($filled === 0) return null;
        if ($filled !== 4) Response::json(['error' => 'Kiralama tarihleri eksik.'], 422);
        try {
            return RentalPeriod::parse($values[0], $values[1], $values[2], $values[3]);
        } catch (\InvalidArgumentException $error) {
            Response::json(['error' => $error->getMessage()], 422);
        }
    }

    private static function related(string $table, array $vehicleIds, string $order): array
    {
        if ($vehicleIds === []) return [];
        $marks = implode(',', array_fill(0, count($vehicleIds), '?'));
        $statement = Database::connection()->prepare("SELECT * FROM {$table} WHERE vehicleId IN ({$marks}) {$order}");
        $statement->execute($vehicleIds);
        $result = [];
        foreach ($statement->fetchAll() as $row) $result[$row['vehicleId']][] = $row;
        return $result;
    }

    private static function selectedLocation(array $input): array
    {
        $pdo = Database::connection();
        $id = self::text($input, 'pickupLocationId');
        $name = self::text($input, 'pickupLocation');
        if ($id !== '') {
            $statement = $pdo->prepare('SELECT id, name FROM BranchLocation WHERE id = ? AND isActive = 1 LIMIT 1');
            $statement->execute([$id]);
            $location = $statement->fetch(PDO::FETCH_ASSOC);
            if (!$location) Response::json(['error' => 'Secilen teslim noktasi artik aktif degil.'], 409);
            return $location;
        }
        if ($name !== '') {
            $statement = $pdo->prepare('SELECT id, name FROM BranchLocation WHERE name = ? AND isActive = 1 LIMIT 1');
            $statement->execute([$name]);
            $location = $statement->fetch(PDO::FETCH_ASSOC);
            if (!$location) Response::json(['error' => 'Secilen teslim noktasi bulunamadi.'], 422);
            return $location;
        }
        $location = $pdo->query('SELECT id, name FROM BranchLocation WHERE isActive = 1 ORDER BY sortOrder, name LIMIT 1')->fetch(PDO::FETCH_ASSOC);
        return $location ?: ['id' => 'fallback-merkez', 'name' => 'Merkez Ofis'];
    }

    private static function localized(array $row, string $field, string $language): string
    {
        $localizedField = $language === 'en' ? $field . 'En' : ($language === 'ar' ? $field . 'Ar' : $field);
        return trim((string) ($row[$localizedField] ?? '')) ?: trim((string) ($row[$field] ?? ''));
    }

    private static function likeFilter(array &$where, array &$params, string $column, mixed $value): void
    {
        $value = trim((string) $value);
        if ($value !== '') { $where[] = $column . ' LIKE ?'; $params[] = '%' . $value . '%'; }
    }

    private static function fuel(mixed $value): ?string
    {
        $value = self::lower(trim((string) $value));
        if ($value === '') return null;
        if (str_contains($value, 'lpg')) return 'GASOLINE_LPG';
        if (str_contains($value, 'dizel')) return 'DIESEL';
        if (str_contains($value, 'benzin')) return 'GASOLINE';
        if (str_contains($value, 'elektrik')) return 'ELECTRIC';
        if (str_contains($value, 'hybrid')) return 'HYBRID';
        return strtoupper($value);
    }

    private static function transmission(mixed $value): ?string
    {
        $value = self::lower(trim((string) $value));
        if ($value === '') return null;
        if (str_contains($value, 'otomatik')) return 'AUTOMATIC';
        if (str_contains($value, 'manuel')) return 'MANUAL';
        return strtoupper($value);
    }

    private static function fuelLabel(string $value): string
    {
        return ['DIESEL' => 'Dizel', 'ELECTRIC' => 'Elektrikli', 'GASOLINE' => 'Benzin', 'GASOLINE_LPG' => 'Benzin + LPG', 'HYBRID' => 'Hybrid'][$value] ?? $value;
    }

    private static function text(array $input, string $key): string { return trim((string) ($input[$key] ?? '')); }
    private static function lower(string $value): string { return function_exists('mb_strtolower') ? mb_strtolower($value, 'UTF-8') : strtolower($value); }
}
