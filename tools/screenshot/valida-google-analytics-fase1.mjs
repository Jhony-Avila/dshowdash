// Módulo Google Analytics — prova da FASE 1 (mock).
//
// O que esta prova cobre, e por quê:
//   1. o item entra na sidebar na ORDEM que o briefing §8.1 pede (Ads → Meta Ads → GA → Anúncios);
//   2. o painel MONTA de verdade (não basta o arquivo existir — ver os 3 painéis que baixavam o
//      index.js e morriam no mount por `container: any` / alias-objeto usado com `new`);
//   3. TODA tela marcada `disponivel: true` abre sem erro de console;
//   4. a sub-sidebar colapsa, persiste a preferência e o ECharts RESSINCRONIZA (§11.4);
//   5. a faixa de "dados simulados" aparece — §69.5 não é opcional;
//   6. o rodapé de procedência existe em toda tela (§49);
//   7. os dois temas, com prova de que foram mesmo exercitados.
//
// ⚠️ TEMA: contexto FRESCO + addInitScript(cm_theme). Trocar o tema com a página montada não
// repinta o painel, e a prova "passa" nos dois temas com PNGs idênticos.
// ⚠️ `<html class="theme-light">` fica presa nos dois temas neste shell — não serve de sinal.
// O sinal usado aqui é a COR DE FUNDO computada, que é o que o usuário vê.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/var/www/dshowdash/storage/media/images/screenshots';

// Espelha `disponivel: true` de src/shell/types.ts. Se divergir, a prova acusa.
const TELAS = [
  'visao-geral', 'tempo-real', 'aquisicao', 'canais', 'campanhas', 'paginas', 'landing-pages',
  'eventos', 'conversoes', 'funis', 'ecommerce', 'produtos', 'usuarios', 'dispositivos',
  'localizacoes', 'retencao', 'qualidade', 'tagging', 'alertas', 'propriedades', 'quotas',
];

const log = (...a) => console.log(...a);
let ok = 0, fail = 0;
const checa = (rot, cond, det = '') => {
  if (cond) { ok++; log(`  OK    ${rot}${det ? '  ' + det : ''}`); }
  else { fail++; log(`  FALHA ${rot}${det ? '  ' + det : ''}`); }
};

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
});
const cookies = await getSessionCookies().catch(() => []);
const fundos = {};

