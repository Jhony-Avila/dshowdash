/**
 * map/renderer.ts — pintura do mapa em canvas 2D.
 * @version 3.0.0
 *
 * Uma função `renderScene` desenha a cena inteira em ordem de camadas. Não há estado
 * mutável escondido aqui: tudo entra por parâmetro, o que torna o render determinístico
 * e reprodutível — é o que permite exportar PNG usando exatamente o mesmo código.
 *
 * ORÇAMENTO DE QUADRO: em interação (arrastar/zoom) o modo `interactive` corta o que
 * custa e não se nota em movimento — estrelas, luzes fracas e a grade fina. O usuário
 * enxerga fluidez; a cena completa volta 120 ms depois que ele solta.
 *
 * ORDEM DAS CAMADAS (importa muito):
 *   espaço → oceano → grade → terra → fronteiras → noite → estrelas → luzes →
 *   marcador solar → atmosfera
 * A noite entra DEPOIS da terra (escurece continente e mar juntos, como sombra real)
 * e ANTES das luzes (que só existem no escuro, senão viram sujeira sobre o dia).
 */
'use strict';

import { geoPath, geoGraticule10, geoDistance, type GeoProjection } from 'd3-geo';
import type { Feature, MultiLineString, MultiPolygon } from 'geojson';
import { antisolarPoint, nightCap, solarPosition, TWILIGHT_BANDS } from '@/lib/astro';
import type { CityLight, GeoData } from '@/map/geodata';
import type { LayerFlags } from '@/lib/prefs';

export type ThemeName = 'dark' | 'light';
export type Quality = 'full' | 'interactive';

/**
 * As duas APIs de contexto 2D são idênticas no subconjunto que este renderizador usa.
 * Tipar pela união é o que permite a MESMA função pintar na thread principal (modo
 * de retaguarda) e dentro do worker (modo padrão) sem nenhuma duplicação de código.
 */
export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface Palette {
  space: [string, string];
  ocean: [string, string];
  land: [string, string];
  landStroke: string;
  borders: string;
  graticule: string;
  night: string;
  lights: string;
  stars: string;
  sun: string;
  sunHalo: string;
  atmosphere: string;
  sphereEdge: string;
}

export const PALETTES: Record<ThemeName, Palette> = {
  dark: {
    space: ['#080b16', '#02030a'],
    ocean: ['#123256', '#071628'],
    land: ['#2f5580', '#1d3a5c'],
    landStroke: 'rgba(150, 190, 240, 0.20)',
    borders: 'rgba(150, 190, 240, 0.28)',
    graticule: 'rgba(160, 200, 255, 0.055)',
    night: '4, 8, 22',
    lights: '255, 214, 150',
    stars: '255, 255, 255',
    sun: '#ffe0a3',
    sunHalo: '255, 200, 110',
    atmosphere: '96, 165, 250',
    sphereEdge: 'rgba(130, 180, 255, 0.35)',
  },
  light: {
    space: ['#dbe7f5', '#c3d5ec'],
    ocean: ['#c2d9f2', '#9fc0e4'],
    land: ['#fbfcfe', '#e6edf7'],
    landStroke: 'rgba(30, 58, 95, 0.22)',
    borders: 'rgba(30, 58, 95, 0.26)',
    graticule: 'rgba(30, 58, 95, 0.07)',
    night: '22, 36, 72',
    lights: '245, 158, 11',
    stars: '255, 255, 255',
    sun: '#b45309',
    sunHalo: '251, 191, 36',
    atmosphere: '59, 130, 246',
    sphereEdge: 'rgba(30, 58, 95, 0.30)',
  },
};

// ===================== Campo de estrelas =====================

interface Star { lng: number; lat: number; mag: number; phase: number }

/**
 * Estrelas geradas UMA vez, com gerador determinístico (LCG semeado). Se fossem
 * sorteadas por quadro, o céu cintilaria feito chuvisco de TV; fixas, elas apenas
 * pulsam de leve e a cena fica estável ao arrastar.
 */
const STARS: Star[] = (() => {
  let seed = 20260730;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const out: Star[] = [];
  for (let i = 0; i < 900; i++) {
    // Distribuição uniforme na esfera: latitude por arco-seno, não linear.
    const lat = Math.asin(rnd() * 2 - 1) * (180 / Math.PI);
    out.push({ lng: rnd() * 360 - 180, lat, mag: 0.25 + rnd() * 0.75, phase: rnd() * Math.PI * 2 });
  }
  return out;
})();

