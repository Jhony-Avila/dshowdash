// services/Assembler3d.ts — CHARACTER ASSEMBLER (megas 621–624 · §406,
// lote 621–630, flag as5.assembler3d).
// @version 1.0.0  @created 2026-08-07
//
// O serviço §406 monta o personagem em 14 PASSOS EXPLÍCITOS — cada passo
// reporta ok/detalhe (mesmo espírito do PipelineAsset §268): falha nunca
// é anônima. A fundação que torna isso possível foi verificada no lote
// 611–620: bases, cabelos e roupas do UBC compartilham o MESMO rig de 65
// bones (rig-ubc-v1) — vestir = REBIND das partes no esqueleto da base
// (Skeleton reconstruído por NOME de bone; ordem/boneInverses da parte).
//
// Passos ainda sem matéria nesta fase reportam ok com detalhe "n/a" e a
// seção que os cobre (tipo corporal §414/lote 631+, morphs §412/651+,
// emblemas §421/641+) — o relatório diz a verdade sobre o que rodou.
import * as THREE from 'three';
import { canalDaCategoria, marcarCanal } from './Materiais3d';

export type PassoAssembler =
  | 'carregar_base' | 'validar_rig' | 'tipo_corporal' | 'morphs' | 'pele'
  | 'cabelo' | 'barba' | 'roupas' | 'acessorios' | 'materiais' | 'emblemas'
  | 'animacao' | 'clipping' | 'compatibilidade';

export interface FaseAssembler {
  passo: PassoAssembler;
  ok: boolean;
  detalhe?: string;
}

/** Uma parte pronta (cena de um GLB de parte JÁ carregado + categoria). */
export interface ParteMontavel {
  id: string;
  categoria: 'cabelo' | 'barba' | 'roupa' | 'acessorio';
  cena: THREE.Object3D;
  /** megas 634–636 (§415.2/§417): regiões do corpo que esta parte OCULTA
   *  (declaradas no manifest §517) — o assembler mascara a base */
  mascara?: string[];
}

// ── megas 634–636 (§415.2/§417): BODY MASKING ───────────────────────
// A roupa declara as regiões que cobre; o assembler ESCONDE os triângulos
// da base cuja pele é dominada pelos bones da região (clipping some na
// raiz — nada de truque de render). Restauração = geometria original
// guardada em userData (byte-stability: sem roupa, base intocada).

/** Regiões §415.2 → bones do rig ubc-v1 que as dominam. */
export const REGIOES_UBC: Record<string, string[]> = {
  torso: ['spine_01', 'spine_02', 'spine_03', 'clavicle_l', 'clavicle_r', 'pelvis'],
  bracos: ['upperarm_l', 'lowerarm_l', 'upperarm_r', 'lowerarm_r'],
  maos: [
    'hand_l', 'hand_r',
    'index_01_l', 'index_02_l', 'index_03_l', 'middle_01_l', 'middle_02_l', 'middle_03_l',
    'pinky_01_l', 'pinky_02_l', 'pinky_03_l', 'ring_01_l', 'ring_02_l', 'ring_03_l',
    'thumb_01_l', 'thumb_02_l', 'thumb_03_l',
    'index_01_r', 'index_02_r', 'index_03_r', 'middle_01_r', 'middle_02_r', 'middle_03_r',
    'pinky_01_r', 'pinky_02_r', 'pinky_03_r', 'ring_01_r', 'ring_02_r', 'ring_03_r',
    'thumb_01_r', 'thumb_02_r', 'thumb_03_r',
  ],
  pernas: ['thigh_l', 'calf_l', 'thigh_r', 'calf_r'],
  pes: ['foot_l', 'ball_l', 'foot_r', 'ball_r'],
  cabeca: ['Head', 'neck_01'],
};

/** Aplica as máscaras §415.2 na base: esconde faces cujo TRIO de vértices
 *  é dominado por bones das regiões cobertas. Devolve faces escondidas.
 *  Guarda o index original em userData p/ restaurar (idempotente). */
