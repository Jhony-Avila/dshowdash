/**
 * map/WorldMap.tsx — o mapa: canvas, navegação e camada de marcadores.
 * @version 3.0.0
 *
 * DIVISÃO DE TRABALHO: o canvas desenha o que é geografia contínua (oceano, terra,
 * noite, luzes) porque milhares de primitivas em DOM matariam o quadro; os marcadores
 * são HTML porque precisam de foco, ARIA, teclado e texto selecionável — a11y de
 * verdade não sai de retângulo pintado em canvas.
 *
 * As duas camadas compartilham a MESMA instância de projeção (useMemo), então nunca
 * saem de registro: se o card diz Tóquio, o ponto embaixo é Tóquio.
 *
 * NAVEGAÇÃO: arrastar gira o globo (ortográfica) ou desloca o mapa (planas); roda do
 * mouse dá zoom no cursor; teclado move e amplia com a mesma semântica. Durante a
 * interação o renderizador entra em modo `interactive` e volta ao completo 140 ms
 * depois da última ação.
 */
'use strict';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { geoDistance } from 'd3-geo';
import { getCity, type City } from '@/data/cities';
import type { LayerFlags } from '@/lib/prefs';
import type { WeatherMap } from '@/lib/weather';
import { loadGeo, peekGeo, type GeoData } from '@/map/geodata';
import {
  clampPan, clampRotation, clampZoom, configureProjection,
  NO_INSETS, PROJECTION_BY_ID, type Insets, type ProjectionId, type ViewState,
} from '@/map/projections';
import { fitCanvas, renderScene, type Quality, type ThemeName } from '@/map/renderer';
import type { MsgRender, MsgSaida } from '@/map/render.worker';
import { boxIntersects, isOccluded, type Rect } from '@/map/useObstacles';
import { CityMarker } from '@/components/CityMarker';
import { MarketPin } from '@/components/MarketPin';
import { AirportPin } from '@/components/AirportPin';
import { EventPin, eventoRelevante, type EventoDeCidade } from '@/components/EventPin';
import { AIRPORTS } from '@/data/airports';
import { EXCHANGES } from '@/data/exchanges';
import { marketStatus } from '@/lib/markets';

export interface WorldMapProps {
  date: Date;
  theme: ThemeName;
  layers: LayerFlags;
  projectionId: ProjectionId;
  view: ViewState;
  onViewChange: (v: ViewState) => void;
  cities: City[];
  activeId: string;
  favorites: string[];
  weather: WeatherMap;
  onSelectCity: (id: string) => void;
  onHoverCity: (id: string | null, rect: DOMRect | null) => void;
  /** Expõe o canvas para a exportação PNG. */
  canvasRef?: React.MutableRefObject<HTMLCanvasElement | null>;
  /** Retângulos da interface que cobrem o mapa — marcadores ali não são desenhados. */
  obstacles?: Rect[];
  /** Margens da interface: a esfera é enquadrada no corredor livre. */
  insets?: Insets;
}

interface Size { w: number; h: number }

/** Lado do ponto em que o rótulo é desenhado. */
export type Placement = 'right' | 'left' | 'top' | 'bottom';

interface PlacedCity { city: City; x: number; y: number; compact: boolean; side: Placement }

/** Referência estável: `?? []` inline criaria um array novo a cada render. */
const EMPTY_RECTS: Rect[] = [];

