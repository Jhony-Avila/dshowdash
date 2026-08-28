// TRACK C Marco 5: mudança de orientação sem perder estado/seleção.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const { navegador, pagina, erros } = await abrir({ viewport: { width: 390, height: 844 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  // escolhe Cabelo + equipa um card (estado/edição pendente)
  await pagina.evaluate(() => { const b = [...document.querySelectorAll('.avst5-sidebar .avst5-cat')].find((x) => (x.textContent||'').trim().startsWith('Cabelo')); b?.scrollIntoView({inline:'center'}); b?.click(); });
  await pagina.waitForTimeout(400);
  await pagina.evaluate(() => { const c = [...document.querySelectorAll('.avst-card')].find((x) => !x.classList.contains('avst-card-ativo')); c?.scrollIntoView({block:'center'}); c?.click(); });
  await pagina.waitForTimeout(400);
  const antes = await pagina.evaluate(() => ({ cat: document.querySelector('.avst5-cat-on')?.textContent?.trim(), pendente: !!document.querySelector('.avst5-salvar-pendente') }));
  // ROTACIONA p/ paisagem
  await pagina.setViewportSize({ width: 844, height: 390 });
  await pagina.waitForTimeout(600);
  const depois = await pagina.evaluate(() => ({
    dataMobile: document.querySelector('.avst5-shell')?.getAttribute('data-mobile'),
    cat: document.querySelector('.avst5-cat-on')?.textContent?.trim(),
    pendente: !!document.querySelector('.avst5-salvar-pendente'),
    temSvg: !!document.querySelector('.avst5-palco svg'),
    docScrollW: document.documentElement.scrollWidth, innerW: window.innerWidth,
  }));
  console.log('  antes', JSON.stringify(antes), 'depois', JSON.stringify(depois));
  ok(depois.dataMobile === '1', 'segue em composição mobile na paisagem (altura baixa)');
  ok(depois.cat === antes.cat, `categoria preservada na rotação (${antes.cat})`);
  ok(depois.pendente === antes.pendente && depois.pendente, 'edição pendente preservada na rotação (sem perda de estado)');
  ok(depois.temSvg, 'palco renderiza na paisagem');
  ok(depois.docScrollW <= depois.innerW + 1, 'sem overflow horizontal na paisagem');
  ok(erros.length === 0, 'sem erros JS');
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-orientation-change: ${falhas} falha(s)` : '\n✓ mobile-orientation-change verde');
process.exit(falhas ? 1 : 0);
