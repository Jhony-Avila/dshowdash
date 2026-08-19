// testes/regressao-visual.mjs — onda 1407 (MEGA_BRIEFING_01 §2678–§2705,
// §2972–§2976, §35, §64; decisão #158): REGRESSÃO VISUAL por screenshots.
//
// Matriz (casos nomeados, viewport fixo, animações congeladas):
//   svg_<gNN>         — os 16 goldens de bytes renderizados em PNG (motor 2D
//                        fora da UI: busto 480², corpo 480×800, foto 960w)
//   item_<ace_*>      — ocupação do Modo Item (§12: 70–85%) por acessório
//                        (MÉTRICA, sem PNG; tripwire se sair da faixa)
//   ui2d_<cam>        — shell novo, config padrão: rosto/busto/corpo + dock
//   3d_<slug>_<cam>   — palco 3D: personagens publicados × corpo/retrato
//                        (SwiftShader; AVISO, nunca tripwire — #158)
//
// Baseline: docs/AVATAR-STUDIO-6/golden-visual.json (sha256/bytes/tamanho/
// métricas/tolerância/nota por caso — no git) + PNGs em
// scripts/avatar/testes/saida/baseline-visual/ (gitignored; cópia em
// /backup/visual-baselines/<commit>/ no servidor). Classificação por caso:
// identico · expected (≤ tolerância) · unexpected · needs_review (baseline
// PNG ausente ou tamanho diferente) · novo (sem baseline).
// Tripwire: unexpected em svg_/ui2d_/item_. 3D e needs_review = aviso.
//
// Uso:
//   node scripts/avatar/testes/regressao-visual.mjs            (compara)
//   … --gravar                     (1ª baseline: grava TUDO + JSON)
//   … --aprovar <caso|todos> --nota "motivo"   (regrava só o caso, exige nota §2695)
//   … --desde <commit>             (só a matriz afetada pelo diff git §2793)
//   … --sem-3d                     (pula o palco 3D)
// @version 1.0.0  @created 2026-08-19
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { SAIDA } from './navegador.mjs';
import { abrirDeterministico, fotografarCanvas3d, fotografarElemento, irParaHarness, medirOcupacao, renderizarSvg } from './visual/captura.mjs';
import { compararPng, gerarDiffPng, sha256De } from './visual/comparar-visual.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const BASELINE_JSON = join(RAIZ, 'docs', 'AVATAR-STUDIO-6', 'golden-visual.json');
const DIR_BASE = join(SAIDA, 'baseline-visual');
const DIR_ATUAL = join(SAIDA, 'visual-atual');
const DIR_DIFF = join(SAIDA, 'visual-diff');
for (const d of [DIR_BASE, DIR_ATUAL, DIR_DIFF]) mkdirSync(d, { recursive: true });

const args = process.argv.slice(2);
const GRAVAR = args.includes('--gravar');
const iAprovar = args.indexOf('--aprovar');
const APROVAR = iAprovar >= 0 ? (args[iAprovar + 1] ?? 'todos') : null;
const iNota = args.indexOf('--nota');
const NOTA = iNota >= 0 ? args[iNota + 1] : null;
const iDesde = args.indexOf('--desde');
const DESDE = iDesde >= 0 ? args[iDesde + 1] : null;
const SEM_3D = args.includes('--sem-3d');
if (APROVAR && !NOTA) { console.error('--aprovar exige --nota "motivo" (§2695/§2975 — baseline só muda com revisão registrada)'); process.exit(2); }

const OCUPACAO = { min: 0.70, max: 0.85 }; // §12
const commit = (() => { try { return execSync('git rev-parse --short HEAD', { cwd: RAIZ }).toString().trim(); } catch { return 'sem-git'; } })();

