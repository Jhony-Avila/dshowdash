// tools-btn-diag.mjs — READ-ONLY: identifica o botão de ferramentas (ponta direita do footer),
// detecta interceptação de clique (elementFromPoint), tenta clicar e reporta.
import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/eb8bd5d1-086b-4892-9f3f-45825fb23b99/scratchpad';
const URL = 'https://dshowdash.com.br/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type()==='error') errors.push(m.text().slice(0,180)); });
page.on('pageerror', e => errors.push('PAGEERR: '+e.message));
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3000);
  if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(2000); }
  await page.waitForSelector('.dsd-footer', { timeout: 30000 }).catch(()=>{});
  await page.waitForTimeout(1500);

  // 1) candidatos por atributo (tool/ferramenta/wrench/build/debug/dev/kernel/governance)
  const candidates = await page.evaluate(() => {
    const rx = /tool|ferrament|wrench|hammer|build|debug|dev-|kernel|governance|diagnost|toolbox/i;
    const out = [];
    document.querySelectorAll('button,[role="button"],a,[data-action],[data-uarps-trigger],[class]').forEach(el => {
      const hay = [el.className&&el.className.toString(), el.getAttribute('title'), el.getAttribute('aria-label'), el.getAttribute('data-action'), el.getAttribute('data-uarps-trigger'), el.id].filter(Boolean).join(' ');
      if (rx.test(hay)) {
        const r = el.getBoundingClientRect();
        if (r.width>0 && r.height>0) out.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,80), title: el.getAttribute('title'), aria: el.getAttribute('aria-label'), act: el.getAttribute('data-action'), uarps: el.getAttribute('data-uarps-trigger'), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
      }
    });
    return out.slice(0, 40);
  });
  console.log('CANDIDATOS ('+candidates.length+'):');
  candidates.forEach(c => console.log('  ', JSON.stringify(c)));

  // 2) varre a faixa inferior-direita: elementFromPoint (topo real = detecta overlay)
  const scan = await page.evaluate(() => {
    const res = [];
    const W = window.innerWidth, H = window.innerHeight;
    for (let x = W-10; x >= W-120; x -= 20) {
      for (let y = H-8; y >= H-60; y -= 14) {
        const el = document.elementFromPoint(x, y);
        if (!el) continue;
        const btn = el.closest('button,[role="button"],[data-action],[data-uarps-trigger]') || el;
        res.push({ x, y, top: el.tagName+'.'+(el.className||'').toString().split(' ')[0], btn: btn.tagName+'.'+(btn.className||'').toString().slice(0,60), title: btn.getAttribute&&btn.getAttribute('title'), pe: getComputedStyle(el).pointerEvents });
      }
    }
    return res;
  });
  console.log('\nSCAN inferior-direito (elementFromPoint):');
  scan.forEach(s => console.log('  ', JSON.stringify(s)));

  await page.screenshot({ path: `${OUT}/tools-btn-full.png` });
  // recorte do canto inferior direito
  await page.screenshot({ path: `${OUT}/tools-btn-corner.png`, clip: { x: 1200, y: 820, width: 240, height: 80 } });
  console.log('\nERRORS:', errors.length, JSON.stringify(errors.slice(0,6)));
} catch (e) { console.log('FALHA:', e.message); }
finally { await browser.close(); }
