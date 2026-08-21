// services/RegistroEfeitos.ts — onda 1417 (MEGA_BRIEFING_01 P9-A.2/7,
// P9-B 2D; decisão #199): FAMÍLIAS DE AURA como DADO — 8 atributos por
// aura, cobrindo as 15 clássicas + as premium `aur_px_*`.
//
// `cobreRosto` é contrato HARD FAIL (§105/§141): aura NUNCA pode cobrir o
// rosto — o teste da onda reprova qualquer ficha com true (e novas auras
// precisam declarar a ficha; ficha ausente também é falha). Registry
// consultivo: nada aqui muda render/validarConfig de configs salvos.
// @version 1.0.0  @created 2026-08-21

export type FamiliaAura =
  | 'energia' | 'elemental' | 'mistica' | 'cosmica' | 'tecnologica';

export interface FichaAura {
  familia: FamiliaAura;
  /** onde a massa da aura vive em relação à figura */
  camada: 'tras' | 'frente' | 'ambas';
  /** 0–1: presença visual padrão (antes dos params §71) */
  intensidadeBase: number;
  /** 0–2: multiplicador de ritmo das animações */
  velocidadeBase: number;
  particulas: boolean;
  emissiva: boolean;
  /** HARD FAIL §105: aura jamais cobre o rosto (região 84–156 × 66–150) */
  cobreRosto: boolean;
  /** raio dominante em px do viewBox 240 */
  raio: number;
}

const f = (familia: FamiliaAura, camada: FichaAura['camada'], intensidadeBase: number,
  velocidadeBase: number, particulas: boolean, emissiva: boolean, raio: number): FichaAura =>
  ({ familia, camada, intensidadeBase, velocidadeBase, particulas, emissiva, cobreRosto: false, raio });

/** As 15 auras clássicas + premium (#199). */
export const FICHAS_AURA: Record<string, FichaAura> = {
  aur_neon: f('tecnologica', 'tras', 0.8, 1, false, true, 108),
  aur_plasma: f('energia', 'tras', 0.85, 1.2, true, true, 112),
  aur_eletrica: f('energia', 'ambas', 0.9, 1.6, true, true, 110),
  aur_cristal: f('mistica', 'tras', 0.7, 0.7, false, false, 106),
  aur_dshow: f('tecnologica', 'tras', 0.8, 1, true, true, 110),
  aur_orbital: f('cosmica', 'ambas', 0.75, 0.9, true, false, 116),
  aur_gelo: f('elemental', 'tras', 0.7, 0.6, true, false, 108),
  aur_fenix: f('elemental', 'ambas', 0.9, 1.3, true, true, 118),
  aur_solar: f('cosmica', 'tras', 0.85, 0.8, false, true, 114),
  aur_sombria: f('mistica', 'tras', 0.75, 0.7, true, false, 110),
  aur_runica: f('mistica', 'ambas', 0.8, 0.9, true, true, 112),
  aur_prisma: f('mistica', 'tras', 0.8, 1, false, true, 110),
  aur_vento: f('elemental', 'ambas', 0.65, 1.4, true, false, 114),
  aur_estelar: f('cosmica', 'ambas', 0.8, 0.9, true, true, 116),
  aur_toxica: f('elemental', 'tras', 0.8, 1.1, true, true, 110),
  // onda 1417 (#199): premium — rear glow + main + partículas na frente
  aur_px_fluxo: f('energia', 'ambas', 0.85, 1, true, true, 114),
  aur_px_cristal: f('mistica', 'ambas', 0.75, 0.7, true, false, 112),
  aur_px_chama: f('elemental', 'ambas', 0.9, 1.3, true, true, 116),
  aur_px_estelar: f('cosmica', 'ambas', 0.8, 0.9, true, true, 118),
};

export function fichaAuraDe(id: string): FichaAura | undefined {
  return FICHAS_AURA[id];
}

/** HARD FAIL §105: true = reprovada (o teste da onda quebra o build). */
export function cobreRosto(id: string): boolean {
  return fichaAuraDe(id)?.cobreRosto ?? false;
}

// ── Looks 2D (P8-F): contrato de APRESENTAÇÃO — CSS vars por [data-look]
// no palco (styles/estudio.css); o SVG salvo NUNCA muda. `portraitSafe`
// mantém o rosto limpo (sem vinheta alta/rim forte). Seleção de look na
// UI chega na 1418 (integração) — aqui vive o contrato + o CSS.
export interface Look2d {
  id: 'studio' | 'portrait' | 'hero' | 'neon';
  nome: string;
  /** variação que preserva o rosto (P8-F.4) */
  portraitSafe: boolean;
}

export const LOOKS_2D: Look2d[] = [
  { id: 'studio', nome: 'Studio', portraitSafe: true },
  { id: 'portrait', nome: 'Portrait', portraitSafe: true },
  { id: 'hero', nome: 'Hero', portraitSafe: false },
  { id: 'neon', nome: 'Neon', portraitSafe: false },
];