export function WorldMap(props: WorldMapProps) {
  const {
    date, theme, layers, projectionId, view, onViewChange,
    cities, activeId, favorites, weather, onSelectCity, onHoverCity,
    obstacles, insets,
  } = props;
  const obst = obstacles ?? EMPTY_RECTS;
  const ins = insets ?? NO_INSETS;

  const hostRef = useRef<HTMLDivElement | null>(null);
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState<Size>({ w: 960, h: 540 });
  const [geo, setGeo] = useState<GeoData | null>(() => peekGeo());
  const [quality, setQuality] = useState<Quality>('full');

  const idleTimer = useRef<number | null>(null);

  /**
   * PINTURA FORA DA THREAD PRINCIPAL.
   *
   * `transferControlToOffscreen` só pode ser chamado UMA vez por canvas e, depois
   * dele, a thread principal não consegue mais um contexto 2D deste elemento — daí
   * a decisão ser tomada uma única vez, na montagem, e ficar registrada em ref.
   *
   * Retaguarda: navegador sem OffscreenCanvas ou sem Worker (ou falha ao criar)
   * continua pintando na thread principal, com exatamente o mesmo `renderScene`.
   */
  const workerRef = useRef<Worker | null>(null);
  const transferido = useRef(false);
  const [usandoWorker, setUsandoWorker] = useState(false);
  const [geoNoWorker, setGeoNoWorker] = useState(false);

  const def = PROJECTION_BY_ID[projectionId];

  // ---- worker de pintura ----
  useEffect(() => {
    const canvas = localCanvasRef.current;
    if (!canvas || transferido.current) return;
    const suportado = typeof Worker !== 'undefined'
      && typeof HTMLCanvasElement !== 'undefined'
      && typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function';
    if (!suportado) return;

    let w: Worker | null = null;
    try {
      w = new Worker(new URL('./render.worker.ts', import.meta.url), { type: 'module' });
      const off = canvas.transferControlToOffscreen();
      transferido.current = true;
      w.postMessage({ tipo: 'init', canvas: off }, [off]);
      w.onmessage = (e: MessageEvent<MsgSaida>) => {
        if (e.data.tipo === 'geo-pronta') setGeoNoWorker(true);
        // 'geo-falhou' mantém o indicador de carregamento visível: o mapa fica sem
        // continentes, o que é honesto — melhor que fingir que carregou.
      };
      workerRef.current = w;
      setUsandoWorker(true);
    } catch {
      // Falha ao criar o worker ou ao transferir: segue na thread principal.
      try { w?.terminate(); } catch { /* noop */ }
      workerRef.current = null;
      setUsandoWorker(false);
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // ---- geometria (uma vez por sessão de página) ----
  useEffect(() => {
    // Com o worker no comando, a geometria é dele: buscar e converter aqui só
    // duplicaria 756 KB de parse na thread que se quer aliviar.
    // `transferido` primeiro pela mesma razão do efeito de pintura: no commit da
    // montagem o estado ainda é `false` e a busca dos 756 KB partia à toa (o
    // AbortController cancelava logo depois, mas a requisição chegava a sair).
    if (transferido.current || usandoWorker) return;
    if (geo) return;
    const ac = new AbortController();
    void loadGeo(ac.signal).then((g) => {
      if (!ac.signal.aborted && g) setGeo(g);
    });
    return () => ac.abort();
  }, [geo, usandoWorker]);

  // ---- tamanho ----
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (!r) return;
      setSize((prev) => {
        const w = Math.max(160, Math.round(r.width));
        const h = Math.max(120, Math.round(r.height));
        return prev.w === w && prev.h === h ? prev : { w, h };
      });
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const projection = useMemo(
    () => configureProjection(def, size.w, size.h, view, ins),
    [def, size.w, size.h, view, ins],
  );

  /**
   * INSTANTE DE PINTURA, arredondado ao MINUTO.
   *
   * O relógio mestre bate a cada segundo, e a primeira versão usava `date` direto na
   * dependência do efeito de pintura: o mapa inteiro era repintado 60 vezes por
   * minuto, em qualidade máxima, com o painel PARADO. A medição pegou: 132–200 ms de
   * tarefa longa em repouso, contra 60–114 ms do próprio app-shell sem este painel.
   *
   * Nada na cena muda dentro do minuto — o terminador avança 0,25° e as luzes não se
   * mexem. Os relógios digitais continuam em 1 Hz (são HTML, não canvas).
   */
  const minuto = Math.floor(date.getTime() / 60000);
  const dataDaPintura = useMemo(() => new Date(minuto * 60000), [minuto]);


  // ---- pintura ----
  useEffect(() => {
    const canvas = localCanvasRef.current;
    if (!canvas) return;

    // A CONDIÇÃO LÊ O REF, NÃO O ESTADO.
    //
    // `setUsandoWorker(true)` só vale no PRÓXIMO commit, e este efeito roda no MESMO
    // em que a transferência acontece — o efeito do worker está declarado acima, logo
    // executa antes. Lendo `usandoWorker`, a primeira pintura via `false`, caía no
    // caminho da thread principal e chamava `fitCanvas()` num canvas JÁ transferido:
    // `canvas.width = w` lança InvalidStateError, e a exceção em efeito de commit
    // derrubava a árvore React inteira — o host ficava vazio e o painel não montava.
    // Medido em 2026-07-30 ("Cannot resize canvas after call to
    // transferControlToOffscreen"). `transferido` é ref e é verdadeiro no instante
    // exato em que o elemento deixa de aceitar width/height, que é o que importa aqui.
    if (transferido.current) {
      // Só o tamanho em CSS pixels vem daqui; o bitmap é do worker (o elemento já
      // não aceita mudança de width/height depois da transferência).
      canvas.style.width = `${size.w}px`;
      canvas.style.height = `${size.h}px`;
      // Transferido mas sem worker vivo (cleanup) = não há mais como pintar este
      // elemento; sair é o único caminho que não lança.
      if (!workerRef.current) return;
      const msg: MsgRender = {
        tipo: 'render',
        width: size.w,
        height: size.h,
        dpr: Math.min(window.devicePixelRatio || 1, 2.5),
        tempo: dataDaPintura.getTime(),
        theme,
        layers,
        quality,
        projectionId,
        view,
        insets: ins,
        elapsed: minuto % 3600,
      };
      workerRef.current.postMessage(msg);
      return;
    }

    const { ctx } = fitCanvas(canvas, size.w, size.h);
    if (!ctx) return;
    renderScene({
      ctx,
      projection,
      width: size.w,
      height: size.h,
      date: dataDaPintura,
      theme,
      layers,
      quality,
      geo,
      isGlobe: def.isGlobe,
      // Fase do cintilar das estrelas: muda a cada minuto, junto com a repintura.
      // Um cintilar contínuo exigiria um laço de animação repintando 60 vezes por
      // segundo os 1.429 anéis do mapa — custo absurdo para um efeito de fundo.
      elapsed: minuto % 3600,
      // Parallax: o céu de fundo desliza com a rotação, bem mais devagar que a Terra.
      rotacao: view.rotate[0],
    });
  }, [projection, size.w, size.h, dataDaPintura, minuto, theme, layers, quality, geo, def.isGlobe,
      view, ins, projectionId, usandoWorker]);

  useEffect(() => {
    if (props.canvasRef) props.canvasRef.current = localCanvasRef.current;
  }, [props.canvasRef]);

  const markInteracting = useCallback(() => {
    setQuality('interactive');
    if (idleTimer.current !== null) clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      idleTimer.current = null;
      setQuality('full');
    }, 140);
  }, []);

  useEffect(() => () => {
    if (idleTimer.current !== null) clearTimeout(idleTimer.current);
  }, []);

  // ---- arrastar ----
  const drag = useRef<{ x: number; y: number; view: ViewState } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Só o botão principal arrasta; e nunca quando o alvo é um marcador (o card
    // precisa continuar clicável).
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-wcm-marker]')) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, view };
    markInteracting();
  }, [view, markInteracting]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    markInteracting();

    if (def.isGlobe) {
      // Sensibilidade proporcional ao zoom: com o globo ampliado, o mesmo arrasto
      // em pixels precisa girar menos graus, senão a Terra "escapa" da mão.
      const k = 0.32 / d.view.k;
      onViewChange({
        ...d.view,
        rotate: clampRotation([
          d.view.rotate[0] + dx * k * 1.2,
          d.view.rotate[1] - dy * k,
          d.view.rotate[2],
        ]),
      });
    } else {
      onViewChange(clampPan({ ...d.view, x: d.view.x + dx, y: d.view.y + dy }, size.w, size.h));
    }
  }, [def.isGlobe, onViewChange, size.w, size.h, markInteracting]);

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
  }, []);

  // ---- roda do mouse ----
  // Registrado à mão com {passive:false}: o React só entrega wheel passivo, e sem
  // preventDefault a página inteira rola junto com o zoom do mapa.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      markInteracting();
      const factor = Math.exp(-e.deltaY * 0.0016);
      const k = clampZoom(view.k * factor);
      if (k === view.k) return;

      if (def.isGlobe) {
        onViewChange({ ...view, k });
        return;
      }
      // Zoom ancorado no cursor: o ponto sob o mouse não escorrega.
      const rect = host.getBoundingClientRect();
      const cx = e.clientX - rect.left - size.w / 2;
      const cy = e.clientY - rect.top - size.h / 2;
      const ratio = k / view.k;
      onViewChange(clampPan({
        ...view,
        k,
        x: cx - (cx - view.x) * ratio,
        y: cy - (cy - view.y) * ratio,
      }, size.w, size.h));
    };

    host.addEventListener('wheel', onWheel, { passive: false });
    return () => host.removeEventListener('wheel', onWheel);
  }, [view, def.isGlobe, onViewChange, size.w, size.h, markInteracting]);

  // ---- teclado (a11y: navegação sem mouse) ----
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 24 : 8;
    let handled = true;
    if (def.isGlobe) {
      const r = view.rotate;
      if (e.key === 'ArrowLeft') onViewChange({ ...view, rotate: clampRotation([r[0] - step, r[1], r[2]]) });
      else if (e.key === 'ArrowRight') onViewChange({ ...view, rotate: clampRotation([r[0] + step, r[1], r[2]]) });
      else if (e.key === 'ArrowUp') onViewChange({ ...view, rotate: clampRotation([r[0], r[1] + step / 2, r[2]]) });
      else if (e.key === 'ArrowDown') onViewChange({ ...view, rotate: clampRotation([r[0], r[1] - step / 2, r[2]]) });
      else handled = false;
    } else {
      if (e.key === 'ArrowLeft') onViewChange(clampPan({ ...view, x: view.x + step * 4 }, size.w, size.h));
      else if (e.key === 'ArrowRight') onViewChange(clampPan({ ...view, x: view.x - step * 4 }, size.w, size.h));
      else if (e.key === 'ArrowUp') onViewChange(clampPan({ ...view, y: view.y + step * 4 }, size.w, size.h));
      else if (e.key === 'ArrowDown') onViewChange(clampPan({ ...view, y: view.y - step * 4 }, size.w, size.h));
      else handled = false;
    }
    if (!handled) {
      if (e.key === '+' || e.key === '=') { onViewChange({ ...view, k: clampZoom(view.k * 1.25) }); handled = true; }
      else if (e.key === '-' || e.key === '_') { onViewChange(clampPan({ ...view, k: clampZoom(view.k / 1.25) }, size.w, size.h)); handled = true; }
      else if (e.key === '0') { onViewChange({ k: 1, x: 0, y: 0, rotate: [0, 0, 0] }); handled = true; }
    }
    if (handled) {
      e.preventDefault();
      markInteracting();
    }
  }, [view, def.isGlobe, onViewChange, size.w, size.h, markInteracting]);

  // ---- posições dos marcadores ----
  const center = useMemo<[number, number]>(() => {
    const r = projection.rotate();
    return [-r[0], -r[1]];
  }, [projection]);

  const visibleAt = useCallback((lng: number, lat: number) => {
    if (def.isGlobe && geoDistance([lng, lat], center) > Math.PI / 2) return null;
    const pt = projection([lng, lat]);
    if (!pt) return null;
    const [x, y] = pt;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    // Margem generosa: um card pode nascer meio fora e ainda ser útil.
    if (x < -160 || y < -80 || x > size.w + 160 || y > size.h + 80) return null;
    return { x, y };
  }, [projection, def.isGlobe, center, size.w, size.h]);

  /*
   * POSICIONAMENTO DE RÓTULOS POR CAIXAS REAIS.
   *
   * A primeira versão usava uma grade de células: dois rótulos na mesma célula, um
   * virava compacto. Grade não modela o formato do rótulo — o cartão tem 112×50 e o
   * pino de bolsa 58×15, então "células diferentes" seguiam se sobrepondo na tela.
   * O resultado eram os pinos XETRA/BME/BIST/TASE/OMX empilhados sobre os cartões de
   * Londres e Moscou.
   *
   * Aqui cada rótulo tenta ocupar a caixa que REALMENTE vai desenhar. Se não couber
   * inteira, tenta a versão compacta; se nem essa couber, não é desenhado. É o
   * algoritmo guloso clássico de rotulagem cartográfica: simples, estável entre
   * quadros (a ordem é determinística) e sem sobreposição.
   */
  const CARD_W = 112;
  const CARD_H = 50;
  const CHIP_W = 50;
  const CHIP_H = 18;
  const PIN_W = 58;
  const PIN_H = 15;
  // O rótulo nasce à direita do ponto; o deslocamento entra no centro da caixa.
  const GAP = 9;

  /** Centro da caixa do rótulo para cada lado possível em torno do ponto. */
  const centroDoLado = useCallback(
    (px: number, py: number, w: number, h: number, side: Placement): [number, number] => {
      switch (side) {
        case 'left': return [px - GAP - w / 2, py];
        case 'top': return [px, py - GAP - h / 2];
        case 'bottom': return [px, py + GAP + h / 2];
        default: return [px + GAP + w / 2, py];
      }
    },
    [],
  );

  const { placedCities, occupiedBoxes } = useMemo(() => {
    // Prioridade: cidade ativa, depois favoritas, depois população. Quem importa
    // mais para o usuário ganha o cartão inteiro quando o espaço é disputado.
    const peso = (c: City) => (c.id === activeId ? 2 : favorites.includes(c.id) ? 1 : 0);
    const sorted = [...cities].sort((a, b) => peso(b) - peso(a) || b.pop - a.pop);

    const boxes: Rect[] = [];
    const out: PlacedCity[] = [];
    // ORÇAMENTO DE CARTÕES POR ÁREA DE MAPA. Num mapa de 388px (o breakpoint
    // estreito) um cartão de 112px é 29% da largura: cinco deles vazavam para fora
    // da moldura e apareciam cortados. Abaixo de 520px só chips; entre 520 e 900,
    // poucos cartões; acima disso, o orçamento cheio.
    const MAX_CARDS = size.w < 520 ? 0 : size.w < 900 ? 5 : 8;
    let cartoesUsados = 0;

    const livre = (cx: number, cy: number, w: number, h: number) =>
      !boxIntersects(cx, cy, w, h, obst, 2) && !boxIntersects(cx, cy, w, h, boxes, 2);

    // Quatro lados antes de desistir. Com um único lado (direita) os clusters
    // europeu e asiático perdiam 6 das 15 cidades; tentar esquerda/cima/baixo
    // recupera quase todas sem nenhuma sobreposição.
    const LADOS: Placement[] = ['right', 'left', 'top', 'bottom'];

    for (const city of sorted) {
      const p = visibleAt(city.lng, city.lat);
      if (!p) continue;
      // O PONTO sob um painel: o marcador seria invisível e inclicável — descarta.
      if (isOccluded(p.x, p.y, obst, 8)) continue;

      let colocado = false;

      // ORÇAMENTO DE CARTÕES: as primeiras MAX_CARDS cidades (ativa, favoritas e as
      // mais populosas) disputam o cartão cheio; da MAX_CARDS+1 em diante só o chip.
      //
      // Sem esse teto, o algoritmo guloso dava cartão de 112×50 para todo mundo até
      // acabar o espaço — 8 cidades apareciam e as outras 7 sumiam. Com o teto,
      // 8 cartões convivem com chips de 50×18 e o mapa mostra as 15.
      const tentativas = cartoesUsados < MAX_CARDS
        ? ([[CARD_W, CARD_H, false], [CHIP_W, CHIP_H, true]] as const)
        : ([[CHIP_W, CHIP_H, true]] as const);

      for (const [w, h, compact] of tentativas) {
        for (const side of LADOS) {
          const [cx, cy] = centroDoLado(p.x, p.y, w, h, side);
          if (!livre(cx, cy, w, h)) continue;
          boxes.push({ x: cx - w / 2, y: cy - h / 2, w, h });
          out.push({ city, x: p.x, y: p.y, compact, side });
          if (!compact) cartoesUsados++;
          colocado = true;
          break;
        }
        if (colocado) break;
      }
      // Sem espaço nem para o chip em nenhum lado: fica de fora deste quadro. Volta
      // assim que o usuário der zoom ou fechar um painel.
    }
    return { placedCities: out, occupiedBoxes: boxes };
  }, [cities, visibleAt, obst, activeId, favorites, centroDoLado, size.w]);

  /**
   * Cidades que já exibem CARTÃO COMPLETO — o cartão traz a linha "NYSE · Aberto",
   * então repetir um pino de bolsa em cima dele é ruído puro. Na primeira prova
   * visual isso produzia "NASDAQ" atravessando o cartão de Nova York e "SSE/HKEX/SGX"
   * empilhados sobre o cluster asiático.
   */
  const comCartaoCompleto = useMemo(
    () => new Set(placedCities.filter((p) => !p.compact).map((p) => p.city.id)),
    [placedCities],
  );

  const placedMarkets = useMemo(() => {
    if (!layers.markets) return [];

    // A camada de mercados mostra as 29 praças, PINADAS OU NÃO. Antes ela só
    // desenhava bolsas de cidades já visíveis, o que a tornava redundante com os
    // cartões — uma camada que só repete o que já está na tela não é uma camada.
    // Agora Frankfurt, Toronto ou Madri aparecem mesmo sem estarem fixadas.
    const abertoPrimeiro = [...EXCHANGES].sort((a, b) => {
      const oa = marketStatus(a, date).isOpen ? 0 : 1;
      const ob = marketStatus(b, date).isOpen ? 0 : 1;
      return oa - ob;
    });

    // Os pinos disputam espaço com os cartões JÁ POSICIONADOS (occupiedBoxes) e entre
    // si. Vence quem vem primeiro na ordem — logo, uma praça ABERTA nunca é escondida
    // por uma fechada.
    const boxes: Rect[] = [...occupiedBoxes];
    const out: { ex: (typeof EXCHANGES)[number]; x: number; y: number }[] = [];

    for (const ex of abertoPrimeiro) {
      // O cartão completo da cidade já reporta o estado desta praça.
      if (layers.labels && comCartaoCompleto.has(ex.cityId)) continue;
      const city = getCity(ex.cityId);
      if (!city) continue;
      const p = visibleAt(city.lng, city.lat);
      if (!p) continue;

      const cy = p.y - 26;
      if (isOccluded(p.x, cy, obst, 8)) continue;
      if (boxIntersects(p.x, cy, PIN_W, PIN_H, obst, 2)) continue;
      if (boxIntersects(p.x, cy, PIN_W, PIN_H, boxes, 2)) continue;

      boxes.push({ x: p.x - PIN_W / 2, y: cy - PIN_H / 2, w: PIN_W, h: PIN_H });
      out.push({ ex, x: p.x, y: p.y });
    }
    return out;
  }, [layers.markets, layers.labels, visibleAt, obst, comCartaoCompleto, date, occupiedBoxes]);

  /**
   * Camada de eventos: só cidades VISÍVEIS com feriado hoje ou DST em ≤7 dias.
   * O pino desce 24px (do outro lado do pino de bolsa, que sobe 26px) para os dois
   * poderem coexistir na mesma cidade sem colisão.
   */
  const placedEvents = useMemo(() => {
    if (!layers.events) return [];
    const out: { city: City; evento: EventoDeCidade; x: number; y: number }[] = [];
    for (const city of cities) {
      const evento = eventoRelevante(city, date);
      if (!evento) continue;
      const p = visibleAt(city.lng, city.lat);
      if (!p) continue;
      const cy = p.y + 24;
      if (isOccluded(p.x, cy, obst, 8)) continue;
      if (boxIntersects(p.x, cy, 88, 16, obst, 2)) continue;
      out.push({ city, evento, x: p.x, y: cy });
    }
    return out;
  }, [layers.events, cities, visibleAt, obst, date]);

  const placedAirports = useMemo(() => {
    if (!layers.airports) return [];
    const wanted = new Set(cities.map((c) => c.id));
    return AIRPORTS
      .filter((a) => wanted.has(a.cityId))
      .map((a) => {
        const p = visibleAt(a.lng, a.lat);
        if (!p) return null;
        if (isOccluded(p.x, p.y + 22, obst, 8)) return null;
        return { airport: a, x: p.x, y: p.y };
      })
      .filter((v): v is { airport: (typeof AIRPORTS)[number]; x: number; y: number } => v !== null);
  }, [layers.airports, cities, visibleAt, obst]);

  return (
    <div
      ref={hostRef}
      className={`wcm-map${def.isGlobe ? ' is-globe' : ''}`}
      role="application"
      aria-label="Mapa-múndi interativo com fusos horários. Use as setas para navegar, mais e menos para ampliar, zero para reenquadrar."
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <canvas ref={localCanvasRef} className="wcm-map__canvas" aria-hidden="true" />

      <div className="wcm-map__overlay">
        {placedAirports.map(({ airport, x, y }) => (
          <AirportPin key={airport.iata} airport={airport} x={x} y={y} date={date} />
        ))}

        {placedMarkets.map(({ ex, x, y }) => (
          <MarketPin key={ex.id} exchange={ex} x={x} y={y} date={date} />
        ))}

        {placedEvents.map(({ city, evento, x, y }) => (
          <EventPin key={`ev-${city.id}`} city={city} evento={evento} x={x} y={y} onSelect={onSelectCity} />
        ))}

        {placedCities.map(({ city, x, y, compact, side }) => (
          <CityMarker
            key={city.id}
            city={city}
            x={x}
            y={y}
            compact={compact}
            side={side}
            date={date}
            active={city.id === activeId}
            favorite={favorites.includes(city.id)}
            weather={weather[city.id]}
            showWeather={layers.weather}
            showLabels={layers.labels}
            onSelect={onSelectCity}
            onHover={onHoverCity}
          />
        ))}
      </div>

      {!(usandoWorker ? geoNoWorker : geo) && (
        <div className="wcm-map__loading" role="status">
          <span className="wcm-spinner" aria-hidden="true" />
          Carregando geometria mundial…
        </div>
      )}
    </div>
  );
}
