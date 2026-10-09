<?php

declare(strict_types=1);

use Kaptas\Core\Config;
use Kaptas\Core\Auth;
use Kaptas\Core\Database;
use Kaptas\Services\RentalPeriod;
use Kaptas\Services\ReservationReceipt;
use Kaptas\Services\RentalCheckout;
use Kaptas\Services\VakifBank;
use Kaptas\Services\PaymentStatus;
use Kaptas\Controllers\PaymentController;

require dirname(__DIR__, 2) . '/app/bootstrap.php';

header('Cache-Control: no-store, max-age=0');
header('Pragma: no-cache');
header('Referrer-Policy: no-referrer');

$isResult = str_contains(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '', '/sonuc');
$currentUser = Auth::user();
$paymentConfigured = VakifBank::available($currentUser);
$testMode = $paymentConfigured && VakifBank::settings()['environment'] === 'test';
$vehicle = null;
$payment = null;

if ($isResult && isset($_GET['id'])) {
    $id = is_string($_GET['id']) ? $_GET['id'] : '';
    $payment = strlen($id) <= 191 ? PaymentStatus::find(Database::connection(), $id) : null;
    if ($payment && !(PaymentStatus::owns($payment, $currentUser, (array) ($_SESSION['checkout_lead_ids'] ?? []))
        || PaymentController::canView($payment['id'], $_GET))) {
        $payment = null;
    }
    if (!$payment) http_response_code(404);
} elseif (isset($_GET['vehicleId'], $_GET['leadId'])) {
    $statement = Database::connection()->prepare(
        'SELECT v.id, v.title, v.dailyPrice, b.name AS brandName, m.name AS modelName, q.id AS leadId, q.userId AS leadUserId, q.contactName, q.contactEmail, q.contactPhone, '
        . '(SELECT url FROM VehicleImage WHERE vehicleId = v.id ORDER BY isCover DESC, sortOrder ASC LIMIT 1) AS image '
        . 'FROM Vehicle v JOIN VehicleBrand b ON b.id = v.brandId JOIN VehicleModel m ON m.id = v.modelId '
        . 'JOIN QuoteRequestItem qi ON qi.vehicleId = v.id JOIN QuoteRequest q ON q.id = qi.quoteRequestId WHERE v.id = ? AND q.id = ? LIMIT 1'
    );
    $statement->execute([(string) $_GET['vehicleId'], (string) $_GET['leadId']]);
    $vehicle = $statement->fetch(PDO::FETCH_ASSOC) ?: null;
    if ($vehicle && !RentalCheckout::owns(['id' => $vehicle['leadId'], 'userId' => $vehicle['leadUserId']], $currentUser, (array) ($_SESSION['checkout_lead_ids'] ?? []))) {
        $vehicle = null;
        http_response_code(404);
    }
}

