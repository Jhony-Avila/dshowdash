// testes/populacao-1403.mjs — onda 1403 (decisão #153): POPULAÇÃO das
// subcategorias VAZIAS em slots existentes (pedido do Jhony 2026-08-12):
// Mochilas e bolsas ×3 (costas) · Robôs ×4 (companheiro) · Espíritos ×3
// (companheiro) · Runas e círculos ×4 (flutuante — principal convertida
// de efeito p/ acessório ANTES de ativar; navegação pura, contrato §1).
//
// Seções:
//   A) Catálogo são (Node puro): 14 existem, subcategoria certa, render
//      limpo, lore em raro+, bounds medidos, taxonomia com as 4
//      principais ATIVAS e apontando para as subcats novas.
//   B) Navegador: Robôs/Espíritos/Runas/Mochilas e bolsas ativos na
//      árvore com cards Modo Item; robô + runa equipam JUNTOS
//      (companheiro + flutuante, slots distintos).
//   C) Varredura das 4 subcategorias sem erro JS.
// @version 1.0.0  @created 2026-08-12
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const NOVOS = {
  bolsas: ['ace_bolsa_mensageiro', 'ace_bolsa_tatica', 'ace_bolsa_couro'],
  robos: ['ace_robo_assistente', 'ace_robo_bit', 'ace_robo_aranha', 'ace_robo_guardiao'],
  espiritos: ['ace_espirito_chama', 'ace_espirito_agua', 'ace_espirito_estelar'],
  runas: ['ace_runa_circulo', 'ace_runa_protecao', 'ace_runa_glifo', 'ace_runa_orbital'],
};

// ── A) Catálogo + taxonomia sãos (Node puro) ────────────────────────
{
  const { execSync } = await import('node:child_process');
  const { mkdtempSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
  const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
  const tmp = mkdtempSync(join(tmpdir(), 'avst-1403-'));
  try {
    writeFileSync(join(tmp, 'prova.ts'), `
import { ACESSORIOS } from '${PAINEL}/src/engine/partes/acessorios';
import { SUBCATEGORIA_POR_ASSET, SUBCATEGORIAS_ACESSORIO } from '${PAINEL}/src/workspace/acessorios';
import { FOCO_ITEM_ASSET } from '${PAINEL}/src/components/modoItem';
import { TAXONOMIA } from '${PAINEL}/src/workspace/taxonomia';
import { paletaDe } from '${PAINEL}/src/engine/cores';
import { CONFIG_PADRAO } from '${PAINEL}/src/services/AvatarCatalog';
const NOVOS = ${JSON.stringify(NOVOS)};
const problemas: string[] = [];
const porId = new Map(ACESSORIOS.map((a) => [a.id, a]));
const paleta = paletaDe(CONFIG_PADRAO.cores);
for (const [sub, ids] of Object.entries(NOVOS)) {
  const subDef = SUBCATEGORIAS_ACESSORIO.find((s) => s.id === sub);
  if (!subDef || subDef.estado !== 'ativa') problemas.push(sub + ': subcategoria ausente/não-ativa');
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
const principais = TAXONOMIA.flatMap((m) => m.principais);
for (const [pid, sub] of [['mochilas-bolsas','bolsas'],['robos','robos'],['espiritos','espiritos'],['runas','runas']] as const) {
  const pr = principais.find((x) => x.id === pid);
  if (!pr) { problemas.push(pid + ': principal ausente da taxonomia'); continue; }
  if (pr.estado !== 'ativa') problemas.push(pid + ': principal deveria estar ATIVA, está ' + pr.estado);
  if (pr.categoria !== 'acessorio' || !pr.subcats?.includes(sub)) problemas.push(pid + ': principal sem subcats [' + sub + ']');
}
console.log(JSON.stringify(problemas));
`);
    execSync(`npx esbuild ${join(tmp, 'prova.ts')} --bundle --platform=node --format=esm --outfile=${join(tmp, 'prova.mjs')} --log-level=silent`, { cwd: RAIZ });
    const problemas = JSON.parse(execSync(`node ${join(tmp, 'prova.mjs')}`, { cwd: RAIZ }).toString().trim().split('\n').pop());
    ok(problemas.length === 0, `A: problemas: ${problemas.join(' · ')}`);
  } catch (e) { falhas.push(`A exceção: ${e.message}`); }
  rmSync(tmp, { recursive: true, force: true });
}

// ── B/C) Navegador (taxonomia v2 LIGADA — é onde as mães novas vivem) ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 2000, height: 1200 },
    init: (f) => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); },
    initArg: { 'as5.novo_shell': true, 'as5.palco3d': false },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    // abre as mães e clica as principais novas (tax v2: acordeão)
    const irPrincipal = async (mae, principal) => {
      await p.evaluate((m) => { [...document.querySelectorAll('.avst5-cat, button')].find((x) => x.textContent?.trim().startsWith(m))?.click(); }, mae);
      await p.waitForTimeout(400);
      await p.evaluate((pr) => { [...document.querySelectorAll('.avst5-cat, button')].find((x) => x.textContent?.trim().startsWith(pr))?.click(); }, principal);
      await p.waitForTimeout(600);
    };
    const contarCards = () => p.locator('.avst5-painel .avst-card:not(.avst-card-nenhum)').count();
    await irPrincipal('Companheiros', 'Robôs');
    ok(await contarCards() >= 4, `B: Robôs deveria ter ≥4 cards, veio ${await contarCards()}`);
    await p.screenshot({ path: `${SAIDA}/1403-robos.png` });
    // equipa um robô
    await p.evaluate(() => {
      const c = [...document.querySelectorAll('.avst5-painel .avst-card')]
        .find((x) => x.querySelector('.avst-card-nome')?.textContent?.includes('Guardião'));
      c?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await p.waitForTimeout(400);
    await irPrincipal('Elementos', 'Runas');
    ok(await contarCards() >= 4, `B: Runas deveria ter ≥4 cards, veio ${await contarCards()}`);
    // equipa uma runa — coexiste com o robô (flutuante + companheiro)
    await p.evaluate(() => {
      const c = [...document.querySelectorAll('.avst5-painel .avst-card')]
        .find((x) => x.querySelector('.avst-card-nome')?.textContent?.includes('Glifo'));
      c?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await p.waitForTimeout(1300); // autosave §139
    const rasc = await p.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('dshow.avst5.rascunho.v1') ?? 'null'); } catch { return null; }
    });
    const cam = rasc?.config?.camadas ?? rasc?.camadas ?? {};
    const ids = Object.values(cam);
    ok(ids.includes('ace_robo_guardiao') && ids.includes('ace_runa_glifo'),
      `B: robô+runa deveriam coexistir, camadas: ${JSON.stringify(cam)}`);
    await p.screenshot({ path: `${SAIDA}/1403-robo-runa.png` });
    await irPrincipal('Espíritos', 'Espíritos');
    await irPrincipal('Costas', 'Mochilas e bolsas');
    ok(await contarCards() >= 3, `C: Mochilas e bolsas deveria ter ≥3 cards, veio ${await contarCards()}`);
    await p.screenshot({ path: `${SAIDA}/1403-bolsas.png` });
    ok(erros.length === 0, `C: erros JS: ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`B/C exceção: ${e.message}`); }
  await b.close();
}

if (falhas.length) {
  console.error('[populacao-1403] FALHAS:\n- ' + falhas.join('\n- '));
  process.exit(1);
}
console.log('[populacao-1403] FALHAS: nenhuma');
console.log('[populacao-1403] ERROS JS: nenhum');
