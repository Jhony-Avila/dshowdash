// engine/enquadramento.ts — decisão A+ §8/§9/§10/§110: CATEGORY_FOCUS_MAP —
// a GEOMETRIA de enquadramento por categoria/slot, FONTE ÚNICA. Fecha o vão
// deixado por services/ApresentacaoAsset (que diz card=asset·palco=aplicado e
// a CÂMERA coarse por categoria) dando a CADA câmera/slot uma CAIXA concreta
// (viewBox normalizado sobre o render), realizando "o que eu edito DOMINA a
// viewport" (§110) sem `if` espalhado pela UI (§8) e SEM novo renderer (§76):
// só recorta (viewBox) o MESMO svgDe.
//
// Consumo (card e palco compartilham a geometria; ApresentacaoAsset decide se
// o que se renderiza é o ASSET isolado ou o AVATAR):
//   const f = focoDe('acessorio', 'pes');           // {src:'corpo', box:[...]}
//   const vb = viewBoxDe(f);                         // "43 328 154 72" p/ o <svg>
//   // card: recorta o render ISOLADO do asset;  palco: recorta o AVATAR.
// @version 1.0.0  @created 2026-08-23 (decisão A+)
import type { CategoriaId } from '../domain/types';
import { apresentacaoDe } from '../services/ApresentacaoAsset';
import type { CameraPreview } from '../services/ApresentacaoAsset';

/** De qual render sai o recorte: busto (240×240) ou corpo (240×400). */
export type FonteFoco = 'busto' | 'corpo';

/** Enquadramento: origem + caixa NORMALIZADA [x,y,w,h] em 0..1 sobre o
 *  viewBox nativo da fonte. Normalizado p/ ser resoluto-independente. */
export interface Enquadramento {
  src: FonteFoco;
  box: [number, number, number, number];
  label: string;
}

/** Dimensões nativas de cada fonte (o viewBox do svgDe). */
export const DIM_FONTE: Record<FonteFoco, [number, number]> = {
  busto: [240, 240],
  corpo: [240, 400],
};

// ── CAIXAS por CÂMERA coarse (a ponte com ApresentacaoAsset.previewCamera) ──
// Cada previewCamera vira uma caixa concreta. 'current'/'wider' são o corpo
// cheio com folga (fundos/molduras usam o quadro todo).
const FOCO_CAMERA: Record<CameraPreview, Enquadramento> = {
  face: { src: 'busto', box: [0.17, 0.05, 0.66, 0.60], label: 'rosto' },
  bust: { src: 'busto', box: [0.06, 0.00, 0.88, 0.94], label: 'busto' },
  full: { src: 'corpo', box: [0.04, 0.00, 0.92, 1.00], label: 'corpo inteiro' },
  back: { src: 'busto', box: [0.06, 0.00, 0.88, 0.70], label: 'nuca/costas' },
  current: { src: 'corpo', box: [0.00, 0.00, 1.00, 1.00], label: 'quadro cheio' },
  wider: { src: 'corpo', box: [0.00, 0.00, 1.00, 1.00], label: 'quadro cheio' },
};

