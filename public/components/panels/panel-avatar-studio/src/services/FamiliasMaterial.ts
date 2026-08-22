// services/FamiliasMaterial.ts — MATERIAL FAMILY REGISTRY (onda 1408,
// MEGA_BRIEFING_01 Parte 7 §1507–§1518, §1597–§1599, §1678–§1681; decisão #160).
// @version 1.0.0  @created 2026-08-19
//
// COR ≠ MATERIAL (§1508): a cor vem dos canais §73 (Materiais3d); a
// RESPOSTA À LUZ vem da FAMÍLIA (roughness/metalness/envMapIntensity/
// normalScale/emissive/transmission…), declarada pelo ASSET no manifest
// (`materiais: { <nomeMaterial>: { familia, overrides?, naoTingir?, canal? } }`)
// — nunca pelo estado salvo (byte-stability por construção). Defaults
// centralizados e VERSIONADOS; zero `roughness=0.37` solto em componente
// (§1510). Aplicação: Materiais3d.aplicarFamilias() só quando o manifest
// declara E a flag as6.material_v2 está ligada; sem declaração = material
// do GLB intocado (§1680 — assets publicados não mudam sozinhos).
// Tiers (§1519–§1529, #161): econômico/standard/ultra ↔ QualityManager;
// MeshPhysicalMaterial (three core) só em standard/ultra para vidro/cristal;
// shaders custom (holograma/energia) ficam para a onda 1421 (Ultra).
export type FamiliaMaterialId =
  | 'skin' | 'eyes' | 'teeth' | 'hair' | 'hair_soft' | 'hair_gloss' | 'hair_coarse'
  | 'cotton' | 'denim' | 'wool' | 'knit' | 'satin' | 'silk' | 'technical'
  | 'leather_matte' | 'leather_polished' | 'leather_worn' | 'rubber' | 'plastic_matte' | 'plastic_gloss' | 'plastic_tech'
  | 'metal_brushed' | 'metal_polished' | 'gold' | 'silver' | 'bronze' | 'armor_composite'
  | 'glass_clear' | 'glass_frosted' | 'glass_tinted' | 'crystal' | 'hologram' | 'energy' | 'emissive';

export interface ParamsFamilia {
  roughness: number;
  metalness: number;
  /** envMapIntensity (resposta ao environment) */
  env: number;
  /** escala do normal map quando o asset tem (1 = como veio) */
  normalScale?: number;
  /** emissiveIntensity alvo (≤ TETO_EMISSIVO) */
  emissive?: number;
  /** vidro/cristal (MeshPhysicalMaterial) — só standard/ultra */
  transmission?: number;
  ior?: number;
  thickness?: number;
  /** brilho de camada (sheen) p/ tecidos finos/pele premium — standard/ultra */
  sheen?: number;
  /** clearcoat p/ polidos — standard/ultra */
  clearcoat?: number;
  /** onda 1421 (#208): anisotropia de cabelo (MeshPhysicalMaterial) — ULTRA */
  anisotropy?: number;
  /** política de alpha p/ cabelo/vidro (publicador/Parte 4) */
  alpha?: 'opaque' | 'mask' | 'blend';
}

export interface FamiliaMaterial {
  id: FamiliaMaterialId;
  nome: string;
  versao: number;
  /** resposta por tier (econômico herda standard sem physical) */
  padrao: ParamsFamilia;
  /** override opcional p/ ultra (sheen/clearcoat/anisotropy) */
  ultra?: Partial<ParamsFamilia>;
  /** onda 1421 (#208): override opcional p/ o tier ECONÔMICO (skin 3 tiers
   *  §1521 — resposta próxima da standard; ΔE visual validado no gate ★) */
  economico?: Partial<Pick<ParamsFamilia, 'roughness' | 'metalness' | 'env' | 'emissive'>>;
  /** nunca tingir pela cor do canal (olhos, dentes, metais nobres, logos) */
  naoTingir?: boolean;
  /** canal §73 sugerido quando o asset não declara */
  canalSugerido?: 'pele' | 'cabelo' | 'roupa' | 'destaque';
}

const F = (id: FamiliaMaterialId, nome: string, padrao: ParamsFamilia, extra: Partial<FamiliaMaterial> = {}): FamiliaMaterial =>
  ({ id, nome, versao: 1, padrao, ...extra });

