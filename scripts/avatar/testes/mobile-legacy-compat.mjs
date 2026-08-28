// testes/mobile-legacy-compat.mjs — TRACK C Marco 6: avatar LEGADO abre, renderiza,
// edita e salva NA COMPOSIÇÃO MOBILE (mesmo store/motor/save; só o layout muda).
import { abrir, irParaHarness } from './navegador.mjs';
const LEGADO = { formato: 'camadas', versao: 1, base: 'bas_classica', camadas: {}, cores: { pele: '#e0b48a', cabelo: '#3b2a1a', roupa: '#3a5cbf', destaque: '#ffcc00' } };
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const { navegador, pagina, erros } = await abrir({
  viewport: { width: 390, height: 844 },
  init: (arg) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(arg.flags)); localStorage.setItem('avst.harness.config', JSON.stringify(arg.legado)); } catch {} },
  initArg: { flags: FLAGS, legado: LEGADO },
});
try {
  await irParaHarness(pagina, 'avst-harness.html', 1200);
  const base = await pagina.evaluate(() => {
    const shell = document.querySelector('.avst5-shell'); const s = document.querySelector('.avst5-palco svg, .avst5-palco-premium svg');
    return { dataMobile: shell?.getAttribute('data-mobile'), temPalco: !!document.querySelector('.avst5-palco'), nos: s ? s.querySelectorAll('*').length : 0, docScrollW: document.documentElement.scrollWidth, innerW: window.innerWidth };
  });
  ok(base.dataMobile === '1' && base.temPalco, 'legado abre no MESMO shell 2D, agora em composição mobile');
  ok(base.nos > 5, `aparência preservada: palco renderiza o legado (${base.nos} nós svg)`);
  ok(base.docScrollW <= base.innerW + 1, 'sem overflow horizontal com avatar legado');
  // edita + salva
  await pagina.evaluate(() => { window.__api = []; const f = window.fetch; window.fetch = (u, o) => { const s = String(u instanceof Request ? u.url : u); if (s.includes('/api/')) window.__api.push(`${(o && o.method) || 'GET'} ${s}`); return f(u, o); }; });
  await pagina.evaluate(() => { const b = [...document.querySelectorAll('.avst5-sidebar .avst5-cat')].find((x) => (x.textContent||'').trim().startsWith('Cabelo')); b?.scrollIntoView({inline:'center'}); b?.click(); });
  await pagina.waitForTimeout(500);
  await pagina.evaluate(() => { const c = [...document.querySelectorAll('.avst5-painel .avst-card')].filter((x) => !x.className.includes('avst-card-ativo'))[1]; c?.scrollIntoView({block:'center'}); c?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await pagina.waitForTimeout(500);
  const btn = pagina.locator('.avst5-salvar button', { hasText: /salvar/i });
  if (await btn.count()) { await btn.first().click(); await pagina.waitForTimeout(800); const api = await pagina.evaluate(() => window.__api); ok(api.some((c) => c.startsWith('POST') && (c.includes('studio.php') || c.includes('estado.php'))), `save do legado válido no mobile (POST: ${api.filter((c)=>c.startsWith('POST')).slice(-1)[0] || 'nenhum'})`); }
  else ok(false, 'barra de salvar ausente');
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-legacy-compat: ${falhas} falha(s)` : '\n✓ mobile-legacy-compat verde');
process.exit(falhas ? 1 : 0);