// ===================== Cena =====================

export interface SceneParams {
  ctx: Ctx2D;
  projection: GeoProjection;
  width: number;
  height: number;
  date: Date;
  theme: ThemeName;
  layers: LayerFlags;
  quality: Quality;
  geo: GeoData | null;
  isGlobe: boolean;
  /** Segundos desde a montagem — usado só no cintilar das estrelas. */
  elapsed: number;
  /** Rotação horizontal atual, em graus — alimenta o parallax do céu de fundo. */
  rotacao?: number;
}

const SPHERE = { type: 'Sphere' } as const;

export function renderScene(p: SceneParams): void {
  const { ctx, projection, width, height, theme, layers, quality, geo, isGlobe } = p;
  const pal = PALETTES[theme];
  const path = geoPath(projection, ctx);

  ctx.clearRect(0, 0, width, height);

  paintSpace(ctx, width, height, pal, isGlobe, p.rotacao ?? 0, theme);
  paintOcean(ctx, path, pal, width, height, isGlobe);

  if (layers.graticule) paintGraticule(ctx, path, pal, quality);

  if (geo) {
    // Em movimento usa a geometria 110m (12× mais leve); parado, o 50m.
    const rapido = quality === 'interactive';
    paintLand(ctx, path, rapido ? geo.landLo : geo.land, pal, width, height, isGlobe, quality);
    if (layers.countries) paintBorders(ctx, path, rapido ? geo.bordersLo : geo.borders, pal);
  }

  if (layers.night) {
    paintNight(ctx, path, p.date, pal);
    if (layers.stars && quality === 'full' && theme === 'dark') {
      paintStars(ctx, projection, path, p.date, pal, p.elapsed);
    }
    if (layers.cityLights && geo) {
      paintCityLights(ctx, projection, path, p.date, geo.lights, pal, quality, isGlobe);
    }
  }

  if (layers.sunMarker) paintSun(ctx, projection, p.date, pal, isGlobe);

  paintSphereEdge(ctx, path, pal, isGlobe);
  if (isGlobe) paintAtmosphere(ctx, path, pal, width, height);
}

// ===================== Camadas =====================

/**
 * Espaço ao redor do globo + PARALLAX.
 *
 * O briefing pede parallax. Num mapa plano isso não existe (é tudo o mesmo plano),
 * mas no globo existe de verdade: as estrelas de FUNDO estão a uma distância
 * praticamente infinita, então giram MUITO menos que a superfície do planeta.
 * O fator 0,12 aplica exatamente essa leitura — girar a Terra faz o céu deslizar
 * devagar atrás dela, e a cena ganha profundidade sem nenhum truque de câmera.
 */
