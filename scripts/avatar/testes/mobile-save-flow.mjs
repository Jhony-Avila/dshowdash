// TRACK C Marco 5: fluxo de salvar no celular — barra inferior fixa, alcançável.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  // faz uma alteração (equipa um card) → pendente
  await pagina.evaluate(() => { const c = [...document.querySelectorAll('.avst-card')].find((x) => !x.classList.contains('avst-card-ativo')); c?.scrollIntoView({ block: 'center' }); c?.click(); });
  await pagina.waitForTimeout(600);
  const s = await pagina.evaluate(() => {
    const bar = document.querySelector('.avst5-salvar');
    const cs = bar ? getComputedStyle(bar) : null;
    const r = bar ? bar.getBoundingClientRect() : null;
    const prim = document.querySelector('.avst5-salvar .avst-botao-primario');
    const rp = prim ? prim.getBoundingClientRect() : null;
    return {
      temBarra: !!bar, fixed: cs ? cs.position === 'fixed' : false,
      noFundo: r ? Math.abs(r.bottom - window.innerHeight) < 3 : false,
      pendente: !!document.querySelector('.avst5-salvar-pendente'),
      temSalvar: !!prim, salvarPx: rp ? Math.round(rp.height) : 0,
      salvarVisivel: rp ? (rp.top < window.innerHeight && rp.bottom > 0) : false,
    };
  });
  console.log('  barra:', JSON.stringify(s));
  ok(s.temBarra && s.fixed, 'barra de salvar é fixa (posição de ação inferior)');
  ok(s.noFundo, 'barra ancorada ao fundo da tela');
  ok(s.pendente, 'estado "alterações pendentes" indicado');
  ok(s.temSalvar && s.salvarPx >= 44 && s.salvarVisivel, `botão salvar alcançável ≥44px e visível (${s.salvarPx})`);
  // salva
  await pagina.evaluate(() => document.querySelector('.avst5-salvar .avst-botao-primario')?.click());
  await pagina.waitForTimeout(1200);
  const depois = await pagina.evaluate(() => ({ salvo: !document.querySelector('.avst5-salvar-pendente'), erro: !!document.querySelector('.avst5-salvar-erro') }));
  ok(!depois.erro, 'salvar sem erro (backend mock chamado)');
  ok(depois.salvo, 'após salvar, deixa de estar pendente (persistiu)');
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-save-flow: ${falhas} falha(s)` : '\n✓ mobile-save-flow verde');
process.exit(falhas ? 1 : 0);
