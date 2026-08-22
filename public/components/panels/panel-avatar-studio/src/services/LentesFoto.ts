// services/LentesFoto.ts — onda 1420 (MEGA_BRIEFING_01 Parte 8 P8-E,
// §2007–§2027; decisão #207): LENTES do Photo Studio 3D — FONTE ÚNICA
// dos enquadramentos fotográficos prontos (aspecto, preset de câmera,
// look, regra dos terços). PURO: zero THREE/DOM — o Renderizador3d
// consome em capturarComLente() (as6.foto_lentes) e o Palco3d monta o
// seletor daqui.
//
// Regras (§P8-E): aspectos 4:5 (feed) e 9:16 (stories) além do 1:1
// canônico; look POR LENTE (a captura aplica e RESTAURA); regra dos
// terços via eye-line do preset de câmera (`tercos` = fração da ALTURA
// do quadro onde os olhos devem cair — 2/3 é o clássico); captura em
// qualidade alta (shadow map ↑ + pós só na captura) com restauro total;
// DETERMINISMO: duas capturas seguidas = mesmos bytes (teste trava).
// DOF fica para P2 (registrado — nada aqui o referencia).
// @version 1.0.0  @created 2026-08-22
import type { LookId } from './Looks3d';

export type LenteFotoId = 'portrait' | 'full' | 'fashion' | 'wide_hero' | 'profile' | 'closeup';
export type AspectoLente = '1:1' | '4:5' | '9:16';

export interface LenteFoto {
  id: LenteFotoId;
  nome: string;
  aspecto: AspectoLente;
  /** preset do Camera3d aplicado na captura (modo do EstadoCamera) */
  camera: 'retrato' | 'corpo' | 'busto' | 'face';
  /** look aplicado SÓ durante a captura (restaurado depois) */
  look: LookId;
  /** regra dos terços: fração da altura do QUADRO onde os olhos caem */
  tercos: number;
}

/** Dimensões CANÔNICAS por aspecto na base 960 (lado menor fixo — a
 *  captura 2× do §506 dobra tudo). */
export const DIMENSOES_ASPECTO: Record<AspectoLente, { largura: number; altura: number }> = {
  '1:1': { largura: 960, altura: 960 },
  '4:5': { largura: 960, altura: 1200 },
  '9:16': { largura: 810, altura: 1440 },
};

export const LENTES_FOTO: Record<LenteFotoId, LenteFoto> = {
  portrait: { id: 'portrait', nome: 'Retrato', aspecto: '4:5', camera: 'retrato', look: 'portrait', tercos: 2 / 3 },
  full: { id: 'full', nome: 'Corpo inteiro', aspecto: '4:5', camera: 'corpo', look: 'estudio', tercos: 0.62 },
  fashion: { id: 'fashion', nome: 'Fashion', aspecto: '9:16', camera: 'corpo', look: 'hero', tercos: 0.66 },
  wide_hero: { id: 'wide_hero', nome: 'Hero vertical', aspecto: '9:16', camera: 'corpo', look: 'dramatic', tercos: 0.62 },
  profile: { id: 'profile', nome: 'Perfil', aspecto: '1:1', camera: 'busto', look: 'estudio', tercos: 2 / 3 },
  closeup: { id: 'closeup', nome: 'Close-up', aspecto: '4:5', camera: 'face', look: 'portrait', tercos: 0.7 },
};

export function lenteDe(id: string | null | undefined): LenteFoto | null {
  return (id && (LENTES_FOTO as Record<string, LenteFoto>)[id]) || null;
}

/** Dimensões da captura da lente (multiplicador p/ derivados). */
export function dimensoesLente(id: LenteFotoId, escala = 1): { largura: number; altura: number } {
  const d = DIMENSOES_ASPECTO[LENTES_FOTO[id].aspecto];
  return { largura: Math.round(d.largura * escala), altura: Math.round(d.altura * escala) };
}

/** Nome de arquivo padrão da captura (paridade com nomeExport 2D). */
export function nomeFotoLente(id: LenteFotoId): string {
  return `dshow-foto-${id}-${LENTES_FOTO[id].aspecto.replace(':', 'x')}.png`;
}
