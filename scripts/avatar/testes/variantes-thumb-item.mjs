// testes/variantes-thumb-item.mjs — onda 1401 (decisão #150): FUNDAÇÃO
// de VARIANTES DE COR + thumbnails MODO ITEM (briefing de elevação §12).
//
// Seções:
//   A) Modo Item na grade de acessórios (as6.thumb_item): cards mostram
//      o ASSET isolado (data-teste="thumb-item"), toggle Item×Aplicado
//      alterna, contagem de variantes aparece no card.
//   B) Variantes no drawer de detalhes (as6.variantes): clicar uma
//      variante equipa e escreve coresCamada §73 no rascunho; "Original"
//      remove o override (rascunho volta a NÃO ter coresCamada da camada).
//   C) Registry são (Node puro, receita dos goldens): canais ⊆ usaCores,
//      ids únicos, hex válido, asset existe, e TODO acessório tem bounds
//      medidos — guarda da population 1402+.
//   D) Rollback: flags OFF ⇒ zero thumb-item, zero toggle, zero badge.
// @version 1.1.0  @created 2026-08-12
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// mesma receita do acessorios-v2.mjs (shell novo, árvore #144 na sidebar)
const FLAGS_BASE = { 'as5.novo_shell': true, 'as5.palco3d': false, 'as6.tax_v2': false };
const irCategoria = async (p, nome) => {
  await p.evaluate((n) => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes(n))?.click(); }, nome);
  await p.waitForTimeout(450);
};
const irSubcategoria = async (p, subId) => {
  await p.click(`[data-teste="arv-${subId}"]`);
  await p.waitForTimeout(500);
};
const lerRascunho = async (p) => {
  await p.waitForTimeout(1300); // autosave §139 = 800ms
  return p.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('dshow.avst5.rascunho.v1') ?? 'null'); } catch { return null; }
  });
};

