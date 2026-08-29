// _login-capture.mjs — Track D onda 3 (item 5): ETAPA MANUAL ÚNICA de login.
// Abre o preview num navegador visível, aguarda o login humano, detecta a sessão
// autenticada (some o formulário + shell renderizado), salva o storage-state com
// permissão restrita e fecha. Continua sozinho depois. Segredos NUNCA vão ao log.
//   uso: PW_CHROME=... node scripts/avatar/testes/_login-capture.mjs <PREVIEW_URL> <STORAGE_OUT>
import { chromium } from 'playwright-core';
import { chmodSync } from 'node:fs';
const [BASE, OUT] = process.argv.slice(2);
const CHROME = process.env.PW_CHROME;
if (!BASE || !OUT || !CHROME) { console.error('uso: PW_CHROME=... node _login-capture.mjs <PREVIEW_URL> <STORAGE_OUT>'); process.exit(2); }

const nav = await chromium.launch({ executablePath: CHROME, headless: false, args: ['--no-sandbox'] });
const ctx = await nav.newContext();
const pg = await ctx.newPage();
await pg.goto(BASE, { waitUntil: 'domcontentloaded' });
console.log('>> Faça login na janela aberta. Detecto a sessão automaticamente…');

// aguarda BODY_STATE=authenticated: sem formulário de login + shell presente
const prazo = Date.now() + 5 * 60 * 1000; // 5 min
let ok = false;
while (Date.now() < prazo) {
  const st = await pg.evaluate(() => ({
    temLogin: !!document.querySelector('#login-region, .login-modal, form[action*="login"], input[type="password"]'),
    temShell: !!document.querySelector('#app-shell, .dsd-shell__region--header'),
    body: document.body?.getAttribute('data-auth') || (document.body?.className.includes('authenticated') ? 'authenticated' : ''),
  })).catch(() => ({}));
  if (!st.temLogin && st.temShell) { ok = true; break; }
  await pg.waitForTimeout(1500);
}
if (!ok) { console.error('>> AUTH_READY=false (não detectei sessão em 5 min). Nada salvo.'); await nav.close(); process.exit(3); }

await ctx.storageState({ path: OUT });
try { chmodSync(OUT, 0o600); } catch { /* ok */ }
console.log('>> AUTH_READY=true LOGIN_VISIBLE_AFTER=NO BODY_STATE=authenticated SHELL_RENDERED=true — storage-state salvo (600).');
await nav.close();
