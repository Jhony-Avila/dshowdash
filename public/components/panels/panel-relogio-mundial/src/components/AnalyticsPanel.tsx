/**
 * components/AnalyticsPanel.tsx — mini cards e painel analítico.
 * @version 3.0.0
 *
 * Números derivados do MESMO instante que o mapa, sempre. A tentação aqui é cachear
 * "cidades em dia" e esquecer de recalcular quando a timeline é arrastada — aí o
 * mapa mostra a Ásia amanhecendo e o card insiste em 65% de dia. Tudo é `useMemo`
 * com `date` na dependência, sem exceção.
 *
 * A barra de fusos e a curva de mercados são SVG desenhado à mão, não ECharts: são
 * duas visualizações minúsculas, e puxar um chunk de biblioteca de gráficos para
 * desenhar 96 retângulos seria peso sem retorno.
 */
'use strict';

import { useMemo } from 'react';
import { Sun, Moon, Globe2, Clock3, Building2, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CITIES, REGION_LABEL, type City, type Region } from '@/data/cities';
import { isDaylight } from '@/lib/astro';
import { businessStatus } from '@/lib/business';
import { marketsCurve, marketsSummary } from '@/lib/markets';
import { fmtHM, offsetMinutes } from '@/lib/time';

export interface AnalyticsPanelProps {
  cities: City[];
  date: Date;
  baseTz: string;
}

export function MiniCards({ cities, date }: { cities: City[]; date: Date }) {
  const stats = useMemo(() => {
    const dia = cities.filter((c) => isDaylight(date, c.lat, c.lng)).length;
    const total = cities.length || 1;
    const zonas = new Set(cities.map((c) => offsetMinutes(date, c.tz))).size;
    const mk = marketsSummary(date);
    return {
      diaPct: Math.round((dia / total) * 100),
      noitePct: 100 - Math.round((dia / total) * 100),
      zonas,
      abertos: mk.abertos,
      total: mk.total,
    };
  }, [cities, date]);

  return (
    <div className="wcm-minis">
      <Mini icon={Sun} tone="day" label="Em luz do dia" value={`${stats.diaPct}%`} />
      <Mini icon={Moon} tone="night" label="Na noite" value={`${stats.noitePct}%`} />
      <Mini icon={Clock3} tone="utc" label="UTC agora" value={fmtHM(date, 'UTC')} mono />
      <Mini icon={Globe2} tone="tz" label="Fusos distintos" value={String(stats.zonas)} />
      <Mini icon={Building2} tone="market" label="Bolsas abertas" value={`${stats.abertos}/${stats.total}`} />
    </div>
  );
}

function Mini({ icon: Icon, label, value, tone, mono }: {
  icon: LucideIcon; label: string; value: string; tone: string; mono?: boolean;
}) {
  return (
    <div className={`wcm-mini is-${tone}`}>
      <Icon size={15} className="wcm-mini__icon" aria-hidden="true" />
      <div className="wcm-mini__body">
        <span className={`wcm-mini__value${mono ? ' is-mono' : ''}`}>{value}</span>
        <span className="wcm-mini__label">{label}</span>
      </div>
    </div>
  );
}

