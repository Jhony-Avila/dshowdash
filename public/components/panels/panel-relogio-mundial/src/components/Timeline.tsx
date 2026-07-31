/**
 * components/Timeline.tsx — linha do tempo mundial de 24 h, arrastável.
 * @version 3.0.0
 *
 * A faixa cobre 24 h centradas em AGORA (−12 h … +12 h). Cada cidade vira uma trilha
 * colorida pelas fases do dia dela (madrugada, manhã, comercial, fim da tarde, noite),
 * como as faixas de disponibilidade do Outlook — só que em escala planetária.
 *
 * Arrastar o cursor não é enfeite: ele altera `timeOffset` no store, e TUDO no painel
 * segue junto (terminador, relógios, mercados, contagens). É o recurso que responde
 * "como o mundo vai estar às 15h?" sem sair da tela.
 *
 * As trilhas são calculadas em passos de 30 min (48 células por cidade). Com 15
 * cidades são 720 células — barato o bastante para recalcular a cada minuto e
 * denso o bastante para as transições parecerem contínuas.
 */
'use strict';

import { useCallback, useMemo, useRef, useState } from 'react';
import { RotateCcw, ChevronsUpDown } from 'lucide-react';
import type { City } from '@/data/cities';
import { flagOf } from '@/data/cities';
import { timeState, TIME_STATE_LABEL, TIME_STATE_TOKEN } from '@/lib/business';
import { durationHuman, fmtHM, zonedParts } from '@/lib/time';

const SPAN_MIN = 24 * 60;   // largura total da faixa, em minutos
const HALF = SPAN_MIN / 2;  // −12 h … +12 h
const STEP = 30;            // resolução das trilhas, em minutos
const CELLS = SPAN_MIN / STEP;

export interface TimelineProps {
  cities: City[];
  realNow: Date;
  offset: number;
  baseTz: string;
  onOffsetChange: (minutes: number) => void;
  maxRows?: number;
}

