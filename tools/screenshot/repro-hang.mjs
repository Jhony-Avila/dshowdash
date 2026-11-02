// repro-hang.mjs — reproduz o boot AUTENTICADO e detecta hang de main-thread. Login sancionado (auth.mjs).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/37e388f6-21e8-479a-8539-85c52043cb4c/scratchpad/auth-boot.png';
const logs = [], errors = [], reqFail = [];

const cookies = await getSessionCookies();
console.log('COOKIES:', cookies.map(c => c.name).join(','));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addCookies(cookies);
const page = await ctx.newPage();
page.on('console', m => logs.push(`${Date.now() % 100000} [${m.type()}] ${m.text().slice(0, 200)}`));
page.on('pageerror', e => errors.push(String(e).slice(0, 300)));
page.on('requestfailed', r => reqFail.push(`${r.method()} ${r.url().slice(0,120)} :: ${r.failure()?.errorText}`));

const t0 = Date.now();
let navErr = '', loginErr = '';
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => navErr = String(e));

// Login via FORMULARIO (caminho fiel ao do dono) — cookie sozinho perde a race do auth-guard
await page.waitForTimeout(1500);
if (await isLoginPage(page)) {
  await loginViaPage(page).catch(e => loginErr = String(e).slice(0, 200));
} else {
  loginErr = 'nao detectou tela de login (ja autenticado?)';
}
const tAfterLogin = Date.now() - t0;

// Sondagem de responsividade: se a main-thread travar, evaluate estoura o timeout.
let hangAt = null; const probes = [];
for (let i = 0; i < 25; i++) {
  const p0 = Date.now();
  try {
    const st = await page.evaluate(() => {
      const bar = document.querySelector('[class*="progress"],[class*="loading"] [style*="width"],[style*="width"]');
      return {
        rs: document.readyState,
        pct: (document.body?.innerText || '').match(/(\d{1,3})%/)?.[1] || null,
        nodes: document.getElementsByTagName('*').length,
      };
    });
    probes.push({ i, ms: Date.now() - p0, ...st });
  } catch (e) {
    hangAt = { i, sinceNav: Date.now() - t0, err: String(e).slice(0, 120) };
    break;
  }
  await page.waitForTimeout(1000);
}

let ui = {};
try { ui = await page.evaluate(() => ({ rs: document.readyState, title: document.title, nodes: document.getElementsByTagName('*').length, text: (document.body?.innerText||'').slice(0,140) })); }
catch (e) { ui = { blocked: String(e).slice(0,100) }; }

await page.screenshot({ path: OUT }).catch(() => {});
await browser.close();

// Detecta logs repetidos (assinatura de loop)
const counts = {};
for (const l of logs) { const key = l.replace(/^\d+ /, ''); counts[key] = (counts[key]||0)+1; }
const repeated = Object.entries(counts).filter(([,n]) => n >= 5).sort((a,b)=>b[1]-a[1]).slice(0,8);

console.log(JSON.stringify({
  navErr, loginErr, tAfterLogin, hangDetected: !!hangAt, hangAt,
  probeCount: probes.length, lastProbe: probes[probes.length-1], slow: probes.filter(p=>p.ms>500),
  ui, pageErrors: errors.slice(0,10), requestFailed: reqFail.slice(0,10),
  repeatedLogs: repeated, consoleTail: logs.slice(-30), screenshot: OUT,
}, null, 2));
