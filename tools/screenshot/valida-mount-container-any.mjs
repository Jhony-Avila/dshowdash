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
// ⚠️ ACHADO QUE ESTA PROVA REGISTRA DE PROPÓSITO: corrigir o `container` destrava o mount, mas
// `panel-user-notifications` e `panel-user-preferences` batem logo depois num SEGUNDO defeito,
// independente e anterior — `TypeError: StateStore is not a constructor`. Nesses dois o
// `state/store.js` é um OBJETO singleton, não uma classe, e o `index.js` faz `new StateStore(...)`.
// Os outros 14 têm `class StateStore` de verdade e montam. Ou seja: o ReferenceError MASCARAVA
// esse segundo bug — os dois únicos painéis alcançáveis da família seguem sem montar, e consertar
// isso é reescrever a integração do store (decisão de produto, fora do escopo desta correção).
// A prova EXIGE os 14, e trava os 2 no defeito conhecido: se um deles passar a montar, alguém
// consertou o store e esta prova precisa ser atualizada.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

// Os 16 painéis corrigidos. Os 2 do fim têm o defeito de store documentado acima.
const SADIOS = [
  'panel-integration-adwords', 'panel-integration-alfinete', 'panel-integration-asaas',
  'panel-integration-bling', 'panel-integration-chatgpt', 'panel-integration-google-drive',
  'panel-status-currency-btc', 'panel-status-currency-usd-brl', 'panel-status-currency-usd-cny',
  'panel-status-email-integration', 'panel-status-instagram-messenger', 'panel-status-weather-sp',
  'panel-status-wechat-integration', 'panel-status-whatsapp-integration',
];
const COM_DEFEITO_DE_STORE = ['panel-user-notifications', 'panel-user-preferences'];

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
      const res = m.mount(alvo, {});
      out.push({ painel: p, montou: !!res?.success, erro: null });
      try { m.unmount?.(); } catch { /* */ }
      alvo.remove();
    } catch (e) { out.push({ painel: p, montou: false, erro: `${e.constructor.name}: ${e.message}` }); }
  }
  return out;
}, [...SADIOS, ...COM_DEFEITO_DE_STORE]);

const por = (n) => resultados.find(r => r.painel === n);

log('\n=== os 14 sem defeito de store: mount() tem de funcionar ===');
for (const p of SADIOS) {
  const r = por(p);
  checa(p.padEnd(36), r?.montou === true, r?.erro ?? '');
}

log('\n=== nenhum painel pode mais morrer em ReferenceError (o bug corrigido) ===');
const refErr = resultados.filter(r => /ReferenceError|any is not defined/i.test(r.erro ?? ''));
checa('zero ReferenceError nos 16', refErr.length === 0, refErr.map(r => r.painel).join(', '));

log('\n=== os 2 alcançáveis: defeito de store CONHECIDO e ainda aberto ===');
for (const p of COM_DEFEITO_DE_STORE) {
  const r = por(p);
  checa(`${p.padEnd(36)} ainda para em "StateStore is not a constructor"`,
    /StateStore is not a constructor/.test(r?.erro ?? ''),
    r?.montou ? 'MONTOU! alguém consertou o store — atualizar esta prova' : (r?.erro ?? ''));
}

log(`\n${fail === 0 ? 'PASSOU' : 'REPROVOU'} — ${ok + fail} checagens, ${fail} falha(s)`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