/** Registry v1 — valores iniciais curados (Parte 7 §1519–§1566); refinados
 *  com o Golden Material Set (onda 1421) e before/after aprovado. */
export const FAMILIAS_MATERIAL: Record<FamiliaMaterialId, FamiliaMaterial> = {
  // onda 1421 (#208): SKIN em 3 TIERS (§1521–§1526) — o econômico fica
  // PERTO do standard (deltas travados por teste; ΔE visual no gate ★)
  skin: F('skin', 'Pele', { roughness: 0.55, metalness: 0, env: 0.6, normalScale: 0.6 }, { ultra: { sheen: 0.15 }, economico: { roughness: 0.6, env: 0.5 }, canalSugerido: 'pele' }),
  eyes: F('eyes', 'Olhos', { roughness: 0.15, metalness: 0, env: 1.0, clearcoat: 0.3 }, { naoTingir: true }),
  teeth: F('teeth', 'Dentes', { roughness: 0.35, metalness: 0, env: 0.8 }, { naoTingir: true }),
  hair: F('hair', 'Cabelo', { roughness: 0.7, metalness: 0, env: 0.7, alpha: 'mask' }, { ultra: { anisotropy: 0.35 }, economico: { roughness: 0.75, env: 0.6 }, canalSugerido: 'cabelo' }),
  hair_soft: F('hair_soft', 'Cabelo macio', { roughness: 0.75, metalness: 0, env: 0.6, alpha: 'mask' }, { canalSugerido: 'cabelo' }),
  hair_gloss: F('hair_gloss', 'Cabelo brilhante', { roughness: 0.45, metalness: 0, env: 0.9, alpha: 'mask' }, { ultra: { clearcoat: 0.2, anisotropy: 0.45 }, canalSugerido: 'cabelo' }),
  hair_coarse: F('hair_coarse', 'Cabelo áspero', { roughness: 0.85, metalness: 0, env: 0.5, alpha: 'mask' }, { canalSugerido: 'cabelo' }),
  cotton: F('cotton', 'Algodão', { roughness: 0.9, metalness: 0, env: 0.4 }, { canalSugerido: 'roupa' }),
  denim: F('denim', 'Denim', { roughness: 0.85, metalness: 0, env: 0.45, normalScale: 1.0 }, { canalSugerido: 'roupa' }),
  wool: F('wool', 'Lã', { roughness: 0.95, metalness: 0, env: 0.35 }, { ultra: { sheen: 0.3 }, canalSugerido: 'roupa' }),
  knit: F('knit', 'Tricô', { roughness: 0.92, metalness: 0, env: 0.35 }, { canalSugerido: 'roupa' }),
  satin: F('satin', 'Cetim', { roughness: 0.35, metalness: 0, env: 0.9 }, { ultra: { sheen: 0.6 }, canalSugerido: 'roupa' }),
  silk: F('silk', 'Seda', { roughness: 0.3, metalness: 0, env: 1.0 }, { ultra: { sheen: 0.7 }, canalSugerido: 'roupa' }),
  technical: F('technical', 'Técnico', { roughness: 0.5, metalness: 0.05, env: 0.7 }, { canalSugerido: 'roupa' }),
  leather_matte: F('leather_matte', 'Couro fosco', { roughness: 0.7, metalness: 0, env: 0.6, normalScale: 0.8 }, { canalSugerido: 'roupa' }),
  leather_polished: F('leather_polished', 'Couro polido', { roughness: 0.35, metalness: 0, env: 0.9 }, { ultra: { clearcoat: 0.4 }, canalSugerido: 'roupa' }),
  leather_worn: F('leather_worn', 'Couro gasto', { roughness: 0.8, metalness: 0, env: 0.5, normalScale: 1.0 }, { canalSugerido: 'roupa' }),
  rubber: F('rubber', 'Borracha', { roughness: 0.8, metalness: 0, env: 0.4 }, { canalSugerido: 'destaque' }),
  plastic_matte: F('plastic_matte', 'Plástico fosco', { roughness: 0.6, metalness: 0, env: 0.6 }, { canalSugerido: 'destaque' }),
  plastic_gloss: F('plastic_gloss', 'Plástico brilhante', { roughness: 0.2, metalness: 0, env: 1.0 }, { ultra: { clearcoat: 0.5 }, canalSugerido: 'destaque' }),
  plastic_tech: F('plastic_tech', 'Plástico técnico', { roughness: 0.4, metalness: 0.05, env: 0.8 }, { canalSugerido: 'destaque' }),
  metal_brushed: F('metal_brushed', 'Metal escovado', { roughness: 0.45, metalness: 1, env: 1.0 }, { canalSugerido: 'destaque' }),
  metal_polished: F('metal_polished', 'Metal polido', { roughness: 0.15, metalness: 1, env: 1.2 }, { canalSugerido: 'destaque' }),
  gold: F('gold', 'Ouro', { roughness: 0.3, metalness: 1, env: 1.2 }, { naoTingir: true }),
  silver: F('silver', 'Prata', { roughness: 0.25, metalness: 1, env: 1.2 }, { naoTingir: true }),
  bronze: F('bronze', 'Bronze', { roughness: 0.4, metalness: 1, env: 1.0 }, { naoTingir: true }),
  armor_composite: F('armor_composite', 'Armadura composta', { roughness: 0.5, metalness: 0.6, env: 0.9 }, { canalSugerido: 'roupa' }),
  glass_clear: F('glass_clear', 'Vidro', { roughness: 0.05, metalness: 0, env: 1.2, transmission: 0.9, ior: 1.5, thickness: 0.05, alpha: 'blend' }),
  glass_frosted: F('glass_frosted', 'Vidro fosco', { roughness: 0.45, metalness: 0, env: 1.0, transmission: 0.7, ior: 1.5, thickness: 0.1, alpha: 'blend' }),
  glass_tinted: F('glass_tinted', 'Vidro tintado', { roughness: 0.1, metalness: 0, env: 1.2, transmission: 0.6, ior: 1.5, thickness: 0.05, alpha: 'blend' }, { canalSugerido: 'destaque' }),
  crystal: F('crystal', 'Cristal', { roughness: 0.08, metalness: 0, env: 1.3, transmission: 0.8, ior: 1.8, thickness: 0.2, emissive: 0.4 }, { canalSugerido: 'destaque' }),
  hologram: F('hologram', 'Holograma', { roughness: 0.3, metalness: 0, env: 0.8, emissive: 1.2, alpha: 'blend' }, { canalSugerido: 'destaque' }),
  energy: F('energy', 'Energia', { roughness: 0.4, metalness: 0, env: 0.5, emissive: 1.8, alpha: 'blend' }, { canalSugerido: 'destaque' }),
  emissive: F('emissive', 'Emissivo', { roughness: 0.6, metalness: 0, env: 0.5, emissive: 1.5 }, { canalSugerido: 'destaque' }),
};

