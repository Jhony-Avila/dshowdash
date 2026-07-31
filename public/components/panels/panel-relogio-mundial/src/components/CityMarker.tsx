/**
 * components/CityMarker.tsx — cartão flutuante de cidade sobre o mapa.
 * @version 3.0.0
 *
 * Substitui os "chips" da v2 (nome + hora numa pílula) pelo cartão que o briefing
 * pede: bandeira, indicador dia/noite, hora, offset, clima, bolsa e status.
 *
 * DOIS TAMANHOS, UMA DECISÃO: em aglomerados densos (Europa, Sudeste Asiático) o
 * WorldMap marca os cartões excedentes como `compact` — vira ponto + hora. Preferimos
 * degradar a densidade de informação a empilhar cartões ilegíveis; o cartão cheio
 * volta no hover e no clique. É o mesmo princípio de rótulo do Apple Maps.
 *
 * É um <button>: recebe foco, responde a Enter/Espaço e anuncia estado por ARIA.
 */
'use strict';

import { memo, useCallback, useRef } from 'react';
import { Star } from 'lucide-react';
import type { City } from '@/data/cities';
import { flagOf } from '@/data/cities';
import { fmtHM, offsetShort } from '@/lib/time';
import { businessStatus, timeState, TIME_STATE_LABEL, TIME_STATE_TOKEN } from '@/lib/business';
import { marketsOfCity } from '@/lib/markets';
import { isDaylight } from '@/lib/astro';
import { fmtTemp, type WeatherPoint } from '@/lib/weather';

export type Placement = 'right' | 'left' | 'top' | 'bottom';

export interface CityMarkerProps {
  city: City;
  x: number;
  y: number;
  compact: boolean;
  /** Lado em que o rótulo é desenhado — decidido pelo posicionador do WorldMap. */
  side: Placement;
  date: Date;
  active: boolean;
  favorite: boolean;
  weather?: WeatherPoint;
  showWeather: boolean;
  showLabels: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null, rect: DOMRect | null) => void;
}

function CityMarkerImpl({
  city, x, y, compact, side, date, active, favorite,
  weather, showWeather, showLabels, onSelect, onHover,
}: CityMarkerProps) {
  const ref = useRef<HTMLButtonElement | null>(null);

  const ts = timeState(city, date);
  const day = isDaylight(date, city.lat, city.lng);
  const biz = businessStatus(city, date);
  const markets = marketsOfCity(city.id, date);
  const openMarket = markets.find((m) => m.isOpen) ?? markets[0] ?? null;

  const handleEnter = useCallback(() => {
    onHover(city.id, ref.current?.getBoundingClientRect() ?? null);
  }, [city.id, onHover]);

  const handleLeave = useCallback(() => onHover(null, null), [onHover]);

  const handleClick = useCallback(() => onSelect(city.id), [city.id, onSelect]);

  const aria = [
    city.name,
    fmtHM(date, city.tz),
    `UTC${offsetShort(date, city.tz)}`,
    day ? 'dia' : 'noite',
    TIME_STATE_LABEL[ts],
    biz.label,
    openMarket ? `${openMarket.exchange.code} ${openMarket.label.toLowerCase()}` : null,
    showWeather && weather?.temperature != null ? `${Math.round(weather.temperature)} graus` : null,
    favorite ? 'favorita' : null,
  ].filter(Boolean).join(', ');

  return (
    <button
      ref={ref}
      type="button"
      data-wcm-marker=""
      data-city-id={city.id}
      className={
        'wcm-marker wcm-marker--' + side
        + (compact || !showLabels ? ' is-compact' : '')
        + (active ? ' is-active' : '')
        + (favorite ? ' is-fav' : '')
        + (day ? ' is-day' : ' is-night')
      }
      style={{
        left: `${x}px`,
        top: `${y}px`,
        // A cor de estado do briefing entra como custom property e é consumida pela
        // borda, pelo ponto e pelo glow — um token, três usos, zero divergência.
        ['--wcm-marker-state' as string]: TIME_STATE_TOKEN[ts],
      }}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      aria-label={aria}
      aria-pressed={active}
      title={compact || !showLabels ? `${city.name} · ${fmtHM(date, city.tz)}` : undefined}
    >
      <span className="wcm-marker__pin" aria-hidden="true">
        <span className="wcm-marker__pulse" />
      </span>

      {compact || !showLabels ? (
        <span className="wcm-marker__mini">{fmtHM(date, city.tz)}</span>
      ) : (
        /*
         * TRÊS LINHAS, NÃO CINCO.
         *
         * A primeira versão tinha nome, hora, clima, mercado e expediente em linhas
         * separadas: 140×78px. Com 15 cidades sobre um mapa de ~900px isso viravam
         * cartões empilhados e ilegíveis. O dossiê completo continua existindo — é o
         * tooltip, que abre no hover e no foco. O cartão do mapa carrega só o que se
         * lê de relance: quem, que horas, e como está.
         */
        <span className="wcm-marker__card">
          <span className="wcm-marker__head">
            <span className="wcm-marker__flag" aria-hidden="true">{flagOf(city.cc)}</span>
            <span className="wcm-marker__name">{city.name}</span>
            {favorite && <Star className="wcm-marker__star" size={10} aria-hidden="true" />}
          </span>

          <span className="wcm-marker__time">
            {fmtHM(date, city.tz)}
            <span className="wcm-marker__utc">{offsetShort(date, city.tz)}</span>
            <span className="wcm-marker__daynight" aria-hidden="true">{day ? '☀' : '☾'}</span>
          </span>

          <span className="wcm-marker__foot">
            {showWeather && weather?.temperature != null && (
              <span className="wcm-marker__weather" title={weather.condition}>
                {weather.icon} {fmtTemp(weather)}
              </span>
            )}
            {openMarket ? (
              <span
                className={`wcm-marker__market is-${openMarket.state}`}
                title={`${openMarket.exchange.name} — ${openMarket.label}`}
              >
                <span className="wcm-marker__dot" aria-hidden="true" />
                {openMarket.exchange.code}
              </span>
            ) : (
              <span className={`wcm-marker__biz is-${biz.state}`}>{biz.label}</span>
            )}
          </span>
        </span>
      )}
    </button>
  );
}

/**
 * memo com comparação explícita: o painel repinta a cada segundo e, sem isso, os
 * 15+ cartões remontariam 60 vezes por minuto. Só a HORA VISÍVEL (minuto) importa —
 * comparar o Date cru causaria re-render a cada tique.
 */
export const CityMarker = memo(CityMarkerImpl, (a, b) => (
  a.city.id === b.city.id
  && Math.round(a.x) === Math.round(b.x)
  && Math.round(a.y) === Math.round(b.y)
  && a.compact === b.compact
  && a.side === b.side
  && a.active === b.active
  && a.favorite === b.favorite
  && a.showWeather === b.showWeather
  && a.showLabels === b.showLabels
  && a.weather === b.weather
  && fmtHM(a.date, a.city.tz) === fmtHM(b.date, b.city.tz)
));