function e(mixed $value): string { return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'); }
function dateDisplay(mixed $value): string {
    if (!is_string($value)) return '';
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date && $date->format('Y-m-d') === $value ? $date->format('d.m.Y') : '';
}
?>
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title><?= $isResult ? 'Ödeme Sonucu' : 'Güvenli Ödeme' ?> | KAPTAŞ Car Rental</title>
  <link rel="stylesheet" href="/checkout/design.css?v=20261006">
</head>
<body>
  <div class="trustbar"><span>3D Secure ödeme</span><span>SSL ile korunan bağlantı</span><span>Kart verileri KAPTAŞ sisteminde saklanmaz</span></div>
  <header class="checkout-header"><a href="/"><img src="/assets/email-logo.png" alt="KAPTAŞ Car Rental"></a><nav><a href="/">Ana Sayfa</a><a href="/arac-filosu">Araç Filosu</a><a href="/iletisim">İletişim</a></nav><a class="fleet-link" href="/arac-filosu">Araçları incele</a></header>

  <?php if ($isResult): ?>
    <?php
      $result = PaymentStatus::present($payment);
    ?>
    <main class="result-page">
      <section id="payment-result" class="result-box <?= e($result['tone']) ?>" data-poll="<?= $result['poll'] ? '1' : '0' ?>">
        <div class="result-icon" id="result-icon" aria-hidden="true"><?= $result['tone'] === 'success' ? '✓' : ($result['tone'] === 'review' ? '!' : '×') ?></div>
        <h1 id="result-title"><?= e($result['title']) ?></h1>
        <?php if (($payment['bankEnvironment'] ?? '') === 'test'): ?><p><strong>VakıfBank test ortamı: gerçek tahsilat, kesin rezervasyon veya müşteri onay e-postası oluşturulmaz.</strong></p><?php endif; ?>
        <p id="result-message"><?= e($result['message']) ?></p>
        <?php if ($payment): ?><dl>
          <div><dt>Rezervasyon numarası</dt><dd><?= e(ReservationReceipt::reference($payment['reservationId'] ?? $payment['id'])) ?></dd></div>
          <div><dt>Araç</dt><dd><?= e($payment['title'] ?: '-') ?></dd></div>
          <?php if ($payment['pickupAt'] && $payment['dropoffAt']): ?>
          <div><dt>Alış (Türkiye saati)</dt><dd><?= e((new DateTimeImmutable($payment['pickupAt']))->format('d.m.Y H:i')) ?><br><?= e($payment['pickupLocation']) ?></dd></div>
          <div><dt>İade (Türkiye saati)</dt><dd><?= e((new DateTimeImmutable($payment['dropoffAt']))->format('d.m.Y H:i')) ?><br><?= e($payment['dropoffLocation']) ?></dd></div>
          <div><dt>Kiralama süresi</dt><dd><?= RentalPeriod::days(new DateTimeImmutable($payment['pickupAt']), new DateTimeImmutable($payment['dropoffAt'])) ?> gün</dd></div>
          <?php endif; ?>
          <div><dt>Tutar</dt><dd><?= e(number_format((float) $payment['amount'], 2, ',', '.')) ?> <?= e($payment['currency']) ?></dd></div>
          <div><dt>Durum</dt><dd id="result-label" aria-live="polite"><?= e($result['label']) ?></dd></div>
        </dl><?php endif; ?>
        <?php if ($payment): ?>
        <p id="result-monitor" role="status" aria-live="polite"></p>
        <button id="result-retry" class="secondary" type="button" hidden>Durumu tekrar kontrol et</button>
        <noscript><p>Son durumu görmek için sayfayı yenileyin. Yeniden ödeme başlatmayın.</p></noscript>
        <?php endif; ?>
        <div class="result-actions"><a class="primary" href="/?account=rentals">Kiraladıklarım</a><a class="secondary" href="/arac-filosu">Araç filosuna dön</a></div>
      </section>
    </main>
  <?php elseif (!$vehicle): ?>
    <main class="result-page"><section class="result-box failed"><div class="result-icon">!</div><h1>Kiralama talebi bulunamadı</h1><p>Araç filosundan bir araç seçerek güvenli ödeme adımına yeniden başlayın.</p><a class="primary" href="/arac-filosu">Araçları incele</a></section></main>
  <?php else: ?>
    <main class="checkout-page">
      <div class="checkout-title"><a href="/arac-filosu">Araç filosuna dön</a><h1>Rezervasyonunuzu tamamlayın</h1><p>Seçtiğiniz araç, size uygun tarihler. Ödemenizi banka doğrulamasıyla güvenle tamamlayın.</p></div>
      <nav class="stepper" aria-label="Rezervasyon adımları"><button type="button" data-step-target="0" aria-current="step"><b>1</b><span>Kiralama</span></button><button type="button" data-step-target="1" disabled><b>2</b><span>Bilgileriniz</span></button><button type="button" data-step-target="2" disabled><b>3</b><span>Ödeme</span></button></nav>
      <?php if (!$paymentConfigured): ?><div class="payment-warning"><strong>Online ödeme henüz aktif değil.</strong><span>Yeni ödeme kuruluşu onayı ve canlı bağlantı tamamlanana kadar karttan tahsilat yapılmaz ve rezervasyon kesinleştirilmez.</span></div><?php endif; ?>
      <?php if ($testMode): ?><div class="payment-warning"><strong>VakıfBank test ortamı · Yalnızca yönetici</strong><span>Yalnızca bankanın test kartlarını kullanın. Gerçek ödeme ve kesin rezervasyon oluşturulmaz.</span></div><?php endif; ?>
      <div class="checkout-grid">
        <form id="payment-form" class="checkout-form" novalidate data-payment-enabled="<?= $paymentConfigured ? '1' : '0' ?>">
          <input type="hidden" name="quoteToken" value="">
          <input type="hidden" name="leadId" value="<?= e($_GET['leadId']) ?>"><input type="hidden" name="vehicleId" value="<?= e($_GET['vehicleId']) ?>"><input type="hidden" name="currency" value="<?= e($_GET['currency'] ?? 'TRY') ?>"><input type="hidden" name="pickupLocationId" value="<?= e($_GET['pickupLocationId'] ?? '') ?>"><input type="hidden" name="pickupLocation" value="<?= e($_GET['pickupLocation'] ?? 'Merkez Ofis') ?>">
          <div class="checkout-step" data-step="0">
          <section><header><div><h2 tabindex="-1">Kiralama dönemi</h2><p>Alış ve iade saatleri Türkiye yerel saatine göredir.</p></div></header>
          <div class="pickup-point"><span>Alış ve iade noktası</span><strong><?= e($_GET['pickupLocation'] ?? 'Merkez Ofis') ?></strong></div><div class="form-grid period-grid">
            <?php foreach (['pickup' => 'Alış', 'dropoff' => 'İade'] as $prefix => $label): ?>
            <div class="date-field"><label for="<?= $prefix ?>-display"><?= $label ?> tarihi <small>Gün.Ay.Yıl</small></label><div class="date-control"><input id="<?= $prefix ?>-display" data-date-display="<?= $prefix ?>Date" type="text" inputmode="numeric" placeholder="GG.AA.YYYY" maxlength="10" autocomplete="off" value="<?= e(dateDisplay($_GET[$prefix . 'Date'] ?? '')) ?>" required><label class="calendar-trigger"><span>Takvim</span><input type="date" name="<?= $prefix ?>Date" lang="tr" aria-label="<?= $label ?> tarihini takvimden seç" value="<?= e($_GET[$prefix . 'Date'] ?? '') ?>" tabindex="0"></label></div><span class="field-error" id="<?= $prefix ?>-error" aria-live="polite"></span></div>
            <label><?= $label ?> saati<input name="<?= $prefix ?>Time" type="text" inputmode="numeric" maxlength="5" pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]" placeholder="SS:DD" value="<?= e($_GET[$prefix . 'Time'] ?? '09:00') ?>" required></label>
            <?php endforeach; ?>
          </div></section>
          </div>
          <div class="checkout-step" data-step="1" hidden>
          <section><header><div><h2 tabindex="-1">Sürücü ve iletişim</h2><p>Rezervasyon onayı bu e-posta adresine gönderilecektir.</p></div></header><div class="form-grid">
            <label class="full">Ad soyad<input name="contactName" autocomplete="name" minlength="2" maxlength="120" value="<?= e($vehicle['contactName']) ?>" required></label>
            <label>E-posta<input name="contactEmail" type="email" autocomplete="email" maxlength="190" value="<?= e($vehicle['contactEmail']) ?>" required></label><label>Telefon<input name="contactPhone" type="tel" autocomplete="tel" minlength="7" maxlength="24" pattern="\+?[0-9 \(\)\-]{7,24}" value="<?= e($vehicle['contactPhone']) ?>" required></label>
          </div></section>
          <section><header><div><h2>Fatura adresi</h2><p>Rezervasyon sahibinin fatura bilgileri.</p></div></header><div class="form-grid">
            <label>Şehir<input name="city" autocomplete="address-level1" minlength="2" maxlength="100" required></label><label>Posta kodu<input name="zipCode" autocomplete="postal-code" minlength="3" maxlength="12" pattern="[A-Za-z0-9 \-]{3,12}" required></label><label class="full">Açık adres<textarea name="address" autocomplete="street-address" minlength="8" maxlength="500" required></textarea></label>
          </div></section>
          </div>
          <div class="checkout-step" data-step="2" hidden>
          <?php if ($paymentConfigured): ?>
          <section><header><div><h2 tabindex="-1">Kart bilgileri</h2><p>Ödeme, bankanızın 3D Secure doğrulamasıyla tamamlanır.</p></div><div class="card-brands"><img src="/images/payments/visa.svg" alt="Visa"><img src="/images/payments/mastercard.svg" alt="Mastercard"></div></header><div class="form-grid">
            <label class="full">Kart numarası<input name="cardNumber" inputmode="numeric" autocomplete="cc-number" maxlength="23" pattern="[0-9 \-]{13,23}" placeholder="0000 0000 0000 0000" required></label>
            <label>Son kullanma ayı<input name="expiryMonth" inputmode="numeric" autocomplete="cc-exp-month" maxlength="2" pattern="0[1-9]|1[0-2]" placeholder="AA" required></label>
            <label>Son kullanma yılı<input name="expiryYear" inputmode="numeric" autocomplete="cc-exp-year" maxlength="4" pattern="20[0-9]{2}" placeholder="YYYY" required></label>
          </div></section>
          <?php endif; ?>
          <div class="agreements"><h3>Sözleşmeler ve bilgilendirme</h3>
          <label class="consent"><input name="termsAccepted" type="checkbox" required><span><a href="/kiralama-kosullari" target="_blank" rel="noreferrer">Kiralama Koşulları</a>nı okudum ve kabul ediyorum.</span></label>
          <label class="consent"><input name="preInformationAccepted" type="checkbox" required><span><a href="/on-bilgilendirme-formu" target="_blank" rel="noreferrer">Ön Bilgilendirme Formu</a>nu; seçtiğim araç, kiralama dönemi, teslim noktası ve ödeme öncesinde gösterilen toplam bedelle birlikte okudum ve onaylıyorum.</span></label>
          <label class="consent"><input name="distanceSalesAccepted" type="checkbox" required><span><a href="/mesafeli-satis-sozlesmesi" target="_blank" rel="noreferrer">Mesafeli Satış Sözleşmesi</a>ni ve <a href="/teslimat-ve-iade-sartlari" target="_blank" rel="noreferrer">Teslimat ve İade Şartları</a>nı okudum, kabul ediyorum.</span></label>
          <label class="consent"><input name="privacyNoticeAccepted" type="checkbox" required><span><a href="/kvkk-aydinlatma-metni" target="_blank" rel="noreferrer">KVKK Aydınlatma Metni</a>ni okudum ve kimlik, iletişim, adres, kiralama ve ödeme işlem bilgilerimin metinde açıklanan amaçlarla işlendiği konusunda bilgilendirildim.</span></label>
          </div>
          </div>
          <div class="form-error" id="payment-error" role="alert" hidden></div>
          <p class="checkout-status" id="checkout-status" role="status" aria-live="polite">Toplam tutar için alış ve iade tarihlerini seçin.</p>
          <div class="checkout-actions"><button class="secondary" id="step-back" type="button" hidden>Geri</button><button class="primary" id="step-next" type="button">Bilgilerime devam et</button><button class="pay-button" type="submit" aria-describedby="checkout-status" disabled hidden><span>Güvenli ödeme yap</span><small>3D Secure</small></button></div>
          <p class="payment-footnote">Rezervasyonunuz yalnızca başarılı ödeme sonrasında kesinleşir.</p>
          <noscript><p class="form-error">Ödeme için tarayıcınızda JavaScript etkin olmalıdır.</p></noscript>
        </form>
        <aside class="summary">
          <div class="summary-heading">Rezervasyon özeti<span>Seçtiğiniz araç</span></div>
          <div class="summary-vehicle"><div class="summary-image"><img src="<?= e($vehicle['image'] ?: '/images/fleet-hero.png') ?>" alt="<?= e($vehicle['title']) ?>"></div>
          <div><h2><?= e($vehicle['brandName'] . ' ' . $vehicle['modelName']) ?></h2><p><?= e($vehicle['title']) ?></p></div></div>
          <dl><div><dt>Günlük kiralama</dt><dd><?= $vehicle['dailyPrice'] ? e(number_format((float) $vehicle['dailyPrice'], 2, ',', '.')) . ' USD' : 'Fiyat yok' ?></dd></div><div><dt>Alış ve iade</dt><dd><?= e($_GET['pickupLocation'] ?? 'Merkez Ofis') ?></dd></div><div><dt>Ödeme yöntemi</dt><dd>Visa / Mastercard · 3D Secure</dd></div></dl>
          <dl><div><dt>Kiralama süresi</dt><dd id="quote-days">Tarih seçin</dd></div></dl><div class="summary-total"><span>Karttan çekilecek toplam</span><strong id="quote-total" aria-live="polite">Tarihlerinizi seçin</strong></div>
          <p class="price-breakdown" id="price-breakdown">Günlük fiyat × kiralama günü</p><p class="quote-note">Her başlayan 24 saat, bir kiralama günü olarak hesaplanır. Tahsilat güncel kurla Türk lirası (TRY) olarak yapılır.</p>
          <p id="quote-feedback" class="quote-feedback" role="status">Tarihlerinizi seçtiğinizde toplam tutar otomatik hesaplanır.</p>
          <?php if ($paymentConfigured): ?><button class="secondary quote-refresh" id="quote-refresh" type="button" hidden>Hesaplamayı tekrar dene</button><?php endif; ?>
          <ul><li>Kesin rezervasyon yalnızca doğrulanmış ödeme sonrası oluşur.</li><li>Kart bilgileriniz KAPTAŞ sunucularında tutulmaz.</li><li>Tarih aralığı ödeme sırasında tekrar kontrol edilir.</li></ul>
        </aside>
      </div>
    </main>
  <?php endif; ?>
  <footer><img src="/assets/email-logo.png" alt="KAPTAŞ Car Rental"><div class="checkout-company"><strong>Kaptaş Madencilik İnşaat Taşımacılık Gıda Ve İletişim Sanayi Limited Şirketi</strong><address>Pelitli Mah. Şehit Murat Yıldız Sok. No:8/AB Ortahisar/Trabzon</address></div><nav><a href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a><a href="/gizlilik-politikasi">Gizlilik</a><a href="/on-bilgilendirme-formu">Ön Bilgilendirme</a><a href="/teslimat-ve-iade-sartlari">Teslimat ve İade</a><a href="/mesafeli-satis-sozlesmesi">Mesafeli Satış</a></nav><span>0 (555) 045 62 61 · kaptascarrental@gmail.com</span></footer>
  <?php if (!$isResult && $vehicle): ?><script src="/checkout/checkout.js?v=20261006" defer></script><?php endif; ?>
  <?php if ($isResult && $payment): ?><script src="/checkout/result.js?v=20261006-1" defer></script><?php endif; ?>
</body>
</html>
