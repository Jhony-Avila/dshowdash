#!/usr/bin/env node
// assets3d/medir-perf-asset.mjs — onda 1409 (MEGA_BRIEFING_01 §2783–§2804,
// §2946; PERFORMANCE-BUDGETS.md §3): PERF POR ASSET, estática e determinística
// (node puro, sem navegador): por LOD — bytes, triângulos, primitivas (≈ draw
// calls), materiais, texturas (nº, maior lado, VRAM estimada RGBA8 ×1.33) —
// comparada com budgets.json pela CLASSE do asset (tipo do manifest ou
// `perfClasse` declarada). Acima do teto = AVISO (production/legacy — §2804
// nunca reprova retroativo) ou ERRO (premium/hero). Também detecta REGRESSÃO
// HISTÓRICA (§2804: textura +50 %, bytes +40 %) contra o JSON anterior.
// Opcional --render: acrescenta drawCalls/triângulos REAIS do renderer via
// gerar-renders-homologacao (navegador; não determinístico em tempo, por isso
// fora do JSON padrão). Saída: docs/AVATAR-STUDIO-5/evidencias/perf-assets.json.
// Uso (da raiz): node scripts/avatar/assets3d/medir-perf-asset.mjs [--json] [--render] [<pasta>]
// @version 1.0.0  @created 2026-08-19
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { lerJsonDoGlb, contarTriangulos, texturasDoGlb } from './validar-asset.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const ASSETS3D = join(RAIZ, 'public', 'assets', 'avatars', '3d');
const DESTINO = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias', 'perf-assets.json');
export const BUDGETS = JSON.parse(readFileSync(join(import.meta.dirname, 'budgets.json'), 'utf8'));
const ESCADA_QV = { prototype: 0, legacy: 1, production: 2, premium: 3, hero: 4 };

/** Classe de orçamento do manifest: `perfClasse` explícita > `tipo`. */
export function classeDe(manifest) {
  const explicita = manifest.perfClasse ? `${manifest.tipo}:${manifest.perfClasse}` : null;
  if (explicita && BUDGETS.classes[explicita]) return explicita;
  return BUDGETS.classes[manifest.tipo] ? manifest.tipo : null;
}

/** Mede UM asset publicado (pasta com manifest.json + modelo.lodN.glb). */
export function medirAsset(dir) {
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const classe = classeDe(manifest);
  const lods = {};
  for (const lod of ['lod0', 'lod1', 'lod2']) {
    const arq = join(dir, `modelo.${lod}.glb`);
    if (!existsSync(arq)) { lods[lod] = null; continue; }
    const gltf = lerJsonDoGlb(arq);
    const texturas = texturasDoGlb(arq);
    let primitivas = 0;
    for (const m of gltf.meshes ?? []) primitivas += (m.primitives ?? []).length;
    const vramBytes = texturas.reduce((n, t) => n + t.largura * t.altura * 4 * 1.33, 0);
    lods[lod] = {
      bytes: statSync(arq).size,
      triangulos: contarTriangulos(gltf),
      primitivas,
      materiais: (gltf.materials ?? []).length,
      texturas: texturas.length,
      texturaMax: texturas.reduce((m, t) => Math.max(m, t.largura, t.altura), 0),
      vramMB: +(vramBytes / 1024 / 1024).toFixed(2),
      skins: (gltf.skins ?? []).length,
      animacoes: (gltf.animations ?? []).length,
    };
  }
  const avisos = []; const erros = [];
  const nivel = String(manifest.qualidadeVisual ?? 'production');
  const premiumOuMais = (ESCADA_QV[nivel] ?? 2) >= ESCADA_QV.premium;
  const destino = premiumOuMais ? erros : avisos;
  if (classe) {
    const b = BUDGETS.classes[classe];
    for (const lod of ['lod0', 'lod1', 'lod2']) {
      const m = lods[lod]; if (!m) continue;
      // triângulos escalam por fatorLod (alvo §2630); VRAM pelo quadrado da
      // redução de textura do publicador (2048→1024→512); bytes/materiais/
      // primitivas/texturas têm o MESMO teto em todos os LODs (≤ lod0)
      const f = BUDGETS.fatorLod[lod];
      const fv = BUDGETS.fatorVramLod[lod];
      const teto = (chave) => Math.ceil(b[chave] * (chave === 'triangulos' ? f : chave === 'vramMB' ? fv : 1));
      const checar = (chave, valor, rotulo, unidade = '') => {
        const t = teto(chave);
        if (valor > t) destino.push(`${lod}: ${rotulo} ${valor}${unidade} acima do orçamento da classe "${classe}" (${t}${unidade}) — §2783/§2804`);
      };
      checar('triangulos', m.triangulos, 'triângulos');
      checar('bytesLod0', m.bytes, 'peso', ' B');
      checar('materiais', m.materiais, 'materiais');
      checar('drawCalls', m.primitivas, 'primitivas (≈draw calls)');
      checar('texturas', m.texturas, 'texturas');
      checar('vramMB', m.vramMB, 'VRAM estimada', ' MB');
      if (m.texturaMax > b.texturaMax) destino.push(`${lod}: textura ${m.texturaMax}px acima do máximo da classe (${b.texturaMax}px)`);
    }
  } else if (!BUDGETS.ignorar.includes(manifest.tipo)) {
    avisos.push(`tipo "${manifest.tipo}" sem classe de orçamento em budgets.json — declare perfClasse ou acrescente a classe`);
  }
  return { id: manifest.id, tipo: manifest.tipo, qualidadeVisual: manifest.qualidadeVisual ?? null, classe, lods, avisos, erros, dentroDoOrcamento: erros.length === 0 && avisos.filter((a) => a.includes('orçamento')).length === 0 };
}

