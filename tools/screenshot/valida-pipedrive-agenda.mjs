// Valida a AGENDA de Atividades (Elevação Visual — Fase 3, FullCalendar):
// alternador Grade⇄Agenda, carga sob demanda do bundle, eventos reais na janela visível,
// clique no evento abrindo o drawer, troca de mês refazendo a consulta e persistência.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/var/www/dshowdash/storage/media/images/screenshots';
const log = (...a) => console.log(...a);
const R = {};

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1050 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch {}
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const bundles = [];       // chunks baixados
const consultas = [];     // GET /activities
page.on('request', r => {
  const u = r.url();
  if (u.includes('/chunks/Agenda.')) bundles.push('Agenda-chunk');
  if (u.includes('/api/pipedrive/activities?')) consultas.push(decodeURIComponent(u.split('activities?')[1]));
});

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(2500);
await page.evaluate(() => localStorage.removeItem('pp:ativ:vista'));
const trigger = await page.$('[data-panel-trigger="panel-pipedrive"]') || await page.$('.panel-pipedrive-component');
if (trigger) await trigger.click().catch(() => {});
await page.waitForSelector('[data-pp-react-root] .pp-nav', { timeout: 30000 });
await page.waitForTimeout(2000);

const irPara = async (label, ms = 2600) => {
  await page.evaluate(() => document.querySelector('.pp-colmenu-bg')?.click());
  await page.evaluate((l) => { const b = [...document.querySelectorAll('.pp-navitem')].find(x => x.textContent.includes(l)); b?.click(); }, label);
  await page.waitForTimeout(ms);
};

// ── 1. Alternador aparece na grade e o bundle da agenda AINDA não baixou ──
await irPara('Atividades');
R.antesDeAbrir = {
  temAlternador: await page.evaluate(() => !!document.querySelector('.pp-main .pp-seg')),
  botoes: await page.evaluate(() => [...document.querySelectorAll('.pp-main .pp-seg-b')].map(b => b.textContent.trim())),
  bundleAgendaBaixado: bundles.length > 0,
  grade: await page.evaluate(() => document.querySelectorAll('.pp-main tbody tr').length > 0),
};
log('1. antes de abrir =>', JSON.stringify(R.antesDeAbrir));

// ── 2. Abre a Agenda: bundle sob demanda + calendário renderiza ──
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-main .pp-seg-b')].find(x => x.textContent.includes('Agenda')); b?.click(); });
await page.waitForSelector('.pp-main .fc', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(3000);
R.agenda = await page.evaluate(() => ({
  calendario: !!document.querySelector('.pp-main .fc'),
  titulo: document.querySelector('.pp-main .fc-toolbar-title')?.textContent,
  eventos: document.querySelectorAll('.pp-main .fc-event').length,
  classesUsadas: [...new Set([...document.querySelectorAll('.pp-main .fc-event')].flatMap(e => [...e.classList].filter(c => c.startsWith('pp-ev-'))))],
  legenda: !!document.querySelector('.pp-main .pp-agenda-legenda'),
  botoes: [...document.querySelectorAll('.pp-main .fc-button')].map(b => b.textContent.trim()),
}));
R.agenda.bundleSobDemanda = bundles.length > 0;
R.agenda.consultasNaJanela = consultas.length;
R.agenda.consultaComJanela = consultas.at(-1)?.includes('due_from=') && consultas.at(-1)?.includes('due_to=');
log('2. agenda =>', JSON.stringify(R.agenda));
await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-agenda.png` }).catch(() => {});

// ── 3. Trocar de mês refaz a consulta com nova janela ──
const antes = consultas.length;
await page.evaluate(() => document.querySelector('.pp-main .fc-next-button')?.click());
await page.waitForTimeout(2600);
R.trocaMes = {
  novasConsultas: consultas.length - antes,
  janelaMudou: consultas.at(-1) !== consultas[antes - 1],
  ultima: consultas.at(-1)?.slice(0, 60),
};
log('3. troca de mês =>', JSON.stringify(R.trocaMes));

// ── 4. Clique no evento abre o drawer (em abas) ──
await page.evaluate(() => document.querySelector('.pp-main .fc-event')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
await page.waitForTimeout(2200);
R.cliqueEvento = await page.evaluate(() => {
  const d = document.querySelector('.pp-drawer');
  return d ? { abriu: true, titulo: d.querySelector('h2')?.textContent?.slice(0, 40), abas: [...d.querySelectorAll('[role="tab"]')].map(a => a.textContent.trim()) } : { abriu: false };
});
log('4. clique no evento =>', JSON.stringify(R.cliqueEvento));
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// ── 5. Volta para a Grade + preferência persiste ──
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-main .pp-seg-b')].find(x => x.textContent.includes('Grade')); b?.click(); });
await page.waitForTimeout(2600);
R.voltaGrade = {
  gridVoltou: await page.evaluate(() => document.querySelectorAll('.pp-main tbody tr').length > 0),
  storage: await page.evaluate(() => localStorage.getItem('pp:ativ:vista')),
};
await page.evaluate(() => { const b = [...document.querySelectorAll('.pp-main .pp-seg-b')].find(x => x.textContent.includes('Agenda')); b?.click(); });
await page.waitForTimeout(2000);
await irPara('Pessoas', 2000);
await irPara('Atividades', 3000);
R.voltaGrade.lembrouAgenda = await page.evaluate(() => !!document.querySelector('.pp-main .fc'));
log('5. volta/persistência =>', JSON.stringify(R.voltaGrade));

// ── 6. Screenshots dark + light ──
for (const t of ['dark', 'light']) {
  await setTheme(t); await page.waitForTimeout(700);
  await (await page.$('[data-pp-react-root]'))?.screenshot({ path: `${OUT}/pipedrive-agenda-${t}.png` }).catch(() => {});
}

const pipeErrs = errors.filter(e => !/container-main:logger|Performance critical|weather|whatsapp|instagram|wechat|integration\.api\.fetch/i.test(e));
log('\nRESUMO =>', JSON.stringify({ ...R, consoleErrs: pipeErrs.length }, null, 2));
if (pipeErrs.length) log('ERROS:', JSON.stringify(pipeErrs.slice(0, 8)));
await browser.close();
log('=== FIM ===');

async function setTheme(t) { let c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); for (let i = 0; i < 4 && c !== t; i++) { await page.click('[data-dsd-theme-toggle]').catch(() => {}); await page.waitForTimeout(700); c = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); } }
