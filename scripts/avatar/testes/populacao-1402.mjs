// testes/populacao-1402.mjs — onda 1402 (decisão #151): POPULAÇÃO
// Cabeça e Rosto — 20 artes novas (chapéus ×4, adornos ×4, óculos ×4,
// capuzes ×3 NOVA ATIVA, máscaras ×5).
//
// Seções:
//   A) Catálogo são (Node puro): os 20 existem, classificados na
//      subcategoria certa, render não-vazio e sem lixo (NaN/undefined),
//      lore obrigatória de raro pra cima (AS3 §9), contagens §3/§4
//      (mín. por subcategoria) atingidas, bounds medidos para TODOS.
//   B) Navegador: Capuzes ATIVA na árvore com 3 cards Modo Item;
//      máscaras com 6; capuz + máscara equipam JUNTOS (slots distintos)
//      e o rascunho §139 registra os dois.
//   C) Zero erros JS varrendo as 5 subcategorias tocadas.
// @version 1.0.0  @created 2026-08-12
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const NOVOS = {
  chapeus: ['ace_fedora', 'ace_cartola', 'ace_chapeu_cowboy', 'ace_chapeu_chef'],
  'adornos-cabeca': ['ace_bandana_testa', 'ace_flor_lotus', 'ace_laco_fita', 'ace_diadema_perolas'],
  oculos: ['ace_oculos_redondos', 'ace_oculos_gatinho', 'ace_viseira_esporte', 'ace_oculos_pixel'],
  capuzes: ['ace_capuz_sombrio', 'ace_capuz_ninja', 'ace_veu_mistico'],
  mascaras: ['ace_mascara_oni', 'ace_mascara_kitsune', 'ace_mascara_teatro', 'ace_medico_peste', 'ace_mascara_hoquei'],
};
const MINIMOS = { chapeus: 8, 'adornos-cabeca': 8, oculos: 8, capuzes: 3, mascaras: 6 };

