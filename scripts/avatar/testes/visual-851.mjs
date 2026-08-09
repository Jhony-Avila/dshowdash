// testes/visual-851.mjs — mega onda visual 851–880 (decisão #88):
// paineis_cards + sidebar_pro + visual_v2.
//   A) flags ON (padrão): Presets no inferior em GRADE (>1 card por
//      linha); toggle da sidebar existe, alterna para só-ícones (coluna
//      ≤80px, labels ocultos, tooltip), persiste no reload; shell com
//      [data-visual2];
//   B) rollback §651: cada flag OFF desfaz o próprio efeito.
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const irParaAba = async (p, nome) => {
  await p.evaluate((n) => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === n)?.click(); }, nome);
  await p.waitForTimeout(700);
};

// ── A) flags ON ─────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.classico_aaa': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('.avst-shell[data-visual2]').count() === 1, 'shell sem [data-visual2] com a flag ON');
    // paineis_cards: Presets em grade (2+ cards na primeira linha)
    await irParaAba(p, 'Presets');
    ok(await p.locator('[data-teste="aaa-inferior"][data-cards]').count() === 1, 'inferior sem [data-cards]');
    const grade = await p.evaluate(() => {
      const cards = [...document.querySelectorAll('.avst-inferior .avst-preset')];
      if (cards.length < 2) return { total: cards.length, mesmaLinha: 0 };
      const y0 = cards[0].getBoundingClientRect().y;
      return { total: cards.length, mesmaLinha: cards.filter((c) => Math.abs(c.getBoundingClientRect().y - y0) < 4).length };
    });
    ok(grade.total >= 4, `poucos presets renderizados (${grade.total})`);
    ok(grade.mesmaLinha >= 2, `presets deveriam formar GRADE (${grade.mesmaLinha} na 1ª linha)`);
    // sidebar_pro: toggle → só-ícones
    ok(await p.locator('[data-teste="sidebar-toggle"]').count() === 1, 'toggle da sidebar ausente');
    const antes = await p.evaluate(() => document.querySelector('.avst-categorias').getBoundingClientRect().width);
    await p.locator('[data-teste="sidebar-toggle"]').click();
    await p.waitForTimeout(400);
    const depois = await p.evaluate(() => document.querySelector('.avst-categorias').getBoundingClientRect().width);
    ok(depois < 90 && depois < antes, `sidebar não encolheu (${antes} → ${depois})`);
    ok(await p.locator('.avst-corpo[data-sicones]').count() === 1, 'corpo sem [data-sicones] no modo ícones');
    const tooltip = await p.locator('.avst-cat[title]').count();
    ok(tooltip >= 5, `tooltips ausentes no modo ícones (${tooltip})`);
    // persiste no reload
    await irParaHarness(p, 'avst-harness.html', 1000);
    ok(await p.locator('.avst-corpo[data-sicones]').count() === 1, 'modo só-ícones não persistiu no reload');
    await p.locator('[data-teste="sidebar-toggle"]').click(); // volta ao normal
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${SAIDA}/visual-851.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 por flag ───────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({
        'as5.novo_shell': false, 'as5.classico_aaa': true,
        'as6.paineis_cards': false, 'as6.sidebar_pro': false, 'as6.visual_v2': false,
      }));
      localStorage.setItem('dshow.avst6.sidebar.v1', 'icones'); // não pode vazar
    },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('.avst-shell[data-visual2]').count() === 0, 'visual_v2 OFF mas o atributo apareceu');
    ok(await p.locator('[data-teste="sidebar-toggle"]').count() === 0, 'sidebar_pro OFF mas o toggle apareceu');
    ok(await p.locator('.avst-corpo[data-sicones]').count() === 0, 'preferência de ícones vazou com a flag OFF');
    await irParaAba(p, 'Presets');
    ok(await p.locator('[data-teste="aaa-inferior"][data-cards]').count() === 0, 'paineis_cards OFF mas [data-cards] apareceu');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS visual-851:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('visual-851 OK');
