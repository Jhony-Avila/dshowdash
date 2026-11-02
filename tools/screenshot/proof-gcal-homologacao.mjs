// Homologação (Fase 8) — auditoria de CLIENTE do módulo Google Calendar.
//
// Verifica os critérios que só existem no navegador: contraste real nos dois
// temas (§80), navegação por teclado, foco visível, ARIA, alternativa textual
// em toda figura, ausência de "só cor" (§70) e ausência de scroll horizontal.
//
// O contraste é CALCULADO (WCAG), não julgado por aparência.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/8c88ec85-e267-42fe-b900-d339ee8df790/scratchpad';
const log = (...a) => console.log(...a);

let falhas = 0;
const ok = (t, c, x = '') => { if (!c) { falhas++; log(`  [FALHA] ${t} ${x}`); } else log(`  [ok]    ${t} ${x}`); };

const ROTAS = ['hoje', 'agenda', 'proximos', 'convites', 'disponibilidade',
               'conflitos', 'carga', 'relatorios', 'calendarios', 'recursos',
               'alertas', 'contas', 'sincronizacao', 'configuracoes', 'equipe'];

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage',
         '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1',
         '--ignore-certificate-errors'],
});

/** Contraste WCAG calculado no próprio DOM, compondo até achar fundo opaco. */
const SCRIPT_CONTRASTE = `(() => {
  const lum = (r, g, b) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const rgb = (s) => { const m = s.match(/[\\d.]+/g); return m ? m.map(Number) : null; };
  const fundoOpaco = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = rgb(getComputedStyle(n).backgroundColor);
      if (c && (c[3] === undefined || c[3] > 0.85)) return c;
      n = n.parentElement;
    }
    return [255, 255, 255];
  };
  const raiz = document.querySelector('[data-gc-react-root]');
  if (!raiz) return { erro: 'root ausente' };
  const ruins = [];
  let medidos = 0;
  for (const el of raiz.querySelectorAll('*')) {
    const txt = [...el.childNodes].filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim()).join('');
    if (!txt || txt.length < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.3) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const fg = rgb(cs.color); if (!fg) continue;
    const bg = fundoOpaco(el);
    const l1 = lum(fg[0], fg[1], fg[2]), l2 = lum(bg[0], bg[1], bg[2]);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    medidos++;
    // 4.5:1 é o piso de texto normal; 3:1 vale para ≥18.66px ou ≥14px bold.
    const px = parseFloat(cs.fontSize);
    const grande = px >= 18.66 || (px >= 14 && Number(cs.fontWeight) >= 700);
    const piso = grande ? 3 : 4.5;
    if (ratio < piso) {
      ruins.push({ txt: txt.slice(0, 34), ratio: Math.round(ratio * 100) / 100,
                   px, cls: (el.className || '').toString().slice(0, 40) });
    }
  }
  return { medidos, ruins };
})()`;

for (const tema of ['dark', 'light']) {
  log(`\n▸ TEMA ${tema.toUpperCase()}`);
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, ignoreHTTPSErrors: true });
  try { await ctx.addCookies(await getSessionCookies()); } catch { /* segue */ }
  await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch { /* modo privado */ } }, tema);
  const page = await ctx.newPage();
  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForTimeout(3000);

  // O tema resolveu de fato? (a classe theme-light do <html> é sinal falso)
  await page.evaluate(() => { location.hash = '#/panel-google-calendar/hoje'; });
  await page.waitForSelector('[data-gc-react-root] .gc-layout', { timeout: 25000 });
  await page.waitForTimeout(2000);
  const tokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('[data-gc-react-root]'));
    return { surface: cs.getPropertyValue('--gc-surface').trim(),
             texto: cs.getPropertyValue('--gc-texto').trim() };
  });
  const ehDark = tokens.surface === '#1c1c2b';
  ok(`tokens do tema ${tema} resolvem`, tema === 'dark' ? ehDark : !ehDark,
     `(surface ${tokens.surface})`);

  // Contraste em TODAS as telas.
  let totalRuins = [], totalMedidos = 0;
  for (const rota of ROTAS) {
    await page.evaluate((r) => { location.hash = `#/panel-google-calendar/${r}`; }, rota);
    await page.waitForTimeout(1500);
    const r = await page.evaluate(SCRIPT_CONTRASTE);
    if (r.erro) continue;
    totalMedidos += r.medidos;
    for (const x of r.ruins) totalRuins.push({ ...x, rota });
  }
  // Dedup por texto+classe: o mesmo componente aparece em várias telas.
  const unicos = [...new Map(totalRuins.map((x) => [x.cls + '|' + x.txt, x])).values()];
  ok(`contraste WCAG em ${ROTAS.length} telas`, unicos.length === 0,
     `(${totalMedidos} textos medidos, ${unicos.length} abaixo do piso)`);
  unicos.slice(0, 8).forEach((u) =>
    log(`          ↳ ${u.ratio}:1  "${u.txt}"  ${u.px}px  .${u.cls}  [${u.rota}]`));

  // Scroll horizontal em nenhuma tela.
  let comScroll = [];
  for (const rota of ['hoje', 'agenda', 'relatorios', 'carga']) {
    await page.evaluate((r) => { location.hash = `#/panel-google-calendar/${r}`; }, rota);
    await page.waitForTimeout(1400);
    const est = await page.evaluate(() => {
      const el = document.querySelector('[data-gc-react-root]');
      return el ? el.scrollWidth - el.clientWidth : 0;
    });
    if (est > 2) comScroll.push(`${rota}(+${est}px)`);
  }
  ok('sem scroll horizontal', comScroll.length === 0, comScroll.join(' '));

  if (tema === 'light') await page.screenshot({ path: `${OUT}/h8-light.png` });
  else await page.screenshot({ path: `${OUT}/h8-dark.png` });
  await ctx.close();
}

