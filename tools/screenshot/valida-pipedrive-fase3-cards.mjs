// Valida a Fase 3 (fatia 1) da Elevação Visual do Pipedrive:
// cards-resumo por entidade (/entity-stats), avatares de iniciais e rótulos legíveis de tipo.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const log = (...a) => console.log(...a);
const R = {};

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const statsResp = [];
page.on('response', async (r) => {
  if (r.url().includes('/api/pipedrive/entity-stats')) {
    statsResp.push({ url: decodeURIComponent(r.url().split('entity-stats')[1]), status: r.status() });
  }
});

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
await page.waitForTimeout(2000);

const irPara = async (label, ms = 2600) => {
  await page.evaluate(() => document.querySelector('.pp-colmenu-bg')?.click());
  await page.evaluate((l) => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes(l)); b?.click(); }, label);
  await page.waitForTimeout(ms);
};
const lerCards = () => page.evaluate(() => {
  const s = document.querySelector('.pp-main .pp-kpistrip');
  if (!s) return null;
  return [...s.querySelectorAll('.pp-kpi')].map(k => ({
    v: k.querySelector('.pp-kpi-n')?.textContent, l: k.querySelector('.pp-kpi-l')?.textContent,
  }));
});

// ── 1. Cards por entidade (6 telas) ───────────────────────────
R.cards = {};
for (const tela of ['Pessoas', 'Organizações', 'Produtos', 'Atividades', 'Leads', 'Notas']) {
  await irPara(tela);
  const c = await lerCards();
  R.cards[tela] = c ? { n: c.length, tiles: c.map(x => `${x.l}=${x.v}`) } : null;
  log(`1. cards ${tela.padEnd(14)} =>`, JSON.stringify(R.cards[tela]));
}
R.respostasStats = { chamadas: statsResp.length, todas200: statsResp.every(r => r.status === 200), amostra: statsResp.slice(0, 3) };
log('1b. respostas /entity-stats =>', JSON.stringify(R.respostasStats));

// ── 2. Avatares (Pessoas / Organizações / Usuários) ───────────
R.avatares = {};
for (const tela of ['Pessoas', 'Organizações', 'Usuários']) {
  await irPara(tela);
  R.avatares[tela] = await page.evaluate(() => {
    const avs = [...document.querySelectorAll('.pp-main tbody .pp-avatar')];
    const cores = new Set(avs.map(a => getComputedStyle(a).backgroundColor));
    return { qtd: avs.length, iniciais: avs.slice(0, 3).map(a => a.textContent), coresDistintas: cores.size, redondo: avs[0] ? getComputedStyle(avs[0]).borderRadius : null };
  });
  log(`2. avatares ${tela.padEnd(14)} =>`, JSON.stringify(R.avatares[tela]));
}

// ── 3. Rótulos legíveis de tipo (Atividades) ──────────────────
await irPara('Atividades');
R.tiposAtividade = await page.evaluate(() => {
  const idx = [...document.querySelectorAll('.pp-main thead th')].findIndex(th => th.textContent.includes('Tipo'));
  const vals = [...document.querySelectorAll('.pp-main tbody tr:not(.pp-det-tr)')].slice(0, 12)
    .map(tr => tr.querySelectorAll('td')[idx]?.textContent?.trim()).filter(Boolean);
  const unicos = [...new Set(vals)];
  return { unicos, temIngles: unicos.some(v => ['call', 'meeting', 'task', 'deadline', 'email', 'lunch'].includes(v)) };
});
log('3. tipos de atividade =>', JSON.stringify(R.tiposAtividade));
await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-fase3-atividades.png` }).catch(() => {});

// ── 4. Resiliência: /entity-stats caindo NÃO derruba o grid ───
// Recarrega a página com a rota já falhando: sem reload, o React Query serve o cache
// (staleTime 120s) e o teste veria o strip antigo — falso "resistiu".
await page.route('**/api/pipedrive/entity-stats**', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false}' }));
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
const t2 = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (t2) await t2.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
await page.waitForTimeout(2000);
await irPara('Produtos', 6000);
R.resiliencia = await page.evaluate(() => ({
  cardsSumiram: !document.querySelector('.pp-main .pp-kpistrip'),
  gridVivo: document.querySelectorAll('.pp-main tbody tr').length > 0,
}));
await page.unroute('**/api/pipedrive/entity-stats**');
log('4. resiliência (stats 500) =>', JSON.stringify(R.resiliencia));

// ── 5. Screenshots dark + light (Pessoas com cards + avatares) ─
await irPara('Pessoas', 3000);
for (const t of ['dark', 'light']) {
  await setTheme(t); await page.waitForTimeout(600);
  await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-fase3-${t}.png` }).catch(() => {});
}

const pipeErrs = errors.filter(e => !/container-main:logger|Performance critical|weather|whatsapp|instagram|wechat|integration\.api\.fetch|500 \(Internal Server Error\)|Failed to load resource/i.test(e));
log('\nRESUMO =>', JSON.stringify({ ...R, consoleErrs: pipeErrs.length }, null, 2));
if (pipeErrs.length) log('ERROS:', JSON.stringify(pipeErrs.slice(0, 8)));
await browser.close();
log('=== FIM ===');

async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
