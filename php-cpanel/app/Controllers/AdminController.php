<?php

declare(strict_types=1);

namespace Kaptas\Controllers;

use Kaptas\Core\Auth;
use Kaptas\Core\Csrf;
use Kaptas\Core\Database;
use Kaptas\Core\Id;
use Kaptas\Core\Request;
use Kaptas\Core\Response;
use Kaptas\Services\Audit;
use Kaptas\Services\Upload;
use PDO;

final class AdminController
{
    private const VEHICLE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
    private const DELIVERY_STATUSES = ['IN_STOCK', 'LIMITED_STOCK', 'ORDER_ONLY', 'SOON'];
    private const FUELS = ['GASOLINE', 'GASOLINE_LPG', 'DIESEL', 'HYBRID', 'ELECTRIC'];
    private const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC'];
    private const DRIVES = ['', 'FWD', 'RWD', 'AWD', 'FOUR_WD'];

    public static function bootstrap(): never
    {
        $user = Auth::requireAdmin();
        Response::json(['csrfToken' => Csrf::token(), 'user' => $user]);
    }

    public static function dashboard(): never
    {
        Auth::requireAdmin();
        $pdo = Database::connection();
        $counts = [
            'vehicles' => (int) $pdo->query('SELECT COUNT(*) FROM Vehicle')->fetchColumn(),
            'publishedVehicles' => (int) $pdo->query("SELECT COUNT(*) FROM Vehicle WHERE status = 'PUBLISHED' AND isPublishedWeb = 1")->fetchColumn(),
            'activeReservations' => (int) $pdo->query("SELECT COUNT(*) FROM Reservation WHERE status IN ('HOLD', 'CONFIRMED')")->fetchColumn(),
            'newLeads' => (int) $pdo->query("SELECT COUNT(*) FROM QuoteRequest WHERE status = 'RECEIVED'")->fetchColumn(),
            'pendingDocuments' => (int) $pdo->query("SELECT COUNT(*) FROM Document WHERE status = 'UPLOADED'")->fetchColumn(),
            'users' => (int) $pdo->query('SELECT COUNT(*) FROM User')->fetchColumn(),
        ];
        $revenue = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM PaymentIntent WHERE status = 'PAID' AND currency = 'TRY'")->fetchColumn();
        $recent = $pdo->query(
            'SELECT q.id, q.contactName, q.contactEmail, q.status, q.source, q.createdAt FROM QuoteRequest q ORDER BY q.createdAt DESC LIMIT 8'
        )->fetchAll();
        Response::json(['counts' => $counts, 'paidRevenueTry' => (float) $revenue, 'recentLeads' => $recent]);
    }

    public static function vehicles(): never
    {
        Auth::requireAdmin();
        $pdo = Database::connection();
        $rows = $pdo->query(
            'SELECT v.*, b.name AS brandName, m.name AS modelName FROM Vehicle v JOIN VehicleBrand b ON b.id = v.brandId '
            . 'JOIN VehicleModel m ON m.id = v.modelId ORDER BY v.createdAt DESC'
        )->fetchAll();
        $images = self::groupByVehicle($pdo->query('SELECT * FROM VehicleImage ORDER BY isCover DESC, sortOrder ASC')->fetchAll());
        $features = self::groupByVehicle($pdo->query('SELECT * FROM VehicleFeature ORDER BY sortOrder ASC')->fetchAll());
        foreach ($rows as &$row) {
            $row['stockCount'] = (int) $row['stockCount'];
            $row['dailyPrice'] = $row['dailyPrice'] !== null ? (float) $row['dailyPrice'] : null;
            $row['isFeatured'] = (bool) $row['isFeatured'];
            $row['isPublishedWeb'] = (bool) $row['isPublishedWeb'];
            $row['images'] = $images[$row['id']] ?? [];
            $row['features'] = $features[$row['id']] ?? [];
        }
        unset($row);
        Response::json([
            'data' => $rows,
            'brands' => $pdo->query('SELECT id, name, slug FROM VehicleBrand ORDER BY name')->fetchAll(),
            'models' => $pdo->query('SELECT id, brandId, name, slug FROM VehicleModel ORDER BY name')->fetchAll(),
        ]);
    }

    public static function createVehicle(): never
    {
        self::mutation();
        $admin = Auth::requireAdmin();
        $input = Request::json();
        $data = self::vehicleData($input);
        $id = Id::make('vehicle_');
        Database::transaction(static function (PDO $pdo) use ($id, $data): void {
            [$brandId, $modelId] = self::brandAndModel($pdo, $data['brand'], $data['model']);
            $slug = self::uniqueSlug($pdo, $data['brand'] . '-' . $data['model']);
            self::insertVehicle($pdo, $id, $brandId, $modelId, $slug, $data);
            self::replaceFeatures($pdo, $id, $data['features']);
        });
        Audit::record($admin['id'], 'CREATE', 'Vehicle', $id, null, $data);
        Response::json(['id' => $id, 'ok' => true], 201);
    }

