// valida-dt-header-sticky.mjs — prova do header FIXO (sticky) do módulo DataTables.
// Para cada tema (dark/light) e seção: acha o container rolável real, rola,
// e verifica se o .topoFixo grudou no topo (rect ≈ topo do scroller + scrollTop>0),
// se o fundo é OPACO (alpha=1) e o z-index resolvido. Screenshots pós-scroll.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/eae0bef0-6629-4ab1-8ef8-4e2b9338a6aa/scratchpad';
const SECOES = [
  { id: 'overview',            hash: '#/panel-datatables/overview' },
  { id: 'servers-subabas',     hash: '#/panel-datatables/infrastructure/servers' },
  { id: 'tables-grid',         hash: '#/panel-datatables/data/tables' },
  { id: 'quality-subabas',     hash: '#/panel-datatables/observability/quality' },
];

const cookies = await getSessionCookies();

async function rodarTema(tema) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'] });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, colorScheme: tema, serviceWorkers: 'block', ignoreHTTPSErrors: true });
  await ctx.addCookies(cookies);
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); localStorage.setItem('dt_force_impl', 'react'); } catch (e) {} }, tema);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 160)));

  const goto = async (h) => {
    await page.goto('https://dshowdash.com.br/' + h, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2600);
    if (await isLoginPage(page)) { await loginViaPage(page).catch(() => {}); await page.goto('https://dshowdash.com.br/' + h).catch(() => {}); await page.waitForTimeout(2600); }
    await page.waitForSelector('[data-dt-react-root]', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1800);
  };

  const resultados = [];
  for (const s of SECOES) {
    await goto(s.hash);
    // mede + rola dentro do browser
    const medida = await page.evaluate(() => {
      const root = document.querySelector('[data-dt-react-root]');
      if (!root) return { erro: 'sem root' };
      // .topoFixo é a classe hasheada: acha pelo prefixo do módulo
      const topo = root.querySelector('[class*="topoFixo"]');
      if (!topo) return { erro: 'sem .topoFixo' };
      // acha o container rolável real subindo a árvore
      let sc = topo.parentElement, scroller = null;
      while (sc) {
        const st = getComputedStyle(sc);
        if ((st.overflowY === 'auto' || st.overflowY === 'scroll') && sc.scrollHeight > sc.clientHeight + 4) { scroller = sc; break; }
        sc = sc.parentElement;
      }
      const cs = getComputedStyle(topo);
      const bg = cs.backgroundColor;
      const alpha = (() => { const m = bg.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(x => parseFloat(x)); return p.length === 4 ? p[3] : 1; })();
      const out = {
        position: cs.position, zIndex: cs.zIndex, bg, alpha,
        temSombra: cs.boxShadow !== 'none', bordaInferior: cs.borderBottomWidth,
        scrollerClass: scroller ? scroller.className : null,
      };
      if (!scroller) { out.erro = 'sem scroller'; return out; }
      // topo antes
      const antes = topo.getBoundingClientRect();
      const scRect = scroller.getBoundingClientRect();
      out.antes_topoTop = Math.round(antes.top);
      out.scrollerTop = Math.round(scRect.top);
      // rola
      scroller.scrollTop = 700;
      // força reflow
      void scroller.offsetHeight;
      const depois = topo.getBoundingClientRect();
      out.scrollTopAplicado = Math.round(scroller.scrollTop);
      out.depois_topoTop = Math.round(depois.top);
      // grudou? topo do header ≈ topo do scroller, e realmente rolou
      out.grudou = (scroller.scrollTop > 50) && (Math.abs(depois.top - scRect.top) <= 3);
      return out;
    });
    medida.secao = s.id; medida.tema = tema;
    resultados.push(medida);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/sticky-${tema}-${s.id}.png` }).catch(() => {});
  }

  // teste do drawer cobrindo o header (na tela Bancos): abre 1ª linha e checa z-index
  await goto('#/panel-datatables/infrastructure/databases');
  const drawer = await page.evaluate(async () => {
    const root = document.querySelector('[data-dt-react-root]');
    const row = root && root.querySelector('[role="row"]');
    // pula o header row: pega uma linha de dados clicável
    const linhas = root ? [...root.querySelectorAll('[role="row"]')] : [];
    const alvo = linhas.find(l => l.getAttribute('aria-selected') !== null || l.tabIndex >= 0) || linhas[1] || linhas[0];
    if (alvo) alvo.click();
    await new Promise(r => setTimeout(r, 800));
    const ov = [...document.querySelectorAll('[class*="overlay"]')].find(e => getComputedStyle(e).position === 'fixed');
    const topo = root && root.querySelector('[class*="topoFixo"]');
    return {
      abriuOverlay: !!ov,
      zOverlay: ov ? getComputedStyle(ov).zIndex : null,
      zHeader: topo ? getComputedStyle(topo).zIndex : null,
    };
  });
  await page.screenshot({ path: `${OUT}/sticky-${tema}-drawer-cobre.png` }).catch(() => {});

  await browser.close();
  return { tema, resultados, drawer, errosJs: errors };
}

const dark = await rodarTema('dark');
const light = await rodarTema('light');
console.log(JSON.stringify({ dark, light }, null, 2));
