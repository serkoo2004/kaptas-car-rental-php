<?php

declare(strict_types=1);

namespace Kaptas\Controllers;

use DomainException;
use Kaptas\Core\Auth;
use Kaptas\Core\Config;
use Kaptas\Core\Csrf;
use Kaptas\Core\Database;
use Kaptas\Core\RateLimiter;
use Kaptas\Core\Request;
use Kaptas\Core\Response;
use Kaptas\Services\Privacy;
use Kaptas\Services\PaymentStatus;
use Kaptas\Services\RentalCheckout;
use Kaptas\Services\VakifBank;
use Throwable;

final class PaymentController
{
    public static function status(): never
    {
        $id = is_string($_GET['id'] ?? null) ? $_GET['id'] : '';
        if ($id === '' || strlen($id) > 191) Response::json(['error' => 'Odeme bulunamadi.'], 404);
        $user = Auth::user();
        $leads = (array) ($_SESSION['checkout_lead_ids'] ?? []);
        if (session_status() === PHP_SESSION_ACTIVE) session_write_close();
        $payment = PaymentStatus::find(Database::connection(), $id);
        if (!$payment || !(PaymentStatus::owns($payment, $user, $leads) || self::canView($id, $_GET))) {
            Response::json(['error' => 'Odeme bulunamadi veya sonuc baglantisinin suresi doldu.'], 404);
        }
        RateLimiter::enforce('payment-status', 120, 60);
        // Read only: bank callbacks and the reconciliation worker finalize payments.
        Response::json(PaymentStatus::present($payment));
    }

    private static function access(): ?array
    {
        Csrf::requireForMutation();
        $user = Auth::user();
        if (!VakifBank::available($user)) Response::json(['error' => 'Online odeme su anda kullanilamiyor.'], 503);
        return $user;
    }

    public static function quote(): never
    {
        $user = self::access();
        RateLimiter::enforce('payment-quote', 40, 900);
        try {
            $quote = (new RentalCheckout(Database::connection()))->quote(Request::json(20000), $user, (array) ($_SESSION['checkout_lead_ids'] ?? []));
            Response::json($quote);
        } catch (\InvalidArgumentException | DomainException $error) {
            Response::json(['error' => $error->getMessage()], 422);
        } catch (Throwable) { Response::json(['error' => 'Fiyat bilgisi su anda alinamiyor.'], 503); }
    }

    public static function start(): never
    {
        $user = self::access();
        RateLimiter::enforce('payment-start', 8, 900);
        $input = Request::json(24000);
        Privacy::requireNotice($input);
        Privacy::requireRentalTerms($input);
        Privacy::requirePreInformation($input);
        Privacy::requireDistanceSales($input);
        $checkout = new RentalCheckout(Database::connection());
        $prepared = null;
        try {
            $base = rtrim((string) Config::get('app.url'), '/');
            $host = parse_url($base, PHP_URL_HOST);
            if (parse_url($base, PHP_URL_SCHEME) !== 'https' || !$host || $host === 'localhost' || filter_var($host, FILTER_VALIDATE_IP)) {
                throw new DomainException('Banka donusu icin internete acik HTTPS alan adi gerekli.');
            }
            if (Config::isProduction() && (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off') && (int) ($_SERVER['SERVER_PORT'] ?? 0) !== 443) {
                throw new DomainException('Odeme yalnizca HTTPS uzerinden baslatilabilir.');
            }
            $card = VakifBank::validateCard($input);
            unset($input['cardNumber'], $input['expiryMonth'], $input['expiryYear']);
            $quote = RentalCheckout::decodeQuote((string) ($input['quoteToken'] ?? ''));
            $prepared = $checkout->prepare($quote, $input, $user, (array) ($_SESSION['checkout_lead_ids'] ?? []), Request::ip());
            $attempt = $prepared['attempt'];
            $returnUrl = $base . '/api/payments/vakifbank/callback?id=' . rawurlencode($attempt['paymentId']) . '&state=' . $prepared['returnToken'];
            $challenge = VakifBank::enrollment($attempt, $card, $returnUrl);
            unset($card);
            $checkout->challengeReady($attempt['paymentId']);
            Response::json(['challenge' => $challenge, 'paymentId' => $attempt['paymentId']]);
        } catch (\InvalidArgumentException | DomainException $error) {
            if ($prepared) $checkout->failBeforeSale($prepared['attempt']['paymentId']);
            Response::json(['error' => $error->getMessage()], 422);
        } catch (Throwable) {
            if ($prepared) $checkout->failBeforeSale($prepared['attempt']['paymentId']);
            Response::json(['error' => 'Banka baglantisi baslatilamadi. Tahsilat yapilmadi. Lutfen daha sonra deneyin.'], 503);
        }
    }

    public static function callback(): never
    {
        if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 65536) Response::json(['error' => 'Banka cevabi cok buyuk.'], 413);
        $id = is_string($_GET['id'] ?? null) ? $_GET['id'] : '';
        $token = is_string($_GET['state'] ?? null) ? $_GET['state'] : '';
        $checkout = new RentalCheckout(Database::connection());
        $stateVerified = false;
        $input = [];
        $stage = 'CB_READ_ERROR';
        try {
            $attempt = $checkout->attempt($id);
            if (!preg_match('/^[a-f0-9]{64}$/D', $token) || !hash_equals($attempt['returnTokenHash'], hash('sha256', $token))
                || strtotime($attempt['expiresAt']) <= time()) throw new DomainException('Banka donusu dogrulanamadi.');
            $stateVerified = true;
            // Cross-site bank POSTs may have no session cookie; state and signature bind the request.
            $input = Request::input();
            $stage = 'CB_VERIFY_ERROR';
            $security = VakifBank::verifiedCallback($input, $attempt);
            $stage = 'CB_CLAIM_ERROR';
            if (!$security['authenticated']) {
                $checkout->failBeforeSale($id);
            } elseif ($checkout->claim($attempt, $token)) {
                if (session_status() === PHP_SESSION_ACTIVE) session_write_close();
                try { VakifBank::sale($attempt, $security); }
                catch (Throwable) { /* Search determines whether the bank received the sale. */ }
                $stage = 'CB_RECONCILE_ERROR';
                $checkout->reconcile($checkout->attempt($id));
            } else {
                self::recordCallbackDiagnostic($id, 'CB_CLAIM_REJECTED');
            }
        } catch (DomainException $error) {
            // Diagnostics never change financial state or allow an invalid callback to charge.
            if ($stateVerified) {
                self::recordCallbackDiagnostic($id, self::callbackDiagnosticCode($error, $input, $stage));
                self::resultRedirect($id);
            }
            Response::json(['error' => 'Odeme cevabi dogrulanamadi. Yeniden odeme yapmadan once destek ekibimizle iletisime gecin.'], 400);
        } catch (Throwable) {
            if ($stateVerified) {
                self::recordCallbackDiagnostic($id, $stage);
                self::resultRedirect($id);
            }
            Response::json(['error' => 'Odeme sonucu kontrol ediliyor. Yeniden odeme yapmayin; Kiraladiklarim bolumunden takip edin.'], 503);
        }
        self::resultRedirect($id);
    }