    public static function updateVehicle(): never
    {
        self::mutation();
        $admin = Auth::requireAdmin();
        $input = Request::json();
        $id = trim((string) ($input['id'] ?? ''));
        if ($id === '') Response::json(['error' => 'Arac kimligi eksik.'], 422);
        $pdo = Database::connection();
        $read = $pdo->prepare('SELECT * FROM Vehicle WHERE id = ?');
        $read->execute([$id]);
        $before = $read->fetch(PDO::FETCH_ASSOC);
        if (!$before) Response::json(['error' => 'Arac bulunamadi.'], 404);
        $data = self::vehicleData($input);
        try {
            Database::transaction(static function (PDO $pdo) use ($id, $data): void {
                $lock = $pdo->prepare('SELECT id FROM Vehicle WHERE id = ? FOR UPDATE');
                $lock->execute([$id]);
                if (!$lock->fetchColumn()) throw new \RuntimeException('Arac bulunamadi.');

                $minimumStock = self::minimumReservedStock($pdo, $id);
                if ($data['stockCount'] < $minimumStock) {
                    throw new \DomainException("Bu arac icin ayni tarih araliginda {$minimumStock} aktif rezervasyon var.");
                }

                [$brandId, $modelId] = self::brandAndModel($pdo, $data['brand'], $data['model']);
                $statement = $pdo->prepare(
                    'UPDATE Vehicle SET brandId = ?, modelId = ?, title = ?, year = ?, fuelType = ?, transmission = ?, driveType = ?, bodyType = ?, segment = ?, enginePower = ?, '
                    . 'dailyPrice = ?, deliveryStatus = ?, stockCount = ?, status = ?, isFeatured = ?, isPublishedWeb = ?, isPublishedMobile = 0, seoTitle = ?, seoDescription = ?, updatedAt = NOW(3) WHERE id = ?'
                );
                $statement->execute([
                    $brandId, $modelId, $data['title'], $data['year'], $data['fuelType'], $data['transmission'], $data['driveType'] ?: null,
                    $data['bodyType'] ?: null, $data['segment'] ?: null, $data['enginePower'] ?: null, $data['dailyPrice'],
                    $data['deliveryStatus'], $data['stockCount'], $data['status'], $data['isFeatured'], $data['isPublishedWeb'],
                    $data['seoTitle'] ?: null, $data['seoDescription'] ?: null, $id,
                ]);
                self::replaceFeatures($pdo, $id, $data['features']);
            });
        } catch (\DomainException $error) {
            Response::json(['error' => $error->getMessage()], 409);
        }
        Audit::record($admin['id'], 'UPDATE', 'Vehicle', $id, $before, $data);
        Response::json(['id' => $id, 'ok' => true]);
    }

    public static function deleteVehicle(): never
    {
        self::mutation();
        $admin = Auth::requireAdmin();
        $id = trim((string) ($_GET['id'] ?? ''));
        $pdo = Database::connection();
        $read = $pdo->prepare('SELECT * FROM Vehicle WHERE id = ?');
        $read->execute([$id]);
        $before = $read->fetch(PDO::FETCH_ASSOC);
        if (!$before) Response::json(['error' => 'Arac bulunamadi.'], 404);
        $used = $pdo->prepare('SELECT COUNT(*) FROM Reservation WHERE vehicleId = ?');
        $used->execute([$id]);
        if ((int) $used->fetchColumn() > 0) {
            Response::json(['error' => 'Rezervasyon gecmisi olan arac silinemez; arsivlenmelidir.'], 409);
        }
        $files = $pdo->prepare('SELECT url FROM VehicleImage WHERE vehicleId = ?');
        $files->execute([$id]);
        Database::transaction(static function (PDO $pdo) use ($id): void {
            $pdo->prepare('UPDATE QuoteRequestItem SET vehicleId = NULL WHERE vehicleId = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM FavoriteVehicle WHERE vehicleId = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM CustomerActivity WHERE vehicleId = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM Vehicle WHERE id = ?')->execute([$id]);
        });
        foreach ($files->fetchAll(PDO::FETCH_COLUMN) as $url) self::deleteUploadedFile((string) $url);
        Audit::record($admin['id'], 'DELETE', 'Vehicle', $id, $before, null);
        Response::json(['ok' => true]);
    }

