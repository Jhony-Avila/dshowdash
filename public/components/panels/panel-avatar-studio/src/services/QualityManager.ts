// services/QualityManager.ts — QUALITY MANAGER central (AS6 Parte 9,
// lote 1021–1030, decisão #104, flag as6.quality).
// @version 1.0.0  @created 2026-08-09
//
// Antes, cada renderer decidia qualidade sozinho (tier adaptativo §528 no
// 3D, DPR §483, densidade de partículas fixa no 2D, blur no CSS). O AS6
// pede UMA fonte: o usuário (ou o device, no Auto) escolhe o PERFIL e os
// consumidores CONSULTAM — 3D recebe a dica de tier, o shell expõe
// [data-qualidade] (o CSS desliga blur/efeitos caros no eco) e as
// partículas do palco escalam a densidade. Nada aqui toca render SALVO
// (byte-stability): qualidade é apresentação.
import { flag } from '../nucleo/flags';
import type { QualidadeTier } from '../nucleo/contratos';

export type PerfilQualidade = 'auto' | 'eco' | 'equilibrado' | 'alto';
export const PERFIS_QUALIDADE: Array<{ id: PerfilQualidade; nome: string }> = [
  { id: 'auto', nome: 'Auto' },
  { id: 'eco', nome: 'Eco' },
  { id: 'equilibrado', nome: 'Equilibrado' },
  { id: 'alto', nome: 'Alto' },
];
export const CHAVE_QUALIDADE = 'dshow.avst6.qualidade.v1';
export const EVENTO_QUALIDADE = 'avst6:qualidade';

export function perfilGuardado(): PerfilQualidade {
  try {
    const v = localStorage.getItem(CHAVE_QUALIDADE) as PerfilQualidade | null;
    return v && PERFIS_QUALIDADE.some((p) => p.id === v) ? v : 'auto';
  } catch { return 'auto'; }
}

export function definirPerfil(p: PerfilQualidade): void {
  try { localStorage.setItem(CHAVE_QUALIDADE, p); } catch { /* sem storage */ }
  try { window.dispatchEvent(new CustomEvent(EVENTO_QUALIDADE, { detail: { perfil: p } })); } catch { /* SSR */ }
}

/** Resolve o Auto pelos SINAIS do device (determinístico p/ um device). */
function resolverAuto(): Exclude<PerfilQualidade, 'auto'> {
  try {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (nav.connection?.saveData) return 'eco';
    const mem = nav.deviceMemory ?? 8;
    const nucleos = nav.hardwareConcurrency ?? 8;
    if (mem <= 4 || nucleos <= 4) return 'eco';
    if (mem >= 8 && nucleos >= 8) return 'alto';
    return 'equilibrado';
  } catch { return 'equilibrado'; }
}

export interface Qualidade {
  perfil: Exclude<PerfilQualidade, 'auto'>;
  /** dica de tier p/ o 3D (o adaptativo §528 continua mandando no fim) */
  tier3d: QualidadeTier;
  /** multiplicador de densidade das partículas do PALCO (§156) */
  particulas: number;
  /** eco desliga blur/efeitos caros via [data-qualidade] no CSS */
  efeitosCaros: boolean;
}

/** Fonte ÚNICA (§ Parte 9): flag off = 'equilibrado' com tudo padrão —
 *  os consumidores gated nem chamam, mas o retorno é neutro por via das
 *  dúvidas (fail-safe). */
export function qualidade(): Qualidade {
  if (!flag('as6.quality')) {
    return { perfil: 'equilibrado', tier3d: 'medio', particulas: 1, efeitosCaros: true };
  }
  const escolhido = perfilGuardado();
  const perfil = escolhido === 'auto' ? resolverAuto() : escolhido;
  return {
    perfil,
    tier3d: perfil === 'eco' ? 'economico' : perfil === 'alto' ? 'alto' : 'medio',
    particulas: perfil === 'eco' ? 0.5 : perfil === 'alto' ? 1.25 : 1,
    efeitosCaros: perfil !== 'eco',
  };
}

// ── onda 1420 (MEGA_BRIEFING_01 §1973–§1977, #206): DEGRADAÇÃO POR
//    PASS da cadeia de pós v2 (as6.pos_v2) — mapeada AQUI (fonte única
//    de qualidade), consumida pelo Renderizador3d. Regra §1975: o passo
//    mais caro (bloom, render target extra) cai primeiro; grade e
//    vinheta são shaders full-screen baratos e sobrevivem no médio; o
//    econômico não paga composer nenhum (cadeia inteira fora). ─────────
export interface PassesPos { bloom: boolean; grade: boolean; vinheta: boolean }

export const PASSES_POR_TIER: Record<QualidadeTier, PassesPos> = {
  economico: { bloom: false, grade: false, vinheta: false },
  medio: { bloom: false, grade: true, vinheta: true },
  alto: { bloom: true, grade: true, vinheta: true },
};

/** Passes de pós permitidos no tier (fail-safe: tier desconhecido = médio). */
export function passesPos(tier: QualidadeTier | string): PassesPos {
  return PASSES_POR_TIER[tier as QualidadeTier] ?? PASSES_POR_TIER.medio;
}