// ── seleção "affected" (§2793–§2801) ──────────────────────────────────
const GRUPOS = ['svg', 'item', 'ui2d', '3d'];
let grupos = new Set(GRUPOS);
if (DESDE) {
  const diff = execSync(`git diff --name-only ${DESDE} HEAD`, { cwd: RAIZ }).toString().split('\n').filter(Boolean);
  grupos = new Set();
  for (const f of diff) {
    if (/src\/engine\/(render|cores|cor-hsl|params|sobrepecas|particulas|base-api|render-foto)\.ts/.test(f) || /src\/engine\/partes\//.test(f) || /src\/services\/AvatarCatalog/.test(f)) { grupos.add('svg'); grupos.add('item'); grupos.add('ui2d'); }
    if (/src\/components\/modoItem|src\/workspace\/acessorios|VariantesAssets/.test(f)) grupos.add('item');
    if (/src\/(shell|components|workspace|app|styles)\//.test(f)) grupos.add('ui2d');
    if (/src\/(poc3d|services\/(Renderizador3d|Assembler3d|Materiais3d|Partes3d|Personagens3d|Animacoes3d|Cenas3d|QualityManager))/.test(f) || /public\/assets\/avatars\/3d\//.test(f)) grupos.add('3d');
    if (/scripts\/avatar\/testes\/(visual\/|regressao-visual)/.test(f)) grupos = new Set(GRUPOS);
  }
  console.log(`[regressao-visual] --desde ${DESDE}: grupos afetados = ${[...grupos].join(', ') || 'nenhum'}`);
}
if (SEM_3D) grupos.delete('3d');

// ── 1) casos 2D do motor (bundle node puro) ───────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'avst-visual-'));
writeFileSync(join(tmp, 'prova.ts'), `
import { casosGolden } from '${join(RAIZ, 'scripts', 'avatar', 'testes', 'visual', 'golden-casos')}';
import { itensDe, svgItemIsolado } from '@painel/services/AvatarCatalog';
import { focoItemDe } from '@painel/components/modoItem';
import { slotCorporal } from '@painel/workspace/acessorios';
const goldens = casosGolden().map((c) => ({ id: c.id, svg: c.svg, tamanho: c.tamanho }));
const itens = itensDe('acessorio').map((it: any) => ({ id: it.id, corporal: slotCorporal(it.slot ?? 'cabeca'), svg: svgItemIsolado(it.id, { uid: 'vis', foco: focoItemDe(it.id) }) }));
console.log(JSON.stringify({ goldens, itens }));
`);
execSync(`npx esbuild ${join(tmp, 'prova.ts')} --bundle --platform=node --format=esm --alias:@painel=${join(PAINEL, 'src')} --outfile=${join(tmp, 'prova.mjs')} --log-level=silent`, { cwd: RAIZ, stdio: ['ignore', 'ignore', 'inherit'] });
const { goldens, itens } = JSON.parse(execSync(`node ${join(tmp, 'prova.mjs')}`, { cwd: RAIZ, maxBuffer: 64 * 1024 * 1024 }).toString());
rmSync(tmp, { recursive: true, force: true });

const atual = {}; // nome → { renderer, png?, sha256?, bytes?, largura?, altura?, ocupacao?, viewBox? }

// ── 2) navegador 2D: svg_*, item_*, ui2d_* ───────────────────────────
if (grupos.has('svg') || grupos.has('item') || grupos.has('ui2d')) {
  const { navegador, pagina } = await abrirDeterministico({ flags: { 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false } });
  try {
    if (grupos.has('svg')) {
      for (const g of goldens) {
        const nome = `svg_${g.id}`;
        const png = join(DIR_ATUAL, `${nome}.png`);
        const dim = await renderizarSvg(pagina, g.svg, png, g.tamanho);
        atual[nome] = { renderer: '2d', png, sha256: sha256De(png), bytes: readFileSync(png).length, ...dim };
      }
    }
    if (grupos.has('item')) {
      for (const it of itens) {
        const m = await medirOcupacao(pagina, it.svg);
        // exceções DECLARADAS à faixa §12 (nunca silenciosas): corporais
        // mostram o RECORTE DA REGIÃO no corpo (1404 #154 — o item sozinho
        // não comunica) e itens minúsculos batem no clamp de 40 do
        // medir-foco-item (lado ≤ 31 = 40×0,78 → zoom absurdo evitado)
        const ladoBbox = m?.bbox ? Math.max(m.bbox.w, m.bbox.h) : 0;
        const excecao = it.corporal ? 'corporal: recorte da região no corpo (§154)' : ladoBbox > 0 && ladoBbox <= 32 ? 'item minúsculo: clamp 40 do medidor (§12)' : null;
        atual[`item_${it.id}`] = { renderer: 'item', ocupacao: m?.ocupacao ?? null, viewBox: m?.viewBox ?? null, bbox: m?.bbox ?? null, excecao };
      }
    }
    if (grupos.has('ui2d')) {
      await irParaHarness(pagina, 'avst-harness.html', 1500);
      for (const cam of ['rosto', 'busto', 'corpo']) {
        const chip = pagina.locator(`[data-teste="cam6-${cam}"]`);
        if (await chip.count()) { await chip.click(); await pagina.waitForTimeout(500); }
        const nome = `ui2d_${cam}`;
        const png = join(DIR_ATUAL, `${nome}.png`);
        if (await fotografarElemento(pagina, '.avst5-viewport', png)) {
          atual[nome] = { renderer: 'ui', png, sha256: sha256De(png), bytes: readFileSync(png).length };
        }
      }
      const pngDock = join(DIR_ATUAL, 'ui2d_dock.png');
      if (await fotografarElemento(pagina, '.avst5-dock, .avst-grade', pngDock)) {
        atual.ui2d_dock = { renderer: 'ui', png: pngDock, sha256: sha256De(pngDock), bytes: readFileSync(pngDock).length };
      }
    }
  } finally { await navegador.close(); }
}

// ── 3) navegador 3D: 3d_<slug>_<cam> ──────────────────────────────────
if (grupos.has('3d')) {
  // determinismo 3D: sem DPR dinâmico (as5.quality3d_v2 OFF → canvas com
  // tamanho fixo) e perfil de qualidade 'alto' fixo (sem tier adaptativo
  // trocando LOD no meio da captura) — §2697/§2973
  const { navegador, pagina } = await abrirDeterministico({ webgl: true, flags: { 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true, 'as5.quality3d_v2': false } });
  await pagina.context().addInitScript(() => { try { localStorage.setItem('dshow.avst6.qualidade.v1', 'alto'); } catch { /* sem storage */ } });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 1200);
    if (await pagina.locator('[data-teste="botao-3d"]').count()) {
      await pagina.locator('[data-teste="botao-3d"]').click();
      await pagina.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 45000 });
      await pagina.waitForTimeout(6000);
      const grupo = pagina.locator('.avst5-p3d-personagens:not(.avst5-p3d-partes)').first();
      const chips = (await grupo.locator('.avst5-p3d-chip').allTextContents()).map((t) => t.trim()).filter((t) => t && !/^auto$/i.test(t));
      // pose congelada (botão p3d-pose = pausar o laço) SÓ na hora da
      // captura: o laço precisa rodar para trocar personagem/câmera (o
      // canvas guarda o último quadro pintado); congelar → capturar →
      // retomar. A fase do idle no instante do congelamento varia um
      // pouco entre execuções — por isso 3D é AVISO com tolerância 2 % (#158).
      const pose = pagina.locator('[data-teste="p3d-pose"]');
      const congelar = async (sim) => {
        if (!(await pose.count())) return;
        const esta = (await pose.getAttribute('aria-pressed')) === 'true';
        if (esta !== sim) { await pose.evaluate((el) => el.click()); await pagina.waitForTimeout(300); }
      };
      for (const nome of chips) {
        await congelar(false);
        await grupo.locator('.avst5-p3d-chip', { hasText: nome }).first().evaluate((el) => el.click());
        await pagina.waitForTimeout(7000);
        const slug = nome.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        for (const [cam, titulo] of [['corpo', 'Corpo inteiro'], ['retrato', 'Retrato']]) {
          await congelar(false);
          const b = pagina.locator(`.avst5-p3d-cameras button[title="${titulo}"]`);
          if (await b.count()) { await b.first().evaluate((el) => el.click()); await pagina.waitForTimeout(1200); }
          await congelar(true);
          const caso = `3d_${slug}_${cam}`;
          const png = join(DIR_ATUAL, `${caso}.png`);
          if (await fotografarCanvas3d(pagina, png)) atual[caso] = { renderer: '3d', png, sha256: sha256De(png), bytes: readFileSync(png).length, personagem: nome };
        }
      }
      await congelar(false);
    }
  } finally { await navegador.close(); }
}