    public static function uploadVehicleImage(): never
    {
        self::mutation();
        $admin = Auth::requireAdmin();
        $vehicleId = trim((string) ($_POST['vehicleId'] ?? ''));
        $pdo = Database::connection();
        $check = $pdo->prepare('SELECT id, title FROM Vehicle WHERE id = ?');
        $check->execute([$vehicleId]);
        $vehicle = $check->fetch(PDO::FETCH_ASSOC);
        if (!$vehicle) Response::json(['error' => 'Arac bulunamadi.'], 404);
        $upload = Upload::vehicle($_FILES['image'] ?? []);
        $count = $pdo->prepare('SELECT COUNT(*) FROM VehicleImage WHERE vehicleId = ?');
        $count->execute([$vehicleId]);
        $sort = (int) $count->fetchColumn();
        $id = Id::make('image_');
        $pdo->prepare('INSERT INTO VehicleImage (id, vehicleId, url, alt, sortOrder, isCover, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW(3))')
            ->execute([$id, $vehicleId, $upload['url'], $vehicle['title'], $sort, $sort === 0 ? 1 : 0]);
        Audit::record($admin['id'], 'UPLOAD_IMAGE', 'Vehicle', $vehicleId, null, ['imageId' => $id, 'url' => $upload['url']]);
        Response::json(['id' => $id, 'ok' => true, 'url' => $upload['url']], 201);
    }

    public static function updateVehicleImage(): never
    {
        self::mutation();
        $admin = Auth::requireAdmin();
        $input = Request::json();
        $id = trim((string) ($input['id'] ?? ''));
        $pdo = Database::connection();
        $read = $pdo->prepare('SELECT * FROM VehicleImage WHERE id = ?');
        $read->execute([$id]);
        $image = $read->fetch(PDO::FETCH_ASSOC);
        if (!$image) Response::json(['error' => 'Gorsel bulunamadi.'], 404);
        Database::transaction(static function (PDO $pdo) use ($id, $image, $input): void {
            if (($input['isCover'] ?? false) === true) {
                $pdo->prepare('UPDATE VehicleImage SET isCover = 0 WHERE vehicleId = ?')->execute([$image['vehicleId']]);
            }
            $pdo->prepare('UPDATE VehicleImage SET alt = ?, sortOrder = ?, isCover = ? WHERE id = ?')->execute([
                mb_substr(trim((string) ($input['alt'] ?? '')), 0, 191), max(0, (int) ($input['sortOrder'] ?? 0)),
                ($input['isCover'] ?? false) === true ? 1 : 0, $id,
            ]);
        });
        Audit::record($admin['id'], 'UPDATE_IMAGE', 'Vehicle', $image['vehicleId'], $image, $input);
        Response::json(['ok' => true]);
    }

    public static function deleteVehicleImage(): never
    {
        self::mutation();
        $admin = Auth::requireAdmin();
        $id = trim((string) ($_GET['id'] ?? ''));
        $pdo = Database::connection();
        $read = $pdo->prepare('SELECT * FROM VehicleImage WHERE id = ?');
        $read->execute([$id]);
        $image = $read->fetch(PDO::FETCH_ASSOC);
        if (!$image) Response::json(['error' => 'Gorsel bulunamadi.'], 404);
        $pdo->prepare('DELETE FROM VehicleImage WHERE id = ?')->execute([$id]);
        self::deleteUploadedFile((string) $image['url']);
        $cover = $pdo->prepare('SELECT id FROM VehicleImage WHERE vehicleId = ? ORDER BY sortOrder LIMIT 1');
        $cover->execute([$image['vehicleId']]);
        if ($coverId = $cover->fetchColumn()) $pdo->prepare('UPDATE VehicleImage SET isCover = 1 WHERE id = ?')->execute([$coverId]);
        Audit::record($admin['id'], 'DELETE_IMAGE', 'Vehicle', $image['vehicleId'], $image, null);
        Response::json(['ok' => true]);
    }

    public static function reservations(): never
    {
        Auth::requireAdmin();
        $rows = Database::connection()->query(
            'SELECT r.*, v.title AS vehicleTitle, b.name AS brandName, m.name AS modelName, p.amount, p.currency, p.status AS paymentStatus '
            . 'FROM Reservation r JOIN Vehicle v ON v.id = r.vehicleId JOIN VehicleBrand b ON b.id = v.brandId JOIN VehicleModel m ON m.id = v.modelId '
            . 'LEFT JOIN PaymentIntent p ON p.id = r.paymentIntentId ORDER BY r.createdAt DESC LIMIT 500'
        )->fetchAll();
        Response::json(['data' => $rows]);
    }

