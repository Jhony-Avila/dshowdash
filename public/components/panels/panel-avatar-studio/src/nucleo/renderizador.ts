// nucleo/renderizador.ts — CONTRATO do renderizador (briefing §400–§401, AS5 F5).
// @version 1.0.0  @created 2026-07-31
//
// O renderizador recebe um ESTADO DECLARATIVO (EstadoAvatar §607) e produz a
// cena — nunca decide posse/desbloqueio/filtros/salvamento (§400: isso é das
// outras camadas). Um único contrato para TODOS os renderers (§401):
// 2D (SVG), 3D (WebGL), fotográfico, thumbnail, banner e captura.
//
// Mapeamento §401 (inglês do briefing) → pt-BR do projeto:
//   initialize→inicializar · mount→montar · applyState→aplicarEstado ·
//   setCamera→definirCamera · playAnimation→tocarAnimacao ·
//   playPower→tocarPoder · capture→capturar · setQuality→definirQualidade ·
//   pause→pausar · resume→retomar · dispose→descartar
//
// Dependência-zero: só importa tipos do próprio núcleo.
import type { EstadoAvatar, QualidadeTier, RendererId } from './contratos';

export interface InicializacaoRenderer {
  qualidade: QualidadeTier | 'auto';
  /** teto do devicePixelRatio (§402/§528) — economia em telas 4K */
  pixelRatioMax?: number;
  antialias?: boolean;
  /** mega 42 (§605-lite): ponto de PARTIDA do modo 'auto' sugerido pelo
   *  diagnóstico de capacidade — o adaptativo §528 segue mandando depois.
   *  Renderers sem modo auto ignoram. */
  dicaTier?: QualidadeTier;
}

/** §453.1 — estados de câmera; o renderer 2D ignora o que não se aplica. */
export interface EstadoCamera {
  // onda 1419 (#204, as6.camera_v2): modos NOVOS aditivos (busto/face/
  // costas — presets do Camera3d); `forcar` fura o guard #165d (bookmarks)
  modo: 'retrato' | 'corpo' | 'orbita' | 'cinematica' | 'busto' | 'face' | 'costas';
  forcar?: boolean;
  alvo?: [number, number, number];
  distancia?: number;
  azimute?: number;
  elevacao?: number;
}

export interface PedidoAnimacao {
  id: string;
  transicaoMs?: number;
  loop?: boolean;
}

export interface PedidoPoder {
  id: string;
}

export interface OpcoesCaptura {
  largura: number;
  altura: number;
  transparente?: boolean;
  /** §508: captura DETERMINÍSTICA (pausa animações antes do frame) */
  deterministica?: boolean;
  // ── lote 691-700 (§506/§329, flag as5.captura3d_v2 no caller) ──
  /** §506 supersampling: 2 = renderiza no dobro e reduz (AA de captura) */
  superAmostra?: 1 | 2;
  /** §506 múltiplos formatos (padrão png; jpeg/webp p/ derivados §329.2) */
  formato?: 'png' | 'jpeg' | 'webp';
  /** qualidade do encoder p/ jpeg/webp (0–1; padrão 0.92) */
  qualidade?: number;
  /** §506 câmera específica DA CAPTURA (aplica e restaura) */
  camera?: EstadoCamera;
}

export interface CapturaRender {
  dataUri: string;
  largura: number;
  altura: number;
}

/** Resultado de aplicarEstado — o chamador sabe O QUE ficou de fora. */
export interface ResultadoAplicarEstado {
  ok: boolean;
  /** slots/domínios do estado que ESTE renderer não representa (ex.: sockets
   *  3D no renderer 2D) — alimenta o aviso de fallback (§481) */
  pendencias: string[];
}

export interface RenderizadorAvatar {
  /** qual renderer é este ('2d' | '3d') — decide fallback e telemetria */
  readonly id: RendererId;
  inicializar(config: InicializacaoRenderer): Promise<void>;
  montar(alvo: { innerHTML: string }): Promise<void>;
  aplicarEstado(estado: EstadoAvatar): Promise<ResultadoAplicarEstado>;
  definirCamera(camera: EstadoCamera): void;
  tocarAnimacao(pedido: PedidoAnimacao): Promise<void>;
  tocarPoder(pedido: PedidoPoder): Promise<void>;
  capturar(opcoes: OpcoesCaptura): Promise<CapturaRender>;
  definirQualidade(perfil: QualidadeTier | 'auto'): void;
  pausar(): void;
  retomar(): void;
  descartar(): Promise<void>;
}

/** Slots que só existem no mundo 3D (§68.1/decisão #41) — o renderer 2D os
 *  reporta como pendência em vez de fingir que pintou. */
export const SLOTS_SO_3D: readonly string[] = [
  'head', 'face', 'eyes', 'ears', 'neck', 'shoulders', 'back', 'waist',
  'wrist_l', 'wrist_r', 'hand_l', 'hand_r', 'companion', 'pet',
];

/** Pendências de um estado para um renderer alvo (§481 — decide o aviso). */
export function pendenciasPara(estado: EstadoAvatar, renderer: RendererId): string[] {
  if (renderer === '3d') return []; // 3D representa tudo (2D é subconjunto)
  return Object.entries(estado.equipment)
    .filter(([slot, id]) => id && SLOTS_SO_3D.includes(slot))
    .map(([slot]) => slot);
}
