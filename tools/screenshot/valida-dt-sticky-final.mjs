// valida-dt-sticky-final.mjs — validação final do header FIXO (wheel real).
// Dark+Light × seções; prova fixação (topoTop→topo do scroller) + screenshots + drawer.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/eae0bef0-6629-4ab1-8ef8-4e2b9338a6aa/scratchpad';
const SECOES = [
  { id: 'overview',        hash: '#/panel-datatables/overview' },
  { id: 'servers',         hash: '#/panel-datatables/infrastructure/servers' },
  { id: 'tables',          hash: '#/panel-datatables/data/tables' },
  { id: 'quality',         hash: '#/panel-datatables/observability/quality' },
  { id: 'administracao',   hash: '#/panel-datatables/settings' },
];
const cookies = await getSessionCookies();

async function rodar(tema) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 640 }, colorScheme: tema, serviceWorkers: 'block', ignoreHTTPSErrors: true });
  await ctx.addCookies(cookies);
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); localStorage.setItem('dt_force_impl', 'react'); } catch (e) {} }, tema);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 140)));
  const goto = async (h) => {
    await page.goto('https://dshowdash.com.br/' + h, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2400);
    if (await isLoginPage(page)) { await loginViaPage(page).catch(() => {}); await page.goto('https://dshowdash.com.br/' + h).catch(() => {}); await page.waitForTimeout(2400); }
    await page.waitForSelector('[data-dt-react-root]', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1600);
  };
  const medir = () => page.evaluate(() => {
    const topo = document.querySelector('[data-dt-react-root] [class*="topoFixo"]');
    if (!topo) return { erro: 'sem topoFixo' };
    const cs = getComputedStyle(topo);
    let e = topo.parentElement, sc = null;
    while (e) { const s = getComputedStyle(e); if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 4) { sc = e; break; } e = e.parentElement; }
    const bg = cs.backgroundColor; const m = bg.match(/rgba?\(([^)]+)\)/); const alpha = m ? (m[1].split(',').length === 4 ? parseFloat(m[1].split(',')[3]) : 1) : 1;
    return { topoTop: Math.round(topo.getBoundingClientRect().top), scrollerTop: sc ? Math.round(sc.getBoundingClientRect().top) : null, scrollerSt: sc ? sc.scrollTop : null, position: cs.position, zIndex: cs.zIndex, alpha, sombra: cs.boxShadow !== 'none' };
  });
  const res = [];
  for (const s of SECOES) {
    await goto(s.hash);
    const antes = await medir();
    await page.mouse.move(700, 420);
    await page.mouse.wheel(0, 500); await page.waitForTimeout(350);
    await page.mouse.wheel(0, 500); await page.waitForTimeout(650);
    const depois = await medir();
    await page.screenshot({ path: `${OUT}/final-${tema}-${s.id}.png` }).catch(() => {});
    const grudou = depois.scrollerSt > 50 && Math.abs(depois.topoTop - depois.scrollerTop) <= 3;
    res.push({ secao: s.id, tema, position: depois.position, zIndex: depois.zIndex, alpha: depois.alpha, sombra: depois.sombra, antesTop: antes.topoTop, depoisTop: depois.topoTop, scrollerTop: depois.scrollerTop, rolou: depois.scrollerSt, grudou });
  }
  // drawer cobre header (Bancos)
  await goto('#/panel-datatables/infrastructure/databases');
  await page.mouse.move(700, 420); await page.mouse.wheel(0, 300); await page.waitForTimeout(400);
  const drawer = await page.evaluate(async () => {
    const root = document.querySelector('[data-dt-react-root]');
    const linhas = root ? [...root.querySelectorAll('[role="row"]')] : [];
    const alvo = linhas[1] || linhas[0]; if (alvo) alvo.click();
    await new Promise(r => setTimeout(r, 800));
    const ov = [...document.querySelectorAll('[class*="overlay"],[class*="painel"]')].map(el => ({ el, z: parseInt(getComputedStyle(el).zIndex) || 0, pos: getComputedStyle(el).position })).filter(x => x.pos === 'fixed' && x.z > 0).sort((a, b) => b.z - a.z)[0];
    const topo = root && root.querySelector('[class*="topoFixo"]');
    return { abriu: !!ov, zOverlay: ov ? ov.z : null, zHeader: topo ? getComputedStyle(topo).zIndex : null, cobre: ov && topo ? ov.z > (parseInt(getComputedStyle(topo).zIndex) || 0) : null };
  });
  await page.screenshot({ path: `${OUT}/final-${tema}-drawer.png` }).catch(() => {});
  await browser.close();
  return { tema, res, drawer, errosJs: errors };
}

const dark = await rodar('dark');
const light = await rodar('light');
const linha = (r) => `${r.tema.padEnd(5)} ${r.secao.padEnd(14)} pos=${r.position} z=${r.zIndex} α=${r.alpha} sombra=${r.sombra} top:${r.antesTop}→${r.depoisTop} scrollerTop=${r.scrollerTop} rolou=${r.rolou} GRUDOU=${r.grudou}`;
console.log('=== RESULTADOS ===');
[...dark.res, ...light.res].forEach(r => console.log(linha(r)));
console.log('drawer dark :', JSON.stringify(dark.drawer));
console.log('drawer light:', JSON.stringify(light.drawer));
console.log('errosJs dark :', JSON.stringify(dark.errosJs));
console.log('errosJs light:', JSON.stringify(light.errosJs));
const todos = [...dark.res, ...light.res];
console.log('PASS_GRUDOU:', todos.every(r => r.grudou), ' PASS_OPACO:', todos.every(r => r.alpha === 1), ' PASS_DRAWER:', dark.drawer.cobre && light.drawer.cobre);