// ── REFINAMENTO FINO por categoria/slot (§110: o alvo domina a viewport) ──
// Chave = categoria OU slot de acessório. Sobrepõe a câmera coarse quando
// existe (ex.: 'acessorio' é 'bust' por padrão, mas calçado foca nos pés).
const FOCO_FINO: Record<string, Enquadramento> = {
  // faciais finos (busto)
  olhos: { src: 'busto', box: [0.22, 0.28, 0.56, 0.24], label: 'olhos' },
  nariz: { src: 'busto', box: [0.34, 0.34, 0.32, 0.28], label: 'nariz/meio-rosto' },
  boca: { src: 'busto', box: [0.30, 0.50, 0.40, 0.22], label: 'boca' },
  sobrancelha: { src: 'busto', box: [0.24, 0.24, 0.52, 0.18], label: 'sobrancelhas' },
  barba: { src: 'busto', box: [0.20, 0.46, 0.60, 0.42], label: 'maxilar/barba' },
  cabelo: { src: 'busto', box: [0.10, 0.00, 0.80, 0.54], label: 'cabeça/cabelo' },
  // corporais finos (corpo)
  roupa: { src: 'corpo', box: [0.16, 0.26, 0.68, 0.36], label: 'torso' },
  roupa_sobre: { src: 'corpo', box: [0.12, 0.24, 0.76, 0.42], label: 'torso (sobre)' },
  roupa_inferior: { src: 'corpo', box: [0.18, 0.50, 0.64, 0.44], label: 'quadril→pés' },
  // slots de acessório (refina 'acessorio')
  pes: { src: 'corpo', box: [0.18, 0.82, 0.64, 0.18], label: 'pés/calçado' },
  cintura: { src: 'corpo', box: [0.20, 0.46, 0.60, 0.16], label: 'cintura' },
  pernas: { src: 'corpo', box: [0.18, 0.56, 0.64, 0.30], label: 'pernas' },
  costas: { src: 'corpo', box: [0.04, 0.10, 0.92, 0.60], label: 'costas' },
  pulso_e: { src: 'corpo', box: [0.02, 0.50, 0.34, 0.18], label: 'punho E' },
  pulso_d: { src: 'corpo', box: [0.64, 0.50, 0.34, 0.18], label: 'punho D' },
  mao_e: { src: 'corpo', box: [0.02, 0.56, 0.34, 0.18], label: 'mão E' },
  mao_d: { src: 'corpo', box: [0.64, 0.56, 0.34, 0.18], label: 'mão D' },
  orelha_e: { src: 'busto', box: [0.10, 0.34, 0.30, 0.26], label: 'orelha E' },
  orelha_d: { src: 'busto', box: [0.60, 0.34, 0.30, 0.26], label: 'orelha D' },
  olhos_slot: { src: 'busto', box: [0.22, 0.28, 0.56, 0.24], label: 'olhos' },
  cabeca: { src: 'busto', box: [0.10, 0.00, 0.80, 0.56], label: 'cabeça' },
  rosto: { src: 'busto', box: [0.17, 0.05, 0.66, 0.60], label: 'rosto' },
  pescoco: { src: 'busto', box: [0.24, 0.52, 0.52, 0.34], label: 'pescoço' },
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * FOCO de uma categoria (opcionalmente refinado pelo slot do acessório).
 * Ordem de resolução (§8, fonte única): slot fino > categoria fina >
 * câmera coarse do registry de apresentação. Nunca há `if` no consumidor.
 */
export function focoDe(categoria: CategoriaId | string, slot?: string | null): Enquadramento {
  if (slot && FOCO_FINO[slot]) return FOCO_FINO[slot];
  if (FOCO_FINO[categoria]) return FOCO_FINO[categoria];
  const cam = apresentacaoDe(categoria).previewCamera;
  return FOCO_CAMERA[cam];
}

/** Câmera coarse → caixa (para o palco que já pensa em termos de câmera). */
export function focoCamera(cam: CameraPreview): Enquadramento {
  return FOCO_CAMERA[cam];
}

/** viewBox absoluto ("x y w h") p/ o <svg> a partir do foco normalizado.
 *  É isto que o card/palco setam para "dominar a viewport" (§110). */
export function viewBoxDe(foco: Enquadramento): string {
  const [W, H] = DIM_FONTE[foco.src];
  const [nx, ny, nw, nh] = foco.box;
  const x = clamp01(nx) * W, y = clamp01(ny) * H;
  const w = Math.min(W - x, nw * W), h = Math.min(H - y, nh * H);
  return `${+x.toFixed(1)} ${+y.toFixed(1)} ${+w.toFixed(1)} ${+h.toFixed(1)}`;
}

/** Caixa em pixels [x,y,w,h] (p/ sharp.extract em provas headless). */
export function caixaPx(foco: Enquadramento): [number, number, number, number] {
  const [W, H] = DIM_FONTE[foco.src];
  const [nx, ny, nw, nh] = foco.box;
  const x = Math.round(clamp01(nx) * W), y = Math.round(clamp01(ny) * H);
  const w = Math.min(W - x, Math.round(nw * W)), h = Math.min(H - y, Math.round(nh * H));
  return [x, y, w, h];
}

/** Todas as categorias conhecidas (p/ provas de cobertura). */
export { FOCO_CAMERA, FOCO_FINO };
