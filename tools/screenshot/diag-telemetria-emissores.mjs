// diag-telemetria-emissores.mjs — QUEM posta em /api/telemetry/ além do telemetry-core?
// @version 1.0.0  @created 2026-07-28
//
// Após a correção do #63, os envios do telemetry-core (identificáveis pelo cabeçalho
// `X-Telemetry-Batch`) passaram a levar CSRF e responder 200. Sobraram POSTs SEM esse
// cabeçalho, que continuam 403. Este script instrumenta fetch/sendBeacon antes de qualquer
// script da página e captura a PILHA de chamada de cada envio — quem chama, não quem parece.
import { chromium } from 'playwright';
import { CONFIG } from './config.mjs';

const browser = await chromium.launch({ args: ['--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'] });
const context = await browser.newContext({ ignoreHTTPSErrors: true });

// addInitScript roda ANTES de qualquer script da página, em toda navegação.
await context.addInitScript(() => {
  // sessionStorage e não uma variável: o teste navega duas vezes (carrega → loga → recarrega)
  // e uma variável de página seria zerada no reload, escondendo justamente os envios do boot.
  const CHAVE = '__diag_envios_telemetria';
  const registrar = (via, temCsrf) => {
    try {
      const pilha = (new Error().stack || '').split('\n').slice(2, 7).join(' | ');
      const atual = JSON.parse(sessionStorage.getItem(CHAVE) || '[]');
      atual.push({ via, temCsrf, pilha });
      sessionStorage.setItem(CHAVE, JSON.stringify(atual));
    } catch { /* diagnóstico nunca pode derrubar a página */ }
  };
  const fetchOriginal = window.fetch;
  window.fetch = function (entrada, init) {
    try {
      const url = typeof entrada === 'string' ? entrada : (entrada && entrada.url) || '';
      if (url.includes('/api/telemetry/')) {
        const h = (init && init.headers) || {};
        const temCsrf = !!(h['X-CSRF-Token'] || h['x-csrf-token']);
        registrar('fetch', temCsrf);
      }
    } catch { /* diagnóstico nunca pode derrubar a página */ }
    return fetchOriginal.apply(this, arguments);
  };
  const beaconOriginal = navigator.sendBeacon && navigator.sendBeacon.bind(navigator);
  if (beaconOriginal) {
    navigator.sendBeacon = function (url, dados) {
      try { if (String(url).includes('/api/telemetry/')) registrar('sendBeacon', false); } catch { /* idem */ }
      return beaconOriginal(url, dados);
    };
  }
});

const page = await context.newPage();
try {
  await page.goto(CONFIG.BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(async ([user, pass]) => {
    await fetch('/api/auth/login.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login: user, password: pass }) });
  }, [CONFIG.AUTH_USER, CONFIG.AUTH_PASS]);
  await page.goto(CONFIG.BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(8000);

  const envios = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__diag_envios_telemetria') || '[]'));
  console.log(`\n─── emissores de /api/telemetry/ (${envios.length} envios) ───`);
  envios.forEach((e, i) => {
    console.log(`\n[${i + 1}] via=${e.via}  CSRF=${e.temCsrf ? 'sim' : 'NÃO'}`);
    console.log(`    ${e.pilha || '(sem pilha)'}`);
  });
  console.log();
} finally {
  await browser.close();
}
