// services/PoderesFamilia.ts — FAMÍLIAS de poder (mega 282 · §153.1–.4)
// e roteiro visual por família (megas 283–286), lote 281–290.
// @version 1.0.0  @created 2026-08-05
//
// Classificação DETERMINÍSTICA dos poderes existentes (efeito/aura) nas 4
// famílias do briefing: overrides por id (onde o briefing nomeia o poder,
// ex.: Portal de Dados é Dshow Original) + fallback por tema. Item novo
// sem override cai pelo tema — nunca fica sem família. Cada família tem
// um ROTEIRO de partículas (§156) que entra na sequência do §154 quando
// a flag as5.poderes_familia está ligada.
import type { ParamsParticulas, TierParticulas, TipoParticula } from '../engine/particulas';
import { svgParticulas } from '../engine/particulas';
import { itemPorId } from './AvatarCatalog';

export type FamiliaPoder = 'originals' | 'tecnologico' | 'elemental' | 'cosmico';

export const ROTULO_FAMILIA: Record<FamiliaPoder, string> = {
  originals: 'Dshow Originals',   // §153.1
  tecnologico: 'Tecnológico',     // §153.2
  elemental: 'Elemental',         // §153.3
  cosmico: 'Cósmico',             // §153.4
};

/** Onde o briefing NOMEIA o poder, o id manda (ex.: §153.1 Portal de
 *  Dados, Chuva de Pixels ≈ nossos portal/chuva digital). */
const POR_ID: Record<string, FamiliaPoder> = {
  aur_dshow: 'originals',    // §153.1 Guardião do Showroom
  aur_prisma: 'originals',   // §153.1 Núcleo RGB
  aur_neon: 'originals',     // §153.1 Pulso LED
  efe_portal: 'originals',   // §153.1 Portal de Dados
  efe_confete: 'originals',
  efe_moedas: 'originals',
  efe_metricas: 'originals',
  efe_chuva: 'tecnologico',  // §153.2 Data Storm
  efe_scanlines: 'tecnologico',
  efe_glitch: 'tecnologico',
  efe_holo_interf: 'tecnologico',
  aur_eletrica: 'tecnologico', // §153.2 Neural Pulse
  aur_fenix: 'elemental',    // §153.3 Flame Core
  aur_cristal: 'elemental',  // §153.3 Crystal Growth
  aur_vento: 'elemental',    // §153.3 Wind Spiral
  efe_bolhas: 'elemental',   // §153.3 Water Sphere
  aur_orbital: 'cosmico',    // §153.4 Orbital Rings
  aur_solar: 'cosmico',      // §153.4 Solar Burst
  aur_sombria: 'cosmico',    // §153.4 Lunar Veil
  aur_estelar: 'cosmico',    // §153.4 Starfall
  efe_veu_aurora: 'cosmico', // §153.4 Nebula Form
  efe_aura: 'cosmico',
  efe_poeira: 'cosmico',
};

/** Fallback por tema — item novo nunca fica órfão de família. */
const POR_TEMA: Record<string, FamiliaPoder> = {
  dshow: 'originals', conquista: 'originals', executivo: 'originals', casual: 'originals',
  cyberpunk: 'tecnologico', tecnologia: 'tecnologico', 'retrô': 'tecnologico', gamer: 'tecnologico',
  natureza: 'elemental', clima: 'elemental', fantasia: 'elemental',
  'sci-fi': 'cosmico',
};

export function familiaDoPoder(id: string): FamiliaPoder {
  const porId = POR_ID[id];
  if (porId) return porId;
  const tema = itemPorId(id)?.tema ?? '';
  return POR_TEMA[tema] ?? 'originals';
}

/** Roteiro visual §153.1–.4: cada família = campo de partículas próprio
 *  (megas 283–286). A cor vem do DESTAQUE do avatar — o poder é do
 *  usuário, não da paleta da casa. */
const ROTEIROS: Record<FamiliaPoder, { tipo: TipoParticula; params: Omit<ParamsParticulas, 'cor'> }> = {
  // §153.1 (mega 283): pixels RGB explodindo do núcleo — Pulso LED/Núcleo RGB
  originals: {
    tipo: 'pixels',
    params: { quantidade: 26, tamanho: 5, velocidade: 1.2, direcao: 'explodir', opacidade: 0.9, duracaoMs: 1400, turbulencia: 0.2 },
  },
  // §153.2 (mega 284): linhas de dados caindo — Data Storm/Chuva digital
  tecnologico: {
    tipo: 'linhas',
    params: { quantidade: 30, tamanho: 6, velocidade: 1.6, direcao: 'cair', opacidade: 0.8, duracaoMs: 1600, turbulencia: 0.1 },
  },
  // §153.3 (mega 285): faíscas subindo — Flame Core/Lightning Surge
  elemental: {
    tipo: 'faiscas',
    params: { quantidade: 24, tamanho: 6, velocidade: 1, direcao: 'subir', opacidade: 0.85, duracaoMs: 1800, turbulencia: 0.6 },
  },
  // §153.4 (mega 286): estrelas em órbita — Orbital Rings/Starfall
  cosmico: {
    tipo: 'estrelas',
    params: { quantidade: 16, tamanho: 5, velocidade: 0.8, direcao: 'orbitar', opacidade: 0.85, duracaoMs: 2400, turbulencia: 0 },
  },
};

/** SVG do roteiro da família — pronto p/ overlay do palco (§154 passo 5). */
export function svgRoteiroFamilia(
  familia: FamiliaPoder,
  corDestaque: string,
  tier: TierParticulas = 'medio',
  animado = true,
): string {
  const r = ROTEIROS[familia];
  return svgParticulas(r.tipo, { ...r.params, cor: corDestaque }, tier, 3, animado);
}
