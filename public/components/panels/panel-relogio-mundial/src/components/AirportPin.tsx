/**
 * components/AirportPin.tsx — pino de aeroporto (ICAO/IATA/hora local/serviço).
 * @version 3.1.0
 *
 * Coordenada REAL do aeroporto (OurAirports), não a da cidade — por isso GRU cai em
 * Guarulhos e CDG em Roissy. Em zoom baixo os dois pontos se encostam; a partir de
 * ~4× de zoom a diferença fica visível e a camada passa a valer de verdade.
 *
 * O briefing pede "Status". Não há operação ao vivo aqui (atrasos, voos, pistas) —
 * isso exigiria uma API de tráfego aéreo que este módulo não tem. O que o pino mostra
 * é o campo real `scheduled_service` do OurAirports, e ele NÃO é decorativo: Kiev
 * (KBP) aparece sem serviço regular, refletindo a suspensão da aviação civil
 * ucraniana. Um selo "Operacional" verde para todos seria pior que campo nenhum.
 */
'use strict';

import { memo } from 'react';
import { Plane, Ban } from 'lucide-react';
import { AIRPORT_TYPE_LABEL, elevacaoLabel, servicoLabel, type Airport } from '@/data/airports';
import { fmtHM, fmtWeekday } from '@/lib/time';
import { daylightPhase } from '@/lib/astro';

export interface AirportPinProps {
  airport: Airport;
  x: number;
  y: number;
  date: Date;
}

function AirportPinImpl({ airport, x, y, date }: AirportPinProps) {
  const hora = fmtHM(date, airport.tz);
  const fase = daylightPhase(date, airport.lat, airport.lng).replace(/-/g, ' ');

  const title = [
    `${airport.iata} / ${airport.icao} — ${airport.name}`,
    `${AIRPORT_TYPE_LABEL[airport.type]} · ${airport.muni}`,
    `${fmtWeekday(date, airport.tz, 'short')} ${hora} local · ${fase}`,
    `Elevação ${elevacaoLabel(airport)}`,
    servicoLabel(airport),
  ].join('\n');

  return (
    <span
      data-wcm-marker=""
      className={`wcm-air${airport.scheduled ? '' : ' is-sem-servico'}`}
      style={{ left: `${x}px`, top: `${y}px` }}
      title={title}
      role="img"
      aria-label={title.replace(/\n/g, ', ')}
    >
      {airport.scheduled
        ? <Plane size={10} aria-hidden="true" />
        : <Ban size={10} aria-hidden="true" />}
      <span className="wcm-air__iata">{airport.iata}</span>
      <span className="wcm-air__time">{hora}</span>
    </span>
  );
}

export const AirportPin = memo(AirportPinImpl, (a, b) => (
  a.airport.iata === b.airport.iata
  && Math.round(a.x) === Math.round(b.x)
  && Math.round(a.y) === Math.round(b.y)
  && fmtHM(a.date, a.airport.tz) === fmtHM(b.date, b.airport.tz)
));
