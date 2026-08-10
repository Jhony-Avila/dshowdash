// testes/layouts-as6.mjs — lote 1251–1260 (decisão #128, flag
// as6.layouts): layouts nomeados do workspace (AS6 Parte 1).
//   A) flag ON: a paleta ganha os 6 comandos (A/B/C salvar/aplicar);
//      salvar guarda a geometria atual; mudar a altura da dock e
//      APLICAR restaura (altura volta + storage canônico); aplicar
//      slot vazio anuncia sem quebrar.
//   B) rollback §651: flag OFF = comandos ausentes da paleta.
// @version 1.0.0  @created 2026-08-10
import { abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const rodarComando = async (p, texto) => {
  await p.keyboard.press('Control+k');
  await p.waitForTimeout(400);
  await p.keyboard.type(texto);
  await p.waitForTimeout(400);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(500);
};
const estadoDock = (p) => p.evaluate(() => document.querySelector('.avst5-painel')?.dataset.dockEstado);

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    // aplicar slot vazio anuncia e não quebra
    await rodarComando(p, 'Layout B: aplicar');
    ok(await p.evaluate(() => document.body.textContent.includes('está vazio')), 'slot vazio deveria anunciar');
    // salva a geometria atual (padrão) no slot A
    ok((await estadoDock(p)) === 'padrao', 'estado inicial deveria ser padrão');
    await rodarComando(p, 'Layout A: salvar');
    const salvo = await p.evaluate(() => JSON.parse(localStorage.getItem('dshow.avst6.layouts.v1') ?? '{}'));
    ok(salvo.A && salvo.A.dock === 'padrao' && typeof salvo.A.esq === 'number', `slot A não gravou (${JSON.stringify(salvo)})`);
    // muda a altura p/ expandida e APLICA o layout A → volta a padrão
    await p.locator('[data-teste="dock-altura"]').click();
    await p.waitForTimeout(500);
    ok((await estadoDock(p)) === 'expandida', 'altura não expandiu');
    await rodarComando(p, 'Layout A: aplicar');
    await p.waitForTimeout(400);
    ok((await estadoDock(p)) === 'padrao', `aplicar A deveria restaurar padrão (${await estadoDock(p)})`);
    ok(await p.evaluate(() => localStorage.getItem('dshow.avst6.dockinf.v1')) === 'padrao',
      'storage canônico da dock não acompanhou o layout');
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.layouts': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.keyboard.press('Control+k');
    await p.waitForTimeout(400);
    await p.keyboard.type('Layout A');
    await p.waitForTimeout(400);
    ok((await p.evaluate(() => document.body.textContent.includes('Layout A: salvar'))) === false,
      'flag OFF ainda expõe comandos de layout');
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[layouts-as6] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[layouts-as6] FALHAS: nenhuma');
console.log('[layouts-as6] ERROS JS: nenhum');