    public static function updateReservation(): never
    {
        self::mutation();
        $admin = Auth::requireAdmin();
        $input = Request::json();
        $status = (string) ($input['status'] ?? '');
        if (!in_array($status, ['HOLD', 'CONFIRMED', 'CANCELLED', 'EXPIRED'], true)) Response::json(['error' => 'Rezervasyon durumu gecersiz.'], 422);
        $pdo = Database::connection();
        $read = $pdo->prepare('SELECT * FROM Reservation WHERE id = ?');
        $read->execute([(string) ($input['id'] ?? '')]);
        $before = $read->fetch(PDO::FETCH_ASSOC);
        if (!$before) Response::json(['error' => 'Rezervasyon bulunamadi.'], 404);
        try {
            Database::transaction(static function (PDO $pdo) use ($before, $status, $input): void {
                // Keep the same vehicle -> reservation lock order as checkout/stock operations.
                $vehicleLock = $pdo->prepare('SELECT id FROM Vehicle WHERE id = ? FOR UPDATE');
                $vehicleLock->execute([$before['vehicleId']]);
                $reservation = $pdo->prepare('SELECT * FROM Reservation WHERE id = ? FOR UPDATE');
                $reservation->execute([$before['id']]);
                $current = $reservation->fetch(PDO::FETCH_ASSOC);
                if (!$current) throw new \DomainException('Rezervasyon bulunamadi.');

                if ($status === 'CONFIRMED') {
                    if (!$current['paymentIntentId']) {
                        throw new \DomainException('Dogrulanmis odeme olmadan rezervasyon onaylanamaz.');
                    }
                    $paid = $pdo->prepare("SELECT id FROM PaymentIntent WHERE id = ? AND status = 'PAID' LIMIT 1");
                    $paid->execute([$current['paymentIntentId']]);
                    if (!$paid->fetchColumn()) {
                        throw new \DomainException('Odeme dogrulanmadan rezervasyon onaylanamaz.');
                    }
                }

                if (in_array($status, ['HOLD', 'CONFIRMED'], true)) {
                    if (strtotime((string) $current['dropoffAt']) <= time()) {
                        throw new \DomainException('Suresi gecmis rezervasyon yeniden etkinlestirilemez.');
                    }
                    $vehicle = $pdo->prepare('SELECT stockCount FROM Vehicle WHERE id = ? FOR UPDATE');
                    $vehicle->execute([$current['vehicleId']]);
                    $stock = (int) $vehicle->fetchColumn();
                    $pdo->prepare("UPDATE Reservation SET status = 'EXPIRED', updatedAt = NOW(3) WHERE vehicleId = ? AND id <> ? AND status = 'HOLD' AND holdExpiresAt <= NOW(3)")
                        ->execute([$current['vehicleId'], $current['id']]);
                    $reserved = $pdo->prepare(
                        "SELECT COUNT(*) FROM Reservation WHERE vehicleId = ? AND id <> ? AND pickupAt < ? AND dropoffAt > ? "
                        . "AND (status = 'CONFIRMED' OR (status = 'HOLD' AND holdExpiresAt > NOW(3)))"
                    );
                    $reserved->execute([$current['vehicleId'], $current['id'], $current['dropoffAt'], $current['pickupAt']]);
                    if ($stock <= 0 || (int) $reserved->fetchColumn() >= $stock) {
                        throw new \DomainException('Secilen tarih araliginda arac stogu dolu.');
                    }
                }

                $pdo->prepare('UPDATE Reservation SET status = ?, cancellationNote = ?, holdExpiresAt = IF(? = \'HOLD\', DATE_ADD(NOW(3), INTERVAL 15 MINUTE), NULL), updatedAt = NOW(3) WHERE id = ?')
                    ->execute([$status, trim((string) ($input['cancellationNote'] ?? '')) ?: null, $status, $current['id']]);
            });
        } catch (\DomainException $error) {
            Response::json(['error' => $error->getMessage()], 409);
        }
        Audit::record($admin['id'], 'STATUS_CHANGE', 'Reservation', $before['id'], $before, ['status' => $status]);
        Response::json(['ok' => true]);
    }

    public static function leads(): never
    {
        Auth::requireAdmin();
        Response::json(['data' => Database::connection()->query(
            'SELECT q.*, u.name AS assignedSalesRepName, (SELECT CONCAT(COALESCE(brandText, \'\'), \' \', COALESCE(modelText, \'\')) FROM QuoteRequestItem WHERE quoteRequestId = q.id LIMIT 1) AS vehicleName '
            . 'FROM QuoteRequest q LEFT JOIN User u ON u.id = q.assignedSalesRepId ORDER BY q.createdAt DESC LIMIT 500'
        )->fetchAll()]);
    }