/** Regressão histórica §2804: compara com o relatório anterior (se houver). */
export function regressoes(atual, anterior) {
  if (!anterior?.assets) return [];
  const porId = new Map(anterior.assets.map((a) => [a.id, a]));
  const out = [];
  for (const a of atual) {
    const p = porId.get(a.id); if (!p?.lods?.lod0 || !a.lods.lod0) continue;
    const dBytes = (a.lods.lod0.bytes - p.lods.lod0.bytes) / p.lods.lod0.bytes * 100;
    const dVram = p.lods.lod0.vramMB > 0 ? (a.lods.lod0.vramMB - p.lods.lod0.vramMB) / p.lods.lod0.vramMB * 100 : 0;
    if (dBytes > BUDGETS.regressaoHistorica.loadPct) out.push({ id: a.id, metrica: 'bytes lod0', deltaPct: +dBytes.toFixed(1) });
    if (dVram > BUDGETS.regressaoHistorica.texturaPct) out.push({ id: a.id, metrica: 'vram lod0', deltaPct: +dVram.toFixed(1) });
  }
  return out;
}

export function medirTudo() {
  const assets = [];
  for (const pasta of ['personagens', 'partes']) {
    const dir = join(ASSETS3D, pasta);
    if (!existsSync(dir)) continue;
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      if (!d.isDirectory() || !existsSync(join(dir, d.name, 'manifest.json'))) continue;
      assets.push({ pasta, ...medirAsset(join(dir, d.name)) });
    }
  }
  assets.sort((a, b) => a.id.localeCompare(b.id));
  const anterior = existsSync(DESTINO) ? JSON.parse(readFileSync(DESTINO, 'utf8')) : null;
  const reg = regressoes(assets, anterior);
  return {
    gerado_por: 'scripts/avatar/assets3d/medir-perf-asset.mjs', budgetsVersao: BUDGETS.versao,
    resumo: {
      total: assets.length,
      dentroDoOrcamento: assets.filter((a) => a.dentroDoOrcamento).length,
      foraDoOrcamento: assets.filter((a) => !a.dentroDoOrcamento).map((a) => a.id),
      comErro: assets.filter((a) => a.erros.length).map((a) => a.id),
      bytesLod0Total: assets.reduce((n, a) => n + (a.lods.lod0?.bytes ?? 0), 0),
      vramLod0TotalMB: +assets.reduce((n, a) => n + (a.lods.lod0?.vramMB ?? 0), 0).toFixed(1),
      regressoes: reg,
    },
    assets,
  };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const args = process.argv.slice(2);
  const pastaArg = args.find((a) => !a.startsWith('--'));
  if (pastaArg) {
    const r = medirAsset(resolve(pastaArg));
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.erros.length ? 1 : 0);
  }
  const rel = medirTudo();
  if (args.includes('--render')) {
    const { gerarRendersHomologacao } = await import('./gerar-renders-homologacao.mjs');
    for (const a of rel.assets) {
      try {
        const r = await gerarRendersHomologacao(join(ASSETS3D, a.pasta, a.id), { angulos: ['front'], modos: ['normal'], lods: [0, 1, 2], gravarPng: false, saida: join(RAIZ, 'scripts', 'avatar', 'testes', 'saida', 'perf', a.id), porta: 8913 });
        for (const lod of ['lod0', 'lod1', 'lod2']) if (a.lods[lod] && r.metricas.lods[lod]) Object.assign(a.lods[lod], { drawCallsReais: r.metricas.lods[lod].drawCalls, triangulosRender: r.metricas.lods[lod].triangulos });
      } catch (e) { a.renderErro = String(e.message).slice(0, 120); }
    }
  }
  mkdirSync(join(DESTINO, '..'), { recursive: true });
  writeFileSync(DESTINO, `${JSON.stringify(rel, null, 2)}\n`);
  if (args.includes('--json')) { console.log(JSON.stringify(rel)); process.exit(0); }
  console.log(`PERF: ${rel.resumo.total} assets · ${rel.resumo.dentroDoOrcamento} dentro do orçamento · lod0 total ${(rel.resumo.bytesLod0Total / 1024 / 1024).toFixed(1)} MB · VRAM lod0 est. ${rel.resumo.vramLod0TotalMB} MB`);
  for (const a of rel.assets.filter((x) => !x.dentroDoOrcamento)) console.log(`  ✗ ${a.id} [${a.classe}]: ${[...a.erros, ...a.avisos].join(' | ')}`);
  if (rel.resumo.regressoes.length) console.log(`  regressões: ${JSON.stringify(rel.resumo.regressoes)}`);
  console.log('→ docs/AVATAR-STUDIO-5/evidencias/perf-assets.json');
}