/* ── Acessibilidade estrutural (um tema basta) ─────────────────────── */
log('\n▸ ACESSIBILIDADE (§80)');
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, ignoreHTTPSErrors: true });
  try { await ctx.addCookies(await getSessionCookies()); } catch { /* segue */ }
  const page = await ctx.newPage();
  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForTimeout(3000);
  await page.evaluate(() => { location.hash = '#/panel-google-calendar/hoje'; });
  await page.waitForSelector('[data-gc-react-root] .gc-layout', { timeout: 25000 });
  await page.waitForTimeout(1800);

  // Todo controle interativo precisa de nome acessível.
  const semNome = await page.evaluate(() => {
    const raiz = document.querySelector('[data-gc-react-root]');
    const out = [];
    for (const el of raiz.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const nome = (el.getAttribute('aria-label') || el.getAttribute('title')
        || el.textContent.trim() || el.getAttribute('placeholder') || '').trim();
      if (!nome) out.push(el.tagName + '.' + (el.className || '').toString().slice(0, 36));
    }
    return out;
  });
  ok('todo controle tem nome acessível', semNome.length === 0,
     semNome.slice(0, 4).join(' | '));

  // Navegação só por teclado: Tab tem de percorrer e o foco tem de ser visível.
  await page.evaluate(() => (document.querySelector('[data-gc-react-root] button') || {}).focus?.());
  let alcancados = 0, semAnel = 0;
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const d = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || !a.closest('[data-gc-react-root]')) return null;
      const cs = getComputedStyle(a);
      const temAnel = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
      return { tag: a.tagName, temAnel };
    });
    if (d) { alcancados++; if (!d.temAnel) semAnel++; }
  }
  ok('Tab percorre os controles do painel', alcancados >= 12, `(${alcancados}/25)`);
  ok('foco sempre visível', semAnel === 0, `(${semAnel} sem anel)`);

  // Toda figura precisa de alternativa textual.
  const figuras = await page.evaluate(async () => {
    const res = [];
    for (const rota of ['carga', 'relatorios', 'disponibilidade']) {
      location.hash = `#/panel-google-calendar/${rota}`;
      await new Promise((r) => setTimeout(r, 2000));
      const raiz = document.querySelector('[data-gc-react-root]');
      for (const f of raiz.querySelectorAll('figure')) {
        const img = f.querySelector('[role="img"]');
        const tabela = f.querySelector('details table, table');
        res.push({ rota, temLabel: !!(img && img.getAttribute('aria-label')), temTabela: !!tabela });
      }
    }
    return res;
  });
  const semAlt = figuras.filter((f) => !f.temLabel || !f.temTabela);
  ok('toda figura tem rótulo e tabela equivalente', semAlt.length === 0,
     `(${figuras.length} figuras, ${semAlt.length} incompletas)`);

  // §70: identidade não pode depender só de cor.
  const soCor = await page.evaluate(async () => {
    location.hash = '#/panel-google-calendar/hoje';
    await new Promise((r) => setTimeout(r, 1800));
    const pontos = [...document.querySelectorAll('[data-gc-react-root] .gc-ponto')];
    return pontos.filter((p) => !p.getAttribute('aria-label') && !p.getAttribute('title')).length;
  });
  ok('cor de calendário sempre acompanhada de rótulo (§70)', soCor === 0, `(${soCor} sem rótulo)`);

  // Estrutura de cabeçalhos e landmarks.
  const estrutura = await page.evaluate(() => {
    const raiz = document.querySelector('[data-gc-react-root]');
    return {
      nav: raiz.querySelectorAll('nav[aria-label]').length,
      main: raiz.querySelectorAll('main').length,
      h: [...raiz.querySelectorAll('h2,h3,h4')].length,
    };
  });
  ok('landmarks nav + main presentes', estrutura.nav >= 1 && estrutura.main >= 1,
     `(nav ${estrutura.nav}, main ${estrutura.main}, ${estrutura.h} títulos)`);

  // Movimento reduzido é respeitado.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(700);
  const anima = await page.evaluate(() => {
    const raiz = document.querySelector('[data-gc-react-root]');
    let n = 0;
    for (const el of raiz.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      if (cs.animationName !== 'none' && cs.animationDuration !== '0s') n++;
    }
    return n;
  });
  ok('prefers-reduced-motion desliga as animações', anima === 0, `(${anima} animando)`);
  await page.emulateMedia({ reducedMotion: null });

  await ctx.close();
}

log('\n═══════════════════════════════════════════════════════════');
log(falhas === 0 ? '  CLIENTE HOMOLOGADO — 0 falha' : `  *** ${falhas} FALHA(S) ***`);
log('═══════════════════════════════════════════════════════════');
await browser.close();
process.exit(falhas === 0 ? 0 : 1);
