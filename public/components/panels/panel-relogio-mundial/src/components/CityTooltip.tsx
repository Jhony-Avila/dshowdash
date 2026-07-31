/**
 * components/CityTooltip.tsx — tooltip premium da cidade sob o cursor.
 * @version 3.0.0
 *
 * Traz o dossiê completo que o briefing pede: cidade, país, hora, UTC, fuso, nascer
 * e pôr do sol, clima, mercados, expediente, horário de verão, data por extenso,
 * semana e a diferença para a cidade de referência.
 *
 * POSICIONAMENTO: `position: fixed` a partir do retângulo do marcador, com inversão
 * automática quando não cabe (vai para cima/para o lado) e recuo das bordas. Não usa
 * @floating-ui aqui de propósito — o alvo já entrega o DOMRect e a lógica cabe em 20
 * linhas, sem prender o tooltip a uma árvore de refs que o canvas não tem.
 *
 * `pointer-events: none` no CSS: o tooltip nunca rouba o hover do próprio marcador,
 * o que causaria aquele piscar infinito clássico.
 */
'use strict';

import { useMemo } from 'react';
import type { City } from '@/data/cities';
import { flagOf } from '@/data/cities';
import { sunTimes, isDaylight, daylightPhase } from '@/lib/astro';
import { businessStatus, timeState, TIME_STATE_LABEL, TIME_STATE_TOKEN } from '@/lib/business';
import { marketsOfCity, MARKET_STATE_TOKEN } from '@/lib/markets';
import { dstBadge, holidayOf } from '@/lib/events';
import {
  dayShift, fmtDateLong, fmtHM, fmtHMS, fmtWeekday, isoWeek,
  offsetLabel, tzAbbrev, tzDiffLabel, tzDiffMinutes,
} from '@/lib/time';
import { fmtTemp, type WeatherPoint } from '@/lib/weather';
import { AIRPORTS_BY_CITY, AIRPORT_TYPE_LABEL, elevacaoLabel, servicoLabel } from '@/data/airports';

export interface CityTooltipProps {
  city: City;
  rect: DOMRect;
  date: Date;
  baseCity: City;
  weather?: WeatherPoint;
}

const W = 268;
const MARGIN = 12;

export function CityTooltip({ city, rect, date, baseCity, weather }: CityTooltipProps) {
  const st = useMemo(() => sunTimes(date, city.lat, city.lng), [date, city.lat, city.lng]);
  const biz = businessStatus(city, date);
  const markets = marketsOfCity(city.id, date);
  const dst = dstBadge(city, date);
  const feriado = holidayOf(city, date);
  const ts = timeState(city, date);
  const day = isDaylight(date, city.lat, city.lng);
  const fase = daylightPhase(date, city.lat, city.lng);
  const aeroportos = AIRPORTS_BY_CITY[city.id] ?? [];
  const diff = tzDiffMinutes(date, baseCity.tz, city.tz);
  const shift = dayShift(date, baseCity.tz, city.tz);

  // Inverte para cima quando não cabe embaixo; recua das bordas laterais.
  const preferBelow = rect.bottom + 240 < window.innerHeight;
  const top = preferBelow ? rect.bottom + 10 : Math.max(MARGIN, rect.top - 10);
  const rawLeft = rect.left + rect.width / 2 - W / 2;
  const left = Math.max(MARGIN, Math.min(window.innerWidth - W - MARGIN, rawLeft));

  return (
    <div
      className="wcm-tip"
      role="tooltip"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${W}px`,
        transform: preferBelow ? 'none' : 'translateY(-100%)',
        ['--wcm-marker-state' as string]: TIME_STATE_TOKEN[ts],
      }}
    >
      <header className="wcm-tip__head">
        <span className="wcm-tip__flag" aria-hidden="true">{flagOf(city.cc)}</span>
        <div>
          <p className="wcm-tip__city">{city.name}</p>
          <p className="wcm-tip__country">{city.country}</p>
        </div>
        <span className="wcm-tip__daynight" aria-hidden="true">{day ? '☀️' : '🌙'}</span>
      </header>

      <p className="wcm-tip__time">
        {fmtHMS(date, city.tz)}
        {shift !== 0 && <sup>{shift > 0 ? '+1 dia' : '−1 dia'}</sup>}
      </p>
      <p className="wcm-tip__date">
        {fmtWeekday(date, city.tz)}, {fmtDateLong(date, city.tz)} · semana {isoWeek(date, city.tz)}
      </p>

      {feriado && (
        <p className="wcm-tip__holiday">
          🎉 {feriado.def.name}
          {feriado.stale && <span className="wcm-tip__stale"> (calendário de outro ano)</span>}
        </p>
      )}

      <dl className="wcm-tip__grid">
        <Row k="Fuso" v={<span title={city.tz}>{offsetLabel(date, city.tz)} · {tzAbbrev(date, city.tz)}</span>} />
        <Row k="Diferença" v={`${tzDiffLabel(diff)} vs. ${baseCity.name}`} />
        <Row k="Fase do dia" v={<span style={{ color: TIME_STATE_TOKEN[ts] }}>{TIME_STATE_LABEL[ts]} · {fase.replace(/-/g, ' ')}</span>} />
        <Row
          k="Nascer / pôr"
          v={
            st.midnightSun ? 'sol da meia-noite'
              : st.polarNight ? 'noite polar'
                : `${st.sunrise ? fmtHM(st.sunrise, city.tz) : '—'} / ${st.sunset ? fmtHM(st.sunset, city.tz) : '—'}`
          }
        />
        {weather && (
          <Row k="Clima" v={`${weather.icon} ${fmtTemp(weather)} · ${weather.condition}`} />
        )}
        {weather?.humidity != null && (
          <Row k="Umidade / vento" v={`${weather.humidity}% · ${weather.wind_speed ?? '—'} km/h`} />
        )}
        <Row k="Expediente" v={<span className={`wcm-tip__biz is-${biz.state}`}>{biz.label}</span>} />
        <Row k="Horário de verão" v={dst.observes ? `${dst.label}${dst.daysToChange !== null ? ` · muda em ${dst.daysToChange} d` : ''}` : 'não observa'} />
      </dl>

      {aeroportos.length > 0 && (
        <div className="wcm-tip__air">
          {aeroportos.map((a) => (
            <span key={a.iata} className={`wcm-tip__airitem${a.scheduled ? '' : ' is-sem-servico'}`}
              title={`${a.name} — ${AIRPORT_TYPE_LABEL[a.type]} · ${a.muni} · elevação ${elevacaoLabel(a)} · ${servicoLabel(a)}`}>
              ✈ {a.iata} / {a.icao}
              {!a.scheduled && <em> sem serviço regular</em>}
            </span>
          ))}
        </div>
      )}

      {markets.length > 0 && (
        <div className="wcm-tip__markets">
          {markets.map((m) => (
            <span key={m.exchange.id} className="wcm-tip__mk">
              <i style={{ background: MARKET_STATE_TOKEN[m.state] }} aria-hidden="true" />
              {m.exchange.code} · {m.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="wcm-tip__row">
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
