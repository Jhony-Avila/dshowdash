/**
 * map/geodata.ts — carga preguiçosa da geometria mundial (Natural Earth 50m).
 * @version 3.0.0
 *
 * Os arquivos vivem em public/geo do painel e o Vite os copia para dist/geo — são
 * ASSETS, não módulos: ficam fora do bundle JS e o navegador os cacheia com as
 * regras de arquivo estático. countries-50m.json tem 756 KB crus (≈180 KB gzip);
 * embutir isso no bundle atrasaria a primeira pintura do painel inteiro à toa.
 *
 * O painel pinta oceano + grade + noite ANTES da geometria chegar e redesenha quando
 * ela carrega. Nunca há tela branca esperando download.
 *
 * FONTE: world-atlas 2.0.2 (Natural Earth, domínio público) + luzes de cidade
 * derivadas de ne_10m_populated_places (5.228 pontos com população ≥ 25 mil).
 */
'use strict';

import { feature, mesh } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, MultiLineString, MultiPolygon } from 'geojson';

const BASE = '/components/panels/panel-relogio-mundial/dist/geo/';

export interface CityLight {
  lng: number;
  lat: number;
  /** Intensidade 0-9 derivada do log da população. */
  tier: number;
}

export interface GeoData {
  /** Natural Earth 50m — 1.429 anéis / 60.835 pontos. Detalhe de repouso. */
  land: Feature<MultiPolygon>;
  borders: MultiLineString;
  /**
   * Natural Earth 110m — 125 anéis / 5.127 pontos, 12× mais leve.
   *
   * Existe por medição, não por precaução: o perfil de CPU durante o arrasto
   * mostrou 52% do tempo em `closePath` nativo, redesenhando os 1.429 anéis do 50m
   * a cada quadro. Em movimento ninguém distingue o litoral da Noruega em 50m de
   * 110m; parado, a diferença aparece — por isso os dois convivem.
   */
  landLo: Feature<MultiPolygon>;
  bordersLo: MultiLineString;
  lights: CityLight[];
}

let _cache: GeoData | null = null;
let _inflight: Promise<GeoData | null> | null = null;

/** Geometria já carregada, se houver — permite pintar sem esperar. */
export function peekGeo(): GeoData | null {
  return _cache;
}

export async function loadGeo(signal?: AbortSignal): Promise<GeoData | null> {
  if (_cache) return _cache;
  if (_inflight) return _inflight;

  _inflight = (async () => {
    try {
      const [hiRes, loRes, lightsRes] = await Promise.all([
        fetch(BASE + 'countries-50m.json', { credentials: 'same-origin', signal }),
        fetch(BASE + 'countries-110m.json', { credentials: 'same-origin', signal }),
        fetch(BASE + 'city-lights.json', { credentials: 'same-origin', signal }),
      ]);
      if (!hiRes.ok) return null;

      const topo = (await hiRes.json()) as Topology;
      const land = feature(topo, topo.objects.land as GeometryCollection) as unknown as Feature<MultiPolygon>;
      // a !== b devolve só as fronteiras INTERNAS: o litoral já é desenhado pelo
      // contorno do land, e desenhar duas vezes engrossa a costa artificialmente.
      const borders = mesh(topo, topo.objects.countries as GeometryCollection, (a, b) => a !== b) as MultiLineString;

      // O 110m é opcional: se falhar, a versão de interação cai no 50m e o painel
      // continua correto, só menos fluido ao arrastar.
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
        if (Array.isArray(raw)) {
          lights = raw.map(([lng, lat, tier]) => ({ lng, lat, tier }));
        }
      }

      _cache = { land, borders, landLo, bordersLo, lights };
      return _cache;
    } catch {
      return null;
    } finally {
      _inflight = null;
    }
  })();

  return _inflight;
}
