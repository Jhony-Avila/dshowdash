// Smoke test de boot: o bundle telemetry-core é carregado no index.html, então um erro nele
// derruba o app inteiro. Mede erros de console e a API pública viva no runtime.
import { chromium } from 'playwright';
import { CONFIG } from './config.mjs';

const browser = await chromium.launch({ args: ['--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'] });
const context = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await context.newPage();
const erros = [];
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text().slice(0, 700)); });
page.on('pageerror', (e) => erros.push('PAGEERROR: ' + String(e).slice(0, 700)));

await page.goto(CONFIG.BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.evaluate(async ([u, p]) => { await fetch('/api/auth/login.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login: u, password: p }) }); }, [CONFIG.AUTH_USER, CONFIG.AUTH_PASS]);
await page.goto(CONFIG.BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(7000);

const api = await page.evaluate(async () => {
  const m = await import('/assets/js/core/telemetry-core/index.js');
  const t = m.Telemetry;
  return {
    exports: Object.keys(m).sort(),
    versao: m.VERSION,
    pronto: typeof t?.isReady === 'function' ? t.isReady() : null,
    saude: typeof t?.healthCheck === 'function' ? t.healthCheck().status : null,
    saudeDetalhe: typeof t?.healthCheck === 'function' ? t.healthCheck() : null,
    adapter: typeof m.createLegacyAdapter === 'function' ? Object.keys(m.createLegacyAdapter('x')).sort().join(',') : null,
    janelaTelemetry: typeof window.Telemetry,
    debugEhObjeto: t && typeof t.debug === 'object',
  };
});

console.log('\n─── smoke de boot ───');
console.log('exports  :', api.exports.join(' '));
console.log('VERSION  :', api.versao, '| isReady:', api.pronto, '| health:', api.saude);
console.log('adapter  :', api.adapter);
console.log('window.Telemetry:', api.janelaTelemetry, '| Telemetry.debug é objeto:', api.debugEhObjeto);
console.log('health   :', JSON.stringify(api.saudeDetalhe?.checks), '· issues:', JSON.stringify(api.saudeDetalhe?.issues));
console.log('erros de console:', erros.length);
erros.slice(0, 10).forEach((e) => console.log('   ✘', e));
console.log(erros.length === 0 ? '\n\x1b[32m✔ boot limpo\x1b[0m\n' : '\n\x1b[31m✘ há erros no boot\x1b[0m\n');
await browser.close();
process.exitCode = erros.length === 0 ? 0 : 1;
