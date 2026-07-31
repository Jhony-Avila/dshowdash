/**
 * components/Comparator.tsx — comparador de fusos e melhor horário de reunião.
 * @version 3.0.0
 *
 * Responde as três perguntas que motivam abrir um comparador:
 *   1. Que horas são lá agora, e é outro dia?
 *   2. Qual a diferença exata (inclusive meia hora — Índia, Nepal, Austrália Central)?
 *   3. Onde os dois expedientes se cruzam, e qual o melhor horário para marcar?
 *
 * A sobreposição é calculada com os perfis de expediente reais (o Golfo trabalha
 * domingo a quinta), não com "9 às 18 em todo lugar". E quando NÃO existe janela
 * comum — São Paulo × Auckland é o caso clássico — o painel diz isso com todas as
 * letras em vez de sugerir um horário ruim para os dois.
 */
'use strict';

import { useMemo } from 'react';
import { ArrowLeftRight, CalendarCheck, Ban } from 'lucide-react';
import { CITIES, flagOf, getCity } from '@/data/cities';
import { bestMeetingSlots, overlapWindow, businessStatus } from '@/lib/business';
import {
  dayShift, durationHuman, fmtDateLong, fmtHM, fmtWeekday,
  offsetLabel, tzDiffLabel, tzDiffMinutes,
} from '@/lib/time';

export interface ComparatorProps {
  pair: [string, string];
  date: Date;
  onChange: (pair: [string, string]) => void;
}

export function Comparator({ pair, date, onChange }: ComparatorProps) {
  const a = getCity(pair[0]);
  const b = getCity(pair[1]);

  const dados = useMemo(() => {
    if (!a || !b) return null;
    const diff = tzDiffMinutes(date, a.tz, b.tz);
    const shift = dayShift(date, a.tz, b.tz);
    const overlap = overlapWindow(a, b, date);
    const slots = bestMeetingSlots([a, b], date, 4);
    return { diff, shift, overlap, slots };
  }, [a, b, date]);

  if (!a || !b || !dados) return <p className="wcm-empty">Selecione duas cidades.</p>;

  return (
    <div className="wcm-cmp">
      <div className="wcm-cmp__pickers">
        <CityPicker label="Origem" value={pair[0]} onChange={(id) => onChange([id, pair[1]])} />
        <button
          type="button"
          className="wcm-cmp__swap"
          onClick={() => onChange([pair[1], pair[0]])}
          title="Inverter origem e destino"
          aria-label="Inverter origem e destino"
        >
          <ArrowLeftRight size={14} aria-hidden="true" />
        </button>
        <CityPicker label="Destino" value={pair[1]} onChange={(id) => onChange([pair[0], id])} />
      </div>

      <div className="wcm-cmp__cards">
        <SideCard city={a} date={date} />
        <div className="wcm-cmp__delta">
          <strong>{tzDiffLabel(dados.diff)}</strong>
          {dados.shift !== 0 && (
            <span className="wcm-cmp__day">
              {dados.shift > 0 ? 'dia seguinte' : 'dia anterior'} em {b.name}
            </span>
          )}
        </div>
        <SideCard city={b} date={date} />
      </div>

      <section className="wcm-cmp__block">
        <h3 className="wcm-cmp__h">Sobreposição de expediente</h3>
        {dados.overlap ? (
          <p className="wcm-cmp__overlap">
            <CalendarCheck size={13} aria-hidden="true" />
            <strong>{durationHuman(dados.overlap.minutes * 60000)}</strong> em comum —
            das {fmtHM(dados.overlap.start, a.tz)} às {fmtHM(dados.overlap.end, a.tz)} em {a.name}
            {' '}({fmtHM(dados.overlap.start, b.tz)}–{fmtHM(dados.overlap.end, b.tz)} em {b.name}).
          </p>
        ) : (
          <p className="wcm-cmp__overlap is-none">
            <Ban size={13} aria-hidden="true" />
            Os expedientes de {a.name} e {b.name} não se cruzam neste dia. Uma reunião
            exigirá que um dos lados saia do horário comercial.
          </p>
        )}
      </section>

      <section className="wcm-cmp__block">
        <h3 className="wcm-cmp__h">Melhores horários para reunião</h3>
        <ul className="wcm-slots">
          {dados.slots.map((s) => (
            <li key={s.at.getTime()} className={`wcm-slot${s.score >= 0.99 ? ' is-best' : ''}`}>
              <span className="wcm-slot__score" aria-hidden="true">
                <span style={{ width: `${Math.round(s.score * 100)}%` }} />
              </span>
              <span className="wcm-slot__times">
                <strong>{fmtHM(s.at, a.tz)}</strong>
                <span className="wcm-slot__sep">/</span>
                <strong>{fmtHM(s.at, b.tz)}</strong>
              </span>
              <span className="wcm-slot__states">
                {s.perCity.map((pc) => (
                  <span key={pc.city.id} className={`wcm-slot__st is-${pc.state}`}>
                    {flagOf(pc.city.cc)} {businessLabelShort(pc.state)}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="wcm-hint">
          Pontuação: expediente pleno vale 1, última hora 0,6 e almoço 0,35 — por isso
          um horário “bom para os dois” ganha de um “ótimo para um só”.
        </p>
      </section>
    </div>
  );
}

function businessLabelShort(state: string): string {
  switch (state) {
    case 'aberto': return 'expediente';
    case 'almoco': return 'almoço';
    case 'fim-do-expediente': return 'fim do dia';
    case 'fim-de-semana': return 'fim de semana';
    default: return 'fora';
  }
}

function SideCard({ city, date }: { city: (typeof CITIES)[number]; date: Date }) {
  const biz = businessStatus(city, date);
  return (
    <div className="wcm-cmp__side">
      <p className="wcm-cmp__city">
        <span aria-hidden="true">{flagOf(city.cc)}</span> {city.name}
      </p>
      <p className="wcm-cmp__time">{fmtHM(date, city.tz)}</p>
      <p className="wcm-cmp__date">{fmtWeekday(date, city.tz, 'short')}, {fmtDateLong(date, city.tz)}</p>
      <p className="wcm-cmp__utc">{offsetLabel(date, city.tz)}</p>
      <p className={`wcm-cmp__biz is-${biz.state}`}>{biz.label}</p>
    </div>
  );
}

function CityPicker({ label, value, onChange }: {
  label: string; value: string; onChange: (id: string) => void;
}) {
  return (
    <label className="wcm-cmp__picker">
      <span className="wcm-cmp__pickerlabel">{label}</span>
      <select className="wcm-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {CITIES.map((c) => (
          <option key={c.id} value={c.id}>{c.name} — {c.country}</option>
        ))}
      </select>
    </label>
  );
}
