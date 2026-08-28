// testes/mobile-accessibility-smoke.mjs — TRACK C Marco 7: acessibilidade e
// alvos de toque da composição mobile. Verifica o que os marcos 1-5 já
// construíram (não fabrica): alvos ≥44px nos controles críticos, categoria ativa
// com aria-current, sheet de ferramenta como diálogo (role/aria-modal/rótulo +
// fechar com nome acessível), zoom NÃO desabilitado, todo botão com nome
// acessível, e prefers-reduced-motion honrado. Sem tocar motor/Track A.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);

  // (a) zoom NÃO desabilitado — pré-requisito de acessibilidade (WCAG 1.4.4)
  const viewport = await pagina.evaluate(() => document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '');
  const zoomOk = !!viewport && !/user-scalable\s*=\s*(no|0)/i.test(viewport) && !/maximum-scale\s*=\s*1(\.0)?\b/i.test(viewport);
  console.log('  viewport:', JSON.stringify(viewport));
  ok(zoomOk, 'viewport permite zoom (sem user-scalable=no / maximum-scale=1)');

  // (b) categoria ativa expõe aria-current + trilho tem rótulo de região
  const cat = await pagina.evaluate(() => {
    const nav = document.querySelector('.avst5-shell[data-mobile] .avst5-sidebar');
    const ativa = document.querySelector('.avst5-shell[data-mobile] .avst5-cat-on');
    return { navRotulo: nav?.getAttribute('aria-label') || '', ariaCurrent: ativa?.getAttribute('aria-current') || '' };
  });
  ok(cat.navRotulo.length > 0, `trilho de categorias tem aria-label ("${cat.navRotulo}")`);
  ok(cat.ariaCurrent === 'true', 'categoria ativa expõe aria-current="true"');

  // (c) alvos de toque ≥44px CSS nos controles críticos visíveis
  const alvos = await pagina.evaluate(() => {
    const min = (el) => { const r = el.getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)); };
    const visivel = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const grupos = {
      categorias: '.avst5-shell[data-mobile] .avst5-sidebar .avst5-cat',
      acoesHeader: '.avst5-shell[data-mobile] .avst5-header-acoes .avst-botao',
      salvar: '.avst5-shell[data-mobile] .avst5-salvar .avst-botao',
    };
    const out = {};
    for (const [k, sel] of Object.entries(grupos)) {
      const els = [...document.querySelectorAll(sel)].filter(visivel);
      out[k] = { n: els.length, menor: els.length ? Math.min(...els.map(min)) : 0 };
    }
    return out;
  });
  console.log('  alvos:', JSON.stringify(alvos));
  ok(alvos.categorias.n > 0 && alvos.categorias.menor >= 44, `categorias ≥44px (menor ${alvos.categorias.menor}, n=${alvos.categorias.n})`);
  if (alvos.acoesHeader.n > 0) ok(alvos.acoesHeader.menor >= 40, `ações do header ≥40px (menor ${alvos.acoesHeader.menor})`);
  if (alvos.salvar.n > 0) ok(alvos.salvar.menor >= 44, `botões de salvar ≥44px (menor ${alvos.salvar.menor})`);

  // (d) todo botão VISÍVEL tem nome acessível (texto, aria-label ou title)
  const semNome = await pagina.evaluate(() => {
    const nome = (b) => (b.textContent || '').trim() || b.getAttribute('aria-label') || b.getAttribute('title') ||
      (b.getAttribute('aria-labelledby') ? 'ref' : '') || (b.querySelector('img[alt]')?.getAttribute('alt') || '');
    return [...document.querySelectorAll('.avst5-shell[data-mobile] button')]
      .filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
      .filter((b) => !nome(b))
      .map((b) => b.className).slice(0, 6);
  });
  ok(semNome.length === 0, `todo botão visível tem nome acessível (sem-nome: ${semNome.join(', ') || 'nenhum'})`);

  // (e) prefers-reduced-motion honrado (media query aplica no mobile)
  await pagina.emulateMedia({ reducedMotion: 'reduce' });
  await pagina.waitForTimeout(150);
  const semMovimento = await pagina.evaluate(() => {
    const bar = document.querySelector('.avst5-shell[data-mobile] .avst5-salvar');
    if (!bar) return null;
    const tr = getComputedStyle(bar).transitionDuration || '';
    return tr === '' || tr === '0s' || tr.split(',').every((x) => x.trim() === '0s');
  });
  ok(semMovimento !== false, `prefers-reduced-motion remove a transição da barra de salvar (${semMovimento})`);
  await pagina.emulateMedia({ reducedMotion: 'no-preference' });

  // (f) sheet de ferramenta é um DIÁLOGO acessível: role + aria-modal + rótulo + fechar nomeado
  const abriu = await pagina.evaluate(() => {
    const alvos = ['Coleções', 'Conquistas', 'Arquétipos', 'Títulos', 'Presets'];
    const botoes = [...document.querySelectorAll('button')];
    for (const nome of alvos) {
      const b = botoes.find((x) => (x.textContent || '').trim().startsWith(nome));
      if (b) { b.scrollIntoView({ inline: 'center', block: 'center' }); b.click(); return nome; }
    }
    return null;
  });
  await pagina.waitForTimeout(700);
  const dlg = await pagina.evaluate(() => {
    const d = document.querySelector('.avst5-ferr-fundo');
    const fechar = document.querySelector('.avst5-ferr-fechar');
    const nomeFechar = fechar ? ((fechar.textContent || '').trim() || fechar.getAttribute('aria-label') || '') : '';
    const rf = fechar ? fechar.getBoundingClientRect() : null;
    return {
      role: d?.getAttribute('role') || '', ariaModal: d?.getAttribute('aria-modal') || '',
      rotulo: (d?.getAttribute('aria-label') || d?.getAttribute('aria-labelledby') || '').length > 0,
      nomeFechar, fecharPx: rf ? Math.round(Math.min(rf.width, rf.height)) : 0,
    };
  });
  console.log('  diálogo:', abriu, JSON.stringify(dlg));
  ok(!!abriu, `abriu uma ferramenta como diálogo (${abriu})`);
  ok(dlg.role === 'dialog', 'sheet tem role="dialog"');
  ok(dlg.ariaModal === 'true', 'sheet tem aria-modal="true"');
  ok(dlg.rotulo, 'sheet tem rótulo acessível (aria-label/labelledby)');
  ok(dlg.nomeFechar.length > 0 && dlg.fecharPx >= 44, `fechar tem nome ("${dlg.nomeFechar}") e ≥44px (${dlg.fecharPx})`);

  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-accessibility-smoke: ${falhas} falha(s)` : '\n✓ mobile-accessibility-smoke verde');
process.exit(falhas ? 1 : 0);