// ── A) Catálogo são (Node puro, receita dos goldens) ────────────────
{
  const { execSync } = await import('node:child_process');
  const { mkdtempSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
  const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
  const tmp = mkdtempSync(join(tmpdir(), 'avst-1402-'));
  try {
    writeFileSync(join(tmp, 'prova.ts'), `
import { ACESSORIOS } from '${PAINEL}/src/engine/partes/acessorios';
import { SUBCATEGORIA_POR_ASSET } from '${PAINEL}/src/workspace/acessorios';
import { SUBCATEGORIAS_ACESSORIO } from '${PAINEL}/src/workspace/acessorios';
import { FOCO_ITEM_ASSET } from '${PAINEL}/src/components/modoItem';
import { paletaDe } from '${PAINEL}/src/engine/cores';
import { CONFIG_PADRAO } from '${PAINEL}/src/services/AvatarCatalog';
const NOVOS = ${JSON.stringify(NOVOS)};
const MINIMOS = ${JSON.stringify(MINIMOS)};
const problemas: string[] = [];
const porId = new Map(ACESSORIOS.map((a) => [a.id, a]));
const paleta = paletaDe(CONFIG_PADRAO.cores);
for (const [sub, ids] of Object.entries(NOVOS)) {
  for (const id of ids) {
    const item = porId.get(id);
    if (!item) { problemas.push(id + ': ausente do catálogo'); continue; }
    if (SUBCATEGORIA_POR_ASSET[id] !== sub) problemas.push(id + ': subcategoria ' + SUBCATEGORIA_POR_ASSET[id] + ' != ' + sub);
    const svg = item.render(paleta, 'pv');
    if (!svg || svg.length < 60) problemas.push(id + ': render vazio/curto');
    if (/NaN|undefined/.test(svg)) problemas.push(id + ': render com lixo');
    const nivel = ['comum','incomum','raro','epico','lendario','mitico','exclusivo'].indexOf(item.raridade);
    if (nivel >= 2 && !item.lore) problemas.push(id + ': raro+ sem lore (§9)');
    if (!FOCO_ITEM_ASSET[id]) problemas.push(id + ': sem bounds medidos');
  }
}
const contagem: Record<string, number> = {};
for (const s of Object.values(SUBCATEGORIA_POR_ASSET)) contagem[s] = (contagem[s] ?? 0) + 1;
for (const [sub, min] of Object.entries(MINIMOS)) {
  if ((contagem[sub] ?? 0) < min) problemas.push(sub + ': ' + (contagem[sub] ?? 0) + ' < mínimo ' + min);
}
const capuzes = SUBCATEGORIAS_ACESSORIO.find((s) => s.id === 'capuzes');
if (capuzes?.estado !== 'ativa') problemas.push('capuzes deveria estar ATIVA, está ' + capuzes?.estado);
console.log(JSON.stringify(problemas));
`);
    execSync(`npx esbuild ${join(tmp, 'prova.ts')} --bundle --platform=node --format=esm --outfile=${join(tmp, 'prova.mjs')} --log-level=silent`, { cwd: RAIZ });
    const problemas = JSON.parse(execSync(`node ${join(tmp, 'prova.mjs')}`, { cwd: RAIZ }).toString().trim().split('\n').pop());
    ok(problemas.length === 0, `A: catálogo com problemas: ${problemas.join(' · ')}`);
  } catch (e) { falhas.push(`A exceção: ${e.message}`); }
  rmSync(tmp, { recursive: true, force: true });
}

// ── B/C) Navegador: capuzes ativa, contagens visíveis, multi-equip ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 2000, height: 1200 },
    init: (f) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); },
    initArg: { 'as5.novo_shell': true, 'as5.palco3d': false, 'as6.tax_v2': false },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Acess'))?.click(); });
    await p.waitForTimeout(500);
    // capuzes ATIVA e com 3 cards em Modo Item
    const arvCapuzes = p.locator('[data-teste="arv-capuzes"]');
    ok(await arvCapuzes.count() === 1, 'B: arv-capuzes ausente da árvore');
    ok(await arvCapuzes.isDisabled().catch(() => false) === false, 'B: capuzes ainda desabilitada');
    await arvCapuzes.click();
    await p.waitForTimeout(600);
    const nCapuzes = await p.locator('[data-teste="thumb-item"]').count();
    ok(nCapuzes >= 3, `B: esperava ≥3 thumbs em capuzes, veio ${nCapuzes}`);
    await p.screenshot({ path: `${SAIDA}/1402-capuzes.png` });
    // máscaras com 6
    await p.click('[data-teste="arv-mascaras"]');
    await p.waitForTimeout(600);
    const nMasc = await p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum)').count();
    ok(nMasc >= 6, `B: esperava ≥6 cards em máscaras, veio ${nMasc}`);
    await p.screenshot({ path: `${SAIDA}/1402-mascaras.png` });
    // equipa uma máscara e depois um capuz — slots distintos, coexistem
    const equipar = async (nome) => {
      await p.fill('input[aria-label="Buscar itens"]', nome);
      await p.waitForTimeout(400);
      await p.evaluate((n) => {
        const c = [...document.querySelectorAll('.avst5-painel .avst-card')]
          .find((x) => x.querySelector('.avst-card-nome')?.textContent?.trim() === n);
        c?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }, nome);
      await p.fill('input[aria-label="Buscar itens"]', '');
      await p.waitForTimeout(400);
    };
    await equipar('Máscara Oni');
    await p.click('[data-teste="arv-capuzes"]');
    await p.waitForTimeout(400);
    await equipar('Capuz Sombrio');
    await p.waitForTimeout(1300); // autosave §139
    const rasc = await p.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('dshow.avst5.rascunho.v1') ?? 'null'); } catch { return null; }
    });
    const cam = rasc?.config?.camadas ?? rasc?.camadas ?? {};
    const equipados = Object.values(cam);
    ok(equipados.includes('ace_mascara_oni') && equipados.includes('ace_capuz_sombrio'),
      `B: capuz+máscara deveriam coexistir, camadas: ${JSON.stringify(cam)}`);
    await p.screenshot({ path: `${SAIDA}/1402-multi-equip.png` });
    // C) varre as 5 subcategorias tocadas sem erro JS
    for (const sub of ['chapeus', 'adornos-cabeca', 'oculos', 'capuzes', 'mascaras']) {
      await p.click(`[data-teste="arv-${sub}"]`).catch(() => falhas.push(`C: arv-${sub} não clicável`));
      await p.waitForTimeout(350);
    }
    ok(erros.length === 0, `C: erros JS: ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`B/C exceção: ${e.message}`); }
  await b.close();
}

if (falhas.length) {
  console.error('[populacao-1402] FALHAS:\n- ' + falhas.join('\n- '));
  process.exit(1);
}
console.log('[populacao-1402] FALHAS: nenhuma');
console.log('[populacao-1402] ERROS JS: nenhum');
