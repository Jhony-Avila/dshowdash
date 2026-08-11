// testes/corpo-preview.mjs — onda 1294 (decisão #137, flag
// as6.corpo_preview): nas categorias de VESTUÁRIO (Roupa/Sobrepeça) e
// no preset manual "Corpo", o preview e as thumbs usam o render de
// CORPO INTEIRO 240×400 do motor (goldens g09/g16 já o cobriam).
//   A) flag ON (padrão): Roupa → palco e thumbs com viewBox 240×400,
//      card inteiro dentro da dock; Sobrepeça idem; preset Rosto segue
//      MANDANDO no busto (zoom intencional); preset Corpo → 240×400 em
//      qualquer categoria; Olhos volta ao busto com o foco §39.19.
//   B) rollback §651: flag OFF = busto byte a byte (viewBox 240×240 e
//      foco de thumb "30 70 180 170" na Roupa).
// @version 1.0.0  @created 2026-08-10
import { abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };
const clicarCat = (p, nome) => p.evaluate((n) => {
  [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes(n))?.click();
}, nome);

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await clicarCat(p, 'Roupa');
    await p.waitForTimeout(800);
    const roupa = await p.evaluate(() => {
      const dock = document.querySelector('.avst5-painel').getBoundingClientRect();
      const card = document.querySelector('.avst5-painel .avst-card')?.getBoundingClientRect();
      return {
        palcoVB: document.querySelector('.avst5-zoom svg')?.getAttribute('viewBox'),
        thumbVB: document.querySelector('.avst5-painel .avst-card .avst-card-thumb svg')?.getAttribute('viewBox'),
        attr: !!document.querySelector('.avst5-viewport[data-corpo]'),
        thumbAttr: !!document.querySelector('.avst-card-thumb[data-corpo]'),
        cardDentro: !!card && card.bottom <= dock.bottom + 1,
      };
    });
    ok(roupa.palcoVB === '0 0 240 400', `Roupa: palco deveria ser corpo 240×400 (veio ${roupa.palcoVB})`);
    // onda 1296 (#139): thumb de vestuário CROPADA na figura (peça legível)
    ok(roupa.thumbVB === '38 20 164 372', `Roupa: thumb deveria cropar a figura (veio ${roupa.thumbVB})`);
    ok(roupa.attr && roupa.thumbAttr, 'Roupa: atributos data-corpo ausentes');
    ok(roupa.cardDentro, 'Roupa: card de corpo inteiro CORTADO na dock');
    // Sobrepeça também é vestuário
    await clicarCat(p, 'Sobrepeça');
    await p.waitForTimeout(800);
    ok(await p.evaluate(() => document.querySelector('.avst5-zoom svg')?.getAttribute('viewBox')) === '0 0 240 400',
      'Sobrepeça: palco deveria ser corpo 240×400');
    await clicarCat(p, 'Roupa');
    await p.waitForTimeout(600);
    // preset Rosto MANDA no busto (zoom intencional nunca sobrescrito)
    await p.locator('[data-teste="cam6-rosto"]').click();
    await p.waitForTimeout(600);
    const rosto = await p.evaluate(() => ({
      vb: document.querySelector('.avst5-zoom svg')?.getAttribute('viewBox'),
      attr: !!document.querySelector('.avst5-viewport[data-corpo]'),
      escala: (() => { const m = getComputedStyle(document.querySelector('.avst5-zoom')).transform; return m.startsWith('matrix') ? Number(m.slice(7).split(',')[0]) : 1; })(),
    }));
    ok(rosto.vb === '0 0 240 240' && !rosto.attr, `preset Rosto deveria voltar ao busto (veio ${rosto.vb})`);
    ok(rosto.escala > 1.2, `preset Rosto deveria aproximar (escala=${rosto.escala.toFixed(2)})`);
    // preset Corpo = corpo inteiro em QUALQUER categoria
    await p.locator('[data-teste="cam6-corpo"]').click();
    await p.waitForTimeout(600);
    ok(await p.evaluate(() => document.querySelector('.avst5-zoom svg')?.getAttribute('viewBox')) === '0 0 240 400',
      'preset Corpo deveria dar corpo inteiro');
    await clicarCat(p, 'Olhos');
    await p.waitForTimeout(700);
    ok(await p.evaluate(() => document.querySelector('.avst5-zoom svg')?.getAttribute('viewBox')) === '0 0 240 400',
      'preset Corpo deveria persistir fora do vestuário');
    // Auto: Olhos volta ao busto e thumb com foco §39.19
    await p.locator('[data-teste="cam6-auto"]').click();
    await p.waitForTimeout(600);
    const olhos = await p.evaluate(() => ({
      palcoVB: document.querySelector('.avst5-zoom svg')?.getAttribute('viewBox'),
      thumbVB: document.querySelector('.avst5-painel .avst-card .avst-card-thumb svg')?.getAttribute('viewBox'),
    }));
    ok(olhos.palcoVB === '0 0 240 240', `Olhos: palco deveria ser busto (veio ${olhos.palcoVB})`);
    ok(olhos.thumbVB === '64 56 112 112', `Olhos: thumb deveria manter o foco §39.19 (veio ${olhos.thumbVB})`);
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651: flag OFF = busto byte a byte ──────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.corpo_preview': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await clicarCat(p, 'Roupa');
    await p.waitForTimeout(800);
    const g = await p.evaluate(() => ({
      palcoVB: document.querySelector('.avst5-zoom svg')?.getAttribute('viewBox'),
      thumbVB: document.querySelector('.avst5-painel .avst-card .avst-card-thumb svg')?.getAttribute('viewBox'),
      attr: !!document.querySelector('.avst5-viewport[data-corpo]'),
      thumbAttr: !!document.querySelector('.avst-card-thumb[data-corpo]'),
    }));
    ok(g.palcoVB === '0 0 240 240', `OFF: palco deveria ser busto (veio ${g.palcoVB})`);
    ok(g.thumbVB === '30 70 180 170', `OFF: thumb deveria manter o foco anterior (veio ${g.thumbVB})`);
    ok(!g.attr && !g.thumbAttr, 'OFF: atributos data-corpo deveriam sumir');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[corpo-preview] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[corpo-preview] FALHAS: nenhuma');
console.log('[corpo-preview] ERROS JS: nenhum');
