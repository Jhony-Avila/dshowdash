/**
 * components/EventsPanel.tsx — agenda mundial (feriados, DST, efemérides).
 * @version 3.0.0
 *
 * Escopo: as cidades no mapa mais as favoritas. Listar os feriados de 157 cidades
 * seria ruído — a agenda é útil quando fala das praças que a pessoa acompanha.
 *
 * As mudanças de horário de verão vêm CALCULADAS da base IANA do navegador, não de
 * tabela. É o item da lista com maior chance de estar certo daqui a três anos.
 */
'use strict';

import { useMemo } from 'react';
import { CalendarDays, Clock4, Sparkle, PartyPopper } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { City } from '@/data/cities';
import { upcomingEvents, EVENT_KIND_LABEL, type WorldEventKind } from '@/lib/events';
import { HOLIDAY_DATA_YEAR } from '@/data/holidays';
import { durationHuman, fmtDateShort, fmtHM, fmtWeekday } from '@/lib/time';

const ICON: Record<WorldEventKind, LucideIcon> = {
  feriado: PartyPopper,
  comemorativa: CalendarDays,
  dst: Clock4,
  efemeride: Sparkle,
};

export interface EventsPanelProps {
  cities: City[];
  date: Date;
  baseTz: string;
  onSelectCity: (id: string) => void;
}

export function EventsPanel({ cities, date, baseTz, onSelectCity }: EventsPanelProps) {
  const events = useMemo(() => upcomingEvents(date, 45, cities).slice(0, 40), [date, cities]);
  const anoAtual = date.getUTCFullYear();

  return (
    <div className="wcm-events">
      {anoAtual !== HOLIDAY_DATA_YEAR && (
        <p className="wcm-warn" role="note">
          O calendário de feriados desta base cobre {HOLIDAY_DATA_YEAR}. Para {anoAtual},
          apenas as mudanças de horário de verão (calculadas) são confiáveis.
        </p>
      )}

      {!events.length && (
        <p className="wcm-empty">Nenhum evento nos próximos 45 dias para as cidades no mapa.</p>
      )}

      <ol className="wcm-evlist">
        {events.map((ev, i) => {
          const Icon = ICON[ev.kind];
          const emQuanto = durationHuman(ev.at.getTime() - date.getTime());
          const hoje = ev.at.getTime() - date.getTime() < 86400000;
          return (
            <li key={`${ev.kind}-${ev.title}-${ev.at.getTime()}-${i}`} className={`wcm-ev is-${ev.kind}${hoje ? ' is-soon' : ''}`}>
              <Icon size={13} className="wcm-ev__icon" aria-hidden="true" />
              <div className="wcm-ev__body">
                <p className="wcm-ev__title">
                  {ev.flag && <span aria-hidden="true">{ev.flag} </span>}
                  {ev.title}
                </p>
                <p className="wcm-ev__meta">
                  <span>{EVENT_KIND_LABEL[ev.kind]}</span>
                  {ev.detail && <span>· {ev.detail}</span>}
                </p>
              </div>
              <div className="wcm-ev__when">
                <span className="wcm-ev__date">{fmtDateShort(ev.at, baseTz)}</span>
                <span className="wcm-ev__rel">
                  {ev.kind === 'dst'
                    ? `${fmtWeekday(ev.at, ev.city?.tz ?? baseTz, 'short')} ${fmtHM(ev.at, ev.city?.tz ?? baseTz)}`
                    : `em ${emQuanto}`}
                </span>
              </div>
              {ev.city && (
                <button
                  type="button"
                  className="wcm-ev__go"
                  onClick={() => onSelectCity(ev.city!.id)}
                  aria-label={`Ver ${ev.city.name} no mapa`}
                  title={`Ver ${ev.city.name} no mapa`}
                >
                  →
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
