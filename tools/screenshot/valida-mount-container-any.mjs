// `mount()` de 16 painéis passava `{ container: any, config }` — `any` NÃO É TIPO aqui, é um
// identificador que não existe em JavaScript. Todo `mount()` desses painéis morria em
// `ReferenceError: any is not defined` antes de montar qualquer coisa.
//
// Veio de uma migração strict: o TS2693 foi silenciado com `@ts-expect-error` em vez de corrigir
// o valor. O comentário calou o compilador e o bug foi para o `.js` servido.
//
// ALCANCE, medido — não presumido (2026-07-29):
//   - 14 dos 16 NÃO estão em `panel-paths`: não são carregáveis, a correção é preventiva;
//   - `panel-user-preferences` está em `panel-paths` (3 aliases: panel-config, panel-preferences)
//     mas está `is_active=0` no `ui_nav_items`;
//   - `panel-user-notifications` É ALCANÇÁVEL: é o SINO do nav-rail (`registry/items.ts`,
//     `panelId: panel-user-notifications`). Clicar no sino REALMENTE baixa o `index.js` do painel
//     (verificado na aba de rede) — ali o ReferenceError era bug ATIVO de UI.
//
// SEGUNDO defeito, que o ReferenceError mascarava e que esta prova cobria travado: nos painéis
// `panel-user-*` o `state/store.js` é um OBJETO singleton, não classe, e o `index.js` fazia
// `new StateStore(...)` — `TypeError: StateStore is not a constructor`. CORRIGIDO consumindo o
// singleton pelo default export, que é a correção que o projeto já tinha aplicado em
// `panel-user-profile` (v9.4.0-RECONNECT, 2026-07-08). Alcançou 3 painéis (notifications,
// preferences, sessions) e, em `preferences`, ainda um terceiro nível: `new Tracker(...)` sobre
// outro alias singleton. Todos montam agora — inclusive `panel-user-management`, que uma versão
// anterior desta prova acusou por defeito DELA (o `mount()` daquele painel devolve Promise e o
// harness não dava `await`).
//
// ⚠️ DEFEITO ADJACENTE, MEDIDO E **NÃO** CORRIGIDO (fora do escopo; decisão do dono): os painéis
// montam mas o valor exibido não atualiza. Eles testam `if (j.success && j.data)`, e o envelope do
// projeto é `{"ok":true,...}` — `ApiResponse.php` grava a chave `ok` (o método só se CHAMA
// `success()`). São **17 painéis** com `j.success` e **zero** usando `j.ok`, então nenhum deles
// sai do placeholder. Por isso a checagem aqui é "montou", não "mostra o número".
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

// Os 14 painéis que tinham SÓ o `container: any` — store deles já era `class StateStore`.
const SADIOS = [
  'panel-integration-adwords', 'panel-integration-alfinete', 'panel-integration-asaas',
  'panel-integration-bling', 'panel-integration-chatgpt', 'panel-integration-google-drive',
  'panel-status-currency-btc', 'panel-status-currency-usd-brl', 'panel-status-currency-usd-cny',
  'panel-status-email-integration', 'panel-status-instagram-messenger', 'panel-status-weather-sp',
  'panel-status-wechat-integration', 'panel-status-whatsapp-integration',
];
// A família `panel-user-*` inteira: os 3 que tinham store singleton usado com `new`, mais
// `profile` (já corrigido em 2026-07-08, serve de referência) e `management` (o do await).
const FAMILIA_USER = ['panel-user-notifications', 'panel-user-preferences', 'panel-user-sessions', 'panel-user-profile', 'panel-user-management'];

const log = (...a) => console.log(...a);
let ok = 0, fail = 0;
const checa = (rotulo, cond, detalhe = '') => {
  if (cond) { ok++; log(`  OK    ${rotulo}${detalhe ? '  ' + detalhe : ''}`); }
  else { fail++; log(`  FALHA ${rotulo}${detalhe ? '  ' + detalhe : ''}`); }
};

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
});
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch { /* */ }
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);

// Chama o mount de cada painel num container próprio e descarta. Direto no módulo servido:
// 14 destes não têm rota, então não há caminho de UI para exercitá-los.
const resultados = await page.evaluate(async (lista) => {
  const out = [];
  for (const p of lista) {
    try {
      const m = await import(`/components/panels/${p}/index.js`);
      const alvo = document.createElement('div');
      document.body.appendChild(alvo);
      const res = await m.mount(alvo, {});   // ⚠️ await: há mount() que devolve Promise
      out.push({ painel: p, montou: !!res?.success, erro: null });
      try { m.unmount?.(); } catch { /* */ }
      alvo.remove();
    } catch (e) { out.push({ painel: p, montou: false, erro: `${e.constructor.name}: ${e.message}` }); }
  }
  return out;
}, [...SADIOS, ...FAMILIA_USER]);

const por = (n) => resultados.find(r => r.painel === n);

log('\n=== os 14 sem defeito de store: mount() tem de funcionar ===');
for (const p of SADIOS) {
  const r = por(p);
  checa(p.padEnd(36), r?.montou === true, r?.erro ?? '');
}

log('\n=== nenhum painel pode mais morrer em ReferenceError (o bug corrigido) ===');
const refErr = resultados.filter(r => /ReferenceError|any is not defined/i.test(r.erro ?? ''));
checa('zero ReferenceError nos 16', refErr.length === 0, refErr.map(r => r.painel).join(', '));

log('\n=== a família panel-user-*: store singleton consertado, todos têm de montar ===');
for (const p of FAMILIA_USER) {
  const r = por(p);
  checa(p.padEnd(36), r?.montou === true, r?.erro ?? '');
}

log('\n=== nenhum "is not a constructor" sobrou (o 2º defeito) ===');
const ctorErr = resultados.filter(r => /is not a constructor/i.test(r.erro ?? ''));
checa('zero TypeError de construtor', ctorErr.length === 0, ctorErr.map(r => `${r.painel}: ${r.erro}`).join(' | '));

log(`\n${fail === 0 ? 'PASSOU' : 'REPROVOU'} — ${ok + fail} checagens, ${fail} falha(s)`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
