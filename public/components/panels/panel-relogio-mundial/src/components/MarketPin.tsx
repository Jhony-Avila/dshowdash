/**
 * components/MarketPin.tsx — pino de bolsa de valores na camada de mercados.
 * @version 3.0.0
 *
 * Fica DESLOCADO da cidade de propósito (offset vertical fixo): a bolsa e a cidade
 * compartilham coordenada, e desenhar os dois no mesmo pixel esconderia um deles.
 * O deslocamento é em pixels de tela, não em graus, para não variar com o zoom.
 */
'use strict';

import { memo } from 'react';
import type { Exchange } from '@/data/exchanges';
import { marketStatus } from '@/lib/markets';
import { durationHuman } from '@/lib/time';

export interface MarketPinProps {
  exchange: Exchange;
  x: number;
  y: number;
  date: Date;
}

function MarketPinImpl({ exchange, x, y, date }: MarketPinProps) {
  const st = marketStatus(exchange, date);
  const falta = st.next ? durationHuman(st.next.at.getTime() - date.getTime()) : null;

  const title = [
    `${exchange.name} (${exchange.code})`,
    st.label,
    st.next ? `${st.next.label} em ${falta}` : null,
    st.holidayDataStale ? 'Calendário de feriados fora do ano coberto' : null,
  ].filter(Boolean).join(' — ');

  return (
    <span
      data-wcm-marker=""
      className={`wcm-mkt is-${st.state}`}
      style={{ left: `${x}px`, top: `${y - 26}px` }}
      title={title}
      role="img"
      aria-label={title}
    >
      <span className="wcm-mkt__dot" aria-hidden="true" />
      <span className="wcm-mkt__code">{exchange.code}</span>
      {st.isOpen && (
        <span className="wcm-mkt__bar" aria-hidden="true">
          <span className="wcm-mkt__fill" style={{ width: `${Math.round(st.progress * 100)}%` }} />
        </span>
      )}
    </span>
  );
}

export const MarketPin = memo(MarketPinImpl, (a, b) => (
  a.exchange.id === b.exchange.id
  && Math.round(a.x) === Math.round(b.x)
  && Math.round(a.y) === Math.round(b.y)
  // 1 minuto de granularidade: o estado de mercado não muda dentro do minuto.
  && Math.floor(a.date.getTime() / 60000) === Math.floor(b.date.getTime() / 60000)
));
