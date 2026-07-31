/**
 * app/App.tsx — composição do painel.
 * @version 3.0.0
 *
 * O mapa ocupa a área inteira e todo o resto flutua por cima em vidro, como o briefing
 * define. A grade de posicionamento é CSS (grid com áreas nomeadas); aqui só se decide
 * o que existe e com que dado.
 *
 * FULLSCREEN: pede tela cheia ao elemento raiz do painel, não ao document — assim a
 * barra lateral e o cabeçalho do shell saem de cena e sobra mapa, que é o ponto.
 */
'use strict';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search as SearchIcon, Star, Layers as LayersIcon, Clock,
  TrendingUp, CalendarClock, ArrowLeftRight, BarChart3, Printer, Clock4,
} from 'lucide-react';
import { useStore } from '@/app/store';
import { GlassPanel } from '@/components/GlassPanel';
import { HeaderBar } from '@/components/HeaderBar';
import { Toolbar } from '@/components/Toolbar';
import { SearchPanel } from '@/components/SearchPanel';
import { FavoritesPanel, VisibleCitiesList } from '@/components/FavoritesPanel';
import { LayersPanel } from '@/components/LayersPanel';
import { ClockPanel } from '@/components/ClockPanel';
import { MarketsPanel } from '@/components/MarketsPanel';
import { EventsPanel } from '@/components/EventsPanel';
import { Comparator } from '@/components/Comparator';
import { AnalyticsPanel, MiniCards } from '@/components/AnalyticsPanel';
import { MultiClock } from '@/components/MultiClock';
import { Timeline } from '@/components/Timeline';
import { CityTooltip } from '@/components/CityTooltip';
import { WorldMap } from '@/map/WorldMap';
import { insetsFromRects, useObstacles } from '@/map/useObstacles';
import { useRipple } from '@/app/useRipple';
import { usePrintMode } from '@/app/usePrintMode';
import { getCity, LOCAL_CITY_ID, type City } from '@/data/cities';
import { fetchWeather, resetWeatherCache, type WeatherMap } from '@/lib/weather';
import { buildShareUrl, copyToClipboard } from '@/lib/share';
import { exportPng, printPanel } from '@/lib/exporter';