export function Timeline({ cities, realNow, offset, baseTz, onOffsetChange, maxRows = 9 }: TimelineProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  /**
   * Compacta por padrão: 3 trilhas em vez de 9.
   *
   * Com as 9 trilhas a barra tinha 190px de altura em toda a largura da tela e
   * escondia a faixa inteira do hemisfério sul — São Paulo, Joanesburgo e Sydney
   * sumiam do mapa. A informação continua a um clique, e quem quiser a grade completa
   * expande. Mapa primeiro; a linha do tempo é apoio.
   */
  const [expandida, setExpandida] = useState(false);
  const limite = expandida ? maxRows : 3;

  const rows = useMemo(() => cities.slice(0, limite), [cities, limite]);

  // Trilhas: fase do dia de cada cidade em cada célula de 30 min.
  const tracks = useMemo(() => {
    const start = realNow.getTime() - HALF * 60000;
    return rows.map((city) => {
      const cells: { state: ReturnType<typeof timeState>; t: Date }[] = [];
      for (let i = 0; i < CELLS; i++) {
        const t = new Date(start + i * STEP * 60000);
        cells.push({ state: timeState(city, t), t });
      }
      return { city, cells };
    });
    // Recalcula por minuto: o Date muda a cada segundo, mas as células são de 30 min.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, Math.floor(realNow.getTime() / 60000)]);

  // Marcações de hora cheia na zona da cidade de referência.
  const ticks = useMemo(() => {
    const start = realNow.getTime() - HALF * 60000;
    const out: { pct: number; label: string; major: boolean }[] = [];
    for (let i = 0; i <= CELLS; i++) {
      const t = new Date(start + i * STEP * 60000);
      const p = zonedParts(t, baseTz);
      if (p.minute !== 0) continue;
      if (p.hour % 3 !== 0) continue;
      out.push({ pct: (i / CELLS) * 100, label: String(p.hour).padStart(2, '0') + 'h', major: p.hour % 6 === 0 });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseTz, Math.floor(realNow.getTime() / 60000)]);

  const pctFromOffset = ((offset + HALF) / SPAN_MIN) * 100;

  const setFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    // Passo de 5 min: o cursor "encaixa" e fica muito mais fácil de mirar um horário.
    const minutes = Math.round((ratio * SPAN_MIN - HALF) / 5) * 5;
    onOffsetChange(minutes);
  }, [onOffsetChange]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  }, [setFromClientX]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setFromClientX(e.clientX);
  }, [setFromClientX]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 60 : 15;
    if (e.key === 'ArrowLeft') { e.preventDefault(); onOffsetChange(Math.max(-HALF, offset - step)); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); onOffsetChange(Math.min(HALF, offset + step)); }
    else if (e.key === 'Home' || e.key === 'Escape') { e.preventDefault(); onOffsetChange(0); }
  }, [offset, onOffsetChange]);

  const viewed = new Date(realNow.getTime() + offset * 60000);

  return (
    <div className="wcm-timeline">
      <div className="wcm-timeline__head">
        <span className="wcm-timeline__label">
          Linha do tempo · 24 h
          <span className="wcm-timeline__ref">referência {baseTz.split('/').pop()?.replace('_', ' ')}</span>
        </span>
        <span className={`wcm-timeline__cursor-info${offset ? ' is-shifted' : ''}`} aria-live="polite">
          {offset === 0
            ? `agora · ${fmtHM(viewed, baseTz)}`
            : `${offset > 0 ? '+' : '−'}${durationHuman(Math.abs(offset) * 60000)} · ${fmtHM(viewed, baseTz)}`}
        </span>
        {offset !== 0 && (
          <button type="button" className="wcm-timeline__reset" onClick={() => onOffsetChange(0)} title="Voltar para agora">
            <RotateCcw size={12} aria-hidden="true" />
            Agora
          </button>
        )}
        <button
          type="button"
          className="wcm-timeline__reset"
          onClick={() => setExpandida((v) => !v)}
          aria-expanded={expandida}
          title={expandida ? 'Compactar a linha do tempo' : `Mostrar as ${Math.min(cities.length, maxRows)} cidades`}
        >
          <ChevronsUpDown size={12} aria-hidden="true" />
          {expandida ? 'Compactar' : `${Math.min(cities.length, maxRows)} cidades`}
        </button>
      </div>

      <div className="wcm-timeline__body">
        <div className="wcm-timeline__names" aria-hidden="true">
          {tracks.map(({ city }) => (
            <span key={city.id} className="wcm-timeline__name">
              <span>{flagOf(city.cc)}</span>
              {city.name}
            </span>
          ))}
        </div>

        <div
          ref={trackRef}
          className="wcm-timeline__track"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          role="slider"
          tabIndex={0}
          aria-label="Deslocamento da linha do tempo"
          aria-valuemin={-HALF}
          aria-valuemax={HALF}
          aria-valuenow={offset}
          aria-valuetext={offset === 0 ? 'agora' : `${fmtHM(viewed, baseTz)}, deslocado ${durationHuman(Math.abs(offset) * 60000)}`}
        >
          {tracks.map(({ city, cells }) => (
            <div key={city.id} className="wcm-timeline__row" title={city.name}>
              {cells.map((cell, i) => (
                <span
                  key={i}
                  className="wcm-timeline__cell"
                  style={{ background: TIME_STATE_TOKEN[cell.state] }}
                  title={`${city.name} · ${fmtHM(cell.t, city.tz)} · ${TIME_STATE_LABEL[cell.state]}`}
                />
              ))}
            </div>
          ))}

          <div className="wcm-timeline__ticks" aria-hidden="true">
            {ticks.map((t, i) => (
              <span
                key={i}
                className={`wcm-timeline__tick${t.major ? ' is-major' : ''}`}
                style={{ left: `${t.pct}%` }}
              >
                <i>{t.label}</i>
              </span>
            ))}
          </div>

          <div className="wcm-timeline__nowline" style={{ left: '50%' }} aria-hidden="true" />
          <div className="wcm-timeline__playhead" style={{ left: `${pctFromOffset}%` }} aria-hidden="true">
            <span className="wcm-timeline__grab" />
          </div>
        </div>
      </div>

      <div className="wcm-timeline__legend" aria-hidden="true">
        {(['madrugada', 'manha', 'comercial', 'fim-tarde', 'noite'] as const).map((s) => (
          <span key={s} className="wcm-legend">
            <i style={{ background: TIME_STATE_TOKEN[s] }} />
            {TIME_STATE_LABEL[s]}
          </span>
        ))}
      </div>
    </div>
  );
}
