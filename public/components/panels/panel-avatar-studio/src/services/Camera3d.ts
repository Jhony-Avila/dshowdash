// services/Camera3d.ts — onda 1419 (MEGA_BRIEFING_01 Parte 8 P8-B;
// decisões #204–#205): CAMERA REGISTRY do palco 3D — FONTE ÚNICA dos
// presets de enquadramento (FOV, headroom, eye-line, bookmarks, limites
// de órbita), consumida pelo Renderizador3d (as6.camera_v2), pelo shell
// (category-aware) e pela PoC. PURO: zero THREE, zero DOM — vetores como
// tuplas; `enquadrar()` é determinística (testável em node).
//
// Regras (§P8-B): retrato/rosto FOV 24°, busto 28°, corpo 32–34°;
// headroom/eye-line por preset; bounds-aware (a CAIXA já chega ∪ props/
// acessórios — quem monta o Box3 é o renderer); a câmera NUNCA reseta
// sozinha (#165d — o guard vive no renderer); transição 300 ms
// interromível (renderer); limites polares/minDistance/near p/ a órbita.
// @version 1.0.0  @created 2026-08-22
import type { CategoriaId } from '../domain/types';

export type PresetCameraId = 'face' | 'retrato' | 'busto' | 'corpo' | 'costas';

export interface PresetCamera {
  id: PresetCameraId;
  nome: string;
  /** FOV vertical em graus (§P8-B: 24 rosto · 28 busto · 32–34 corpo) */
  fov: number;
  /** fração da ALTURA da caixa onde mira o alvo (eye-line §P8-B) */
  eyeLine: number;
  /** fração da altura da caixa que o enquadramento cobre */
  alturaEnquadrada: number;
  /** folga acima da cabeça (multiplicador da distância — headroom) */
  headroom: number;
  /** ângulo horizontal padrão (rad; 0 = frente; π = costas) */
  azimute: number;
  /** elevação padrão (rad) */
  elevacao: number;
}

export const PRESETS_CAMERA_3D: Record<PresetCameraId, PresetCamera> = {
  face: { id: 'face', nome: 'Rosto', fov: 24, eyeLine: 0.88, alturaEnquadrada: 0.30, headroom: 0.10, azimute: 0.12, elevacao: 0.02 },
  retrato: { id: 'retrato', nome: 'Retrato', fov: 24, eyeLine: 0.84, alturaEnquadrada: 0.44, headroom: 0.12, azimute: 0.16, elevacao: 0.04 },
  busto: { id: 'busto', nome: 'Busto', fov: 28, eyeLine: 0.74, alturaEnquadrada: 0.62, headroom: 0.12, azimute: 0.2, elevacao: 0.08 },
  corpo: { id: 'corpo', nome: 'Corpo inteiro', fov: 33, eyeLine: 0.52, alturaEnquadrada: 1.08, headroom: 0.08, azimute: 0.24, elevacao: 0.12 },
  costas: { id: 'costas', nome: 'Costas', fov: 30, eyeLine: 0.6, alturaEnquadrada: 0.8, headroom: 0.1, azimute: Math.PI, elevacao: 0.1 },
};

/** Bookmarks §P8-B (UI/atalhos) → preset. */
export const BOOKMARKS_CAMERA: Record<'full' | 'bust' | 'face' | 'back', PresetCameraId> = {
  full: 'corpo', bust: 'busto', face: 'face', back: 'costas',
};

/** Category-aware (shell): trocar de categoria SUGERE o preset — nunca
 *  força (#165d: quem decide aplicar é o caller, e órbita manual vence). */
export const PRESET_POR_CATEGORIA: Record<CategoriaId, PresetCameraId> = {
  base: 'face', olhos: 'face', boca: 'face', nariz: 'face', sobrancelha: 'face', barba: 'face',
  cabelo: 'retrato',
  roupa: 'busto', roupa_sobre: 'busto', emblema: 'busto', acessorio: 'busto',
  roupa_inferior: 'corpo',
  fundo: 'corpo', moldura: 'corpo', efeito: 'corpo', aura: 'corpo', banner: 'corpo',
};

/** Limites da ÓRBITA manual (as6.camera_v2): nunca por baixo do chão,
 *  nunca dentro do personagem, near curto p/ close sem clipping. */
export const LIMITES_ORBITA = {
  minPolar: 0.35,      // rad — não sobrevoa o topo
  maxPolar: 1.92,      // rad — não mergulha sob o chão
  minDistance: 0.45,
  maxDistance: 6,
  near: 0.01,
} as const;

/** Duração canônica da transição de câmera (interromível). */
export const TRANSICAO_CAMERA_MS = 300;

export interface CaixaEnquadro {
  min: [number, number, number];
  max: [number, number, number];
}

export interface EnquadroCamera {
  posicao: [number, number, number];
  alvo: [number, number, number];
  fov: number;
}

const arr = (n: number): number => Math.round(n * 10000) / 10000;

/** Enquadra a CAIXA (já ∪ acessórios/props) com o preset — puro e
 *  determinístico: mesma caixa + preset ⇒ mesmos números. */
export function enquadrar(caixa: CaixaEnquadro, presetId: PresetCameraId): EnquadroCamera {
  const p = PRESETS_CAMERA_3D[presetId] ?? PRESETS_CAMERA_3D.corpo;
  const altura = Math.max(0.001, caixa.max[1] - caixa.min[1]);
  const cx = (caixa.min[0] + caixa.max[0]) / 2;
  const cz = (caixa.min[2] + caixa.max[2]) / 2;
  const alvoY = caixa.min[1] + altura * p.eyeLine;
  // distância p/ caber `alturaEnquadrada` no FOV vertical + headroom
  const meiaAltura = (altura * p.alturaEnquadrada) / 2;
  const dist = (meiaAltura / Math.tan((p.fov * Math.PI) / 360)) * (1 + p.headroom);
  const posicao: [number, number, number] = [
    arr(cx + dist * Math.cos(p.elevacao) * Math.sin(p.azimute)),
    arr(alvoY + dist * Math.sin(p.elevacao)),
    arr(cz + dist * Math.cos(p.elevacao) * Math.cos(p.azimute)),
  ];
  return { posicao, alvo: [arr(cx), arr(alvoY), arr(cz)], fov: p.fov };
}

export function presetDe(id: string | undefined): PresetCamera | undefined {
  return id ? PRESETS_CAMERA_3D[id as PresetCameraId] : undefined;
}