    public static function updateLead(): never
    {
        self::mutation();
        $admin = Auth::requireAdmin();
        $input = Request::json();
        $status = (string) ($input['status'] ?? '');
        $allowed = ['RECEIVED','REVIEWING','WAITING_DOCUMENTS','PREPARING_OFFER','OFFER_SENT','REVISION_REQUESTED','APPROVED','REJECTED','CONTRACT_STAGE','DELIVERY_PLANNED','COMPLETED','CANCELLED'];
        if (!in_array($status, $allowed, true)) Response::json(['error' => 'Talep durumu gecersiz.'], 422);
        $pdo = Database::connection();
        $read = $pdo->prepare('SELECT * FROM QuoteRequest WHERE id = ?');
        $read->execute([(string) ($input['id'] ?? '')]);
        $before = $read->fetch(PDO::FETCH_ASSOC);
        if (!$before) Response::json(['error' => 'Talep bulunamadi.'], 404);
        $pdo->prepare('UPDATE QuoteRequest SET status = ?, assignedSalesRepId = ?, updatedAt = NOW(3) WHERE id = ?')->execute([
            $status, trim((string) ($input['assignedSalesRepId'] ?? '')) ?: null, $before['id'],
        ]);
        $pdo->prepare('INSERT INTO QuoteStatusHistory (id, quoteRequestId, fromStatus, toStatus, changedById, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW(3))')
            ->execute([Id::make('history_'), $before['id'], $before['status'], $status, $admin['id'], trim((string) ($input['note'] ?? '')) ?: null]);
        Audit::record($admin['id'], 'STATUS_CHANGE', 'QuoteRequest', $before['id'], $before, ['status' => $status]);
        Response::json(['ok' => true]);
    }

    public static function locations(): never
    {
        Auth::requireAdmin();
        $data = Database::connection()->query('SELECT * FROM BranchLocation ORDER BY sortOrder ASC, name ASC')->fetchAll();
        Response::json([
            'activeCount' => count(array_filter($data, static fn (array $row): bool => (bool) $row['isActive'])),
            'data' => $data,
        ]);
    }

