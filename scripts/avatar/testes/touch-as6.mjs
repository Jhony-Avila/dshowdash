// testes/touch-as6.mjs — lote 1031–1040 (decisão #105, flag as6.touch):
// drag&drop de asset no palco (AS6 Parte 6).
//   A) flag ON (shell novo): cards da grade são draggable; simular a
//      sequência dragover→drop no viewport com o id de um cabelo NÃO
//      equipado EQUIPA o item (comando com undo — Ctrl+Z desfaz);
//      durante o dragover o palco marca [data-soltavel] (realce).
//   B) rollback §651: flag OFF = cards sem draggable e drop inerte.
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const irCabelo = async (p) => {
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
  await p.waitForTimeout(700);
};
const svgPalco = (p) => p.evaluate(() => document.querySelector('.avst5-zoom svg')?.outerHTML ?? '');
const soltarNoPalco = async (p, id) => {
  await p.evaluate((idItem) => {
    const alvo = document.querySelector('.avst5-viewport');
    const dt = new DataTransfer();
    dt.setData('text/avst-item', idItem);
    window.__dt = dt;
    alvo?.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
  }, id);
  await p.waitForTimeout(250); // estado React → atributo no próximo render
  const marcou = await p.evaluate(() => document.querySelector('.avst5-viewport')?.hasAttribute('data-soltavel'));
  await p.evaluate(() => {
    const alvo = document.querySelector('.avst5-viewport');
    alvo?.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: window.__dt }));
  });
  return marcou ? 'ok' : 'sem realce';
};

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irCabelo(p);
    ok(await p.locator('.avst5-painel .avst-card[draggable="true"]').count() > 0,
      'cards deveriam ser draggable com a flag ON');
    // escolhe um cabelo NÃO equipado direto do card
    const alvo = await p.evaluate(() => {
      const c = [...document.querySelectorAll('.avst5-painel .avst-card[draggable="true"]')]
        .find((x) => !x.className.includes('avst-card-ativo'));
      return c?.querySelector('.avst-card-nome')?.textContent ?? null;
    });
    ok(!!alvo, 'nenhum card não-equipado encontrado');
    // id real via drag do próprio card? mais simples: cab_moicano é do catálogo
    const antes = await svgPalco(p);
    const r = await soltarNoPalco(p, 'cab_moicano');
    await p.waitForTimeout(600);
    ok(r === 'ok', `dragover deveria marcar o palco como alvo (${r})`);
    const depois = await svgPalco(p);
    ok(antes !== depois, 'drop no palco deveria equipar o item (§325)');
    ok((await p.locator('.avst5-salvar').textContent())?.includes('alteraç'),
      'drop deveria virar mudança pendente (comando)');
    // é comando de verdade: undo desfaz
    await p.keyboard.press('Control+z');
    await p.waitForTimeout(500);
    ok(await svgPalco(p) === antes, 'Ctrl+Z deveria desfazer o drop');
    await p.screenshot({ path: `${SAIDA}/touch-as6.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false, 'as6.touch': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irCabelo(p);
    ok(await p.locator('.avst5-painel .avst-card[draggable="true"]').count() === 0,
      'flag OFF com cards draggable (§651)');
    const antes = await svgPalco(p);
    await soltarNoPalco(p, 'cab_moicano');
    await p.waitForTimeout(500);
    ok(await svgPalco(p) === antes, 'flag OFF com drop ativo (§651)');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[touch-as6] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[touch-as6] FALHAS: nenhuma');
console.log('[touch-as6] ERROS JS: nenhum');
