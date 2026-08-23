// engine/footwear.ts — decisão A+ §12/§71/§72/§73: CALÇADO como DOMÍNIO real.
// Até aqui o calçado era desenhado com coordenadas fixas (partes/premium/
// vestuario CALCADOS_PREMIUM) — não ancorado ao PÉ, então não acompanha a
// anatomia por perfil (o corpo mudou de proporção no §13; o sapato precisa
// pousar no pé certo, como a roupa pousa no torso). Este módulo dá:
//   (1) pontosPe(perfil, lado): a ÂNCORA do pé (tornozelo/chão/largura/drift)
//       derivada de anatomiaCorpo — FONTE ÚNICA p/ um calçado autorado calçar
//       qualquer perfil (espelha a matemática do pé em corpo.perna()).
//   (2) o modelo de ESTRUTURA do calçado: zonas nomeadas (cabedal/entressola/
//       sola/biqueira/salto/colarinho/língua) + parâmetros de fit (salto/drop/
//       cano) — o "idioma" de um HeroAsset2D de calçado (§7 aplicado ao pé).
// Não redesenha o calçado legado (byte-stable); é o contrato do DOMÍNIO novo.
// @version 1.0.0  @created 2026-08-23 (decisão A+)
import { anatomiaCorpo } from './partes/corpo';
import type { PerfilCorpo2D } from './partes/corpo';

/** Zonas estruturais de um calçado (o que um asset de calçado nomeia). */
export type FootwearZone =
  | 'sola'        // contato com o chão (grip/valor mais escuro)
  | 'entressola'  // faixa clara entre cabedal e sola (volume)
  | 'cabedal'     // corpo do calçado (upper) — canal de cor principal
  | 'biqueira'    // toe box (ponta) — pega luz
  | 'colarinho'   // colar do tornozelo (padding)
  | 'lingua'      // língua sob o cadarço
  | 'contraforte' // calcanhar (heel counter)
  | 'salto'       // salto (heel) — altura declarada
  | 'cadarco';    // cadarço/fivela — canal destaque

export const FOOTWEAR_ZONES: readonly FootwearZone[] = [
  'sola', 'entressola', 'cabedal', 'biqueira', 'colarinho', 'lingua', 'contraforte', 'salto', 'cadarco',
];

/** Âncora do pé de UM lado (s=-1 esquerdo do observador, s=1 direito). */
export interface PontosPe {
  s: 1 | -1;
  ax: number;          // eixo do tornozelo (x)
  yTornozelo: number;  // topo do calçado (tornozelo)
  yChao: number;       // linha do solo
  larguraPe: number;   // meia-largura do pé (externa)
  drift: number;       // deslocamento do bico p/ fora (assinado)
}

/**
 * Âncora do pé derivada de anatomiaCorpo — MESMA matemática do pé em
 * corpo.perna() (hx = cx + s·quadril/2; ax = hx − s; pa = max(8, coxa−4)),
 * exposta como FONTE ÚNICA p/ calçados autorados calçarem qualquer perfil.
 */
export function pontosPe(perfil: PerfilCorpo2D, s: 1 | -1): PontosPe {
  const A = anatomiaCorpo(perfil);
  // MESMA matemática de corpo.perna(): hx = cx + s·quadril/2; ax = hx − s;
  // pa = max(8, coxa − 4). Agora com a coxa REAL (AnatomiaCorpo.coxa).
  const hx = A.cx + s * (A.quadril * 0.5);
  const ax = hx - s * 1;
  const pa = Math.max(8, A.coxa - 4);
  return { s, ax, yTornozelo: A.yTor - 4, yChao: A.yPe + 5, larguraPe: pa - 1, drift: s * 3 };
}

/** Parâmetros de FIT de um calçado (declarados pelo asset). */
export interface EstruturaCalcado {
  /** altura do salto em px (0 = raso; social ~4; bota ~6). */
  salto: number;
  /** drop biqueira↔calcanhar (0 = plano; >0 = ponta mais baixa). */
  drop: number;
  /** altura do cano acima do tornozelo (0 = baixo; bota > 20). */
  cano: number;
  /** zonas presentes neste calçado (subconjunto de FOOTWEAR_ZONES). */
  zonas: FootwearZone[];
}

/** Presets de estrutura por arquétipo (referência p/ autoria). */
export const ESTRUTURA_PRESET: Record<'tenis' | 'social' | 'bota', EstruturaCalcado> = {
  tenis: { salto: 2, drop: 1, cano: 4, zonas: ['sola', 'entressola', 'cabedal', 'biqueira', 'colarinho', 'lingua', 'cadarco'] },
  social: { salto: 4, drop: 2, cano: 2, zonas: ['sola', 'cabedal', 'biqueira', 'contraforte'] },
  bota: { salto: 6, drop: 1, cano: 26, zonas: ['sola', 'entressola', 'cabedal', 'biqueira', 'contraforte', 'cadarco'] },
};