export function mascararBase(
  base: THREE.Object3D,
  regioes: string[],
  mapaRegioes: Record<string, string[]> = REGIOES_UBC,
): number {
  const bonesCobertos = new Set<string>();
  for (const r of regioes) for (const b of mapaRegioes[r] ?? []) bonesCobertos.add(b);
  let escondidas = 0;
  base.traverse((n) => {
    const malha = n as THREE.SkinnedMesh;
    if (!malha.isSkinnedMesh) return;
    const geo = malha.geometry;
    // restaura o original antes de re-aplicar (troca de roupa = recomeça)
    if (malha.userData.indexOriginal) geo.setIndex(malha.userData.indexOriginal as THREE.BufferAttribute);
    if (!bonesCobertos.size) return;
    const indice = geo.getIndex();
    const skinIndex = geo.getAttribute('skinIndex') as THREE.BufferAttribute | undefined;
    const skinWeight = geo.getAttribute('skinWeight') as THREE.BufferAttribute | undefined;
    if (!indice || !skinIndex || !skinWeight) return;
    if (!malha.userData.indexOriginal) malha.userData.indexOriginal = indice;
    const nomes = malha.skeleton.bones.map((b) => b.name);
    const dominante = (v: number): string => {
      let melhor = 0;
      let peso = -1;
      for (let k = 0; k < 4; k++) {
        const w = skinWeight.getComponent(v, k);
        if (w > peso) { peso = w; melhor = skinIndex.getComponent(v, k); }
      }
      return nomes[melhor] ?? '';
    };
    const novo: number[] = [];
    for (let i = 0; i < indice.count; i += 3) {
      const a = indice.getX(i);
      const b = indice.getX(i + 1);
      const c = indice.getX(i + 2);
      const coberta = bonesCobertos.has(dominante(a))
        && bonesCobertos.has(dominante(b)) && bonesCobertos.has(dominante(c));
      if (coberta) escondidas += 1;
      else novo.push(a, b, c);
    }
    geo.setIndex(novo);
  });
  return escondidas;
}

export interface ReceitaMontagem {
  /** cena do GLB da BASE (exclusiva — o assembler é dono dela) */
  base: THREE.Object3D;
  /** clipes da base (quando houver) — o mixer nasce no passo 12 */
  animacoes?: THREE.AnimationClip[];
  partes?: ParteMontavel[];
  /** bones canônicos do rig declarado (rig-ubc-v1.json) — passo 2 */
  bonesCanonicos?: string[];
  /** §411 pele: cor multiplicada nos materiais marcados como pele (futuro
   *  §414.1 — hoje aplica em materiais cujo nome contém "skin"/"pele") */
  pele?: string | null;
}

export interface ResultadoMontagem {
  ok: boolean;
  fases: FaseAssembler[];
  /** raiz montada (base + partes REBINDADAS) — pronta p/ cena */
  raiz: THREE.Object3D | null;
  /** mixer do passo 12 (null = base sem clipes; idle procedural cobre) */
  mixer: THREE.AnimationMixer | null;
  clipes: Map<string, THREE.AnimationClip>;
  /** §481: o que a montagem NÃO representou (avisos honestos p/ a UI) */
  pendencias: string[];
}

/** Mapa nome→Bone da hierarquia (inclui esqueletos de SkinnedMesh). */
function bonesDe(raiz: THREE.Object3D): Map<string, THREE.Bone> {
  const mapa = new Map<string, THREE.Bone>();
  raiz.traverse((n) => {
    if ((n as THREE.Bone).isBone) mapa.set(n.name, n as THREE.Bone);
  });
  return mapa;
}

/** REBIND §406 passos 6–9: religa os SkinnedMesh da parte no esqueleto da
 *  BASE — Skeleton novo na ORDEM de bones da parte (boneInverses dela
 *  valem: mesmo rig ⇒ mesmo bind pose), bones vindos da base POR NOME. */
export function religarParte(
  parte: THREE.Object3D,
  bonesBase: Map<string, THREE.Bone>,
): { religados: number; ausentes: string[] } {
  const ausentes = new Set<string>();
  let religados = 0;
  parte.traverse((n) => {
    const malha = n as THREE.SkinnedMesh;
    if (!malha.isSkinnedMesh) return;
    const antigos = malha.skeleton.bones;
    const novos: THREE.Bone[] = [];
    for (const b of antigos) {
      const daBase = bonesBase.get(b.name);
      if (daBase) novos.push(daBase);
      else { ausentes.add(b.name); novos.push(b); } // degrada: mantém o da parte
    }
    const esqueleto = new THREE.Skeleton(novos, malha.skeleton.boneInverses);
    malha.bind(esqueleto, malha.bindMatrix);
    malha.frustumCulled = false; // mesma lição do mega 17 (culling × skinned)
    religados += 1;
  });
  // Rebind LIMPO ⇒ o esqueleto próprio da parte virou ÓRFÃO — PODA os
  // bones dela (nomes duplicados na raiz montada envenenariam qualquer
  // busca por nome: idle procedural §440, sockets §426, retargeting §436).
  // Rebind degradado (bone ausente) MANTÉM: as malhas ainda os referenciam.
  if (religados > 0 && ausentes.size === 0) {
    const raizesDeBones: THREE.Object3D[] = [];
    parte.traverse((n) => {
      if ((n as THREE.Bone).isBone && !((n.parent as THREE.Bone | null)?.isBone)) raizesDeBones.push(n);
    });
    for (const r of raizesDeBones) r.parent?.remove(r);
  }
  return { religados, ausentes: [...ausentes] };
}

