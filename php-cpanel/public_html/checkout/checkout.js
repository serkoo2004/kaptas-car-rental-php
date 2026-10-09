(() => {
  'use strict';
  const form = document.querySelector('#payment-form');
  if (!form) return;
  const enabled = form.dataset.paymentEnabled === '1';
  const fields = form.elements;
  const errorBox = document.querySelector('#payment-error');
  const pay = form.querySelector('.pay-button');
  const total = document.querySelector('#quote-total');
  const days = document.querySelector('#quote-days');
  const breakdown = document.querySelector('#price-breakdown');
  const feedback = document.querySelector('#quote-feedback');
  const status = document.querySelector('#checkout-status');
  const retry = document.querySelector('#quote-refresh');
  const next = document.querySelector('#step-next');
  const back = document.querySelector('#step-back');
  const steps = [...form.querySelectorAll('[data-step]')];
  const stepButtons = [...document.querySelectorAll('[data-step-target]')];
  const periods = ['pickupDate', 'pickupTime', 'dropoffDate', 'dropoffTime'];
  const consents = ['privacyNoticeAccepted', 'termsAccepted', 'preInformationAccepted', 'distanceSalesAccepted'];
  const displays = [...form.querySelectorAll('[data-date-display]')];
  const todayParts = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (name) => todayParts.find((item) => item.type === name).value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  fields.pickupDate.min = today;
  let step = 0;
  let revision = 0;
  let timer;
  let expiryTimer;
  let request;
  let csrfToken;
  let submitting = false;
  let loading = false;
  let quote = null;
  const money = (amount, currency) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(Number(amount));

  function announce(message, state = '') {
    feedback.textContent = message;
    feedback.dataset.state = state;
    status.textContent = message;
  }
  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    announce(message, 'error');
  }
  function controls() {
    pay.disabled = !enabled || !quote || loading || submitting;
    next.disabled = submitting || !enabled || (step === 0 && loading);
    next.textContent = step === 0 ? (loading ? 'Tutar hesaplanıyor…' : 'Bilgilerime devam et') : 'Ödemeye devam et';
    back.disabled = submitting;
    stepButtons.forEach((button, index) => {
      button.disabled = submitting || index > step;
      button.classList.toggle('complete', index < step);
      if (index === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }
  function goTo(index, focus = true) {
    step = index;
    steps.forEach((panel, i) => { panel.hidden = i !== index; });
    back.hidden = index === 0;
    next.hidden = index === 2;
    pay.hidden = index !== 2;
    controls();
    if (focus) steps[index].querySelector('h2')?.focus();
  }
  function invalidate() {
    revision++;
    request?.abort();
    clearTimeout(expiryTimer);
    quote = null;
    loading = false;
    fields.quoteToken.value = '';
    consents.forEach((name) => { fields[name].checked = false; });
    total.textContent = 'Tarihlerinizi seçin';
    days.textContent = 'Tarih seçin';
    breakdown.textContent = 'Günlük fiyat × kiralama günü';
    if (retry) retry.hidden = true;
    controls();
  }
  function dateFromDisplay(value) {
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
    if (!match) return '';
    const [, day, month, year] = match;
    const parsed = new Date(`${year}-${month}-${day}T12:00:00Z`);
    return Number(year) >= 2000 && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === `${year}-${month}-${day}` ? `${year}-${month}-${day}` : '';
  }
  function displayFromDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('.') : '';
  }
  function validateDates(report = false) {
    let firstInvalid;
    displays.forEach((input) => {
      const iso = dateFromDisplay(input.value);
      fields[input.dataset.dateDisplay].value = iso;
      let message = '';
      if (!iso) message = input.value ? 'Geçerli bir tarih girin: GG.AA.YYYY.' : 'Tarih seçin veya GG.AA.YYYY olarak girin.';
      else if (iso < today) message = 'Geçmiş bir tarih seçilemez.';
      input.setCustomValidity(message);
      input.setAttribute('aria-invalid', message && (report || input.value) ? 'true' : 'false');
      document.querySelector(`#${input.id.replace('-display', '-error')}`).textContent = report || input.value ? message : '';
      if (message && !firstInvalid) firstInvalid = input;
    });
    fields.dropoffDate.min = fields.pickupDate.value || today;
    if (firstInvalid) {
      if (report) firstInvalid.reportValidity();
      return false;
    }
    const pickup = Date.parse(`${fields.pickupDate.value}T${fields.pickupTime.value}:00+03:00`);
    const dropoff = Date.parse(`${fields.dropoffDate.value}T${fields.dropoffTime.value}:00+03:00`);
    let message = '';
    if (!Number.isFinite(pickup) || !Number.isFinite(dropoff)) message = 'Alış ve iade saatlerini seçin.';
    else if (pickup < Date.now() - 300000) message = 'Alış zamanı geçmişte olamaz.';
    else if (dropoff <= pickup) message = 'İade tarihi ve saati alıştan sonra olmalıdır.';
    else if (dropoff - pickup > 90 * 86400000) message = 'Kiralama süresi 90 günü aşamaz.';
    if (message) { showError(message); return false; }
    return true;
  }
  async function jsonRequest(url, options = {}, timeout = 25000) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) controller.abort();
    const limit = setTimeout(abort, timeout);
    try {
      const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options, signal: controller.signal });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        if (response.status === 403) csrfToken = null;
        throw new Error(data?.error || `Sunucu yanıtı alınamadı (${response.status}). Sayfayı yenileyip tekrar deneyin.`);
      }
      return data;
    } finally {
      clearTimeout(limit);
      options.signal?.removeEventListener('abort', abort);
    }
  }
  async function csrf() {
    if (!csrfToken) {
      const result = await jsonRequest('/api/auth/csrf');
      if (!result.csrfToken) throw new Error('Oturum doğrulanamadı. Sayfayı yenileyin.');
      csrfToken = result.csrfToken;
    }
    return csrfToken;
  }
  async function updateQuote() {
    if (submitting || !enabled) return false;
    clearTimeout(timer);
    invalidate();
    errorBox.hidden = true;
    if (!validateDates()) {
      if (errorBox.hidden) announce('Alış ve iade tarihlerini gün.ay.yıl biçiminde tamamlayın.');
      return false;
    }
    const current = revision;
    request = new AbortController();
    const signal = request.signal;
    loading = true;
    total.textContent = 'Hesaplanıyor…';
    announce('Seçilen gün sayısı ve güncel kurla toplam hesaplanıyor.');
    controls();
    try {
      const token = await csrf();
      if (current !== revision) return false;
      // Quote requests contain rental identifiers only, never contact or card fields.
      const payload = Object.fromEntries(['leadId', 'vehicleId', 'pickupLocationId', ...periods].map((name) => [name, fields[name].value]));
      const result = await jsonRequest('/api/payments/quote', { method: 'POST', signal,
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: JSON.stringify(payload) });
      if (current !== revision) return false;
      if (!result.quoteToken || result.currency !== 'TRY' || !Number.isFinite(Number(result.amount)) || Number(result.amount) <= 0 || !Number.isFinite(Number(result.dailyUsd)) || Number(result.dailyUsd) <= 0 || !Number.isInteger(result.days) || result.days < 1 || !Number.isFinite(result.expiresAt) || result.expiresAt * 1000 <= Date.now()) throw new Error('Güncel fiyat doğrulanamadı. Hesaplamayı tekrar deneyin.');
      quote = result;
      fields.quoteToken.value = result.quoteToken;
      days.textContent = `${result.days} gün`;
      total.textContent = money(result.amount, result.currency);
      breakdown.textContent = `${money(result.dailyUsd, 'USD')} × ${result.days} gün = ${money(Number(result.dailyUsd) * result.days, 'USD')}`;
      announce(step === 2 ? 'Toplam hazır. Sözleşmeleri onaylayıp güvenli ödemeye geçebilirsiniz.' : 'Toplam hazır. Kiralama bilgilerinize devam edebilirsiniz.', 'ready');
      expiryTimer = setTimeout(() => {
        if (!submitting && !document.hidden) void updateQuote();
        else if (!submitting) { invalidate(); announce('Güncel fiyat, sayfaya döndüğünüzde yeniden hesaplanacak.'); }
      }, Math.min(2147483647, result.expiresAt * 1000 - Date.now()));
      return true;
    } catch (error) {
      if (current !== revision) return false;
      total.textContent = 'Hesaplanamadı';
      showError(error.name === 'AbortError' ? 'Hesaplama zaman aşımına uğradı. Bağlantınızı kontrol edip tekrar deneyin.' : error.message);
      if (retry) retry.hidden = false;
      return false;
    } finally {
      if (current === revision) { loading = false; controls(); }
    }
  }
  function scheduleQuote() {
    if (submitting) return;
    invalidate();
    errorBox.hidden = true;
    announce('Tarihler değişti; toplam yeniden hesaplanıyor.');
    clearTimeout(timer);
    timer = setTimeout(updateQuote, 450);
  }
  displays.forEach((input) => {
    const picker = fields[input.dataset.dateDisplay];
    input.setAttribute('aria-describedby', input.id.replace('-display', '-error'));
    input.addEventListener('input', () => {
      // A fixed DD.MM.YYYY display is independent of the browser's date locale.
      const digits = input.value.replace(/\D/g, '').slice(0, 8);
      input.value = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('.');
      input.setCustomValidity('');
      picker.value = dateFromDisplay(input.value);
      scheduleQuote();
    });
    const sync = () => { input.value = displayFromDate(picker.value); input.setCustomValidity(''); scheduleQuote(); };
    picker.addEventListener('input', sync);
    picker.addEventListener('change', sync);
  });
  ['pickupTime', 'dropoffTime'].forEach((name) => {
    fields[name].addEventListener('input', () => {
      const digits = fields[name].value.replace(/\D/g, '').slice(0, 4);
      fields[name].value = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
      scheduleQuote();
    });
    fields[name].addEventListener('change', scheduleQuote);
  });
  retry?.addEventListener('click', updateQuote);
  back.addEventListener('click', () => { if (!submitting) goTo(Math.max(0, step - 1)); });
  stepButtons.forEach((button, index) => button.addEventListener('click', () => { if (!submitting && index < step) goTo(index); }));
  function validatePanel(index) {
    if (index === 0 && !validateDates()) { goTo(0, false); validateDates(true); return false; }
    const invalid = [...steps[index].querySelectorAll('input,textarea')].find((input) => input.willValidate && !input.checkValidity());
    if (invalid) { goTo(index, false); invalid.reportValidity(); return false; }
    return true;
  }
  async function advance() {
    if (submitting || loading || !enabled || !validatePanel(step)) return;
    if (step === 0 && !quote && !(await updateQuote())) return;
    errorBox.hidden = true;
    goTo(Math.min(2, step + 1));
    if (quote) announce(step === 2 ? 'Tutarı kontrol edip kart bilgilerinizi ve sözleşme onaylarını tamamlayın.' : 'İletişim ve fatura bilgilerinizi tamamlayın.', 'ready');
  }
  next.addEventListener('click', advance);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (step !== 2) { void advance(); return; }
    if (submitting || !enabled) return;
    for (let i = 0; i < steps.length; i++) if (!validatePanel(i)) return;
    if (!quote || quote.expiresAt * 1000 <= Date.now()) {
      if (await updateQuote()) announce('Toplam yenilendi. Güncel bedeli kontrol edip sözleşmeleri yeniden onaylayın.');
      return;
    }
    submitting = true;
    clearTimeout(timer); clearTimeout(expiryTimer);
    errorBox.hidden = true;
    form.setAttribute('aria-busy', 'true');
    controls();
    if (retry) retry.disabled = true;
    const original = pay.innerHTML;
    pay.textContent = 'Bankaya bağlanılıyor…';
    announce('3D Secure ekranı hazırlanıyor. Lütfen sayfayı kapatmayın.');
    const payload = Object.fromEntries(new FormData(form).entries());
    consents.forEach((name) => { payload[name] = fields[name].checked; });
    const inputs = [...form.querySelectorAll('input,textarea')];
    inputs.forEach((input) => { input.readOnly = true; });
    try {
      const result = await jsonRequest('/api/payments/start', { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': await csrf() }, body: JSON.stringify(payload) }, 60000);
      const challenge = result.challenge;
      const allowed = [
        'https://inbound.apigatewaytest.vakifbank.com.tr:8443/threeDGateway/startThreeDFlow',
        'https://inbound.apigateway.vakifbank.com.tr:8443/threeDGateway/startThreeDFlow',
        'https://inbound.apigatewaytest.vakifbank.com.tr/threeDGateway/startThreeDFlow',
        'https://inbound.apigateway.vakifbank.com.tr/threeDGateway/startThreeDFlow',
      ];
      if (!challenge || !allowed.includes(challenge.action) || !challenge.fields?.PaReq || !challenge.fields?.MD) throw new Error('Banka doğrulama ekranı alınamadı.');
      const bankForm = document.createElement('form');
      bankForm.method = 'POST'; bankForm.action = challenge.action;
      for (const name of ['PaReq', 'MD']) {
        const input = document.createElement('input'); input.type = 'hidden'; input.name = name; input.value = challenge.fields[name]; bankForm.appendChild(input);
      }
      document.body.appendChild(bankForm);
      bankForm.submit();
    } catch (error) {
      submitting = false;
      inputs.forEach((input) => { input.readOnly = false; });
      if (retry) retry.disabled = false;
      pay.innerHTML = original;
      invalidate();
      showError(error.name === 'AbortError' ? 'Banka yanıtı zamanında alınamadı. Tekrar ödeme yapmadan önce işlem durumunu kontrol edin.' : error.message);
      if (retry) retry.hidden = false;
    } finally {
      delete payload.cardNumber; delete payload.expiryMonth; delete payload.expiryYear;
      ['cardNumber', 'expiryMonth', 'expiryYear'].forEach((name) => { if (fields[name]) fields[name].value = ''; });
      form.removeAttribute('aria-busy');
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && enabled && !submitting && !loading && (!quote || quote.expiresAt * 1000 <= Date.now())) void updateQuote();
  });
  goTo(0, false);
  if (enabled) void updateQuote();
  else announce('Online ödeme şu anda kapalı. Test işlemi için yönetici hesabınızla giriş yapın.', 'error');
})();
