<?php

declare(strict_types=1);

namespace Kaptas\Services;

use PDO;

final class PaymentStatus
{
    public static function find(PDO $pdo, string $id): ?array
    {
        $read = $pdo->prepare(
            'SELECT p.id, p.amount, p.currency, p.status, p.userId AS paymentUserId, p.quoteRequestId AS paymentLeadId, '
            . 'a.state AS bankState, a.environment AS bankEnvironment, a.resultCode, '
            . 'r.userId, r.quoteRequestId, r.status AS reservationStatus, r.id AS reservationId, '
            . 'r.pickupAt, r.dropoffAt, r.pickupLocation, r.dropoffLocation, v.title '
            . 'FROM PaymentIntent p LEFT JOIN Reservation r ON r.paymentIntentId = p.id '
            . 'LEFT JOIN Vehicle v ON v.id = r.vehicleId LEFT JOIN PhpVposAttempt a ON a.paymentId = p.id WHERE p.id = ? LIMIT 1'
        );
        $read->execute([$id]);
        return $read->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public static function owns(array $payment, ?array $user, array $leads): bool
    {
        return ($user !== null && !empty($payment['paymentUserId']) && $payment['paymentUserId'] === $user['id'])
            || (!empty($payment['paymentLeadId']) && in_array($payment['paymentLeadId'], $leads, true));
    }

    public static function present(?array $payment): array
    {
        $bank = $payment['bankState'] ?? '';
        $status = $payment['status'] ?? '';
        $test = ($payment['bankEnvironment'] ?? '') === 'test';
        $code = (string) ($payment['resultCode'] ?? '');
        $state = 'unavailable';
        $tone = 'review';
        $title = 'Ödeme sonucu doğrulanamadı';
        $label = 'Kontrol gerekli';
        $message = 'Onaylanmış bir rezervasyon görüntülenemiyor. Tahsilat gördüyseniz yeniden ödeme yapmadan önce bizimle iletişime geçin.';
        $poll = false;

        if ($test && $bank === 'TEST_PAID') {
            $state = 'test_paid'; $tone = 'success'; $title = 'Test ödemesi doğrulandı'; $label = 'Test başarılı';
            $message = 'Banka test işlemini doğruladı. Gerçek tahsilat veya kesin rezervasyon oluşturulmadı.';
        } elseif (!$test && $bank === 'PAID' && $status === 'PAID' && ($payment['reservationStatus'] ?? '') === 'CONFIRMED') {
            $state = 'confirmed'; $tone = 'success'; $title = 'Rezervasyonunuz kesinleşti'; $label = 'Kesinleşti';
            $message = 'Ödemeniz doğrulandı; ayrıca yönetici onayı gerekmez. Onay e-postanız gönderim kuyruğuna alındı. Hesabınızla işlem yaptıysanız detayları Kiraladıklarım bölümünde bulabilirsiniz.';
        } elseif ($bank === 'REVIEW_STOCK' || $status === 'PAID') {
            $state = 'attention'; $title = 'Rezervasyonunuz inceleniyor'; $label = 'İnceleme gerekli';
            $message = 'Ödemeniz ile rezervasyon durumunuzun eşleştirilmesi gerekiyor. Yeniden ödeme yapmayın; rezervasyon numaranızla bizimle iletişime geçin.';
        } elseif ($bank === 'CHALLENGE' && $test && preg_match('/^CB_[A-Z_]{1,29}$/D', $code)) {
            $state = 'verification_blocked'; $title = 'Banka dönüşü doğrulanamadı'; $label = 'Doğrulama gerekli';
            $message = 'Test işlemindeki banka dönüşü doğrulanamadığı için rezervasyon kesinleştirilmedi. Destek kodu: ' . $code;
        } elseif (in_array($bank, ['FAILED'], true) || in_array($status, ['FAILED', 'CANCELLED', 'REFUNDED'], true)) {
            $state = 'failed'; $tone = 'failed'; $title = 'Ödeme tamamlanamadı'; $label = 'Kesinleşmedi';
        } elseif (in_array($bank, ['ENROLLING', 'CHALLENGE', 'PROCESSING', 'REVIEW'], true)
            && in_array($status, ['PENDING', 'REVIEW_REQUIRED'], true)) {
            $state = 'pending'; $title = 'Ödemeniz kontrol ediliyor'; $label = 'Kontrol ediliyor'; $poll = true;
            $message = 'Banka sonucu henüz kesinleşmedi. Doğrulama tamamlandığında bu ekran otomatik güncellenecek. Yeniden ödeme yapmayın.';
        }

        return compact('state', 'tone', 'title', 'label', 'message', 'poll');
    }
}
