/**
 * components/EventPin.tsx — camada de eventos mundiais sobre o mapa.
 * @version 3.1.0
 *
 * O briefing pede eventos como CAMADA, não só como lista. A diferença é operacional:
 * numa lista você procura; numa camada você VÊ que a praça de Tóquio está em feriado
 * antes de perguntar por que o volume caiu.
 *
 * Só entram eventos com consequência para HOJE ou para os próximos dias:
 *   • feriado nacional no dia corrente da cidade;
 *   • mudança de horário de verão dentro de 7 dias (o que quebra reunião recorrente).
 *
 * Não é a agenda inteira — a agenda de 45 dias continua no painel de Eventos. Uma
 * camada que marcasse tudo marcaria o mapa inteiro e não diria nada.
 */
'use strict';

import { memo } from 'react';
import type { City } from '@/data/cities';
import { dstBadge, holidayOf } from '@/lib/events';

export interface EventoDeCidade {
  tipo: 'feriado' | 'dst';
  titulo: string;
  /** Dias até a mudança (só para DST). */
  dias?: number;
  stale?: boolean;
}

/** Evento relevante da cidade AGORA, ou null. Feriado tem prioridade sobre DST. */
export function eventoRelevante(city: City, date: Date): EventoDeCidade | null {
  const fer = holidayOf(city, date);
  if (fer) {
    return { tipo: 'feriado', titulo: fer.def.name, stale: fer.stale };
  }
  const dst = dstBadge(city, date);
  if (dst.observes && dst.daysToChange !== null && dst.daysToChange <= 7) {
    return {
      tipo: 'dst',
      titulo: dst.gainsHour ? 'Entra no horário de verão' : 'Sai do horário de verão',
      dias: dst.daysToChange,
    };
  }
  return null;
}

export interface EventPinProps {
  city: City;
  evento: EventoDeCidade;
  x: number;
  y: number;
  onSelect: (id: string) => void;
}

function EventPinImpl({ city, evento, x, y, onSelect }: EventPinProps) {
  const rotulo = evento.tipo === 'feriado'
    ? `${city.name}: ${evento.titulo}${evento.stale ? ' (calendário de outro ano)' : ''}`
    : `${city.name}: ${evento.titulo} em ${evento.dias} dia(s)`;

  return (
    <button
      type="button"
      data-wcm-marker=""
      className={`wcm-evpin is-${evento.tipo}`}
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={() => onSelect(city.id)}
      title={rotulo}
      aria-label={rotulo}
    >
      <span aria-hidden="true">{evento.tipo === 'feriado' ? '🎉' : '⏱'}</span>
      <span className="wcm-evpin__txt">
        {evento.tipo === 'feriado' ? evento.titulo : `DST ${evento.dias}d`}
      </span>
    </button>
  );
}

export const EventPin = memo(EventPinImpl, (a, b) => (
  a.city.id === b.city.id
  && a.evento.tipo === b.evento.tipo
  && a.evento.titulo === b.evento.titulo
  && a.evento.dias === b.evento.dias
  && Math.round(a.x) === Math.round(b.x)
  && Math.round(a.y) === Math.round(b.y)
));
