// testes/virtual-as6.mjs — lote 1011–1020 (decisão #103, flag
// as6.virtual): VIRTUALIZAÇÃO REAL da grade (AS6 Parte 9; §276 v2).
//   A) flag ON (shell novo, Cabelo = 50 itens): rolar até o fim promove
//      os esqueletos (comportamento §276 de sempre); VOLTAR ao topo faz
//      os cards LONGE reciclarem para esqueleto (janela deslizante) —
//      DOM devolvido em grade grande; os primeiros cards (na tela)
//      seguem reais.
//   B) rollback §651: flag OFF = promoção one-way byte a byte (depois
//      de rolar tudo, zero esqueletos para sempre).
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const prepararCabelo = async (p) => {
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
  await p.waitForTimeout(900);
};
const rolar = async (p, alvo) => {
  await p.evaluate((y) => {
    const el = document.querySelector('.avst5-painel-scroll');
    if (el) el.scrollTop = y === 'fim' ? el.scrollHeight : 0;
  }, alvo);
  await p.waitForTimeout(900);
};
const adiados = (p) => p.locator('[data-teste="card-adiado"]').count();

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await prepararCabelo(p);
    ok(await adiados(p) > 0, 'sanidade §276: deveria haver esqueletos no início');
    const ultimoEhAdiado = () => p.evaluate(() => {
      const cards = [...document.querySelectorAll('.avst5-painel .avst-card')];
      return cards[cards.length - 1]?.dataset.teste === 'card-adiado';
    });
    // fim: o ÚLTIMO card promove (janela chegou nele)
    await rolar(p, 'fim');
    await p.waitForTimeout(600);
    ok(!(await ultimoEhAdiado()), 'no fim o último card deveria ser REAL');
    // topo: o último card RECICLA de volta a esqueleto (§276 v2 — duas vias)
    await rolar(p, 'topo');
    await p.waitForTimeout(1400);
    ok(await ultimoEhAdiado(), 'no topo o último card deveria RECICLAR p/ esqueleto (janela deslizante)');
    // os primeiros cards (na tela) seguem REAIS
    const primeiroAdiado = await p.evaluate(() => {
      const cards = [...document.querySelectorAll('.avst5-painel .avst-card')];
      return cards.findIndex((c) => c.dataset.teste === 'card-adiado');
    });
    ok(primeiroAdiado >= 20, `cards do topo nunca reciclam (primeiro esqueleto no índice ${primeiroAdiado})`);
    // e reaproximar promove de novo (janela desliza nos dois sentidos)
    await rolar(p, 'fim');
    await p.waitForTimeout(600);
    ok(!(await ultimoEhAdiado()), 'reaproximar deveria promover o último de novo');
    await p.screenshot({ path: `${SAIDA}/virtual-as6.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false, 'as6.virtual': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await prepararCabelo(p);
    await rolar(p, 'fim');
    await p.waitForTimeout(600);
    const realNoFim = await p.evaluate(() => {
      const cards = [...document.querySelectorAll('.avst5-painel .avst-card')];
      return cards[cards.length - 1]?.dataset.teste !== 'card-adiado';
    });
    ok(realNoFim, 'sanidade OFF: último card deveria promover no fim');
    await rolar(p, 'topo');
    await p.waitForTimeout(1400);
    const aindaReal = await p.evaluate(() => {
      const cards = [...document.querySelectorAll('.avst5-painel .avst-card')];
      return cards[cards.length - 1]?.dataset.teste !== 'card-adiado';
    });
    ok(aindaReal, 'flag OFF reciclou o último card (§651 — promoção deveria ser one-way)');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[virtual-as6] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[virtual-as6] FALHAS: nenhuma');
console.log('[virtual-as6] ERROS JS: nenhum');
