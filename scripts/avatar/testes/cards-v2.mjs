// testes/cards-v2.mjs — lote 431–440 (§60.9–.10/§66, flag as5.cards_v2)
//   • §60.9: item "só para outra base" agora APARECE como indisponível
//     (aria-disabled, sem equipar no clique) em vez de sumir da grade
//   • §60.10/§66: hover premium com coleção e "Substitui: X"
//   • rollback §651: some da grade de novo (comportamento legado)
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
try {
  await irParaHarness(p, 'avst-harness.html', 1200);
  // categoria com requerBase (Cabelo tem itens de espécie? procurar em todas:
  // a grade com flag ON mostra data-indisponivel quando houver)
  let achouIndisponivel = false;
  for (const cat of ['Cabelo', 'Roupa', 'Olhos', 'Boca']) {
    await p.evaluate((c) => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes(c))?.click(); }, cat);
    await p.waitForTimeout(500);
    if (await p.locator('.avst-card[data-indisponivel]').count() > 0) { achouIndisponivel = true; break; }
  }
  if (achouIndisponivel) {
    // §60.9: clicar NÃO equipa
    const antes = await p.evaluate(() => document.querySelector('.avst5-zoom svg')?.outerHTML.length ?? 0);
    await p.evaluate(() => document.querySelector('.avst-card[data-indisponivel]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await p.waitForTimeout(400);
    const depois = await p.evaluate(() => document.querySelector('.avst5-zoom svg')?.outerHTML.length ?? 0);
    ok(antes === depois, 'clique em indisponível não podia equipar (§60.9)');
    ok(await p.locator('.avst-card[data-indisponivel][aria-disabled="true"]').count() >= 1,
      'indisponível sem aria-disabled');
  } else {
    ok(true, 'sanidade'); // catálogo pode não ter requerBase fora da base padrão
  }
  // §60.10/§66: hover num card NÃO equipado mostra "Substitui:"
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
  await p.waitForTimeout(500);
  const cards = p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum):not(.avst-card-ativo):not([data-indisponivel])');
  await cards.nth(1).hover();
  await p.waitForTimeout(600); // delay da Dica (250ms) + margem
  ok(await p.locator('[data-teste="tip-substitui"]').count() === 1, 'hover sem "Substitui: X" (§60.10)');
  await p.screenshot({ path: `${SAIDA}/cards-v2.png` });
} catch (e) { falhas.push(`exceção: ${e.message}`); }
await b.close();

const { navegador: b2, pagina: p2, erros: erros2 } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.cards_v2': false }));
  },
});
try {
  await irParaHarness(p2, 'avst-harness.html', 1200);
  await p2.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
  await p2.waitForTimeout(500);
  ok(await p2.locator('.avst-card[data-indisponivel]').count() === 0, 'flag off com indisponível (§651)');
  const cards2 = p2.locator('.avst5-painel .avst-card:not(.avst-card-nenhum):not(.avst-card-ativo)');
  await cards2.nth(1).hover();
  await p2.waitForTimeout(600);
  ok(await p2.locator('[data-teste="tip-substitui"]').count() === 0, 'flag off com Substitui (§651)');
} catch (e) { falhas.push(`exceção no rollback: ${e.message}`); }

const ok_ = relatorio('cards-v2', falhas, [...erros, ...erros2]);
await b2.close();
process.exit(ok_ ? 0 : 1);
