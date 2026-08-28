// testes/mobile-tools-overlays.mjs — TRACK C Marco 3: ferramentas do 2D único
// como FULL-SCREEN SHEET no celular. Abre dentro do shell, tem título + fechar
// acessível, scroll próprio (sem duplo), cabe na tela, e fecha.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  // abre uma ferramenta clicando o botão de nav correspondente (Coleções/Conquistas/Arquétipos/Títulos)
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
  const m = await pagina.evaluate(() => {
    const modal = document.querySelector('.avst5-ferr-modal');
    const cab = document.querySelector('.avst5-ferr-cab');
    const titulo = document.querySelector('.avst5-ferr-titulo');
    const fechar = document.querySelector('.avst5-ferr-fechar');
    const corpo = document.querySelector('.avst5-ferr-corpo');
    const dialog = document.querySelector('.avst5-ferr-fundo[aria-modal="true"]');
    const r = modal ? modal.getBoundingClientRect() : null;
    const rf = fechar ? fechar.getBoundingClientRect() : null;
    const cs = corpo ? getComputedStyle(corpo) : null;
    return {
      temModal: !!modal, ariaModal: !!dialog, temTitulo: !!titulo && !!titulo.textContent.trim(),
      temFechar: !!fechar, fecharPx: rf ? Math.round(Math.min(rf.width, rf.height)) : 0,
      fullW: r ? Math.round(r.width) : 0, fullH: r ? Math.round(r.height) : 0,
      innerW: window.innerWidth, innerH: window.innerHeight,
      corpoScroll: cs ? (cs.overflowY === 'auto' || cs.overflowY === 'scroll') : false,
      docScrollW: document.documentElement.scrollWidth,
    };
  });
  console.log('  abriu:', abriu, JSON.stringify(m));
  ok(!!abriu, `abriu uma ferramenta (${abriu})`);
  ok(m.temModal, 'sheet da ferramenta montou DENTRO do shell');
  ok(m.ariaModal, 'aria-modal="true" (foco/diálogo)');
  ok(m.temTitulo, 'sheet tem título');
  ok(m.temFechar && m.fecharPx >= 44, `botão fechar acessível ≥44px (${m.fecharPx})`);
  ok(m.fullW >= m.innerW - 2 && m.fullH >= m.innerH - 2, `full-screen (${m.fullW}×${m.fullH} ~ ${m.innerW}×${m.innerH})`);
  ok(m.corpoScroll, 'corpo tem scroll próprio (sem duplo scroll)');
  ok(m.docScrollW <= m.innerW + 1, 'sem overflow horizontal com a sheet aberta');
  // fecha
  await pagina.evaluate(() => document.querySelector('.avst5-ferr-fechar')?.click());
  await pagina.waitForTimeout(400);
  const fechou = await pagina.evaluate(() => !document.querySelector('.avst5-ferr-modal'));
  ok(fechou, 'fechar remove a sheet (volta ao shell)');
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-tools-overlays: ${falhas} falha(s)` : '\n✓ mobile-tools-overlays verde');
process.exit(falhas ? 1 : 0);
