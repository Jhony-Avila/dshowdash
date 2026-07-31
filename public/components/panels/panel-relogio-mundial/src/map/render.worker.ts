/**
 * map/render.worker.ts — pintura do mapa fora da thread principal.
 * @version 3.2.0
 *
 * POR QUE ESTE WORKER EXISTE — e por que ele NÃO existia antes.
 *
 * Na rodada anterior eu documentei que Web Workers não se justificavam: depois de
 * remover a sombra do canvas, adotar geometria 110m em movimento e repintar por
 * minuto, o quadro tinha caído ao nível do ruído do próprio app-shell. Aquilo estava
 * certo para o caso que eu havia medido — o ARRASTO do mapa.
 *
 * Medindo os outros caminhos, o quadro é diferente:
 *   • virada de minuto ............. tarefa longa de 134 ms
 *   • troca de projeção ............ 303–546 ms
 *   • arrastar a linha do tempo .... 441 ms de mediana, 563 ms de pico
 *
 * Esses três compartilham a mesma causa: uma repintura COMPLETA (Natural Earth 50m,
 * 1.429 anéis, mais as luzes e as faixas de crepúsculo) que não pode ser degradada
 * porque o resultado fica parado na tela. Tentei baixar a qualidade durante o arrasto
 * da timeline e PIOROU (441 → 658 ms): alternar qualidade por estado do React
 * acrescenta uma segunda repintura em vez de baratear a primeira.
 *
 * Tirar a pintura da thread principal resolve os três de uma vez, sem degradar nada.
 *
 * DIVISÃO DE RESPONSABILIDADE
 *   worker  → busca e converte a geometria, projeta e pinta no OffscreenCanvas.
 *   principal → projeção própria (só para posicionar os marcadores em HTML), estado,
 *               interação, acessibilidade.
 * As duas projeções são construídas com os MESMOS parâmetros serializáveis pela mesma
 * `configureProjection`, então não divergem: é a mesma função com a mesma entrada.
 *
 * A geometria é buscada AQUI DENTRO, não transferida. Além de evitar o custo de
 * clonar ~3 MB de objetos, tira da thread principal também o parse do JSON de 756 KB
 * e a conversão topojson→GeoJSON, que antes pesavam na primeira pintura.
 */
'use strict';

import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, MultiLineString, MultiPolygon } from 'geojson';
import { configureProjection, PROJECTION_BY_ID, type Insets, type ProjectionId, type ViewState } from '@/map/projections';
import { renderScene, type Quality, type ThemeName } from '@/map/renderer';
import type { CityLight, GeoData } from '@/map/geodata';
import type { LayerFlags } from '@/lib/prefs';

const BASE = '/components/panels/panel-relogio-mundial/dist/geo/';

export interface MsgInit { tipo: 'init'; canvas: OffscreenCanvas }
export interface MsgRender {
  tipo: 'render';
  width: number;
  height: number;
  dpr: number;
  /** Instante em ms (Date não sobrevive bem a todas as pontes; number é explícito). */
  tempo: number;
  theme: ThemeName;
  layers: LayerFlags;
  quality: Quality;
  projectionId: ProjectionId;
  view: ViewState;
  insets: Insets;
  elapsed: number;
}
export type MsgEntrada = MsgInit | MsgRender;
export type MsgSaida = { tipo: 'geo-pronta' } | { tipo: 'geo-falhou' } | { tipo: 'pintado' };

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let geo: GeoData | null = null;
/** Último pedido recebido — se chegar outro antes de pintar, o novo vence. */
let pendente: MsgRender | null = null;
let agendado = false;

async function carregarGeo(): Promise<void> {
  try {
    const [hiRes, loRes, lightsRes] = await Promise.all([
      fetch(BASE + 'countries-50m.json'),
      fetch(BASE + 'countries-110m.json'),
      fetch(BASE + 'city-lights.json'),
    ]);
    if (!hiRes.ok) throw new Error('50m indisponível');

    const topo = (await hiRes.json()) as Topology;
    const land = feature(topo, topo.objects.land as GeometryCollection) as unknown as Feature<MultiPolygon>;
    const borders = mesh(topo, topo.objects.countries as GeometryCollection, (a, b) => a !== b) as MultiLineString;

    let landLo = land;
    let bordersLo = borders;
    if (loRes.ok) {
      const topoLo = (await loRes.json()) as Topology;
      landLo = feature(topoLo, topoLo.objects.land as GeometryCollection) as unknown as Feature<MultiPolygon>;
      bordersLo = mesh(topoLo, topoLo.objects.countries as GeometryCollection, (a, b) => a !== b) as MultiLineString;
    }

    let lights: CityLight[] = [];
    if (lightsRes.ok) {
      const raw = (await lightsRes.json()) as [number, number, number][];
      if (Array.isArray(raw)) lights = raw.map(([lng, lat, tier]) => ({ lng, lat, tier }));
    }

    geo = { land, borders, landLo, bordersLo, lights };
    post({ tipo: 'geo-pronta' });
    // A cena pode ter sido pedida antes da geometria chegar: repinta com ela.
    if (pendente) agendar();
  } catch {
    post({ tipo: 'geo-falhou' });
  }
}

function post(m: MsgSaida): void {
  (self as unknown as Worker).postMessage(m);
}

/**
 * Coalescência: vários pedidos dentro do mesmo quadro viram UMA pintura, com os
 * parâmetros mais recentes. Sem isso, arrastar a timeline enfileiraria dezenas de
 * repinturas completas e o worker viraria o novo gargalo — só que invisível.
 */
function agendar(): void {
  if (agendado) return;
  agendado = true;
  const executar = () => {
    agendado = false;
    pintar();
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(executar);
  else setTimeout(executar, 16);
}

function pintar(): void {
  const p = pendente;
  if (!p || !canvas) return;
  pendente = null;

  const larguraBitmap = Math.max(1, Math.round(p.width * p.dpr));
  const alturaBitmap = Math.max(1, Math.round(p.height * p.dpr));
  if (canvas.width !== larguraBitmap) canvas.width = larguraBitmap;
  if (canvas.height !== alturaBitmap) canvas.height = alturaBitmap;

  if (!ctx) ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(p.dpr, p.dpr);

  const def = PROJECTION_BY_ID[p.projectionId];
  const projection = configureProjection(def, p.width, p.height, p.view, p.insets);

  renderScene({
    ctx,
    projection,
    width: p.width,
    height: p.height,
    date: new Date(p.tempo),
    theme: p.theme,
    layers: p.layers,
    quality: p.quality,
    geo,
    isGlobe: def.isGlobe,
    elapsed: p.elapsed,
    rotacao: p.view.rotate[0],
  });

  post({ tipo: 'pintado' });
}

self.onmessage = (e: MessageEvent<MsgEntrada>) => {
  const m = e.data;
  if (m.tipo === 'init') {
    canvas = m.canvas;
    ctx = null;
    void carregarGeo();
    return;
  }
  if (m.tipo === 'render') {
    pendente = m;
    agendar();
  }
};
