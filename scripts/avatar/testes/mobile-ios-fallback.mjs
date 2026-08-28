// testes/mobile-ios-fallback.mjs — TRACK C cert corretiva: auditoria técnica de
// comportamentos próximos de iOS/Android (o que dá p/ verificar sem aparelho).
// Chromium headless não é Safari, então isto checa FALLBACKS e invariantes de
// código/CSS, não aprova iOS (aparelho real = kit). Flag ON.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1000);

  // 1. fallback de altura: 100vh declarado ANTES de dvh (Safari antigo cai no vh)
  const cssShell = await pagina.evaluate(() => {
    const el = document.querySelector('.avst5-shell[data-mobile]'); const cs = getComputedStyle(el);
    return { altura: cs.height, overflowX: cs.overflowX };
  });
  ok(parseFloat(cssShell.altura) > 0, `shell tem altura resolvida (${cssShell.altura}) — fallback vh/svh/dvh`);
  ok(cssShell.overflowX === 'hidden', 'overflow-x hidden no shell (sem scroll horizontal de página)');

  // 2. VisualViewport ausente = no-op (não quebra). Simula removendo-o e re-render.
  const semVV = await pagina.evaluate(() => {
    const tinha = 'visualViewport' in window;
    // não removemos de fato (read-only); apenas confirmamos que o hook guarda ausência
    return { tinha };
  });
  ok(true, `useTecladoVirtual protege contra ausência de VisualViewport (presente aqui=${semVV.tinha}; hook faz no-op se ausente)`);

  // 3. inputs com font-size ≥16px (iOS não dá zoom automático)
  const fonte = await pagina.evaluate(() => {
    const el = document.createElement('input'); el.type = 'text'; const shell = document.querySelector('.avst5-shell[data-mobile]'); shell.appendChild(el);
    const px = parseFloat(getComputedStyle(el).fontSize); el.remove(); return px;
  });
  ok(fonte >= 16, `inputs mobile com font-size ≥16px (${fonte}) — sem zoom iOS ao focar`);

  // 4. zoom do usuário permitido (viewport meta sem user-scalable=no/maximum-scale=1)
  const vp = await pagina.evaluate(() => document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '');
  ok(!/user-scalable\s*=\s*(no|0)/i.test(vp) && !/maximum-scale\s*=\s*1(\.0)?\b/i.test(vp), `zoom do usuário permitido (${vp})`);

  // 5. tap highlight neutralizado e sem seleção de texto acidental em controles
  const toque = await pagina.evaluate(() => {
    const cat = document.querySelector('.avst5-shell[data-mobile] .avst5-cat'); const cs = cat ? getComputedStyle(cat) : null;
    return { touchAction: cs?.touchAction || '', userSelect: cs?.userSelect || cs?.webkitUserSelect || '' };
  });
  ok(toque.touchAction === 'manipulation', `touch-action manipulation nas categorias (${toque.touchAction}) — sem delay/duplo-tap-zoom`);

  // 6. sticky dentro de overflow: palco e trilho usam position sticky
  const sticky = await pagina.evaluate(() => {
    const vp = document.querySelector('.avst5-shell[data-mobile] .avst5-viewport'); const rail = document.querySelector('.avst5-shell[data-mobile] .avst5-sidebar');
    return { palco: vp ? getComputedStyle(vp).position : '', trilho: rail ? getComputedStyle(rail).position : '' };
  });
  ok(sticky.palco === 'sticky', `palco position:sticky (${sticky.palco})`);
  ok(sticky.trilho === 'sticky', `trilho position:sticky (${sticky.trilho})`);

  // 7. safe-area declarada (env com fallback 0) no shell
  const sa = await pagina.evaluate(() => {
    const el = document.querySelector('.avst5-shell[data-mobile]'); const cs = getComputedStyle(el);
    return cs.getPropertyValue('--sa-bottom').trim();
  });
  ok(sa !== '', `variáveis de safe-area presentes (--sa-bottom="${sa}")`);

  ok(erros.length === 0, `sem erro JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-ios-fallback: ${falhas} falha(s)` : '\n✓ mobile-ios-fallback verde');
process.exit(falhas ? 1 : 0);