// ── 4) comparação / gravação ──────────────────────────────────────────
const base = existsSync(BASELINE_JSON) ? JSON.parse(readFileSync(BASELINE_JSON, 'utf8')) : { casos: {} };
const resultado = {}; const falhas = []; const avisos = [];
const podeGravar = (nome) => GRAVAR || APROVAR === 'todos' || APROVAR === nome;

for (const [nome, a] of Object.entries(atual).sort(([x], [y]) => x.localeCompare(y))) {
  const b = base.casos[nome];
  if (a.renderer === 'item') {
    const fora = a.ocupacao === null || a.ocupacao < OCUPACAO.min || a.ocupacao > OCUPACAO.max;
    const excecao = a.excecao ?? b?.excecao ?? null;
    resultado[nome] = { classe: fora && !excecao ? 'unexpected' : 'expected', ocupacao: a.ocupacao, viewBox: a.viewBox, ...(excecao ? { excecao } : {}) };
    if (fora && !excecao) falhas.push(`${nome}: ocupação ${a.ocupacao} fora de ${OCUPACAO.min}–${OCUPACAO.max} (§12 — medir-foco-item.mjs / preset da subcategoria)`);
    // ocupação mudou vs baseline (sem exceção) = aviso (thumb re-medido)
    if (b && b.ocupacao !== undefined && b.ocupacao !== a.ocupacao && !excecao) avisos.push(`${nome}: ocupação ${b.ocupacao} → ${a.ocupacao} (Modo Item re-medido?)`);
    if (podeGravar(nome)) base.casos[nome] = { renderer: 'item', ocupacao: a.ocupacao, viewBox: a.viewBox, ...(excecao ? { excecao } : {}), ...(NOTA ? { nota: NOTA } : {}) };
    continue;
  }
  const basePng = join(DIR_BASE, `${nome}.png`);
  let r;
  if (!b) r = { classe: podeGravar(nome) ? 'gravado' : 'novo' };
  else if (b.sha256 === a.sha256) r = { classe: 'identico', pctDiferente: 0 };
  else if (existsSync(basePng)) {
    r = await compararPng(basePng, a.png, { renderer: a.renderer === 'ui' ? 'ui' : a.renderer, toleranciaPct: b.tolerancia });
    if (r.classe === 'unexpected' || r.classe === 'needs_review') await gerarDiffPng(basePng, a.png, join(DIR_DIFF, `${nome}.diff.png`)).catch(() => false);
  } else r = { classe: 'needs_review', motivo: 'baseline PNG ausente localmente (restaurar de /backup/visual-baselines/ ou --aprovar)' };
  resultado[nome] = { ...r, renderer: a.renderer, sha256: a.sha256, bytes: a.bytes };

  if (r.classe === 'unexpected') {
    const msg = `${nome}: ${r.pctDiferente}% dos pixels mudaram (tol ${r.tolerancia}%, bbox ${JSON.stringify(r.bbox)}) — diff em saida/visual-diff/`;
    if (a.renderer === '3d') avisos.push(`[3D aviso] ${msg}`); else falhas.push(msg);
  } else if (r.classe === 'needs_review') avisos.push(`${nome}: needs_review — ${r.motivo}`);
  else if (r.classe === 'novo') avisos.push(`${nome}: caso novo sem baseline (--gravar ou --aprovar ${nome} --nota …)`);

  if (podeGravar(nome)) {
    copyFileSync(a.png, basePng);
    base.casos[nome] = { renderer: a.renderer, sha256: a.sha256, bytes: a.bytes, ...(a.largura ? { largura: a.largura, altura: a.altura } : {}),
      tolerancia: b?.tolerancia ?? (a.renderer === '3d' ? 2.0 : a.renderer === 'ui' ? 1.0 : 0.5), ...(NOTA ? { nota: NOTA } : b?.nota ? { nota: b.nota } : {}) };
  }
}
// casos que sumiram
for (const nome of Object.keys(base.casos)) {
  if (!atual[nome] && grupos.has(nome.split('_')[0])) avisos.push(`${nome}: caso da baseline não foi capturado (sumiu do runner?)`);
}

