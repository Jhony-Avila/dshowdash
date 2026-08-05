// nucleo/adaptadores.ts — conversores LEGADO ↔ EstadoAvatar (AS5 F1 Inc.5).
// @version 1.0.0  @created 2026-07-31
//
// Ponte entre os formatos persistidos hoje (AvatarConfig 'camadas' do
// studio.php e Config3D da PoC) e o EstadoAvatar em domínios (§607). O
// roundtrip 2D é SEM PERDA para chaves conhecidas; o 3D é parcial e
// unidirecional por decisão registrada: roupa/cabeca/mochila continuam no
// config3d legado até a F5 (P8) definir o modelo 3D novo — misturá-los em
// slots 2D agora criaria contrato falso.
import type { EstadoAvatar, SlotId } from './contratos';
import { SLOTS_EQUIPAMENTO, estadoVazio } from './contratos';

/** Forma mínima do config legado 2D (espelha domain/types.AvatarConfig). */
export interface ConfigLegado2d {
  formato: 'camadas';
  versao: number;
  base: string;
  camadas: Partial<Record<string, string>>;
  cores: Record<string, string>;
  titulo?: string;
  /** megas 254–255 (§102/§118): tipo corporal e postura — roundtrip sem
   *  perda (mesmos literais do domain/types; o validarConfig re-sanitiza). */
  corpo?: 'esbelto' | 'atletico' | 'robusto' | 'compacto';
  postura?: 'confiante' | 'relaxada' | 'executiva' | 'heroica' | 'misteriosa';
  /** §71: propriedades por camada (F3 C2) — roundtrip sem perda. */
  params?: Partial<Record<string, Record<string, number>>>;
  /** §73: canais de cor por camada (F3 C3) — roundtrip sem perda. */
  coresCamada?: Partial<Record<string, Record<string, string>>>;
}

const SLOTS_VALIDOS = new Set<string>(SLOTS_EQUIPAMENTO);

/** legado 2D → domínios (§607). Chave desconhecida é DESCARTADA (fail-safe);
 *  'acessorio' legado pousa em acessorio_cabeca (mesma regra do validarConfig). */
export function deLegado2d(cfg: ConfigLegado2d): EstadoAvatar {
  const e = estadoVazio();
  e.body.base = cfg.base || null;
  for (const [chave, id] of Object.entries(cfg.camadas ?? {})) {
    if (!id) continue;
    const slot = chave === 'acessorio' ? 'acessorio_cabeca' : chave;
    if (SLOTS_VALIDOS.has(slot)) e.equipment[slot as SlotId] = id;
  }
  e.appearance.cores = { ...(cfg.cores ?? {}) };
  // §71/§73: propriedades e canais acompanham a MESMA regra das camadas
  for (const [chave, valores] of Object.entries(cfg.params ?? {})) {
    if (!valores || !Object.keys(valores).length) continue;
    const slot = chave === 'acessorio' ? 'acessorio_cabeca' : chave;
    if (!SLOTS_VALIDOS.has(slot)) continue;
    (e.appearance.params ??= {})[slot] = { ...valores };
  }
  for (const [chave, canais] of Object.entries(cfg.coresCamada ?? {})) {
    if (!canais || !Object.keys(canais).length) continue;
    const slot = chave === 'acessorio' ? 'acessorio_cabeca' : chave;
    if (!SLOTS_VALIDOS.has(slot)) continue;
    (e.appearance.coresCamada ??= {})[slot] = { ...canais };
  }
  e.presentation.titulo = cfg.titulo ?? null;
  // megas 254–255 (§102/§118): campos opcionais — ausentes NÃO entram
  if (cfg.corpo) e.body.tipo = cfg.corpo;
  if (cfg.postura) e.body.postura = cfg.postura;
  e.renderer.preferido = '2d';
  return e;
}

/** domínios → legado 2D (para SALVAR pelo caminho atual até o corte §619). */
export function paraLegado2d(e: EstadoAvatar, baseFallback = 'bas_classica'): ConfigLegado2d {
  const camadas: Partial<Record<string, string>> = {};
  for (const [slot, id] of Object.entries(e.equipment)) {
    if (!id) continue;
    // slots 3D nunca vazam para o config 2D
    if (['head', 'face', 'eyes', 'ears', 'neck', 'shoulders', 'back', 'waist',
      'wrist_l', 'wrist_r', 'hand_l', 'hand_r', 'companion', 'pet'].includes(slot)) continue;
    camadas[slot] = id;
  }
  // §71/§73: propriedades e canais voltam SÓ das camadas que voltaram
  const params: Partial<Record<string, Record<string, number>>> = {};
  for (const [slot, valores] of Object.entries(e.appearance.params ?? {})) {
    if (camadas[slot] && valores && Object.keys(valores).length) {
      params[slot] = { ...valores };
    }
  }
  const coresCamada: Partial<Record<string, Record<string, string>>> = {};
  for (const [slot, canais] of Object.entries(e.appearance.coresCamada ?? {})) {
    if (camadas[slot] && canais && Object.keys(canais).length) {
      coresCamada[slot] = { ...canais };
    }
  }
  return {
    formato: 'camadas',
    versao: 1,
    base: e.body.base ?? baseFallback,
    camadas,
    cores: { ...e.appearance.cores },
    ...(e.presentation.titulo ? { titulo: e.presentation.titulo } : {}),
    ...(e.body.tipo ? { corpo: e.body.tipo as ConfigLegado2d['corpo'] } : {}),
    ...(e.body.postura ? { postura: e.body.postura as ConfigLegado2d['postura'] } : {}),
    ...(Object.keys(params).length ? { params } : {}),
    ...(Object.keys(coresCamada).length ? { coresCamada } : {}),
  };
}

/** Forma mínima do Config3D da PoC (espelha poc3d/catalogo3d.Config3D). */
export interface ConfigLegado3d {
  arquetipo: string;
  sockets?: Partial<Record<string, string>>;
  cores: Record<string, string>;
  material: { metal: number; brilho: number };
  morfos: Record<string, number>;
  iluminacao: string;
  cenario: string;
  hora: string;
  clima: string;
}

/** Config3D → domínios (PARCIAL v1 — ver cabeçalho). */
export function deLegado3d(cfg: ConfigLegado3d): EstadoAvatar {
  const e = estadoVazio();
  for (const [socket, id] of Object.entries(cfg.sockets ?? {})) {
    if (id && SLOTS_VALIDOS.has(socket)) e.equipment[socket as SlotId] = id;
  }
  e.appearance.cores = { ...(cfg.cores ?? {}) };
  e.appearance.materiais = { metal: cfg.material?.metal ?? 0, brilho: cfg.material?.brilho ?? 0 };
  e.body.morfos = { ...(cfg.morfos ?? {}) };
  e.environment = {
    cenario: cfg.cenario ?? null, iluminacao: cfg.iluminacao ?? null,
    hora: cfg.hora ?? null, clima: cfg.clima ?? null,
  };
  e.renderer.preferido = '3d';
  return e;
}
