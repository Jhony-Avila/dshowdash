/**
 * components/ClockPanel.tsx — o relógio em destaque (digital + analógico + efemérides).
 * @version 3.0.0
 *
 * Painel da cidade ativa. Além da hora, traz o que o briefing lista: UTC, GMT, fuso,
 * data completa, semana ISO, dia juliano, timestamp Unix, fração do dia e a contagem
 * regressiva até a meia-noite local.
 *
 * SOBRE "UTC E GMT": as duas linhas existem porque o briefing pede as duas, mas elas
 * são o mesmo instante — GMT é o nome antigo, UTC é o padrão atual. Em vez de fingir
 * que são grandezas diferentes (e criar uma inconsistência que nunca fecha), a linha
 * GMT mostra o offset nomeado como o navegador o expõe, e o título explica isso.
 */
'use strict';

import { useMemo } from 'react';
import { Clock, Sunrise, Sunset, Moon } from 'lucide-react';
import type { City } from '@/data/cities';
import { flagOf } from '@/data/cities';
import {
  dayFraction, durationHMS, fmtDateLong, fmtHMS, fmtIsoZoned, fmtWeekday,
  isoWeek, julianDay, msToMidnight, offsetLabel, tzAbbrev,
} from '@/lib/time';
import { moonPhase, sunTimes } from '@/lib/astro';
import { dstBadge } from '@/lib/events';
import { AnalogClock } from '@/components/AnalogClock';
import { fmtHM } from '@/lib/time';

export interface ClockPanelProps {
  city: City;
  date: Date;
  analog: boolean;
  onToggleAnalog: () => void;
}

export function ClockPanel({ city, date, analog, onToggleAnalog }: ClockPanelProps) {
  const st = useMemo(() => sunTimes(date, city.lat, city.lng), [date, city.lat, city.lng]);
  const moon = useMemo(() => moonPhase(date), [date]);
  const dst = useMemo(() => dstBadge(city, date), [city, date]);

  const fraction = dayFraction(date, city.tz);
  const toMidnight = msToMidnight(date, city.tz);

  return (
    <div className="wcm-clock">
      <div className="wcm-clock__top">
        <div className="wcm-clock__digital">
          <p className="wcm-clock__place">
            <span aria-hidden="true">{flagOf(city.cc)}</span>
            <strong>{city.name}</strong>
            <span className="wcm-clock__country">{city.country}</span>
          </p>

          <p className="wcm-clock__time" aria-live="off">{fmtHMS(date, city.tz)}</p>

          <p className="wcm-clock__date">
            {fmtWeekday(date, city.tz)}, {fmtDateLong(date, city.tz)}
          </p>

          <p className="wcm-clock__badges">
            <span className="wcm-badge" title={city.tz}>{offsetLabel(date, city.tz)}</span>
            <span className="wcm-badge">{tzAbbrev(date, city.tz)}</span>
            <span className={`wcm-badge is-dst-${dst.active ? 'on' : 'off'}`} title={
              dst.observes
                ? (dst.changeAt
                  ? `Muda em ${dst.daysToChange} dia(s), ${dst.gainsHour ? 'adiantando' : 'atrasando'} 1 h`
                  : 'Zona observa horário de verão')
                : 'Zona não observa horário de verão'
            }>
              {dst.label}
              {dst.observes && dst.daysToChange !== null && (
                <span className="wcm-badge__sub">{dst.daysToChange} d</span>
              )}
            </span>
          </p>
        </div>

        {analog && (
          <button
            type="button"
            className="wcm-clock__analog"
            onClick={onToggleAnalog}
            title="Ocultar relógio analógico"
            aria-label="Ocultar relógio analógico"
          >
            <AnalogClock date={date} tz={city.tz} lat={city.lat} lng={city.lng} size={96} />
          </button>
        )}
        {!analog && (
          <button type="button" className="wcm-clock__analog-off" onClick={onToggleAnalog} title="Mostrar relógio analógico">
            <Clock size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="wcm-clock__sun">
        <span className="wcm-sunitem">
          <Sunrise size={13} aria-hidden="true" />
          {st.sunrise ? fmtHM(st.sunrise, city.tz) : (st.midnightSun ? 'sol da meia-noite' : '—')}
        </span>
        <span className="wcm-sunitem">
          <Sunset size={13} aria-hidden="true" />
          {st.sunset ? fmtHM(st.sunset, city.tz) : (st.polarNight ? 'noite polar' : '—')}
        </span>
        <span className="wcm-sunitem" title={`${moon.name} — ${Math.round(moon.illumination * 100)}% iluminada`}>
          <Moon size={13} aria-hidden="true" />
          {Math.round(moon.illumination * 100)}%
        </span>
        <span className="wcm-sunitem" title="Duração do dia claro">
          ☀ {Math.floor(st.daylightMinutes / 60)}h{String(st.daylightMinutes % 60).padStart(2, '0')}
        </span>
      </div>

      <div className="wcm-clock__progress" title={`${(fraction * 100).toFixed(1)}% do dia local decorrido`}>
        <div className="wcm-clock__bar" style={{ width: `${fraction * 100}%` }} />
        <span className="wcm-clock__pct">{(fraction * 100).toFixed(1)}% do dia</span>
      </div>

      <dl className="wcm-clock__grid">
        <Item label="UTC" value={fmtHMS(date, 'UTC')} mono />
        <Item
          label="GMT"
          value={`${tzAbbrev(date, city.tz) || offsetLabel(date, city.tz, 'GMT')}`}
          hint="GMT e UTC marcam o mesmo instante; aqui aparece a designação do fuso."
        />
        <Item label="Semana ISO" value={String(isoWeek(date, city.tz))} />
        <Item label="Dia juliano" value={julianDay(date).toFixed(4)} mono />
        <Item label="Unix" value={String(Math.floor(date.getTime() / 1000))} mono />
        <Item label="Até a meia-noite" value={durationHMS(toMidnight)} mono />
        <Item label="ISO-8601" value={fmtIsoZoned(date, city.tz)} mono wide />
      </dl>
    </div>
  );
}

function Item({ label, value, mono, wide, hint }: {
  label: string; value: string; mono?: boolean; wide?: boolean; hint?: string;
}) {
  return (
    <div className={`wcm-kv${wide ? ' is-wide' : ''}`} title={hint}>
      <dt>{label}</dt>
      <dd className={mono ? 'is-mono' : undefined}>{value}</dd>
    </div>
  );
}