/** Cores PBR-safe de referência p/ metais nobres (§1549–§1554, §1631–§1635):
 *  ouro NÃO é #FFD700 — são albedos físicos aproximados (sRGB). Só usadas
 *  no caminho de render 3D de famílias metálicas; nunca alteram hex salvo. */
export const ALBEDO_METAL: Partial<Record<FamiliaMaterialId, number>> = {
  gold: 0xffc46b, silver: 0xf2f2f0, bronze: 0xcd8a55, metal_brushed: 0xb8bcc4, metal_polished: 0xc9cdd4,
};

export function familiaDe(id: string | null | undefined): FamiliaMaterial | null {
  return (id && (FAMILIAS_MATERIAL as Record<string, FamiliaMaterial>)[id]) || null;
}
export function familias(): FamiliaMaterial[] { return Object.values(FAMILIAS_MATERIAL); }

/** Clamp PBR-safe de luminância em sRGB (§1631–§1634): evita #000/#FFF
 *  puros no render 3D de famílias metal/pele; aplicado só na cópia usada
 *  pelo material — o hex persistido nunca muda. */
export function corPbrSegura(hex: number, min = 0x18, max = 0xf4): number {
  const r = Math.min(max, Math.max(min, (hex >> 16) & 0xff));
  const g = Math.min(max, Math.max(min, (hex >> 8) & 0xff));
  const b = Math.min(max, Math.max(min, hex & 0xff));
  return (r << 16) | (g << 8) | b;
}

// ── onda 1421 (MEGA_BRIEFING_01 P7-C..F §1519–§1566, §1631–§1651;
//    decisão #208): TIERS, TETO EMISSIVO POR RARIDADE e GOLDEN SET ────

/** Extras "physical" que o tier ECONÔMICO nunca paga (material standard
 *  plano; §1526 — material por LOD/tier). */
