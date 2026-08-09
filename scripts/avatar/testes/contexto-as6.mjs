// testes/contexto-as6.mjs — lote 951–960 (decisão #97, flag
// as6.contexto): Workspace Context Engine (AS6 §323–§325).
//   A) flag ON (shell novo): trocar de categoria é UMA mudança
//      coordenada — busca antiga limpa, aba do catálogo volta a Todos,
//      grupo relevante do Inspector abre (cabelo → Cores; acessório →
//      Compatibilidade), aria-live anuncia o contexto.
//   B) rollback §651: flag OFF = troca de categoria anterior byte a
//      byte (busca e aba PERSISTEM; nada de anúncio de contexto).
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const irCategoria = async (p, nome) => {
  await p.evaluate((n) => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes(n))?.click(); }, nome);
  await p.waitForTimeout(450);
};
const escreverBusca = async (p, texto) => {
  await p.evaluate((t) => {
    const input = document.querySelector('input[aria-label="Buscar itens"]');
    if (!input) return;
    const setar = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setar.call(input, t);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, texto);
  await p.waitForTimeout(350);
};
const lerBusca = (p) => p.evaluate(() => document.querySelector('input[aria-label="Buscar itens"]')?.value ?? null);
const abrirPropriedades = async (p) => {
  await p.evaluate(() => { document.querySelector('button[title="Cores e propriedades"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await p.waitForTimeout(400);
};

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await abrirPropriedades(p);
    // suja o ambiente: busca + aba Favoritos
    await escreverBusca(p, 'neon');
    await p.evaluate(() => { [...document.querySelectorAll('[role="tab"]')].find((x) => x.textContent.includes('Favoritos'))?.click(); });
    await p.waitForTimeout(300);
    // troca de categoria → contexto coordenado (§323–§325)
    await irCategoria(p, 'Cabelo');
    ok(await lerBusca(p) === '', `busca não limpou na troca de contexto (veio "${await lerBusca(p)}")`);
    const abaOn = await p.evaluate(() => [...document.querySelectorAll('[role="tab"]')].find((x) => x.getAttribute('aria-selected') === 'true')?.textContent ?? '');
    ok(abaOn.includes('Todos'), `aba deveria voltar a Todos (veio "${abaOn}")`);
    ok(await p.locator('[data-teste="insp-corpo-cores"]').count() === 1,
      'cabelo deveria chegar com o grupo Cores aberto no Inspector (§323)');
    // anúncio no aria-live
    const anuncio = await p.evaluate(() => document.querySelector('[aria-live]')?.textContent ?? '');
    ok(anuncio.includes('Cabelo'), `aria-live sem o anúncio de contexto (veio "${anuncio}")`);
    // outro contexto: acessório → Compatibilidade
    await irCategoria(p, 'Acessório');
    ok(await p.locator('[data-teste="insp-corpo-compatibilidade"]').count() === 1,
      'acessório deveria chegar com Compatibilidade aberta (§323)');
    await p.screenshot({ path: `${SAIDA}/contexto-as6.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false, 'as6.contexto': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await escreverBusca(p, 'neon');
    await p.evaluate(() => { [...document.querySelectorAll('[role="tab"]')].find((x) => x.textContent.includes('Favoritos'))?.click(); });
    await p.waitForTimeout(300);
    await irCategoria(p, 'Cabelo');
    ok(await lerBusca(p) === 'neon', 'flag OFF deveria PRESERVAR a busca (§651)');
    const abaOff = await p.evaluate(() => [...document.querySelectorAll('[role="tab"]')].find((x) => x.getAttribute('aria-selected') === 'true')?.textContent ?? '');
    ok(abaOff.includes('Favoritos'), 'flag OFF deveria preservar a aba (§651)');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[contexto-as6] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[contexto-as6] FALHAS: nenhuma');
console.log('[contexto-as6] ERROS JS: nenhum');
