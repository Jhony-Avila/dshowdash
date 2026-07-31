/**
 * components/MarketsPanel.tsx — praças financeiras com estado ao vivo.
 * @version 3.0.0
 *
 * Ordenado por relevância operacional: abertas primeiro, depois quem abre antes.
 * A contagem regressiva ("fecha em 2 h 15") vale mais que o horário absoluto — é a
 * pergunta que se faz olhando para um painel destes.
 *
 * O aviso de calendário defasado aparece de verdade quando a data sai do ano coberto
 * pelas listas de feriado. É preferível admitir a limitação a mostrar "Aberto" num
 * feriado que o dado não conhece.
 */
'use strict';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getCity } from '@/data/cities';
import { flagOf } from '@/data/cities';
import { allMarketStatus, MARKET_STATE_TOKEN } from '@/lib/markets';
import { durationHuman, fmtHM } from '@/lib/time';

export interface MarketsPanelProps {
  date: Date;
  onSelectCity: (id: string) => void;
}

export function MarketsPanel({ date, onSelectCity }: MarketsPanelProps) {
  const list = useMemo(() => allMarketStatus(date), [date]);
  const stale = list.some((m) => m.holidayDataStale);

  return (
    <div className="wcm-markets">
      {stale && (
        <p className="wcm-warn" role="note">
          <AlertTriangle size={12} aria-hidden="true" />
          A data consultada está fora do ano coberto pelo calendário de feriados —
          os estados abaixo desconsideram feriados.
        </p>
      )}

      <ul className="wcm-mkts">
        {list.map((m) => {
          const city = getCity(m.exchange.cityId);
          const falta = m.next ? durationHuman(m.next.at.getTime() - date.getTime()) : null;
          return (
            <li key={m.exchange.id} className={`wcm-mkrow is-${m.state}`}>
              <button
                type="button"
                className="wcm-mkrow__btn"
                onClick={() => onSelectCity(m.exchange.cityId)}
                aria-label={`${m.exchange.name}, ${m.label}${falta && m.next ? `, ${m.next.label.toLowerCase()} em ${falta}` : ''}`}
              >
                <span
                  className="wcm-mkrow__dot"
                  style={{ background: MARKET_STATE_TOKEN[m.state] }}
                  aria-hidden="true"
                />
                <span className="wcm-mkrow__flag" aria-hidden="true">{city ? flagOf(city.cc) : '🏳️'}</span>
                <span className="wcm-mkrow__code">{m.exchange.code}</span>
                <span className="wcm-mkrow__city">{city?.name ?? m.exchange.cityId}</span>
                <span className="wcm-mkrow__local">{fmtHM(date, m.exchange.tz)}</span>
                <span className="wcm-mkrow__state">{m.label}</span>
                {m.next && falta && (
                  <span className="wcm-mkrow__next" title={`${m.next.label} às ${fmtHM(m.next.at, m.exchange.tz)} (local da praça)`}>
                    {m.next.state === 'aberto' ? 'abre' : m.next.state === 'fechado' ? 'fecha' : m.next.label.toLowerCase()} em {falta}
                  </span>
                )}
              </button>
              {m.isOpen && (
                <span className="wcm-mkrow__bar" aria-hidden="true">
                  <span className="wcm-mkrow__fill" style={{ width: `${Math.round(m.progress * 100)}%` }} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