const EXTRAS_FISICOS = ['transmission', 'ior', 'thickness', 'sheen', 'clearcoat', 'anisotropy'] as const;

/** Resolve os parâmetros EFETIVOS da família no tier (#208, fonte única):
 *  econômico = padrao + economico, SEM extras físicos e SEM normalScale;
 *  medio = padrao; alto = padrao + ultra. Puro e determinístico. */
export function paramsFamiliaPorTier(
  fam: FamiliaMaterial,
  tier: 'economico' | 'medio' | 'alto',
): ParamsFamilia {
  if (tier === 'alto') return { ...fam.padrao, ...(fam.ultra ?? {}) };
  if (tier === 'medio') return { ...fam.padrao };
  const p: ParamsFamilia = { ...fam.padrao, ...(fam.economico ?? {}) };
  for (const k of EXTRAS_FISICOS) delete (p as unknown as Record<string, unknown>)[k];
  delete (p as unknown as Record<string, unknown>).normalScale;
  return p;
}

/** Deltas MÁXIMOS entre tiers p/ famílias orgânicas (§1521 — proxy de
 *  dado do "ΔE entre tiers < limiar"; o ΔE visual é do gate ★). */
export const DELTA_MAX_TIER = { roughness: 0.2, env: 0.4 } as const;

/** §1636–§1642 (#208): teto de EMISSÃO por raridade — o budget emissivo
 *  cresce com a raridade e NUNCA passa o teto global §418.2 (2.0). O
 *  bloom seletivo vem daí: o limiar alto dos looks (1420) só estoura o
 *  que a raridade permitiu emitir. */
export const TETO_EMISSIVO_POR_RARIDADE: Record<'comum' | 'raro' | 'epico' | 'lendario' | 'mitico', number> = {
  comum: 1.2, raro: 1.4, epico: 1.6, lendario: 1.8, mitico: 2.0,
};

export function tetoEmissivo(raridade?: string | null): number {
  return (raridade && TETO_EMISSIVO_POR_RARIDADE[raridade as keyof typeof TETO_EMISSIVO_POR_RARIDADE]) || 2;
}

/** GOLDEN MATERIAL SET M01–M12 (§1751, #208): 12 casos travados como
 *  DADO — família × tier × parâmetros ESPERADOS (snapshot literal;
 *  mudou o registry sem decisão = teste quebra, doutrina #83). A cena
 *  de calibração (montarCenaMateriais) monta 1 esfera por caso. */
export const GOLDEN_MATERIAIS: ReadonlyArray<{ id: string; familia: FamiliaMaterialId; tier: 'economico' | 'medio' | 'alto'; esperado: { roughness: number; metalness: number; env: number } }> = [
  { id: 'M01', familia: 'skin', tier: 'medio', esperado: { roughness: 0.55, metalness: 0, env: 0.6 } },
  { id: 'M02', familia: 'skin', tier: 'economico', esperado: { roughness: 0.6, metalness: 0, env: 0.5 } },
  { id: 'M03', familia: 'skin', tier: 'alto', esperado: { roughness: 0.55, metalness: 0, env: 0.6 } },
  { id: 'M04', familia: 'hair', tier: 'alto', esperado: { roughness: 0.7, metalness: 0, env: 0.7 } },
  { id: 'M05', familia: 'cotton', tier: 'medio', esperado: { roughness: 0.9, metalness: 0, env: 0.4 } },
  { id: 'M06', familia: 'leather_polished', tier: 'alto', esperado: { roughness: 0.35, metalness: 0, env: 0.9 } },
  { id: 'M07', familia: 'gold', tier: 'medio', esperado: { roughness: 0.3, metalness: 1, env: 1.2 } },
  { id: 'M08', familia: 'silver', tier: 'alto', esperado: { roughness: 0.25, metalness: 1, env: 1.2 } },
  { id: 'M09', familia: 'glass_clear', tier: 'alto', esperado: { roughness: 0.05, metalness: 0, env: 1.2 } },
  { id: 'M10', familia: 'crystal', tier: 'alto', esperado: { roughness: 0.08, metalness: 0, env: 1.3 } },
  { id: 'M11', familia: 'emissive', tier: 'medio', esperado: { roughness: 0.6, metalness: 0, env: 0.5 } },
  { id: 'M12', familia: 'hologram', tier: 'alto', esperado: { roughness: 0.3, metalness: 0, env: 0.8 } },
];
