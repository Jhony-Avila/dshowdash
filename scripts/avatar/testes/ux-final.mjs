// testes/ux-final.mjs — lote 591–600 (§59.1/§60.4/§64.2/§545, flag
// as5.ux_final): CARDS/UX FINAL.
//   A) §64.2: hover → badge Prévia no palco → Fixar segura a prévia
//      (hover em outro card não mexe) → Soltar restaura;
//   B) §60.4: card sob preview ganha badge "Prévia";
//   C) §59.1: grade compacta v2 — imagem ocupa 70–80% do card;
//   D) rollback §651.
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A+B+C ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false }));
      localStorage.setItem('dshow.avatar.grade.modo.v1', 'compacta');
    },
  });
  await irParaHarness(p, 'avst-harness.html', 1200);
  const svgPalco = () => p.evaluate(() => document.querySelector('.avst5-zoom svg')?.outerHTML ?? '');

  // categoria com vários itens equipáveis
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
  await p.waitForTimeout(600);
  const antes = await svgPalco();

  // §64.2 + §60.4: hover → preview no palco + badges
  const cards = p.locator('.avst-card:not(.avst-card-adiado):not(.avst-card-ativo)');
  await cards.nth(1).hover();
  await p.waitForTimeout(300);
  ok(await p.locator('[data-teste="card-previa"]').count() === 1, 'badge Prévia no CARD ausente (§60.4)');
  ok(await p.locator('[data-teste="previa-badge"]').count() === 1, 'badge de prévia no PALCO ausente (§64.2)');
  const comPreview = await svgPalco();
  ok(comPreview !== antes, 'hover não aplicou o preview no palco (§64)');

  // fixar: prévia SEGURA mesmo com hover em outro card
  await p.locator('[data-teste="previa-fixar"]').click();
  await p.waitForTimeout(200);
  ok((await p.locator('[data-teste="previa-badge"]').textContent())?.includes('fixada'), 'fixar não marcou a prévia (§64.2)');
  const fixada = await svgPalco();
  await cards.nth(2).hover();
  await p.waitForTimeout(500);
  ok(await svgPalco() === fixada, 'prévia fixada não deveria mudar com hover em outro card (§64.2)');

  // soltar restaura o estado real
  await p.locator('[data-teste="previa-soltar"]').click();
  await p.waitForTimeout(400);
  ok(await p.locator('[data-teste="previa-badge"]').count() === 0, 'soltar não removeu o badge (§64.2)');
  ok(await svgPalco() === antes, 'soltar não restaurou o palco (§64.2)');

  // §59.1: na compacta v2 a imagem ocupa 70–80% da altura do card
  const prop = await p.evaluate(() => {
    // só cards RENDERIZADOS no viewport (content-visibility: auto reporta
    // o placeholder p/ os de fora); linhas com vizinho mais alto esticam
    // (grid stretch) — o card TÍPICO é o de MAIOR proporção
    const ratios = [...document.querySelectorAll('.avst-grade[data-uxfinal][data-modo="compacta"] .avst-card:not(.avst-card-adiado):not(.avst-card-nenhum)')]
      .filter((c) => { const r = c.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; })
      .map((c) => {
        const thumb = c.querySelector('.avst-card-thumb');
        return thumb ? thumb.getBoundingClientRect().height / c.getBoundingClientRect().height : 0;
      });
    return ratios.length ? Math.max(...ratios) : null;
  });
  ok(prop !== null, 'grade compacta v2 não achada (data-uxfinal §59.1)');
  ok(prop === null || (prop >= 0.62 && prop <= 0.85), `imagem deveria ocupar ~70–80% do card (veio ${(prop * 100).toFixed(0)}%)`);
  await p.screenshot({ path: `${SAIDA}/ux-final.png` });
  ok(erros.length === 0, `erros de página: ${erros.join(' | ')}`);
  await b.close();
}

// ── D) rollback §651 ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false, 'as5.ux_final': false }));
    },
  });
  await irParaHarness(p, 'avst-harness.html', 1200);
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
  await p.waitForTimeout(600);
  const cards = p.locator('.avst-card:not(.avst-card-adiado):not(.avst-card-ativo)');
  await cards.nth(1).hover();
  await p.waitForTimeout(300);
  ok(await p.locator('[data-teste="previa-badge"]').count() === 0, 'flag off com badge de prévia (§651)');
  ok(await p.locator('[data-teste="card-previa"]').count() === 0, 'flag off com badge no card (§651)');
  ok(await p.locator('.avst-grade[data-uxfinal]').count() === 0, 'flag off com grade v2 (§651)');
  ok(erros.length === 0, `erros de página (rollback): ${erros.join(' | ')}`);
  await b.close();
}

if (falhas.length) { console.error('FALHAS ux-final:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('ux-final OK');