// Ruído conhecido do shell que não é do módulo.
const doModulo = (t) => !/\[header\.|container-main:logger|Performance critical|weather|Failed to load resource|favicon|sw\.js|ServiceWorker/i.test(t);

for (const tema of ['dark', 'light']) {
  log(`\n═══ ${tema} ═══`);
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch { /* */ } }, tema);
  // Começa expandida em todo run, senão a checagem de colapso depende da execução anterior.
  await ctx.addInitScript(() => { try { localStorage.setItem('dshow.google-analytics.sidebar.collapsed', '0'); } catch { /* */ } });
  try { await ctx.addCookies(cookies); } catch { /* */ }

  const page = await ctx.newPage();
  const erros = [];
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push('PAGEERROR: ' + e.message));

  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForTimeout(2500);

  // ── 1. o item está na sidebar, na ordem certa ───────────────────────────
  const ordem = await page.evaluate(() => {
    const alvos = ['Ads', 'Meta Ads', 'Google Analytics', 'Anuncios'];
    const itens = [...document.querySelectorAll('.dsd-sidebar__item')];
    const achados = [];
    for (const el of itens) {
      const txt = (el.textContent || '').trim();
      const pid = el.dataset?.panelId ?? el.getAttribute('data-panel-id');
      for (const a of alvos) {
        if (txt === a || txt.startsWith(a)) { achados.push({ label: a, pid }); break; }
      }
    }
    return achados;
  });
  const labels = ordem.map((o) => o.label);
  const iAds = labels.indexOf('Ads');
  const iGa = labels.indexOf('Google Analytics');
  const iAnu = labels.indexOf('Anuncios');
  checa('o item existe na sidebar', iGa >= 0, JSON.stringify(labels));
  checa('ordem do §8.1: Ads antes de GA, GA antes de Anúncios',
    iAds >= 0 && iGa > iAds && (iAnu === -1 || iGa < iAnu), JSON.stringify(labels));

  // ── 2. o painel MONTA ao clicar ─────────────────────────────────────────
  const item = await page.$('[data-panel-id="panel-google-analytics"]');
  checa('o item aponta para panel-google-analytics', !!item);
  if (item) await item.click().catch(() => {});
  const montou = await page.waitForSelector('[data-ga-react-root] .ga-shell', { timeout: 30000 }).then(() => true).catch(() => false);
  checa('o painel React montou', montou);
  if (!montou) { await ctx.close(); continue; }
  await page.waitForTimeout(1800);

  // ── 5. faixa de dados simulados (§69.5) ─────────────────────────────────
  const faixa = await page.evaluate(() => {
    const el = document.querySelector('[data-ga-react-root] .ga-faixa-mock');
    return el ? el.textContent.replace(/\s+/g, ' ').trim().slice(0, 90) : null;
  });
  checa('faixa de dados simulados visível', !!faixa && /simulados/i.test(faixa), faixa ?? 'ausente');

  // ── 4. sub-sidebar: colapsa, persiste e o gráfico ressincroniza ─────────
  // ⚠️ Seletor pelo `role="img"` do container do gráfico, NÃO por `svg` solto: a primeira
  // versão desta prova mediu um ícone Lucide de 15px e reprovou o código por defeito DELA.
  // Os ícones do módulo também são <svg>.
  const larguraGrafico = () => page.evaluate(() => {
    const box = document.querySelector('[data-ga-react-root] [role="img"][aria-label*="evolução"]');
    return box ? Math.round(box.getBoundingClientRect().width) : 0;
  });
  const antesW = await larguraGrafico();
  const subAntes = await page.evaluate(() => document.querySelector('[data-ga-react-root] .ga-sub')?.getBoundingClientRect().width ?? 0);
  await page.click('[data-ga-react-root] .ga-sub__toggle');
  await page.waitForTimeout(900);
  const subDepois = await page.evaluate(() => document.querySelector('[data-ga-react-root] .ga-sub')?.getBoundingClientRect().width ?? 0);
  const depoisW = await larguraGrafico();
  checa('a sub-sidebar colapsa', subDepois < subAntes - 100, `${Math.round(subAntes)}px -> ${Math.round(subDepois)}px`);
  // O gráfico tem de CRESCER quando a sub-sidebar encolhe: é a prova do ResizeObserver (§11.4).
  checa('o gráfico ressincroniza ao colapsar (ResizeObserver)', depoisW > antesW + 50, `${antesW}px -> ${depoisW}px`);
  checa('não surgiu scroll horizontal', await page.evaluate(() => {
    const c = document.querySelector('[data-ga-react-root] .ga-conteudo');
    return c ? c.scrollWidth <= c.clientWidth + 2 : false;
  }));

  const persistiu = await page.evaluate(() => localStorage.getItem('dshow.google-analytics.sidebar.collapsed'));
  checa('a preferência de colapso persiste', persistiu === '1', `chave=${persistiu}`);
  await page.click('[data-ga-react-root] .ga-sub__toggle');   // volta expandida
  await page.waitForTimeout(700);

  // ── 3. todas as telas abrem sem erro ────────────────────────────────────
  log('  — telas —');
  const semProcedencia = [];
  const comErro = [];
  for (const tela of TELAS) {
    erros.length = 0;
    await page.evaluate((t) => { window.location.hash = `#/panel-google-analytics/${t}`; }, tela);
    await page.waitForTimeout(950);
    const estado = await page.evaluate(() => {
      const raiz = document.querySelector('[data-ga-react-root]');
      const conteudo = raiz?.querySelector('.ga-conteudo');
      return {
        titulo: raiz?.querySelector('.ga-header__titulo')?.textContent?.trim() ?? null,
        temConteudo: (conteudo?.textContent ?? '').trim().length > 40,
        temProcedencia: !!raiz?.querySelector('.ga-proc'),
        temErroVisivel: !!raiz?.querySelector('.ga-erro[role="alert"]'),
        naoImplementada: (conteudo?.textContent ?? '').includes('ainda não implementada'),
      };
    });
    const errs = erros.filter(doModulo);
    const bom = estado.temConteudo && !estado.temErroVisivel && !estado.naoImplementada && errs.length === 0;
    if (!bom) comErro.push(`${tela}${estado.naoImplementada ? ' (sem componente)' : ''}${estado.temErroVisivel ? ' (erro na tela)' : ''}${errs.length ? ' (console: ' + errs[0].slice(0, 60) + ')' : ''}`);
    if (!estado.temProcedencia) semProcedencia.push(tela);
    checa(`tela ${tela.padEnd(15)}`, bom, estado.titulo ?? '');
  }
  checa('todas as telas têm rodapé de procedência (§49)', semProcedencia.length === 0, semProcedencia.join(', '));

  // ── e-commerce: o estado vazio é INFORMATIVO, não erro ──────────────────
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/ecommerce'; });
  await page.waitForTimeout(900);
  const ecom = await page.evaluate(() => {
    const t = document.querySelector('[data-ga-react-root] .ga-conteudo')?.textContent ?? '';
    return { diz: /não instrumentado/i.test(t), explica: /container GTM|view_item/i.test(t) };
  });
  checa('e-commerce diz que não está instrumentado', ecom.diz);
  checa('e-commerce explica o motivo e o que fazer', ecom.explica);

  // ── qualidade: mostra os achados REAIS da auditoria ─────────────────────
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/tagging'; });
  await page.waitForTimeout(900);
  const tag = await page.evaluate(() => {
    const t = document.querySelector('[data-ga-react-root] .ga-conteudo')?.textContent ?? '';
    return {
      container: t.includes('GTM-M8KJKVV'),
      mid: t.includes('G-WGDR8WJ7G8'),
      ua: t.includes('UA-945670-1'),
      bundle: /app\.min\.js/.test(t),
    };
  });
  checa('tagging mostra o container real (GTM-M8KJKVV)', tag.container);
  checa('tagging mostra o measurement ID real', tag.mid);
  checa('tagging denuncia o UA legado', tag.ua);
  checa('tagging avisa que a tag vive no app.min.js', tag.bundle);

  // ── tema exercitado de verdade ──────────────────────────────────────────
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/visao-geral'; });
  await page.waitForTimeout(900);
  const fundo = await page.evaluate(() => {
    const el = document.querySelector('[data-ga-react-root] .ga-kpi') ?? document.querySelector('[data-ga-react-root]');
    return el ? getComputedStyle(el).backgroundColor : null;
  });
  fundos[tema] = fundo;
  const rgb = (fundo ?? '').match(/\d+/g)?.map(Number) ?? [];
  const claro = rgb.length >= 3 && (rgb[0] + rgb[1] + rgb[2]) / 3 > 128;
  checa(`o tema aplicado é mesmo ${tema}`, claro === (tema === 'light'), `fundo=${fundo}`);

  await page.screenshot({ path: `${OUT}/ga-fase1-visao-geral-${tema}.png`, fullPage: false }).catch(() => {});
  await page.evaluate(() => { window.location.hash = '#/panel-google-analytics/qualidade'; });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/ga-fase1-qualidade-${tema}.png` }).catch(() => {});

  if (comErro.length) log(`  telas com problema: ${comErro.join(' | ')}`);
  await ctx.close();
}

log('\n═══ os dois temas foram mesmo exercitados? ═══');
checa('o fundo difere entre dark e light',
  !!fundos.dark && !!fundos.light && fundos.dark !== fundos.light,
  `dark=${fundos.dark} light=${fundos.light}`);

log(`\n${fail === 0 ? 'PASSOU' : 'REPROVOU'} — ${ok + fail} checagens, ${fail} falha(s)`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