    private static function callbackDiagnosticCode(DomainException $error, array $input, string $stage): string
    {
        if ($error->getMessage() === 'Banka cevabi eksik.') {
            $present = array_change_key_case($input, CASE_LOWER);
            $required = [
                'verifyenrollmentrequestid' => 'CB_MISSING_REQUEST_ID',
                'merchantid' => 'CB_MISSING_MERCHANT',
                'purchcurrency' => 'CB_MISSING_CURRENCY',
                'purchamount' => 'CB_MISSING_AMOUNT',
                'eci' => 'CB_MISSING_ECI',
                'cavv' => 'CB_MISSING_CAVV',
                'mdstatus' => 'CB_MISSING_MDSTATUS',
                'status' => 'CB_MISSING_STATUS',
                'hash' => 'CB_MISSING_HASH',
            ];
            foreach ($required as $field => $code) {
                if (!isset($present[$field])) return $code;
            }
        }
        return match ($error->getMessage()) {
            'Banka cevabi gecersiz.' => 'CB_INVALID_FIELDS',
            'Tekrarlanan banka alani.' => 'CB_DUPLICATE_FIELD',
            'Tutar gecersiz.' => 'CB_AMOUNT_FORMAT',
            'Banka islem bilgileri eslesmiyor.' => 'CB_PAYMENT_MISMATCH',
            'Banka islem numarasi eslesmiyor.' => 'CB_TRANSACTION_MISMATCH',
            'Banka isyeri bilgisi eslesmiyor.' => 'CB_MERCHANT_MISMATCH',
            'Banka para birimi eslesmiyor.' => 'CB_CURRENCY_MISMATCH',
            'Banka tutari eslesmiyor.' => 'CB_AMOUNT_MISMATCH',
            'Banka donus tutarinin bicimi gecersiz.' => 'CB_AMOUNT_FORMAT',
            'Banka imzasi dogrulanamadi.' => 'CB_SIGNATURE_INVALID',
            default => $stage,
        };
    }

    private static function recordCallbackDiagnostic(string $id, string $code): void
    {
        if (!preg_match('/^CB_[A-Z_]{1,29}$/D', $code)) return;
        try {
            // Only an authenticated return-token path can reach this helper. Keep raw
            // callback values out of logs/storage and never modify a submitted sale.
            Database::connection()->prepare(
                "UPDATE PhpVposAttempt SET resultCode = ?, updatedAt = NOW(3) "
                . "WHERE paymentId = ? AND environment = 'test' AND state = 'CHALLENGE'"
            )->execute([$code, $id]);
        } catch (Throwable) {
            error_log('VakifBank callback diagnostic could not be saved: ' . $code);
        }
    }

    private static function resultRedirect(string $id): never
    {
        $expires = time() + 900;
        $view = hash_hmac('sha256', 'payment-result|' . $id . '|' . $expires, (string) Config::get('app.secret'));
        header('Location: /satin-al/sonuc?id=' . rawurlencode($id) . '&expires=' . $expires . '&view=' . $view, true, 303);
        exit;
    }

    public static function canView(string $id, array $query): bool
    {
        $expires = $query['expires'] ?? '';
        $view = $query['view'] ?? '';
        return is_string($expires) && ctype_digit($expires) && (int) $expires > time() && (int) $expires <= time() + 900
            && is_string($view) && hash_equals(hash_hmac('sha256', 'payment-result|' . $id . '|' . $expires, (string) Config::get('app.secret')), $view);
    }
}
