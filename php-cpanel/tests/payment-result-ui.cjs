const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../public_html');
const template = fs.readFileSync(path.join(root, 'checkout/index.php'), 'utf8');
const pending = { state: 'pending', tone: 'review', title: 'Ödemeniz kontrol ediliyor', label: 'Kontrol ediliyor', message: 'Banka sonucu bekleniyor. Yeniden ödeme yapmayın.', poll: true };
const confirmed = { state: 'confirmed', tone: 'success', title: 'Rezervasyonunuz kesinleşti', label: 'Kesinleşti', message: 'Ödemeniz doğrulandı; ayrıca yönetici onayı gerekmez.', poll: false };
const ids = ['payment-result', 'result-title', 'result-message', 'result-icon', 'result-label', 'result-monitor', 'result-retry'];
for (const id of ids) assert.ok(template.includes(`id="${id}"`), `Actual PHP template contains ${id}`);
const fixture = `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/checkout/design.css"><main class="result-page"><section class="result-box review" id="payment-result" data-poll="1"><div class="result-icon" id="result-icon">!</div><h1 id="result-title">${pending.title}</h1><p id="result-message">${pending.message}</p><dl><div><dt>Araç</dt><dd>Dacia Sandero Stepway</dd></div><div><dt>Kiralama süresi</dt><dd>3 gün</dd></div><div><dt>Durum</dt><dd id="result-label" aria-live="polite">${pending.label}</dd></div></dl><p id="result-monitor" role="status"></p><button id="result-retry" class="secondary" hidden>Durumu tekrar kontrol et</button><div class="result-actions"><a class="primary" href="/?account=rentals">Kiraladıklarım</a><a class="secondary" href="/arac-filosu">Araç filosuna dön</a></div></section></main><script src="/checkout/result.js"></script></html>`;
let checks = ids.length;
const check = (value, label) => { assert.ok(value, label); checks++; };

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    async function scenario(responses, test) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const calls = [];
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.install();
      await page.route('http://payment-result.test/**', async route => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.pathname === '/api/payments/status') {
          calls.push({ method: request.method(), url, body: request.postData() });
          const next = responses[Math.min(calls.length - 1, responses.length - 1)];
          if (next.delay) await new Promise(resolve => setTimeout(resolve, next.delay));
          return route.fulfill({ status: next.http || 200, headers: next.headers || {}, json: next.data || next });
        }
        if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: fixture });
        const file = path.resolve(root, '.' + url.pathname);
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404 });
        const types = { '.js': 'application/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
        return route.fulfill({ contentType: types[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
      });
      await page.goto('http://payment-result.test/?id=pay_test&expires=123&view=signed&state=never-forward-this');
      const wait = async () => {
        await page.waitForFunction(() => !document.getElementById('result-monitor').textContent.includes('kontrol ediliyor…'));
      };
      await wait();
      await test(page, calls, wait);
      check(calls.every(call => call.method === 'GET' && call.body === null), 'Polling never submits a payment');
      check(calls.every(call => !call.url.searchParams.has('state') && call.url.searchParams.get('id') === 'pay_test'), 'Only result access parameters forwarded');
      check(errors.length === 0, `No browser errors: ${errors.join(', ')}`);
      await page.close();
    }

    await scenario([pending, confirmed], async (page, calls) => {
      check(calls.length === 1, 'Immediate first check');
      await page.clock.runFor(5100);
      await page.waitForFunction(() => document.getElementById('result-label').textContent === 'Kesinleşti');
      check(await page.locator('#payment-result').evaluate(el => el.classList.contains('success')), 'Verified success updates appearance');
      await page.clock.runFor(30000);
      check(calls.length === 2, 'Stops after terminal success');
      const out = path.resolve(__dirname, '../../tmp/payment-result-qa');
      fs.mkdirSync(out, { recursive: true });
      await page.screenshot({ path: path.join(out, 'desktop-confirmed.png'), fullPage: true });
      await page.setViewportSize({ width: 375, height: 812 });
      await page.screenshot({ path: path.join(out, 'mobile-confirmed.png'), fullPage: true });
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile horizontal overflow');
    });
    await scenario([{ ...confirmed, state: 'test_paid', title: 'Test ödemesi doğrulandı', label: 'Test başarılı' }], async (page, calls) => {
      await page.clock.runFor(20000);
      check(calls.length === 1, 'Test success stops polling');
      check(await page.locator('#result-label').innerText() === 'Test başarılı', 'Test not displayed as confirmed rental');
    });
    await scenario([{ ...pending, state: 'verification_blocked', poll: false, title: 'Banka dönüşü doğrulanamadı', label: 'Doğrulama gerekli', message: 'CB_MISSING_HASH' }], async (page, calls) => {
      await page.clock.runFor(20000);
      check(calls.length === 1, 'Blocked callback stops endless polling');
      check(await page.locator('#result-message').innerText() === 'CB_MISSING_HASH', 'Safe diagnostic visible');
    });
    await scenario([{ http: 503 }, confirmed], async (page, calls) => {
      check((await page.locator('#result-monitor').innerText()).includes('tekrar denenecek'), 'Network failure is not payment failure');
      await page.clock.runFor(10100);
      await page.waitForFunction(() => document.getElementById('result-label').textContent === 'Kesinleşti');
      check(calls.length === 2, 'Recovers automatically after temporary error');
    });
    await scenario([{ http: 404 }], async (page, calls) => {
      await page.clock.runFor(30000);
      check(calls.length === 1, 'Expired access stops');
      check(await page.locator('#result-retry').isHidden(), 'Expired signed link cannot loop');
    });
    await scenario([{ ...pending, state: 'failed', tone: 'failed', poll: false, title: 'Ödeme tamamlanamadı', label: 'Kesinleşmedi' }], async (page, calls) => {
      await page.clock.runFor(20000);
      check(calls.length === 1, 'Declined payment stops polling');
      check(await page.locator('#payment-result').evaluate(el => el.classList.contains('failed')), 'Decline never shown as success');
    });
    await scenario([{ data: { tone: 'success', poll: false } }, confirmed], async (page, calls) => {
      check(await page.locator('#result-label').innerText() === pending.label, 'Incomplete response cannot confirm payment');
      await page.clock.runFor(10100);
      await page.waitForFunction(() => document.getElementById('result-label').textContent === 'Kesinleşti');
      check(calls.length === 2, 'Invalid response recovered');
    });
    await scenario([pending], async (page, calls) => {
      await page.clock.fastForward(301000);
      check(await page.locator('#result-retry').isVisible(), 'Bounded monitoring offers manual read-only retry');
      const count = calls.length;
      await page.locator('#result-retry').click();
      await page.waitForFunction(() => document.getElementById('result-monitor').textContent.includes('Son kontrol:'));
      check(calls.length === count + 1, 'Retry checks status without new charge');
    });
    await scenario([{ http: 429, headers: { 'Retry-After': '60' } }, confirmed], async (page, calls) => {
      await page.clock.runFor(59000);
      check(calls.length === 1, 'Respects Retry-After');
      await page.clock.runFor(1500);
      await page.waitForFunction(() => document.getElementById('result-label').textContent === 'Kesinleşti');
    });
    await scenario([pending], async (page, calls) => {
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
      await page.clock.runFor(30000);
      check(calls.length === 1, 'Hidden tab does not poll');
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
      await page.clock.runFor(100);
      check(calls.length === 2, 'Visible tab resumes');
    });
    await scenario([pending, { data: confirmed, delay: 150 }], async (page, calls) => {
      await page.clock.runFor(5100);
      await page.evaluate(() => {
        document.dispatchEvent(new Event('visibilitychange'));
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.clock.runFor(50);
      await page.waitForFunction(() => document.getElementById('result-label').textContent === 'Kesinleşti');
      check(calls.length === 2, 'Visibility events cannot overlap an in-flight request');
    });
    await scenario([pending], async (page, calls) => {
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
      await page.clock.runFor(20000);
      check(calls.length === 1, 'No polling after pagehide');
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
      await page.clock.runFor(100);
      check(calls.length === 2, 'Back-forward cached page resumes');
    });
    console.log(`OK: ${checks} checks. Browser fixtures only; no PHP execution, bank call, payment or database access.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