if (GRAVAR || APROVAR) {
  base.descricao = 'GOLDEN VISUAL (onda 1407, decisão #158) — sha256/tamanho/métricas por caso de screenshot determinístico; PNGs FORA do git (scripts/avatar/testes/saida/baseline-visual/ + /backup/visual-baselines/<commit>/). Regravar: --gravar (1ª vez) ou --aprovar <caso> --nota "motivo" (revisar o diff no MESMO commit — doutrina #83).';
  base.viewport2d = { width: 1440, height: 900 }; base.viewport3d = { width: 1500, height: 940 }; base.reducedMotion = true;
  base.chromium = process.env.PW_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  base.ocupacaoItem = OCUPACAO; base.ultimaGravacao = { commit, casos: Object.keys(atual).length };
  base.casos = Object.fromEntries(Object.entries(base.casos).sort(([x], [y]) => x.localeCompare(y)));
  writeFileSync(BASELINE_JSON, `${JSON.stringify(base, null, 2)}\n`);
  console.log(`[regressao-visual] baseline ${GRAVAR ? 'gravada' : `aprovada (${APROVAR})`}: ${Object.keys(base.casos).length} casos em ${BASELINE_JSON}`);
}

writeFileSync(join(SAIDA, 'regressao-visual.json'), `${JSON.stringify({ commit, grupos: [...grupos], resultado }, null, 2)}\n`);
const classes = Object.values(resultado).reduce((acc, r) => { acc[r.classe] = (acc[r.classe] ?? 0) + 1; return acc; }, {});
console.log(`[regressao-visual] ${Object.keys(resultado).length} casos · ${JSON.stringify(classes)}`);
if (avisos.length) console.log('[regressao-visual] AVISOS:\n- ' + avisos.join('\n- '));
console.log('[regressao-visual] FALHAS:', falhas.length ? falhas.join(' || ') : 'nenhuma');
process.exit(falhas.length ? 1 : 0);
