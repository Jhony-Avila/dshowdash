// Valida os drawers EM ABAS (Elevação Visual — Fase 3): Negócio, Pessoa, Organização,
// Atividade, Lead e Produto. Checa abas, contagens, troca por clique e por teclado,
// memória da última aba e as abas novas alimentadas pelo backend (notas/atividades).
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

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
await page.evaluate(() => { for (const k of ['deal', 'person', 'org', 'activity', 'lead', 'product']) localStorage.removeItem(`pp:aba:${k}`); });
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
await page.waitForTimeout(2000);

const irPara = async (label, ms = 2600) => {
  await page.evaluate(() => document.querySelector('.pp-colmenu-bg')?.click());
  await page.evaluate((l) => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes(l)); b?.click(); }, label);
  await page.waitForTimeout(ms);
};
const abrirPrimeiraLinha = async () => {
  await page.evaluate(() => {
    const tr = document.querySelector('.pp-main tbody tr:not(.pp-det-tr)');
    const td = tr?.querySelectorAll('td')[2];   // 0=expansor 1=seleção 2=primeira coluna real
    td?.click();
  });
  await page.waitForSelector('.pp-drawer', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1800);
};
const lerAbas = () => page.evaluate(() => {
  const d = document.querySelector('.pp-drawer');
  if (!d) return null;
  const abas = [...d.querySelectorAll('[role="tab"]')];
  return {
    titulo: d.querySelector('h2')?.textContent,
    abas: abas.map(a => a.textContent.trim()),
    ativa: abas.find(a => a.getAttribute('aria-selected') === 'true')?.textContent.trim(),
    temPainel: !!d.querySelector('[role="tabpanel"]'),
    icones: abas.filter(a => a.querySelector('svg')).length,
  };
});
const fechar = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(500); };

// ── 1. Abas em cada tipo de drawer ────────────────────────────
const casos = [
  ['Negócios', 'deal'], ['Pessoas', 'person'], ['Organizações', 'org'],
  ['Atividades', 'activity'], ['Leads', 'lead'], ['Produtos', 'product'],
];
R.drawers = {};
for (const [tela, chave] of casos) {
  await irPara(tela);
  await abrirPrimeiraLinha();
  R.drawers[chave] = await lerAbas();
  log(`1. ${chave.padEnd(9)} =>`, JSON.stringify(R.drawers[chave]));
  if (chave === 'person') await (await page.$('.pp-drawer'))?.screenshot({ path: `${OUT}/pipedrive-drawer-abas-pessoa.png` }).catch(() => {});
  await fechar();
}

// ── 2. Troca de aba por clique + conteúdo muda ────────────────
await irPara('Negócios');
await abrirPrimeiraLinha();
const antes = await page.evaluate(() => document.querySelector('.pp-drawer [role="tabpanel"]')?.textContent?.slice(0, 60));
await page.evaluate(() => { const t = [...document.querySelectorAll('.pp-drawer [role="tab"]')].find(x => x.textContent.includes('Dados')); t?.click(); });
await page.waitForTimeout(600);
const depois = await page.evaluate(() => ({
  texto: document.querySelector('.pp-drawer [role="tabpanel"]')?.textContent?.slice(0, 60),
  ativa: document.querySelector('.pp-drawer [role="tab"][aria-selected="true"]')?.textContent.trim(),
}));
R.trocaClique = { mudou: antes !== depois.texto, ativa: depois.ativa };
log('2. troca por clique =>', JSON.stringify(R.trocaClique));

// ── 3. Navegação por teclado (setas) ──────────────────────────
await page.evaluate(() => document.querySelector('.pp-drawer [role="tab"][aria-selected="true"]')?.focus());
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(400);
R.teclado = await page.evaluate(() => ({ ativa: document.querySelector('.pp-drawer [role="tab"][aria-selected="true"]')?.textContent.trim() }));
log('3. seta direita =>', JSON.stringify(R.teclado));
await (await page.$('.pp-drawer'))?.screenshot({ path: `${OUT}/pipedrive-drawer-abas-negocio.png` }).catch(() => {});

// ── 4. Memória da última aba (reabrir mantém) ─────────────────
const abaAntesDeFechar = R.teclado.ativa;
await fechar();
await abrirPrimeiraLinha();
R.memoria = await page.evaluate(() => ({
  ativa: document.querySelector('.pp-drawer [role="tab"][aria-selected="true"]')?.textContent.trim(),
  storage: localStorage.getItem('pp:aba:deal'),
}));
R.memoria.manteve = R.memoria.ativa === abaAntesDeFechar;
log('4. memória da aba =>', JSON.stringify(R.memoria));
await fechar();

// ── 5. Abas novas do backend: Notas/Atividades da PESSOA ──────
// Busca uma pessoa que REALMENTE tem notas (a 1ª da lista pode ter zero e o teste
// passaria mostrando só o estado vazio — não provaria o campo novo do backend).
await irPara('Pessoas');
await page.fill('.pp-toolbar-l input.pp-input', 'Douglas Rafael Correa');
await page.press('.pp-toolbar-l input.pp-input', 'Enter');
await page.waitForTimeout(2500);
await abrirPrimeiraLinha();
R.pessoaComNotas = await page.evaluate(() => {
  const abas = [...document.querySelectorAll('.pp-drawer [role="tab"]')].map(a => a.textContent.trim());
  return { titulo: document.querySelector('.pp-drawer h2')?.textContent, abas };
});
log('5a. pessoa com notas =>', JSON.stringify(R.pessoaComNotas));
R.pessoaConteudo = await page.evaluate(async () => {
  const clicar = (nome) => { const t = [...document.querySelectorAll('.pp-drawer [role="tab"]')].find(x => x.textContent.includes(nome)); t?.click(); };
  const ler = () => document.querySelector('.pp-drawer [role="tabpanel"]')?.textContent?.trim() ?? '';
  clicar('Atividades'); await new Promise(r => setTimeout(r, 400));
  const ativ = ler().slice(0, 70);
  clicar('Notas'); await new Promise(r => setTimeout(r, 400));
  const notas = ler().slice(0, 70);
  return { ativ, notas };
});
log('5. pessoa (atividades/notas) =>', JSON.stringify(R.pessoaConteudo));

// ── 6. Escape fecha o drawer ──────────────────────────────────
await fechar();
R.escapeFecha = await page.evaluate(() => !document.querySelector('.pp-drawer'));
log('6. Escape fecha =>', R.escapeFecha);

// ── 7. Screenshots dark + light ───────────────────────────────
await abrirPrimeiraLinha();
for (const t of ['dark', 'light']) {
  await setTheme(t); await page.waitForTimeout(600);
  await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-drawer-abas-${t}.png` }).catch(() => {});
}

const pipeErrs = errors.filter(e => !/container-main:logger|Performance critical|weather|whatsapp|instagram|wechat|integration\.api\.fetch/i.test(e));
log('\nRESUMO =>', JSON.stringify({ ...R, consoleErrs: pipeErrs.length }, null, 2));
if (pipeErrs.length) log('ERROS:', JSON.stringify(pipeErrs.slice(0, 8)));
await browser.close();
log('=== FIM ===');

async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