export function App() {
  const { state, dispatch, date, realNow, theme, visibleCities, activeCity } = useStore();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ripple em todos os botões por delegação — um listener, zero estado no React.
  useRipple(rootRef);
  // Libera o painel do recorte do shell durante a impressão (ver usePrintMode).
  usePrintMode();

  // Tudo que flutua sobre o mapa e esconde marcador. Medido do DOM porque muda ao
  // recolher painel, abrir o comparador e a cada breakpoint — tabela fixa erraria.
  const obstacles = useObstacles(
    stageRef,
    '.wcm-glass, .wcm-toolbar, .wcm-minis, .wcm-timewarn',
  );
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setStageSize((p) => {
        const w = Math.round(r.width);
        const h = Math.round(r.height);
        return p.w === w && p.h === h ? p : { w, h };
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Margens do mapa derivadas dos painéis abertos: fechar um painel devolve espaço
  // ao mapa automaticamente, sem número mágico em lugar nenhum.
  const insets = useMemo(
    () => insetsFromRects(obstacles, stageSize.w || 1, stageSize.h || 1),
    [obstacles, stageSize.w, stageSize.h],
  );

  const [weather, setWeather] = useState<WeatherMap>({});
  const [hover, setHover] = useState<{ city: City; rect: DOMRect } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const baseCity = getCity(LOCAL_CITY_ID) ?? activeCity;

  // ---- clima ----
  // Recarrega quando a lista de cidades muda; o cache de 30 min em lib/weather e o
  // Redis do servidor absorvem as trocas rápidas de cidade.
  useEffect(() => {
    if (!state.prefs.layers.weather) return;
    const ac = new AbortController();
    void fetchWeather(visibleCities, ac.signal).then((w) => {
      if (!ac.signal.aborted) setWeather(w);
    });
    return () => ac.abort();
  }, [visibleCities, state.prefs.layers.weather]);

  useEffect(() => () => resetWeatherCache(), []);

  // ---- fullscreen ----
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void rootRef.current?.requestFullscreen();
    } catch {
      /* navegador sem permissão de fullscreen: silencioso, o painel segue usável */
    }
  }, []);

  // ---- toast efêmero ----
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const onShare = useCallback(async () => {
    const url = buildShareUrl({
      visible: state.prefs.visible,
      activeId: state.prefs.activeId,
      projection: state.prefs.projection,
      layers: state.prefs.layers,
      compare: state.prefs.compare,
      timeOffset: state.timeOffset,
    });
    const ok = await copyToClipboard(url);
    showToast(ok ? 'Link da configuração copiado.' : 'Não foi possível copiar o link.');
  }, [state.prefs, state.timeOffset, showToast]);

  const onExport = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      showToast('O mapa ainda não terminou de carregar.');
      return;
    }
    const ok = await exportPng({
      canvas, cities: visibleCities, date, baseTz: activeCity.tz, theme, scale: 1,
    });
    showToast(ok ? 'Imagem PNG exportada.' : 'Falha ao gerar a imagem.');
  }, [visibleCities, date, activeCity.tz, theme, showToast]);

  // ---- atalhos de teclado ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Não sequestrar teclas enquanto o usuário digita.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const map: Record<string, () => void> = {
        b: () => dispatch({ type: 'panel/toggle', panel: 'busca' }),
        f: () => dispatch({ type: 'panel/toggle', panel: 'favoritos' }),
        c: () => dispatch({ type: 'panel/toggle', panel: 'camadas' }),
        m: () => dispatch({ type: 'panel/toggle', panel: 'mercados' }),
        e: () => dispatch({ type: 'panel/toggle', panel: 'eventos' }),
        k: () => dispatch({ type: 'panel/toggle', panel: 'comparador' }),
        t: () => dispatch({ type: 'panel/toggle', panel: 'timeline' }),
        a: () => dispatch({ type: 'panel/toggle', panel: 'analitico' }),
        r: () => dispatch({ type: 'panel/toggle', panel: 'relogio' }),
        g: () => dispatch({ type: 'panel/toggle', panel: 'relogios' }),
      };
      const fn = map[e.key.toLowerCase()];
      if (fn) { e.preventDefault(); fn(); }
      else if (e.key === 'Escape' && state.timeOffset) {
        e.preventDefault();
        dispatch({ type: 'time/offset', minutes: 0 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, state.timeOffset]);

  const onHoverCity = useCallback((id: string | null, rect: DOMRect | null) => {
    if (!id || !rect) { setHover(null); return; }
    const city = getCity(id);
    if (city) setHover({ city, rect });
  }, []);

  const favoriteCities = useMemo(
    () => state.prefs.favorites.map(getCity).filter((c): c is City => c !== null),
    [state.prefs.favorites],
  );

  return (
    <div ref={rootRef} className={`wcm-root${fullscreen ? ' is-fullscreen' : ''}`} data-theme-hint={theme}>
      <HeaderBar fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen} onShare={onShare} />

      <div className="wcm-stage" ref={stageRef}>
        <WorldMap
          date={date}
          theme={theme}
          layers={state.prefs.layers}
          projectionId={state.prefs.projection}
          view={state.view}
          onViewChange={(v) => dispatch({ type: 'view/set', view: v })}
          cities={visibleCities}
          activeId={state.prefs.activeId}
          favorites={state.prefs.favorites}
          weather={weather}
          onSelectCity={(id) => dispatch({ type: 'city/select', id })}
          onHoverCity={onHoverCity}
          canvasRef={canvasRef}
          obstacles={obstacles}
          insets={insets}
        />

        {/* ---- faixa superior: indicadores + ferramentas ----
             A toolbar era vertical dentro da coluna da direita e, com seus ~400px de
             altura, empurrava o painel de Mercados para fora da área visível da
             coluna. Horizontal no topo ela também fica mais perto da "barra superior
             de ferramentas estilo Google Maps" que o briefing descreve.

             A POSIÇÃO NO JSX IMPORTA: no desktop tudo é absoluto e a ordem do DOM é
             irrelevante, mas no breakpoint estreito o palco vira uma pilha em fluxo —
             e ali a toolbar precisa vir logo depois do mapa, não depois dos painéis.
             Estava no lugar errado e caía 600px abaixo do mapa. */}
        <div className="wcm-topstrip">
          <MiniCards cities={visibleCities} date={date} />
          <Toolbar onExport={onExport} />
        </div>

        {/* ---- coluna esquerda ---- */}
        <div className="wcm-col wcm-col--left">
          <GlassPanel
            title="Pesquisar"
            icon={SearchIcon}
            open={state.open.busca}
            onToggle={() => dispatch({ type: 'panel/toggle', panel: 'busca' })}
          >
            <SearchPanel date={date} onSelect={(id) => dispatch({ type: 'city/select', id })} />
          </GlassPanel>

          <GlassPanel
            title="Favoritos"
            icon={Star}
            open={state.open.favoritos}
            onToggle={() => dispatch({ type: 'panel/toggle', panel: 'favoritos' })}
            aside={<span className="wcm-count">{favoriteCities.length}</span>}
          >
            <FavoritesPanel
              favorites={state.prefs.favorites}
              categories={state.prefs.categories}
              activeId={state.prefs.activeId}
              baseTz={baseCity.tz}
              date={date}
              onReorder={(ids) => dispatch({ type: 'fav/reorder', ids })}
              onSelect={(id) => dispatch({ type: 'city/select', id })}
              onRemove={(id) => dispatch({ type: 'fav/toggle', id })}
              onCategory={(id, label) => dispatch({ type: 'fav/category', id, label })}
            />
            <details className="wcm-details">
              <summary>Cidades no mapa ({visibleCities.length})</summary>
              <VisibleCitiesList
                cities={visibleCities}
                activeId={state.prefs.activeId}
                favorites={state.prefs.favorites}
                date={date}
                onSelect={(id) => dispatch({ type: 'city/select', id })}
                onToggleFav={(id) => dispatch({ type: 'fav/toggle', id })}
                onRemove={(id) => dispatch({ type: 'city/remove', id })}
              />
            </details>
          </GlassPanel>

          <GlassPanel
            title="Relógio"
            icon={Clock}
            open={state.open.relogio}
            onToggle={() => dispatch({ type: 'panel/toggle', panel: 'relogio' })}
          >
            <ClockPanel
              city={activeCity}
              date={date}
              analog={state.prefs.analog}
              onToggleAnalog={() => dispatch({ type: 'analog/toggle' })}
            />
          </GlassPanel>
        </div>

        {/* ---- coluna direita ---- */}
        <div className="wcm-col wcm-col--right">
          {state.open.camadas && (
            <GlassPanel
              title="Camadas e projeção"
              icon={LayersIcon}
              open
              onToggle={() => dispatch({ type: 'panel/toggle', panel: 'camadas' })}
            >
              <LayersPanel />
            </GlassPanel>
          )}

          <GlassPanel
            title="Mercados"
            icon={TrendingUp}
            open={state.open.mercados}
            onToggle={() => dispatch({ type: 'panel/toggle', panel: 'mercados' })}
          >
            <MarketsPanel date={date} onSelectCity={(id) => dispatch({ type: 'city/select', id })} />
          </GlassPanel>

          {state.open.eventos && (
            <GlassPanel
              title="Eventos e feriados"
              icon={CalendarClock}
              open
              onToggle={() => dispatch({ type: 'panel/toggle', panel: 'eventos' })}
            >
              <EventsPanel
                cities={[...visibleCities, ...favoriteCities]}
                date={date}
                baseTz={baseCity.tz}
                onSelectCity={(id) => dispatch({ type: 'city/select', id })}
              />
            </GlassPanel>
          )}

          {state.open.comparador && state.prefs.compare && (
            <GlassPanel
              title="Comparador de fusos"
              icon={ArrowLeftRight}
              open
              onToggle={() => dispatch({ type: 'panel/toggle', panel: 'comparador' })}
            >
              <Comparator
                pair={state.prefs.compare}
                date={date}
                onChange={(pair) => dispatch({ type: 'compare/set', pair })}
              />
            </GlassPanel>
          )}

          {state.open.analitico && (
            <GlassPanel
              title="Painel analítico"
              icon={BarChart3}
              open
              onToggle={() => dispatch({ type: 'panel/toggle', panel: 'analitico' })}
              aside={
                <button type="button" className="wcm-miniaction" onClick={printPanel} title="Imprimir ou salvar em PDF">
                  <Printer size={12} aria-hidden="true" />
                </button>
              }
            >
              <AnalyticsPanel cities={visibleCities} date={date} baseTz={activeCity.tz} />
            </GlassPanel>
          )}
        </div>

        {/* ---- múltiplos relógios (faixa sempre visível) ---- */}
        {state.open.relogios && (
          <div className="wcm-clockstrip">
            <GlassPanel title="Relógios simultâneos" icon={Clock4} open bare>
              <MultiClock
                favorites={state.prefs.favorites}
                activeId={state.prefs.activeId}
                baseTz={baseCity.tz}
                date={date}
                analog={state.prefs.analog}
                onSelect={(id) => dispatch({ type: 'city/select', id })}
              />
            </GlassPanel>
          </div>
        )}

        {/* ---- timeline ---- */}
        {state.open.timeline && (
          <div className="wcm-bottom">
            <GlassPanel title="Linha do tempo mundial" open bare>
              <Timeline
                cities={visibleCities}
                realNow={realNow}
                offset={state.timeOffset}
                baseTz={activeCity.tz}
                onOffsetChange={(minutes) => dispatch({ type: 'time/offset', minutes })}
              />
            </GlassPanel>
          </div>
        )}

        {hover && (
          <CityTooltip
            city={hover.city}
            rect={hover.rect}
            date={date}
            baseCity={baseCity}
            weather={weather[hover.city.id]}
          />
        )}

        {state.timeOffset !== 0 && (
          <div className="wcm-timewarn" role="status">
            Visualizando um instante deslocado — pressione Esc para voltar a agora.
          </div>
        )}

        {toast && <div className="wcm-toast" role="status">{toast}</div>}
      </div>
    </div>
  );
}