/** Monta o personagem nos 14 passos do §406. Nunca lança: o relatório diz. */
export function montarPersonagem(receita: ReceitaMontagem): ResultadoMontagem {
  const fases: FaseAssembler[] = [];
  const pendencias: string[] = [];
  const okFase = (passo: PassoAssembler, detalhe?: string) => fases.push({ passo, ok: true, detalhe });
  const falha = (passo: PassoAssembler, detalhe: string): ResultadoMontagem => {
    fases.push({ passo, ok: false, detalhe });
    return { ok: false, fases, raiz: null, mixer: null, clipes: new Map(), pendencias };
  };

  // 1. carregar a base (a cena chega carregada — validamos a matéria)
  const base = receita.base;
  if (!base) return falha('carregar_base', 'receita sem cena de base');
  let temMalha = false;
  base.traverse((n) => { if ((n as THREE.Mesh).isMesh) temMalha = true; });
  if (!temMalha) return falha('carregar_base', 'base sem malha alguma');
  okFase('carregar_base');

  // 2. validar rig — presença EXATA dos bones canônicos (§436/§410)
  const bonesBase = bonesDe(base);
  const canonicos = receita.bonesCanonicos ?? [];
  if (canonicos.length) {
    const faltando = canonicos.filter((b) => !bonesBase.has(b));
    if (faltando.length) {
      return falha('validar_rig', `bones canônicos ausentes: ${faltando.slice(0, 5).join(', ')}${faltando.length > 5 ? '…' : ''}`);
    }
    okFase('validar_rig', `${canonicos.length} bones canônicos presentes`);
  } else {
    okFase('validar_rig', `sem lista canônica — ${bonesBase.size} bones aceitos`);
    pendencias.push('rig sem lista canônica (validação de presença pulada)');
  }

  // 3. tipo corporal §414 — aplicado no RENDERER via escala (lote 651+,
  //    flag as5.morfos3d): base e partes compartilham o esqueleto, então
  //    a escala do objeto raiz veste todo o conjunto junto (§413)
  okFase('tipo_corporal', 'coberto pelo renderer (escala §414 — as5.morfos3d)');
  // 4. morphs §412 — GLBs do farm CC0 não trazem morph targets; os
  //    ESTRUTURAIS saem via escala §414 (passo 3); expressivos ficam
  //    para a animação §440 (piscar procedural, lote 661+)
  okFase('morphs', 'base sem morph targets — estruturais via escala §414');

  // 5. pele §411/§418 — tinge materiais de PELE (nome contém skin/pele)
  if (receita.pele) {
    let tingidos = 0;
    let porMetadado = 0;
    const cor = new THREE.Color(receita.pele);
    base.traverse((n) => {
      const malha = n as THREE.Mesh;
      if (!malha.isMesh) return;
      const mats = Array.isArray(malha.material) ? malha.material : [malha.material];
      for (const m of mats) {
        const nome = (m?.name ?? '').toLowerCase();
        // onda 1408 (#165a, MEGA_BRIEFING_01 §695–§697): pele marcada pelo
        // MANIFEST v2 (bases UBC: MI_Superhero_*) — o tint multiplicativo
        // fica com o pipeline de cores (Materiais3d); aqui só reconhecemos
        if (m?.userData?.canal3d === 'pele') { porMetadado += 1; continue; }
        if ((nome.includes('skin') || nome.includes('pele')) && (m as THREE.MeshStandardMaterial).color) {
          (m as THREE.MeshStandardMaterial).color.copy(cor);
          tingidos += 1;
        }
      }
    });
    if (porMetadado && !tingidos) okFase('pele', `${porMetadado} material(is) de pele via metadados do manifest (pipeline §420)`);
    else okFase('pele', tingidos ? `${tingidos} material(is) de pele` : 'nenhum material de pele nomeado');
    if (!tingidos && !porMetadado) pendencias.push('pele pedida mas a base não nomeia material de pele');
  } else {
    okFase('pele', 'sem cor pedida');
  }

  // 6–9. anexar partes — REBIND no esqueleto da base, por categoria
  const porCategoria: Record<ParteMontavel['categoria'], PassoAssembler> = {
    cabelo: 'cabelo', barba: 'barba', roupa: 'roupas', acessorio: 'acessorios',
  };
  const contagem: Record<string, number> = {};
  for (const parte of receita.partes ?? []) {
    const { religados, ausentes } = religarParte(parte.cena, bonesBase);
    if (ausentes.length) {
      pendencias.push(`parte ${parte.id}: ${ausentes.length} bone(s) fora da base (${ausentes.slice(0, 3).join(', ')}…) — rig incompatível degradado`);
    }
    if (religados === 0) {
      pendencias.push(`parte ${parte.id} sem SkinnedMesh — anexada estática`);
    }
    base.add(parte.cena);
    contagem[parte.categoria] = (contagem[parte.categoria] ?? 0) + 1;
  }
  for (const cat of ['cabelo', 'barba', 'roupa', 'acessorio'] as const) {
    okFase(porCategoria[cat], contagem[cat] ? `${contagem[cat]} parte(s)` : 'nenhuma');
  }

  // 10. materiais §418–§421 (megas 641-644) — marca o CANAL §420 nos
  //     materiais de cada parte pela CATEGORIA (§73: cabelo/roupa/
  //     destaque). Tintura fica no pipeline central do Material Manager
  //     (Materiais3d.aplicarPipelineCores) — o renderer converte canais.
  const porCanal: Record<string, number> = {};
  for (const parte of receita.partes ?? []) {
    const canal = canalDaCategoria(parte.categoria);
    const n = marcarCanal(parte.cena, canal);
    if (n) porCanal[canal] = (porCanal[canal] ?? 0) + n;
  }
  const canaisMarcados = Object.entries(porCanal).map(([c, n]) => `${c}×${n}`);
  okFase('materiais', canaisMarcados.length
    ? `canais §73 marcados: ${canaisMarcados.join(' ')}`
    : 'sem partes — materiais dos GLBs mantidos');
  // 11. emblemas §421.1 — decals sobre a roupa: precisam da infra de
  //     captura/UV do Photo Studio 3D (§329, lote 681+) — n/a honesto
  okFase('emblemas', 'n/a nesta fase (§421.1 — decals no lote 681+)');

  // 12. configurar animação — UM mixer na RAIZ move base + partes juntas
  //     (as partes compartilham os MESMOS Bones após o rebind)
  let mixer: THREE.AnimationMixer | null = null;
  const clipes = new Map<string, THREE.AnimationClip>();
  if (receita.animacoes?.length) {
    mixer = new THREE.AnimationMixer(base);
    for (const c of receita.animacoes) clipes.set(c.name, c);
    okFase('animacao', `${clipes.size} clipe(s) no esqueleto único`);
  } else {
    okFase('animacao', 'base sem clipes — idle procedural do renderer cobre');
  }

  // 13. validar clipping — §415.2/§417 REAL (megas 634-636): as máscaras
  //     declaradas pelas partes ESCONDEM as regiões cobertas da base;
  //     + sanidade de escala (parte gigante/deslocada = algo errado)
  const regioesCobertas = [...new Set((receita.partes ?? []).flatMap((p) => p.mascara ?? []))];
  const facesEscondidas = mascararBase(base, regioesCobertas);
  const caixaBase = new THREE.Box3().setFromObject(base);
  const tamBase = caixaBase.getSize(new THREE.Vector3()).length();
  let clippingOk = true;
  for (const parte of receita.partes ?? []) {
    const caixaParte = new THREE.Box3().setFromObject(parte.cena);
    const tamParte = caixaParte.getSize(new THREE.Vector3()).length();
    if (tamParte > tamBase * 1.5) {
      clippingOk = false;
      pendencias.push(`parte ${parte.id} maior que 1.5× a base — conferir escala/rig`);
    }
  }
  okFase('clipping', `${regioesCobertas.length ? `máscaras §415.2 [${regioesCobertas.join(',')}] → ${facesEscondidas} faces da base ocultas` : 'sem máscaras'}${clippingOk ? '' : ' · parte fora de escala (ver pendências)'}`);

  // 14. confirmar compatibilidade — resumo honesto (§481)
  okFase('compatibilidade', pendencias.length ? `${pendencias.length} pendência(s) declarada(s)` : 'sem pendências');

  return { ok: true, fases, raiz: base, mixer, clipes, pendencias };
}
