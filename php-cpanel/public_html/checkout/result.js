(() => {
  'use strict';
  const box = document.getElementById('payment-result');
  if (!box || box.dataset.poll !== '1') return;
  const monitor = document.getElementById('result-monitor');
  const retry = document.getElementById('result-retry');
  const endpoint = new URL('/api/payments/status', window.location.origin);
  const query = new URLSearchParams(window.location.search);
  for (const key of ['id', 'expires', 'view']) {
    if (query.has(key)) endpoint.searchParams.set(key, query.get(key));
  }
  let timer;
  let controller;
  let deadline = Date.now() + 300000;
  let stopped = false;
  let active = true;
  let failures = 0;

  function pause(message, canRetry) {
    stopped = true;
    clearTimeout(timer);
    monitor.textContent = message;
    retry.hidden = !canRetry;
  }

  function schedule(delay) {
    clearTimeout(timer);
    if (stopped || !active || document.hidden) return;
    if (Date.now() >= deadline) {
      pause('Banka sonucu henüz kesinleşmedi. Yeniden ödeme yapmayın. Durumu tekrar kontrol edebilir veya rezervasyon numaranızla bize ulaşabilirsiniz.', true);
      return;
    }
    timer = setTimeout(check, delay);
  }

  async function check() {
    if (controller || stopped || !active || document.hidden) return;
    if (Date.now() >= deadline) { schedule(0); return; }
    controller = new AbortController();
    const timeout = setTimeout(() => controller?.abort(), 10000);
    let delay = 5000;
    try {
      const response = await fetch(endpoint.href, {
        method: 'GET', credentials: 'same-origin', cache: 'no-store',
        referrerPolicy: 'no-referrer', headers: { Accept: 'application/json' }, signal: controller.signal,
      });
      if ([401, 403, 404].includes(response.status)) {
        pause('Sonuç bağlantısının süresi dolmuş veya erişim sona ermiş olabilir. Hesabınıza giriş yaparak Kiraladıklarım bölümünü kontrol edin. Yeniden ödeme yapmayın.', false);
        return;
      }
      if (response.status === 429) {
        const after = Number(response.headers.get('Retry-After'));
        delay = Number.isFinite(after) && after > 0 ? Math.min(Math.max(after * 1000, 5000), 300000) : 30000;
        throw new Error('rate-limit');
      }
      if (!response.ok) throw new Error('unavailable');
      const result = await response.json();
      if (!['success', 'review', 'failed'].includes(result.tone)
        || typeof result.poll !== 'boolean'
        || !['title', 'label', 'message'].every(key => typeof result[key] === 'string')) throw new Error('invalid-response');
      box.classList.remove('success', 'review', 'failed');
      box.classList.add(result.tone);
      document.getElementById('result-icon').textContent = result.tone === 'success' ? '\u2713' : result.tone === 'review' ? '!' : '\u00d7';
      for (const key of ['title', 'message', 'label']) document.getElementById(`result-${key}`).textContent = result[key];
      failures = 0;
      if (!result.poll) {
        pause('Durum güncellendi.', false);
        return;
      }
      monitor.textContent = 'Banka sonucu bekleniyor. Son kontrol: ' + new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
    } catch {
      if (!stopped && active && !document.hidden) {
        failures += 1;
        delay = Math.max(delay, Math.min(30000, 5000 * (2 ** Math.min(failures, 3))));
        monitor.textContent = 'Durum şu anda alınamadı; otomatik tekrar denenecek. Yeniden ödeme yapmayın.';
      }
    } finally {
      clearTimeout(timeout);
      controller = null;
      schedule(delay);
    }
  }

  retry.addEventListener('click', () => {
    if (controller) return;
    stopped = false;
    failures = 0;
    deadline = Date.now() + 300000;
    retry.hidden = true;
    monitor.textContent = 'Ödeme durumu kontrol ediliyor…';
    check();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimeout(timer); controller?.abort(); }
    else schedule(0);
  });
  window.addEventListener('pagehide', () => { active = false; clearTimeout(timer); controller?.abort(); });
  window.addEventListener('pageshow', event => { active = true; if (event.persisted) schedule(0); });
  monitor.textContent = 'Ödeme durumu kontrol ediliyor…';
  check();
})();