    public static function saveLocation(): never
    {
        self::mutation();
        $admin = Auth::requireAdmin();
        $input = Request::json();
        $name = trim((string) ($input['name'] ?? ''));
        $address = trim((string) ($input['address'] ?? ''));
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $phone = trim((string) ($input['phone'] ?? ''));
        $rating = filter_var($input['rating'] ?? 5, FILTER_VALIDATE_FLOAT);
        $sortOrder = filter_var($input['sortOrder'] ?? 0, FILTER_VALIDATE_INT);
        $isActive = !array_key_exists('isActive', $input) || in_array($input['isActive'], [true, 1, '1', 'true', 'on'], true);
        if (mb_strlen($name) < 2 || mb_strlen($name) > 191 || mb_strlen($address) < 5 || mb_strlen($address) > 2000) {
            Response::json(['error' => 'Lokasyon adi ve acik adres zorunludur.'], 422);
        }
        foreach (['nameEn', 'nameAr', 'subtitle', 'subtitleEn', 'subtitleAr', 'city', 'district'] as $field) {
            if (mb_strlen(trim((string) ($input[$field] ?? ''))) > 191) Response::json(['error' => 'Lokasyon alanlarindan biri cok uzun.'], 422);
        }
        foreach (['addressEn', 'addressAr'] as $field) {
            if (mb_strlen(trim((string) ($input[$field] ?? ''))) > 2000) Response::json(['error' => 'Cevrilmis adres cok uzun.'], 422);
        }
        if ($email !== '' && (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 191)) {
            Response::json(['error' => 'E-posta adresi gecersiz.'], 422);
        }
        if ($phone !== '' && !preg_match('/^\+?[0-9\s()\-]{10,20}$/', $phone)) {
            Response::json(['error' => 'Telefon numarasi gecersiz.'], 422);
        }
        if ($rating === false || $rating < 0 || $rating > 5 || $sortOrder === false || $sortOrder < 0 || $sortOrder > 9999) {
            Response::json(['error' => 'Puan veya yayin sirasi gecersiz.'], 422);
        }
        $pdo = Database::connection();
        $requestedId = trim((string) ($input['id'] ?? ''));
        $id = $requestedId ?: Id::make('location_');
        $before = null;
        if ($requestedId !== '') {
            $read = $pdo->prepare('SELECT * FROM BranchLocation WHERE id = ? LIMIT 1');
            $read->execute([$id]);
            $before = $read->fetch(PDO::FETCH_ASSOC);
            if (!$before) Response::json(['error' => 'Duzenlenecek lokasyon bulunamadi.'], 404);
        }
        $slug = self::slug($name);
        $duplicate = $pdo->prepare('SELECT id FROM BranchLocation WHERE slug = ? AND id <> ? LIMIT 1');
        $duplicate->execute([$slug, $id]);
        if ($duplicate->fetchColumn()) Response::json(['error' => 'Ayni adla kayitli baska bir lokasyon var.'], 409);
        if (!$isActive) {
            $active = $pdo->prepare('SELECT COUNT(*) FROM BranchLocation WHERE isActive = 1 AND id <> ?');
            $active->execute([$id]);
            if ((int) $active->fetchColumn() === 0) Response::json(['error' => 'En az bir lokasyon aktif kalmalidir.'], 409);
        }
        $values = [
            $name, self::nullable($input, 'nameEn'), self::nullable($input, 'nameAr'), $slug,
            self::nullable($input, 'subtitle'), self::nullable($input, 'subtitleEn'), self::nullable($input, 'subtitleAr'),
            $address, self::nullable($input, 'addressEn'), self::nullable($input, 'addressAr'),
            self::nullable($input, 'city'), self::nullable($input, 'district'), $phone ?: null, $email ?: null,
            (float) $rating, in_array(($input['type'] ?? ''), ['city', 'airport'], true) ? $input['type'] : 'city',
            (int) $sortOrder, $isActive ? 1 : 0,
        ];
        if ($before) {
            $pdo->prepare(
                'UPDATE BranchLocation SET name=?, nameEn=?, nameAr=?, slug=?, subtitle=?, subtitleEn=?, subtitleAr=?, address=?, addressEn=?, addressAr=?, '
                . 'city=?, district=?, phone=?, email=?, rating=?, type=?, sortOrder=?, isActive=?, updatedAt=NOW(3) WHERE id=?'
            )->execute([...$values, $id]);
        } else {
            $pdo->prepare(
                'INSERT INTO BranchLocation (name, nameEn, nameAr, slug, subtitle, subtitleEn, subtitleAr, address, addressEn, addressAr, city, district, phone, email, rating, type, sortOrder, isActive, id, createdAt, updatedAt) '
                . 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))'
            )->execute([...$values, $id]);
        }
        Audit::record($admin['id'], $before ? 'UPDATE' : 'CREATE', 'BranchLocation', $id, $before ?: null, $input);
        Response::json(['id' => $id, 'ok' => true]);
    }

    public static function users(): never
    {
        Auth::requireAdmin();
        Response::json(['data' => Database::connection()->query(
            'SELECT id, name, email, emailVerified, phone, role, status, lastLoginAt, createdAt FROM User ORDER BY createdAt DESC LIMIT 500'
        )->fetchAll()]);
    }

    public static function updateUser(): never
    {
        self::mutation();
        $admin = Auth::requireAdmin();
        $input = Request::json();
        $role = (string) ($input['role'] ?? 'USER');
        $status = (string) ($input['status'] ?? 'ACTIVE');
        if (!in_array($role, ['USER','CORPORATE_USER','DRIVER','SALES_REP','OPERATIONS_STAFF','ADMIN','SUPER_ADMIN'], true)
            || !in_array($status, ['ACTIVE','PASSIVE','SUSPENDED','PENDING_VERIFICATION'], true)) Response::json(['error' => 'Rol veya durum gecersiz.'], 422);
        if (($input['id'] ?? '') === $admin['id'] && ($status !== 'ACTIVE' || !in_array($role, ['ADMIN','SUPER_ADMIN'], true))) {
            Response::json(['error' => 'Kendi yonetici erisiminizi kaldiramazsiniz.'], 409);
        }
        if ($role === 'SUPER_ADMIN' && $admin['role'] !== 'SUPER_ADMIN') Response::json(['error' => 'Yalnizca ana yonetici bu rolu verebilir.'], 403);
        Database::connection()->prepare('UPDATE User SET role = ?, status = ?, updatedAt = NOW(3) WHERE id = ?')->execute([$role, $status, (string) $input['id']]);
        Audit::record($admin['id'], 'ACCESS_CHANGE', 'User', (string) $input['id'], null, compact('role', 'status'));
        Response::json(['ok' => true]);
    }

    public static function documents(): never
    {
        Auth::requireAdmin();
        Response::json(['data' => Database::connection()->query(
            'SELECT d.*, u.name AS userName, u.email AS userEmail FROM Document d LEFT JOIN User u ON u.id = d.userId ORDER BY d.createdAt DESC LIMIT 500'
        )->fetchAll()]);
    }

    public static function updateDocument(): never
    {
        self::mutation();
        $admin = Auth::requireAdmin();
        $input = Request::json();
        $status = (string) ($input['status'] ?? '');
        if (!in_array($status, ['REQUESTED','UPLOADED','APPROVED','REJECTED','EXPIRED'], true)) Response::json(['error' => 'Belge durumu gecersiz.'], 422);
        $reason = trim((string) ($input['rejectionReason'] ?? ''));
        if ($status === 'REJECTED' && mb_strlen($reason) < 3) Response::json(['error' => 'Red nedeni zorunludur.'], 422);
        Database::connection()->prepare('UPDATE Document SET status = ?, rejectionReason = ?, reviewedById = ?, reviewedAt = NOW(3), updatedAt = NOW(3) WHERE id = ?')
            ->execute([$status, $status === 'REJECTED' ? $reason : null, $admin['id'], (string) $input['id']]);
        Audit::record($admin['id'], 'REVIEW', 'Document', (string) $input['id'], null, compact('status', 'reason'));
        Response::json(['ok' => true]);
    }

    private static function mutation(): void { Csrf::requireForMutation(); }

    private static function vehicleData(array $input): array
    {
        $brand = trim((string) ($input['brand'] ?? ''));
        $model = trim((string) ($input['model'] ?? ''));
        $daily = filter_var($input['dailyPrice'] ?? null, FILTER_VALIDATE_FLOAT);
        $stock = filter_var($input['stockCount'] ?? null, FILTER_VALIDATE_INT);
        $fuel = (string) ($input['fuelType'] ?? '');
        $transmission = (string) ($input['transmission'] ?? '');
        $drive = (string) ($input['driveType'] ?? '');
        $status = (string) ($input['status'] ?? 'DRAFT');
        $delivery = (string) ($input['deliveryStatus'] ?? 'IN_STOCK');
        if (mb_strlen($brand) < 2 || mb_strlen($model) < 1 || $stock === false || $stock < 0 || $stock > 999
            || ($daily !== false && ($daily <= 0 || $daily > 999999.99)) || !in_array($fuel, self::FUELS, true)
            || !in_array($transmission, self::TRANSMISSIONS, true) || !in_array($drive, self::DRIVES, true)
            || !in_array($status, self::VEHICLE_STATUSES, true) || !in_array($delivery, self::DELIVERY_STATUSES, true)) {
            Response::json(['error' => 'Arac bilgilerini ve fiyat/stok degerlerini kontrol edin.'], 422);
        }
        $features = is_array($input['features'] ?? null) ? array_values(array_filter(array_map(static function ($feature): ?array {
            if (!is_array($feature)) return null;
            $label = mb_substr(trim((string) ($feature['label'] ?? '')), 0, 191);
            $value = mb_substr(trim((string) ($feature['value'] ?? '')), 0, 191);
            return $label !== '' && $value !== '' ? ['label' => $label, 'value' => $value, 'group' => mb_substr(trim((string) ($feature['group'] ?? 'Donanım')), 0, 191)] : null;
        }, $input['features']))) : [];
        return [
            'brand' => $brand, 'model' => $model,
            'title' => trim((string) ($input['title'] ?? '')) ?: $brand . ' ' . $model,
            'year' => ($year = (int) ($input['year'] ?? 0)) >= 2000 && $year <= (int) date('Y') + 1 ? $year : null,
            'fuelType' => $fuel, 'transmission' => $transmission, 'driveType' => $drive,
            'bodyType' => mb_substr(trim((string) ($input['bodyType'] ?? '')), 0, 191),
            'segment' => mb_substr(trim((string) ($input['segment'] ?? '')), 0, 191),
            'enginePower' => mb_substr(trim((string) ($input['enginePower'] ?? '')), 0, 191),
            'dailyPrice' => $daily === false ? null : round((float) $daily, 2), 'stockCount' => $stock,
            'deliveryStatus' => $delivery, 'status' => $status,
            'isFeatured' => ($input['isFeatured'] ?? false) === true ? 1 : 0,
            'isPublishedWeb' => ($input['isPublishedWeb'] ?? false) === true ? 1 : 0,
            'seoTitle' => mb_substr(trim((string) ($input['seoTitle'] ?? '')), 0, 191),
            'seoDescription' => mb_substr(trim((string) ($input['seoDescription'] ?? '')), 0, 191),
            'features' => $features,
        ];
    }

    private static function brandAndModel(PDO $pdo, string $brand, string $model): array
    {
        $brandSlug = self::slug($brand);
        $brandId = Id::make('brand_');
        $pdo->prepare('INSERT INTO VehicleBrand (id, name, slug, isActive, createdAt, updatedAt) VALUES (?, ?, ?, 1, NOW(3), NOW(3)) ON DUPLICATE KEY UPDATE name=VALUES(name), isActive=1, updatedAt=NOW(3)')
            ->execute([$brandId, $brand, $brandSlug]);
        $readBrand = $pdo->prepare('SELECT id FROM VehicleBrand WHERE slug = ?'); $readBrand->execute([$brandSlug]); $brandId = (string) $readBrand->fetchColumn();
        $modelSlug = self::slug($model);
        $modelId = Id::make('model_');
        $pdo->prepare('INSERT INTO VehicleModel (id, brandId, name, slug, isActive) VALUES (?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE name=VALUES(name), isActive=1')
            ->execute([$modelId, $brandId, $model, $modelSlug]);
        $readModel = $pdo->prepare('SELECT id FROM VehicleModel WHERE brandId = ? AND slug = ?'); $readModel->execute([$brandId, $modelSlug]); $modelId = (string) $readModel->fetchColumn();
        return [$brandId, $modelId];
    }

    private static function insertVehicle(PDO $pdo, string $id, string $brandId, string $modelId, string $slug, array $d): void
    {
        $pdo->prepare(
            'INSERT INTO Vehicle (id, brandId, modelId, title, slug, year, fuelType, transmission, driveType, bodyType, segment, enginePower, dailyPrice, deliveryStatus, stockCount, status, isFeatured, isPublishedWeb, isPublishedMobile, seoTitle, seoDescription, createdAt, updatedAt) '
            . 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, NOW(3), NOW(3))'
        )->execute([$id,$brandId,$modelId,$d['title'],$slug,$d['year'],$d['fuelType'],$d['transmission'],$d['driveType']?:null,$d['bodyType']?:null,$d['segment']?:null,$d['enginePower']?:null,$d['dailyPrice'],$d['deliveryStatus'],$d['stockCount'],$d['status'],$d['isFeatured'],$d['isPublishedWeb'],$d['seoTitle']?:null,$d['seoDescription']?:null]);
    }

    private static function replaceFeatures(PDO $pdo, string $vehicleId, array $features): void
    {
        $pdo->prepare('DELETE FROM VehicleFeature WHERE vehicleId = ?')->execute([$vehicleId]);
        $insert = $pdo->prepare('INSERT INTO VehicleFeature (id, vehicleId, label, value, `group`, sortOrder) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($features as $index => $feature) $insert->execute([Id::make('feature_'), $vehicleId, $feature['label'], $feature['value'], $feature['group'], $index]);
    }

    private static function minimumReservedStock(PDO $pdo, string $vehicleId): int
    {
        $statement = $pdo->prepare(
            "SELECT pickupAt, dropoffAt FROM Reservation WHERE vehicleId = ? AND dropoffAt > NOW(3) "
            . "AND (status = 'CONFIRMED' OR (status = 'HOLD' AND holdExpiresAt > NOW(3)))"
        );
        $statement->execute([$vehicleId]);
        $events = [];
        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $reservation) {
            $events[] = ['at' => (string) $reservation['pickupAt'], 'change' => 1];
            $events[] = ['at' => (string) $reservation['dropoffAt'], 'change' => -1];
        }
        usort($events, static fn (array $left, array $right): int => [$left['at'], $left['change']] <=> [$right['at'], $right['change']]);
        $active = 0;
        $maximum = 0;
        foreach ($events as $event) {
            $active += $event['change'];
            $maximum = max($maximum, $active);
        }
        return $maximum;
    }

    private static function groupByVehicle(array $rows): array { $result=[]; foreach($rows as $row) $result[$row['vehicleId']][]=$row; return $result; }
    private static function nullable(array $input, string $key): ?string { $value=trim((string)($input[$key]??'')); return $value!==''?$value:null; }
    private static function slug(string $value): string { $value=strtr(mb_strtolower($value,'UTF-8'),['ç'=>'c','ğ'=>'g','ı'=>'i','ö'=>'o','ş'=>'s','ü'=>'u']); $value=preg_replace('/[^a-z0-9]+/','-',$value)??''; return trim($value,'-')?:'kayit'; }
    private static function uniqueSlug(PDO $pdo, string $value): string { $base=self::slug($value); $slug=$base; $i=2; $check=$pdo->prepare('SELECT 1 FROM Vehicle WHERE slug = ?'); do{$check->execute([$slug]); if(!$check->fetchColumn()) return $slug; $slug=$base.'-'.$i++;}while($i<10000); return $base.'-'.bin2hex(random_bytes(3)); }
    private static function deleteUploadedFile(string $url): void { if(!str_starts_with($url,'/uploads/vehicles/')) return; $base=realpath(KAPTAS_ROOT.'/public_html/uploads/vehicles'); $file=realpath(KAPTAS_ROOT.'/public_html'.$url); if($base&&$file&&str_starts_with($file,$base.DIRECTORY_SEPARATOR)&&is_file($file)) @unlink($file); }
}
