/**
 * components/MultiClock.tsx — múltiplos relógios sempre visíveis.
 * @version 3.0.0
 *
 * A seção "Múltiplos Relógios" do briefing pede um conjunto de praças visível o tempo
 * todo — São Paulo, Shenzhen, Hong Kong, Dubai, Nova York, Londres —, e não uma lista
 * onde se lê a hora. A diferença é de leitura: aqui cada cidade é um MOSTRADOR, com
 * ponteiro e segundos, lido de relance como se olha uma parede de relógios de hotel.
 *
 * Fonte das cidades: os FAVORITOS do usuário. Enquanto ele não favorita nada, entra o
 * conjunto do briefing. É o comportamento que respeita a escolha de quem usa sem
 * deixar o painel vazio no primeiro acesso.
 *
 * Cada mostrador é um <button>: clicar promove a cidade a destaque, com o mesmo
 * contrato de teclado e ARIA dos marcadores do mapa.
 */
'use strict';

import { memo, useMemo } from 'react';
import { getCity, flagOf, type City } from '@/data/cities';
import { fmtHMS, fmtWeekday, offsetShort, dayShift } from '@/lib/time';
import { isDaylight } from '@/lib/astro';
import { businessStatus, timeState, TIME_STATE_LABEL, TIME_STATE_TOKEN } from '@/lib/business';
import { AnalogClock } from '@/components/AnalogClock';

/** Conjunto do briefing, usado enquanto não houver favoritos. */
const PADRAO_BRIEFING = ['sao-paulo', 'shenzhen', 'hong-kong', 'dubai', 'new-york', 'london'];

export interface MultiClockProps {
  favorites: string[];
  activeId: string;
  baseTz: string;
  date: Date;
  analog: boolean;
  onSelect: (id: string) => void;
}

export function MultiClock({ favorites, activeId, baseTz, date, analog, onSelect }: MultiClockProps) {
  const cidades = useMemo(() => {
    const ids = favorites.length >= 2 ? favorites : PADRAO_BRIEFING;
    return ids.map(getCity).filter((c): c is City => c !== null).slice(0, 8);
  }, [favorites]);

  if (!cidades.length) return null;

  return (
    <ul className="wcm-mclocks" aria-label="Relógios simultâneos">
      {cidades.map((city) => (
        <Mostrador
          key={city.id}
          city={city}
          date={date}
          baseTz={baseTz}
          active={city.id === activeId}
          analog={analog}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

interface MostradorProps {
  city: City;
  date: Date;
  baseTz: string;
  active: boolean;
  analog: boolean;
  onSelect: (id: string) => void;
}

function MostradorImpl({ city, date, baseTz, active, analog, onSelect }: MostradorProps) {
  const ts = timeState(city, date);
  const dia = isDaylight(date, city.lat, city.lng);
  const biz = businessStatus(city, date);
  const shift = dayShift(date, baseTz, city.tz);
  const hora = fmtHMS(date, city.tz);

  return (
    <li className={`wcm-mclock${active ? ' is-active' : ''}`} style={{ ['--wcm-marker-state' as string]: TIME_STATE_TOKEN[ts] }}>
      <button
        type="button"
        className="wcm-mclock__btn"
        onClick={() => onSelect(city.id)}
        aria-pressed={active}
        aria-label={`${city.name}, ${hora}, ${TIME_STATE_LABEL[ts]}, ${biz.label}`}
      >
        {analog && (
          <span className="wcm-mclock__face" aria-hidden="true">
            <AnalogClock date={date} tz={city.tz} lat={city.lat} lng={city.lng} size={54} daylightRing={false} />
          </span>
        )}
        <span className="wcm-mclock__body">
          <span className="wcm-mclock__city">
            <span aria-hidden="true">{flagOf(city.cc)}</span>
            {city.name}
          </span>
          <span className="wcm-mclock__time">
            {hora}
            {shift !== 0 && <sup>{shift > 0 ? '+1' : '−1'}</sup>}
          </span>
          <span className="wcm-mclock__meta">
            <span aria-hidden="true">{dia ? '☀' : '☾'}</span>
            UTC{offsetShort(date, city.tz)}
            <span className="wcm-mclock__sep">·</span>
            {fmtWeekday(date, city.tz, 'short')}
          </span>
        </span>
      </button>
    </li>
  );
}

// Segundo é a menor unidade exibida; comparar o Date cru re-renderizaria à toa.
const Mostrador = memo(MostradorImpl, (a, b) => (
  a.city.id === b.city.id
  && a.active === b.active
  && a.analog === b.analog
  && a.baseTz === b.baseTz
  && Math.floor(a.date.getTime() / 1000) === Math.floor(b.date.getTime() / 1000)
));