function paintSpace(
  ctx: Ctx2D, w: number, h: number, pal: Palette,
  isGlobe: boolean, rotacao: number, theme: ThemeName,
): void {
  if (!isGlobe) return; // no plano o oceano cobre tudo; gradiente extra só suja
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, pal.space[0]);
  g.addColorStop(1, pal.space[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  if (theme !== 'dark') return;

  // Deslocamento horizontal proporcional à rotação, com envolvimento (wrap) para o
  // campo nunca acabar. Estrelas de fundo são pontos fixos: nada de gradiente por
  // ponto, nada de projeção — só posição e alfa.
  const desloc = ((-rotacao * PARALLAX_FATOR) % w + w) % w;
  ctx.save();
  ctx.fillStyle = `rgb(${pal.stars})`;
  for (const s of ESTRELAS_DE_FUNDO) {
    const x = (s.x * w + desloc) % w;
    const y = s.y * h;
    ctx.globalAlpha = s.mag * 0.5;
    ctx.fillRect(x, y, s.mag * 1.4, s.mag * 1.4);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** Quanto o céu de fundo acompanha a rotação do globo. 0 = imóvel, 1 = colado. */
const PARALLAX_FATOR = 0.12;

/** Campo de fundo em coordenadas de TELA (0..1), determinístico como o estelar geográfico. */
const ESTRELAS_DE_FUNDO: { x: number; y: number; mag: number }[] = (() => {
  let seed = 987654321;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: 260 }, () => ({ x: rnd(), y: rnd(), mag: 0.4 + rnd() * 0.9 }));
})();

function paintOcean(
  ctx: Ctx2D,
  path: ReturnType<typeof geoPath>,
  pal: Palette, w: number, h: number, isGlobe: boolean,
): void {
  ctx.save();
  ctx.beginPath();
  path(SPHERE);

  // Profundidade: no globo o gradiente é radial (esfera iluminada de frente);
  // no plano é vertical, imitando a batimetria mais escura nos polos.
  const g = isGlobe
    ? ctx.createRadialGradient(w * 0.42, h * 0.38, 8, w / 2, h / 2, Math.min(w, h) * 0.62)
    : ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, pal.ocean[0]);
  g.addColorStop(1, pal.ocean[1]);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

function paintGraticule(
  ctx: Ctx2D,
  path: ReturnType<typeof geoPath>,
  pal: Palette, quality: Quality,
): void {
  ctx.save();
  ctx.beginPath();
  path(geoGraticule10());
  ctx.strokeStyle = pal.graticule;
  ctx.lineWidth = quality === 'full' ? 0.6 : 0.5;
  ctx.stroke();

  // Equador e meridiano de Greenwich um pouco mais presentes: são referências reais.
  if (quality === 'full') {
    ctx.beginPath();
    path({ type: 'LineString', coordinates: [[-180, 0], [0, 0], [180, 0]] });
    path({ type: 'LineString', coordinates: [[0, -90], [0, 0], [0, 90]] });
    ctx.strokeStyle = pal.graticule;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Continentes.
 *
 * 🔴 NÃO REINTRODUZIR `ctx.shadowBlur` AQUI. A primeira versão punha uma sombra
 * suave sob a terra para dar relevo. O perfil de CPU durante o arrasto apontou 52%
 * do tempo em `closePath` nativo: o caminho da terra tem **1.429 anéis e 60.835
 * pontos**, e sombrear um caminho desse tamanho obriga o navegador a rasterizar
 * tudo e borrar — o quadro passava de 150 ms (≈6 fps).
 *
 * O relevo agora vem de dois traços concêntricos baratos: um escuro por baixo,
 * deslocado 1px, e o contorno claro por cima. Custa dois `stroke()` e dá a mesma
 * leitura de profundidade.
 */
function paintLand(
  ctx: Ctx2D,
  path: ReturnType<typeof geoPath>,
  land: Feature<MultiPolygon>,
  pal: Palette, w: number, h: number, isGlobe: boolean, quality: Quality,
): void {
  ctx.save();
  ctx.beginPath();
  path(land);

  const g = isGlobe
    ? ctx.createRadialGradient(w * 0.42, h * 0.38, 10, w / 2, h / 2, Math.min(w, h) * 0.62)
    : ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, pal.land[0]);
  g.addColorStop(1, pal.land[1]);
  ctx.fillStyle = g;
  ctx.fill();

  if (quality === 'full') {
    // Falsa sombra: traço escuro deslocado, recortado pela própria terra para não
    // vazar para o oceano. Reaproveita o caminho já construído — custo desprezível.
    ctx.save();
    ctx.clip();
    ctx.translate(0.6, 1.2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = pal.landStroke;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

function paintBorders(
  ctx: Ctx2D,
  path: ReturnType<typeof geoPath>,
  borders: MultiLineString,
  pal: Palette,
): void {
  ctx.save();
  ctx.beginPath();
  path(borders);
  ctx.strokeStyle = pal.borders;
  ctx.lineWidth = 0.45;
  ctx.stroke();
  ctx.restore();
}

/**
 * Noite em faixas concêntricas ao redor do ponto antisolar.
 * Sobrepor 7 calotas translúcidas produz o degradê atmosférico contínuo do briefing
 * sem nenhum shader: cada anel escurece um pouco mais que o anterior.
 */
function paintNight(
  ctx: Ctx2D,
  path: ReturnType<typeof geoPath>,
  date: Date, pal: Palette,
): void {
  ctx.save();
  // Recorta na esfera para a noite não escorrer para fora do globo.
  ctx.beginPath();
  path(SPHERE);
  ctx.clip();

  for (const band of TWILIGHT_BANDS) {
    ctx.beginPath();
    path(nightCap(date, band.radius, 2));
    ctx.fillStyle = `rgba(${pal.night}, ${band.alpha})`;
    ctx.fill();
  }
  ctx.restore();
}

function paintStars(
  ctx: Ctx2D,
  projection: GeoProjection,
  path: ReturnType<typeof geoPath>,
  date: Date, pal: Palette, elapsed: number,
): void {
  const [aLng, aLat] = antisolarPoint(date);
  ctx.save();
  // Estrelas só dentro da calota de noite fechada (Sol abaixo de −18°).
  ctx.beginPath();
  path(nightCap(date, 72, 3));
  ctx.clip();

  for (const s of STARS) {
    // Descarta o hemisfério oposto antes de projetar: geoDistance é bem mais barato.
    if (geoDistance([s.lng, s.lat], [aLng, aLat]) > Math.PI / 2) continue;
    const pt = projection([s.lng, s.lat]);
    if (!pt) continue;
    const twinkle = 0.72 + 0.28 * Math.sin(elapsed * 1.6 + s.phase);
    ctx.globalAlpha = s.mag * 0.55 * twinkle;
    ctx.fillStyle = `rgb(${pal.stars})`;
    ctx.beginPath();
    ctx.arc(pt[0], pt[1], s.mag * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/**
 * SPRITE DE LUZ — desenhado uma vez, reaproveitado milhares de vezes.
 *
 * A versão anterior criava um `createRadialGradient` POR LUZ, a cada quadro: até
 * 5.228 objetos de gradiente por repintura. Criar gradiente é caro; desenhar uma
 * imagem já pronta é praticamente de graça. O sprite é gerado no primeiro uso e
 * cacheado por cor, e a intensidade vem de `globalAlpha` na hora de estampar.
 */
type SpriteCanvas = HTMLCanvasElement | OffscreenCanvas;
const _spriteCache = new Map<string, SpriteCanvas>();

function spriteLuz(cor: string): SpriteCanvas {
  const hit = _spriteCache.get(cor);
  if (hit) return hit;

  const R = 32; // resolução do sprite; é reescalado no destino
  // Dentro do worker não existe `document`: OffscreenCanvas é o único caminho.
  //
  // O dimensionamento vive DENTRO de cada ramo de propósito. A versão anterior
  // decidia depois, com `c instanceof HTMLCanvasElement` — e `instanceof` avalia o
  // identificador em runtime: no worker `HTMLCanvasElement` não existe e a linha
  // lançava `ReferenceError`, matando toda a pintura fora da thread principal.
  // Medido em 2026-07-30; ficou escondido enquanto um crash anterior derrubava a
  // árvore React antes de o worker chegar a pintar.
  let c: SpriteCanvas;
  if (typeof OffscreenCanvas !== 'undefined') {
    c = new OffscreenCanvas(R * 2, R * 2); // já nasce com o tamanho
  } else {
    const el = document.createElement('canvas');
    el.width = R * 2;
    el.height = R * 2;
    c = el;
  }
  const g = c.getContext('2d') as Ctx2D | null;
  if (g) {
    const grad = g.createRadialGradient(R, R, 0, R, R, R);
    grad.addColorStop(0, `rgba(${cor}, 1)`);
    grad.addColorStop(0.18, `rgba(${cor}, 0.55)`);
    grad.addColorStop(0.45, `rgba(${cor}, 0.18)`);
    grad.addColorStop(1, `rgba(${cor}, 0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, R * 2, R * 2);
  }
  _spriteCache.set(cor, c);
  return c;
}

/**
 * Luzes das cidades no lado noturno — o efeito "Terra à noite" do Google Earth.
 * Composição `lighter` (aditiva) faz os aglomerados urbanos somarem brilho e formarem
 * manchas contínuas, exatamente como numa imagem de satélite noturna.
 */
function paintCityLights(
  ctx: Ctx2D,
  projection: GeoProjection,
  path: ReturnType<typeof geoPath>,
  date: Date,
  lights: CityLight[],
  pal: Palette,
  quality: Quality,
  isGlobe: boolean,
): void {
  const [aLng, aLat] = antisolarPoint(date);
  // Em movimento, só os núcleos maiores: o olho não conta pontos num mapa que desliza.
  const minTier = quality === 'full' ? 0 : 2;
  const sprite = spriteLuz(pal.lights);

  ctx.save();
  ctx.beginPath();
  path(nightCap(date, 88, 2));
  ctx.clip();
  ctx.globalCompositeOperation = 'lighter';

  for (const l of lights) {
    if (l.tier < minTier) continue;
    const dist = geoDistance([l.lng, l.lat], [aLng, aLat]);
    if (dist > Math.PI / 2) continue;
    const pt = projection([l.lng, l.lat]);
    // No globo o clipAngle devolve undefined para o lado de trás.
    if (!pt) continue;

    // Mais fundo na noite = luz mais intensa (perto do terminador o dia ainda lava).
    const depth = Math.min(1, (Math.PI / 2 - dist) / (Math.PI / 3));
    const alpha = (0.10 + l.tier * 0.055) * depth;
    if (alpha <= 0.012) continue;

    const raio = (0.7 + l.tier * 0.55) * 3.2;
    ctx.globalAlpha = Math.min(1, alpha * 2.2);
      ctx.drawImage(sprite as CanvasImageSource, pt[0] - raio, pt[1] - raio, raio * 2, raio * 2);
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  void isGlobe;
}

/** Marcador do ponto subsolar com halo — "onde é meio-dia agora". */
function paintSun(
  ctx: Ctx2D,
  projection: GeoProjection,
  date: Date, pal: Palette, isGlobe: boolean,
): void {
  const s = solarPosition(date);
  const pt = projection([s.lng, s.lat]);
  if (!pt) return;
  if (isGlobe && geoDistance([s.lng, s.lat], invertCenter(projection)) > Math.PI / 2) return;

  ctx.save();
  const halo = ctx.createRadialGradient(pt[0], pt[1], 0, pt[0], pt[1], 48);
  halo.addColorStop(0, `rgba(${pal.sunHalo}, 0.42)`);
  halo.addColorStop(0.35, `rgba(${pal.sunHalo}, 0.16)`);
  halo.addColorStop(1, `rgba(${pal.sunHalo}, 0)`);
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(pt[0], pt[1], 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = pal.sun;
  ctx.beginPath();
  ctx.arc(pt[0], pt[1], 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(${pal.sunHalo}, 0.75)`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(pt[0], pt[1], 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Centro geográfico atual da projeção (inverso da rotação). */
function invertCenter(projection: GeoProjection): [number, number] {
  const r = projection.rotate();
  return [-r[0], -r[1]];
}

function paintSphereEdge(
  ctx: Ctx2D,
  path: ReturnType<typeof geoPath>,
  pal: Palette, isGlobe: boolean,
): void {
  ctx.save();
  ctx.beginPath();
  path(SPHERE);
  ctx.strokeStyle = pal.sphereEdge;
  ctx.lineWidth = isGlobe ? 1.2 : 0.8;
  ctx.stroke();
  ctx.restore();
}

/** Halo atmosférico externo — só no globo, onde existe borda de planeta. */
function paintAtmosphere(
  ctx: Ctx2D,
  path: ReturnType<typeof geoPath>,
  pal: Palette, w: number, h: number,
): void {
  const b = path.bounds(SPHERE);
  const cx = (b[0][0] + b[1][0]) / 2;
  const cy = (b[0][1] + b[1][1]) / 2;
  const r = (b[1][0] - b[0][0]) / 2;
  if (!(r > 0)) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(cx, cy, r * 0.965, cx, cy, r * 1.14);
  g.addColorStop(0, `rgba(${pal.atmosphere}, 0)`);
  g.addColorStop(0.32, `rgba(${pal.atmosphere}, 0.20)`);
  g.addColorStop(1, `rgba(${pal.atmosphere}, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  void w; void h;
}

/** Ajusta o canvas ao devicePixelRatio. Devolve as dimensões em CSS pixels. */
export function fitCanvas(
  canvas: HTMLCanvasElement, cssWidth: number, cssHeight: number,
): { ctx: CanvasRenderingContext2D | null; dpr: number } {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const w = Math.max(1, Math.round(cssWidth * dpr));
  const h = Math.max(1, Math.round(cssHeight * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }
  return { ctx, dpr };
}