export function AnalyticsPanel({ cities, date, baseTz }: AnalyticsPanelProps) {
  const data = useMemo(() => {
    const dia = cities.filter((c) => isDaylight(date, c.lat, c.lng)).length;
    const paises = new Set(cities.map((c) => c.cc)).size;
    const offsets = [...new Set(cities.map((c) => offsetMinutes(date, c.tz)))].sort((a, b) => a - b);
    const expediente = cities.filter((c) => {
      const s = businessStatus(c, date).state;
      return s === 'aberto' || s === 'fim-do-expediente' || s === 'almoco';
    }).length;

    const porRegiao = cities.reduce<Record<string, number>>((m, c) => {
      m[c.region] = (m[c.region] ?? 0) + 1;
      return m;
    }, {});

    const populacao = cities.reduce((s, c) => s + c.pop, 0);

    return { dia, noite: cities.length - dia, paises, offsets, expediente, porRegiao, populacao };
  }, [cities, date]);

  const mk = useMemo(() => marketsSummary(date), [date]);
  const curva = useMemo(() => marketsCurve(date, 30), [date]);

  return (
    <div className="wcm-analytics">
      <dl className="wcm-analytics__grid">
        <Stat label="Cidades no mapa" value={String(cities.length)} sub={`de ${CITIES.length} na base`} />
        <Stat label="Países" value={String(data.paises)} />
        <Stat label="Fusos únicos" value={String(data.offsets.length)} sub="entre as visíveis" />
        <Stat label="Em luz do dia" value={String(data.dia)} sub={`${data.noite} na noite`} />
        <Stat label="Em expediente" value={String(data.expediente)} sub="horário comercial local" />
        <Stat label="Bolsas abertas" value={`${mk.abertos}`} sub={`${mk.pre} pré · ${mk.after} after · ${mk.feriado} feriado`} />
      </dl>

      <section className="wcm-analytics__block">
        <h3 className="wcm-analytics__h">Alcance populacional</h3>
        <p className="wcm-analytics__pop">
          <Users size={13} aria-hidden="true" />
          {(data.populacao / 1_000_000).toFixed(1)} milhões de habitantes nas áreas urbanas monitoradas
        </p>
        <ul className="wcm-regions">
          {(Object.keys(data.porRegiao) as Region[]).map((r) => (
            <li key={r} className={`wcm-region is-${r}`}>
              <span className="wcm-region__label">{REGION_LABEL[r]}</span>
              <span className="wcm-region__bar">
                <span
                  className="wcm-region__fill"
                  style={{ width: `${(data.porRegiao[r] / cities.length) * 100}%` }}
                />
              </span>
              <span className="wcm-region__n">{data.porRegiao[r]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="wcm-analytics__block">
        <h3 className="wcm-analytics__h">Bolsas abertas nas próximas 24 h</h3>
        <MarketsSparkline curve={curva} baseTz={baseTz} />
        <p className="wcm-hint">
          As ondas são o revezamento Ásia → Europa → Américas. O traço vertical é agora.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="wcm-astat">
      <dt>{label}</dt>
      <dd>
        <strong>{value}</strong>
        {sub && <span>{sub}</span>}
      </dd>
    </div>
  );
}

function MarketsSparkline({ curve, baseTz }: { curve: { t: Date; open: number }[]; baseTz: string }) {
  if (!curve.length) return null;
  const W = 260;
  const H = 54;
  const max = Math.max(1, ...curve.map((p) => p.open));
  const step = W / (curve.length - 1);

  const points = curve.map((p, i) => `${(i * step).toFixed(1)},${(H - (p.open / max) * (H - 6) - 2).toFixed(1)}`);
  const area = `M0,${H} L${points.join(' L')} L${W},${H} Z`;

  // Rótulos a cada 6 h, na zona da cidade ativa (é a referência mental do usuário).
  const ticks = curve
    .map((p, i) => ({ p, i }))
    .filter(({ i }) => i % Math.round(curve.length / 4) === 0)
    .slice(0, 5);

  return (
    <figure className="wcm-spark">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
        aria-label={`Curva de bolsas abertas nas próximas 24 horas, máximo de ${max} simultâneas`}>
        <path d={area} className="wcm-spark__area" />
        <polyline points={points.join(' ')} className="wcm-spark__line" fill="none" />
        <line x1="0" y1="0" x2="0" y2={H} className="wcm-spark__now" />
      </svg>
      <figcaption className="wcm-spark__axis">
        {ticks.map(({ p, i }) => (
          <span key={i}>{fmtHM(p.t, baseTz)}</span>
        ))}
      </figcaption>
    </figure>
  );
}