// ── A) Modo Item na grade ───────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 2000, height: 1200 },
    init: (f) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); },
    initArg: FLAGS_BASE,
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irCategoria(p, 'Acess');
    await irSubcategoria(p, 'chapeus');
    const nIsolados = await p.locator('[data-teste="thumb-item"]').count();
    ok(nIsolados >= 3, `A: esperava ≥3 thumbs Modo Item em chapéus, veio ${nIsolados}`);
    // viewBox medido ≠ canvas inteiro (asset protagonista, §12)
    const vb = await p.locator('[data-teste="thumb-item"] svg').first().getAttribute('viewBox');
    ok(vb && vb !== '0 0 240 240', `A: viewBox do Modo Item deveria ser o MEDIDO, veio "${vb}"`);
    // contagem de variantes visível em pelo menos um card (ace_bone tem 4)
    const nBadges = await p.locator('[data-teste="card-variantes"]').count();
    ok(nBadges >= 1, `A: esperava badge de variantes em ≥1 card, veio ${nBadges}`);
    // toggle Item × Aplicado
    ok(await p.locator('[data-teste="modo-thumb"]').count() === 1, 'A: toggle modo-thumb ausente');
    await p.click('[data-teste="modo-thumb-aplicado"]');
    await p.waitForTimeout(400);
    ok(await p.locator('[data-teste="thumb-item"]').count() === 0,
      'A: Modo Aplicado ainda mostra thumbs isolados');
    await p.click('[data-teste="modo-thumb-item"]');
    await p.waitForTimeout(400);
    ok(await p.locator('[data-teste="thumb-item"]').count() >= 3,
      'A: voltar ao Modo Item não restaurou os thumbs isolados');
    await p.screenshot({ path: `${SAIDA}/1401-modo-item.png` });
    ok(erros.length === 0, `A: erros JS: ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`A exceção: ${e.message}`); }
  await b.close();
}

// ── B) Variantes no drawer: aplicar escreve §73, Original limpa ─────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 2000, height: 1200 },
    init: (f) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); },
    initArg: FLAGS_BASE,
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irCategoria(p, 'Acess');
    await irSubcategoria(p, 'chapeus');
    // abre o drawer de detalhes do Boné (botão §67 do card, via dispatch —
    // o botão só aparece no hover)
    await p.evaluate(() => {
      const card = [...document.querySelectorAll('.avst5-painel .avst-card')]
        .find((x) => x.querySelector('.avst-card-nome')?.textContent?.includes('Boné'));
      card?.querySelector('.avst-card-info-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await p.waitForTimeout(700);
    const secao = p.locator('[data-teste="det-variantes"]');
    ok(await secao.count() === 1, 'B: seção de variantes ausente no drawer do Boné');
    // aplica a variante Rubi → rascunho tem coresCamada da camada do boné
    await p.click('[data-teste="var-var_rubi"]');
    let rasc = await lerRascunho(p);
    let cfg = rasc?.config ?? rasc; // rascunho guarda {config,...}
    const camadaBone = cfg?.camadas
      ? Object.keys(cfg.camadas).find((c) => cfg.camadas[c] === 'ace_bone') : null;
    ok(!!camadaBone, 'B: aplicar variante não equipou o boné');
    const canais = camadaBone ? cfg?.coresCamada?.[camadaBone] : null;
    ok(!!canais && canais.roupa === '#521624' && canais.destaque === '#ff5f8f',
      `B: coresCamada §73 esperado {roupa:#521624,destaque:#ff5f8f}, veio ${JSON.stringify(canais)}`);
    // chip fica marcado como ativo (derivação, nunca persistido)
    ok(await p.locator('[data-teste="var-var_rubi"][aria-pressed="true"]').count() === 1,
      'B: variante aplicada não aparece como ativa');
    await p.screenshot({ path: `${SAIDA}/1401-variantes-drawer.png` });
    // Original → override some do rascunho (byte-stability do salvo)
    await p.click('[data-teste="var-original"]');
    rasc = await lerRascunho(p);
    cfg = rasc?.config ?? rasc;
    ok(!cfg?.coresCamada?.[camadaBone],
      `B: Original deveria REMOVER o override, sobrou ${JSON.stringify(cfg?.coresCamada?.[camadaBone])}`);
    ok(erros.length === 0, `B: erros JS: ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`B exceção: ${e.message}`); }
  await b.close();
}

// ── C) Registry são (Node puro, receita dos goldens) ────────────────
{
  const { execSync } = await import('node:child_process');
  const { mkdtempSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
  const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
  const tmp = mkdtempSync(join(tmpdir(), 'avst-vars-'));
  try {
    writeFileSync(join(tmp, 'prova.ts'), `
import { VARIANTES_POR_ASSET } from '${PAINEL}/src/services/VariantesAssets';
import { FOCO_ITEM_ASSET } from '${PAINEL}/src/components/modoItem';
import { ACESSORIOS } from '${PAINEL}/src/engine/partes/acessorios';
import { itemPorId } from '${PAINEL}/src/services/AvatarCatalog';
const problemas: string[] = [];
for (const [assetId, vars] of Object.entries(VARIANTES_POR_ASSET)) {
  const item = itemPorId(assetId);
  if (!item) { problemas.push(assetId + ': asset inexistente no catálogo'); continue; }
  const declarados = new Set(item.usaCores ?? []);
  const ids = new Set<string>();
  for (const v of vars) {
    if (ids.has(v.id)) problemas.push(assetId + '/' + v.id + ': id duplicado');
    ids.add(v.id);
    for (const [canal, hex] of Object.entries(v.canais)) {
      if (!declarados.has(canal as never)) problemas.push(assetId + '/' + v.id + ': canal ' + canal + ' fora de usaCores');
      if (!/^#[0-9a-f]{6}$/.test(String(hex))) problemas.push(assetId + '/' + v.id + ': hex inválido ' + hex);
    }
    if (!Object.keys(v.canais).length) problemas.push(assetId + '/' + v.id + ': variante sem canais');
  }
}
for (const a of ACESSORIOS) {
  if (!FOCO_ITEM_ASSET[a.id]) problemas.push(a.id + ': SEM bounds medidos (rode scripts/avatar/medir-foco-item.mjs e cole o diff)');
}
console.log(JSON.stringify(problemas));
`);
    execSync(`npx esbuild ${join(tmp, 'prova.ts')} --bundle --platform=node --format=esm --outfile=${join(tmp, 'prova.mjs')} --log-level=silent`, { cwd: RAIZ });
    const problemas = JSON.parse(execSync(`node ${join(tmp, 'prova.mjs')}`, { cwd: RAIZ }).toString().trim().split('\n').pop());
    ok(problemas.length === 0, `C: registry com problemas: ${problemas.join(' · ')}`);
  } catch (e) { falhas.push(`C exceção: ${e.message}`); }
  rmSync(tmp, { recursive: true, force: true });
}

// ── D) Rollback: flags OFF = zero DOM novo ──────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 2000, height: 1200 },
    init: (f) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); },
    initArg: { ...FLAGS_BASE, 'as6.thumb_item': false, 'as6.variantes': false },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await irCategoria(p, 'Acess');
    await irSubcategoria(p, 'chapeus');
    ok(await p.locator('[data-teste="thumb-item"]').count() === 0, 'D: flag off ainda renderiza Modo Item');
    ok(await p.locator('[data-teste="modo-thumb"]').count() === 0, 'D: flag off ainda mostra o toggle');
    ok(await p.locator('[data-teste="card-variantes"]').count() === 0, 'D: flag off ainda mostra badge de variantes');
    await p.screenshot({ path: `${SAIDA}/1401-rollback.png` });
    ok(erros.length === 0, `D: erros JS: ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`D exceção: ${e.message}`); }
  await b.close();
}

if (falhas.length) {
  console.error('[variantes-thumb-item] FALHAS:\n- ' + falhas.join('\n- '));
  process.exit(1);
}
console.log('[variantes-thumb-item] FALHAS: nenhuma');
console.log('[variantes-thumb-item] ERROS JS: nenhum');
