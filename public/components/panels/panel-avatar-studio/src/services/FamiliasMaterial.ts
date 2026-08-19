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
  skin: F('skin', 'Pele', { roughness: 0.55, metalness: 0, env: 0.6, normalScale: 0.6 }, { ultra: { sheen: 0.15 }, canalSugerido: 'pele' }),
  eyes: F('eyes', 'Olhos', { roughness: 0.15, metalness: 0, env: 1.0, clearcoat: 0.3 }, { naoTingir: true }),
  teeth: F('teeth', 'Dentes', { roughness: 0.35, metalness: 0, env: 0.8 }, { naoTingir: true }),
  hair: F('hair', 'Cabelo', { roughness: 0.7, metalness: 0, env: 0.7, alpha: 'mask' }, { canalSugerido: 'cabelo' }),
  hair_soft: F('hair_soft', 'Cabelo macio', { roughness: 0.75, metalness: 0, env: 0.6, alpha: 'mask' }, { canalSugerido: 'cabelo' }),
  hair_gloss: F('hair_gloss', 'Cabelo brilhante', { roughness: 0.45, metalness: 0, env: 0.9, alpha: 'mask' }, { ultra: { clearcoat: 0.2 }, canalSugerido: 'cabelo' }),
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
