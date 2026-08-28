// testes/mobile-small-screen-320.mjs — TRACK C cert: menor viewport suportado
// (320×568, iPhone SE 1ª geração). Nada pode estourar, sumir ou ficar
// inalcançável no pior caso de largura. Flag as6.mobile_studio ON.
import { abrir, irParaHarness } from './navegador.mjs';
const FLAGS = { 'as5.novo_shell': true, 'as6.single_2d': true, 'as6.dock_inferior': true, 'as6.mobile_studio': true };
let falhas = 0; const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

const { navegador, pagina, erros } = await abrir({ viewport: { width: 320, height: 568 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  const m = await pagina.evaluate(() => {
    const shell = document.querySelector('.avst5-shell[data-mobile]');
    const palco = document.querySelector('.avst5-palco');
    const rp = palco?.getBoundingClientRect();
    const cats = [...document.querySelectorAll('.avst5-sidebar .avst5-cat')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0; });
    const menorCat = cats.length ? Math.min(...cats.map((el) => { const r = el.getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)); })) : 0;
    const painel = document.querySelector('.avst5-painel');
    const cs = painel ? getComputedStyle(painel) : null;
    return {
      mobile: !!shell,
      docScrollW: document.documentElement.scrollWidth, innerW: window.innerWidth,
      palcoVisivel: !!rp && rp.height > 120 && rp.top < window.innerHeight && rp.width <= window.innerWidth + 1,
      nCats: cats.length, menorCat,
      painelScroll: cs ? (cs.overflowY === 'auto' || cs.overflowY === 'scroll') : false,
    };
  });
  console.log('  320:', JSON.stringify(m));
  ok(m.mobile, 'composição mobile ativa em 320px');
  ok(m.docScrollW <= m.innerW + 1, `sem overflow horizontal (scrollW ${m.docScrollW} ≤ ${m.innerW})`);
  ok(m.palcoVisivel, 'palco útil e visível, dentro da largura');
  ok(m.nCats > 0 && m.menorCat >= 44, `categorias alcançáveis ≥44px (menor ${m.menorCat}, n=${m.nCats})`);
  ok(m.painelScroll, 'catálogo com scroll próprio');
  // troca de categoria funciona no pior caso
  const trocou = await pagina.evaluate(() => {
    const b = [...document.querySelectorAll('.avst5-sidebar .avst5-cat')].find((x) => (x.textContent || '').trim().startsWith('Cabelo'));
    if (!b) return false; b.scrollIntoView({ inline: 'center' }); b.click(); return true;
  });
  await pagina.waitForTimeout(400);
  const semOverflowPos = await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  ok(trocou, 'troca de categoria por toque em 320px');
  ok(semOverflowPos, 'sem overflow horizontal após troca');
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);
} finally { await navegador.close(); }
console.log(falhas ? `\n✗ mobile-small-screen-320: ${falhas} falha(s)` : '\n✓ mobile-small-screen-320 verde');
process.exit(falhas ? 1 : 0);
