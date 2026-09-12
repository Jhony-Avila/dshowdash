// scripts/shell/prova-profile-redirect.mjs — prova Playwright do shim /profile → Avatar Studio (M1b, decisões #89/#90): OFF ≡ produção (assinatura DOM do #main + scripts), ON boot frio e pós-boot sem flash/loop, variantes e rotas vizinhas. Uso: node scripts/header/preview-shell.mjs --root <wt>/public --port 8903 & node scripts/shell/prova-profile-redirect.mjs <dir-saida>
const TOOLS = '/var/www/dshowdash/tools/screenshot';
const pkg = (await import(TOOLS + '/node_modules/playwright/index.js')).default;
const { isLoginPage, loginViaPage } = await import(TOOLS + '/auth.mjs');
const { chromium } = pkg;
const OUT = process.argv[2]; const PREVIEW = process.env.PREVIEW_BASE || 'http://127.0.0.1:8903'; const PROD = 'https://dshowdash.com.br';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1, MAP www.dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
async function sessao(base, flag, rota) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript(({ flag }) => { try { const k = 'dshow.avst.flags.v1'; const cur = JSON.parse(localStorage.getItem(k) || '{}'); delete cur['as6.profile_redirect']; if (flag === 'on') cur['as6.profile_redirect'] = true; if (flag === 'off-explicit') cur['as6.profile_redirect'] = false; localStorage.setItem(k, JSON.stringify(cur)); } catch {} }, { flag });
  const page = await ctx.newPage();
  const reqs = []; page.on('response', (r) => { const u = r.url().replace(/^https?:\/\/[^/]+/, ''); if (/profile-redirect|flag=as6\.profile_redirect/.test(u)) reqs.push(r.status() + ' ' + u.slice(0, 80)); });
  const perr = []; page.on('pageerror', (e) => perr.push(String(e).slice(0, 140)));
  await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  const chegou = await Promise.race([page.waitForSelector('.site-header', { timeout: 25000 }).then(() => 'shell').catch(() => null), page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 25000 }).then(() => 'login').catch(() => null)]);
  if (chegou === 'login' || ((await isLoginPage(page)) && await page.isVisible('input[type="password"]').catch(() => false))) await loginViaPage(page);
  await page.waitForSelector('[data-region="main"]', { timeout: 30000 });
  // boot FRIO na rota pedida (nova carga da página)
  await page.goto(base + '/' + rota, { waitUntil: 'domcontentloaded', timeout: 45000 });
  return { ctx, page, reqs, perr };
}
const VIGIAR = (ms) => new Promise((res) => { const t0 = performance.now(); const seen = { pref: null, avst: null, home: null, hashes: [] }; const it = setInterval(() => { const t = Math.round(performance.now() - t0); if (seen.pref === null && document.querySelector('.panel-user-preferences')) seen.pref = t; if (seen.avst === null && document.querySelector('[data-avst-react-root], .vc-root[data-vc]')) seen.avst = t; if (seen.home === null && document.querySelector('#main .dsd-container__content [data-geral-react-root]')) seen.home = t; const h = location.hash; if (seen.hashes[seen.hashes.length - 1] !== h) seen.hashes.push(h); if (t >= ms) { clearInterval(it); res(seen); } }, 50); });
const ESTADO = () => ({ hash: location.hash, pref: !!document.querySelector('.panel-user-preferences'), avst: !!document.querySelector('[data-avst-react-root], .vc-root[data-vc]'), home: !!document.querySelector('#main .dsd-container__content [data-geral-react-root]'), attrRedirect: document.documentElement.getAttribute('data-profile-redirect'), attrInitial: document.documentElement.getAttribute('data-initial-route-honrada'), info: window.__profileRedirect ? { resolved: window.__profileRedirect.info().resolved, source: window.__profileRedirect.info().source, redirects: window.__profileRedirect.info().redirects } : null, histLen: history.length, assinatura: (() => { const m = document.querySelector('#main'); if (!m) return null; const tags = []; m.querySelectorAll('*').forEach((el) => { if (tags.length < 400) tags.push(el.tagName.toLowerCase() + '.' + String(el.className || '').split(/\s+/).filter((c) => !/^(is-|has-|active|hover|ger-estrela|ripple)/.test(c)).slice(0, 2).join('.')); }); return tags.join('|'); })(), scripts: [...document.querySelectorAll('script[type="module"][src]')].map((s) => s.getAttribute('src').replace(/\?.*$/, '')) });
const esperarShell = async (page) => { await page.waitForSelector('.preloader-container', { state: 'hidden', timeout: 20000 }).catch(() => {}); };
const res = {};
// ── OFF (flag ausente no banco / explícita false) × produção (sem o shim) ──
for (const [nome, base, flag] of [['off-preview', PREVIEW, 'off'], ['off-explicit-preview', PREVIEW, 'off-explicit'], ['baseline-prod', PROD, 'off']]) {
  const s = await sessao(base, flag, '#/profile'); const vig = await s.page.evaluate(VIGIAR, 9000); await esperarShell(s.page); await s.page.waitForTimeout(1500);
  const est = await s.page.evaluate(ESTADO); await s.page.screenshot({ path: `${OUT}/${nome}-profile.png` }); res[nome] = est;
  console.log(nome, JSON.stringify({ hash: est.hash, pref: est.pref, avst: est.avst, attrRedirect: est.attrRedirect, attrInitial: est.attrInitial, info: est.info, flashPref_ms: vig.pref, reqs: s.reqs, perr: s.perr }));
  await s.ctx.close();
}
const sig = (n) => res[n].assinatura; const sc = (n) => JSON.stringify(res[n].scripts.filter((x) => !/profile-redirect/.test(x)));
console.log('IDENTIDADE_OFF', JSON.stringify({ domMainIgualProd: sig('off-preview') === sig('baseline-prod'), nos: sig('baseline-prod').split('|').length, scriptsIguais: sc('off-preview') === sc('baseline-prod'), offExplicitIgual: sig('off-explicit-preview') === sig('baseline-prod') }));
// ── ON: boot frio em #/profile ──
{
  const s = await sessao(PREVIEW, 'on', '#/profile'); const vig = await s.page.evaluate(VIGIAR, 12000); await esperarShell(s.page); await s.page.waitForTimeout(1500);
  const est = await s.page.evaluate(ESTADO); await s.page.screenshot({ path: `${OUT}/on-boot-frio-profile.png` });
  console.log('on-boot-frio', JSON.stringify({ hash: est.hash, pref: est.pref, avst: est.avst, attrRedirect: est.attrRedirect, attrInitial: est.attrInitial, info: est.info, flashPreferencias: vig.pref !== null, avst_ms: vig.avst, hashes: vig.hashes, reqs: s.reqs, perr: s.perr }));
  // anti-loop: parado 3 s; depois volta ao home por hash e entra de novo em #/profile
  await s.page.waitForTimeout(3000); const loop = await s.page.evaluate(ESTADO); console.log('on-anti-loop(3s)', JSON.stringify({ hash: loop.hash, redirects: loop.info.redirects, avst: loop.avst }));
  await s.page.evaluate(() => { location.hash = '#/'; }); await s.page.waitForTimeout(3000);
  const home = await s.page.evaluate(ESTADO);
  await s.page.evaluate(() => { location.hash = '#/profile'; }); const vig2 = await s.page.evaluate(VIGIAR, 6000); const est2 = await s.page.evaluate(ESTADO);
  console.log('on-pos-boot home→#/profile', JSON.stringify({ homeAntes: { hash: home.hash, home: home.home, avst: home.avst }, hash: est2.hash, avst: est2.avst, pref: est2.pref, redirects: est2.info.redirects, flashPreferencias: vig2.pref !== null, avst_ms: vig2.avst, hashes: vig2.hashes, histLen: est2.histLen, perr: s.perr }));
  await s.page.screenshot({ path: `${OUT}/on-pos-boot-profile.png` });
  await s.ctx.close();
}
// ── ON: pós-boot a partir das PREFERÊNCIAS (boot frio em #/preferencias, depois #/profile e variantes) ──
{
  const s = await sessao(PREVIEW, 'on', '#/preferencias'); await esperarShell(s.page); await s.page.waitForTimeout(5000);
  const p0 = await s.page.evaluate(ESTADO); console.log('on-boot-preferencias', JSON.stringify({ hash: p0.hash, pref: p0.pref, avst: p0.avst, redirects: p0.info.redirects }));
  for (const h of ['#/profile', '#/profile/', '#/profile?x=1']) {
    await s.page.evaluate(() => { location.hash = '#/preferencias'; }); await s.page.waitForTimeout(3000);
    await s.page.evaluate((h) => { location.hash = h; }, h); const v = await s.page.evaluate(VIGIAR, 6000); const e = await s.page.evaluate(ESTADO);
    console.log('on-pos-boot pref→' + h, JSON.stringify({ hash: e.hash, avst: e.avst, pref: e.pref, redirects: e.info.redirects, avst_ms: v.avst, hashes: v.hashes }));
  }
  for (const [h, nome] of [['#/meu-perfil', 'meu-perfil'], ['#/preferencias', 'preferencias'], ['#/profile-x', 'profile-x (não é /profile)']]) {
    await s.page.evaluate((h) => { location.hash = h; }, h); await s.page.waitForTimeout(3500); const e = await s.page.evaluate(ESTADO);
    console.log('on-outras-rotas ' + nome, JSON.stringify({ hash: e.hash, pref: e.pref, avst: e.avst, redirects: e.info.redirects, attrRedirect: e.attrRedirect }));
  }
  console.log('on-perr', JSON.stringify(s.perr));
  await s.ctx.close();
}
await browser.close();
