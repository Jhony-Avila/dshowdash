// components/ui.tsx — componentes de apresentação reutilizáveis.
// @version 1.0.0  @created 2026-07-21
import type { ReactNode } from 'react';
import type { BigNumber, HealthClass } from '../shell/types';
import { formatarValor, pctVar, moeda0 } from '../lib/format';
import { Sparkline } from './charts';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="ads-pagehead">
      <div>
        <h1 className="ads-h1">{title}</h1>
        {subtitle && <p className="ads-sub">{subtitle}</p>}
      </div>
      {actions && <div className="ads-pagehead-acts">{actions}</div>}
    </div>
  );
}

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return <div className="ads-skel"><span className="ads-spinner" /> {label}</div>;
}

export function EmptyState({ icon, title, desc, soon }: { icon: ReactNode; title: string; desc?: string; soon?: string }) {
  return (
    <div className="ads-empty">
      <div className="ads-empty-ic" aria-hidden>{icon}</div>
      <div className="ads-empty-tit">{title}</div>
      {desc && <p className="ads-empty-desc">{desc}</p>}
      {soon && <span className="ads-empty-soon">{soon}</span>}
    </div>
  );
}

const SPARK_COLOR: Record<string, string> = { positive: 'var(--ads-ok)', negative: 'var(--ads-danger)', neutral: 'var(--ads-text-dim)' };

export function BigNumberCard({ b }: { b: BigNumber }) {
  const arrow = b.dir === 'up' ? '▲' : (b.dir === 'down' ? '▼' : '—');
  return (
    <div className="ads-bignum">
      <div className="ads-bignum-lbl">{b.label}</div>
      <div className="ads-bignum-val">{formatarValor(b.value, b.unit, true)}</div>
      <div className="ads-bignum-foot">
        <span className={`ads-delta is-${b.sign}`}>{arrow} {pctVar(b.delta_pct)}</span>
        <span className="ads-bignum-prev">vs {formatarValor(b.prev, b.unit, true)}</span>
      </div>
      <Sparkline data={b.spark} color={SPARK_COLOR[b.sign] ?? 'var(--ads-primary)'} />
    </div>
  );
}

// ── Badges de classificação ──────────────────────────────────────────────
const HEALTH: Record<HealthClass, [string, string]> = {
  excellent: ['Excelente', 'ads-pill-ok'],
  healthy: ['Saudável', 'ads-pill-ok'],
  attention: ['Atenção', 'ads-pill-warn'],
  critical: ['Crítica', 'ads-pill-danger'],
  no_data: ['Sem dados', 'ads-pill-dim'],
  budget_limited: ['Limitada p/ verba', 'ads-pill-warn'],
  wasting: ['Desperdiçando', 'ads-pill-danger'],
  scale_opportunity: ['Escalar', 'ads-pill-primary'],
};
export function HealthBadge({ health }: { health: HealthClass }) {
  const [label, cls] = HEALTH[health] ?? ['—', 'ads-pill-dim'];
  return <span className={`ads-pill ${cls}`}>{label}</span>;
}

const STRENGTH: Record<string, [string, string]> = {
  EXCELLENT: ['Excelente', 'ads-pill-ok'], GOOD: ['Boa', 'ads-pill-ok'],
  AVERAGE: ['Média', 'ads-pill-warn'], POOR: ['Ruim', 'ads-pill-danger'],
};
export function StrengthBadge({ s }: { s: string }) {
  const [label, cls] = STRENGTH[s] ?? ['—', 'ads-pill-dim'];
  return <span className={`ads-pill ${cls}`}>{label}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  if (status === 'ENABLED') return <span><span className="ads-statusdot on" />Ativa</span>;
  if (status === 'PAUSED') return <span><span className="ads-statusdot off" />Pausada</span>;
  return <span><span className="ads-statusdot off" />{status}</span>;
}

export function ApprovalBadge({ status }: { status: string }) {
  return status === 'APPROVED'
    ? <span className="ads-pill ads-pill-ok">Aprovado</span>
    : <span className="ads-pill ads-pill-danger">Reprovado</span>;
}

const MATCH: Record<string, string> = { EXACT: 'Exata', PHRASE: 'Frase', BROAD: 'Ampla' };
export function MatchBadge({ m }: { m: string }) {
  return <span className="ads-pill ads-pill-dim">{MATCH[m] ?? m}</span>;
}

const KW_CLASS: Record<string, [string, string]> = {
  profitable: ['Rentável', 'ads-pill-ok'], promising: ['Promissora', 'ads-pill-primary'],
  low_volume: ['Baixo volume', 'ads-pill-dim'], expensive: ['Cara', 'ads-pill-warn'],
  low_quality: ['Baixa qualidade', 'ads-pill-warn'], no_conversion: ['Sem conversão', 'ads-pill-warn'],
  wasting: ['Desperdício', 'ads-pill-danger'], bad_intent: ['Intenção ruim', 'ads-pill-danger'],
  page_issue: ['Problema de página', 'ads-pill-warn'], ad_issue: ['Problema de anúncio', 'ads-pill-warn'],
  pause_candidate: ['Candidata a pausa', 'ads-pill-danger'], expand_candidate: ['Candidata a expansão', 'ads-pill-ok'],
};
export function KwClassBadge({ c }: { c: string }) {
  const [label, cls] = KW_CLASS[c] ?? ['—', 'ads-pill-dim'];
  return <span className={`ads-pill ${cls}`}>{label}</span>;
}

const TERM_CLASS: Record<string, [string, string]> = {
  converting: ['Convertendo', 'ads-pill-ok'], commercial: ['Comercial', 'ads-pill-primary'],
  informational: ['Informacional', 'ads-pill-dim'], waste: ['Desperdício', 'ads-pill-danger'],
  competitor: ['Concorrente', 'ads-pill-purple'],
};
export function TermClassBadge({ c }: { c: string }) {
  const [label, cls] = TERM_CLASS[c] ?? ['—', 'ads-pill-dim'];
  return <span className={`ads-pill ${cls}`}>{label}</span>;
}

/** Medidor 0..max (Quality Score, optimization score). */
export function Meter({ value, max, good }: { value: number; max: number; good?: boolean }) {
  const fr = Math.max(0, Math.min(1, value / max));
  const color = good === undefined
    ? (fr >= 0.66 ? 'var(--ads-ok)' : fr >= 0.4 ? 'var(--ads-warn)' : 'var(--ads-danger)')
    : (good ? 'var(--ads-ok)' : 'var(--ads-danger)');
  return (
    <span className="ads-meter">
      <span className="ads-meter-track"><span className="ads-meter-fill" style={{ width: `${fr * 100}%`, background: color }} /></span>
      {value}
    </span>
  );
}

const CHANNEL: Record<string, string> = {
  SEARCH: 'Pesquisa', DISPLAY: 'Display', PERFORMANCE_MAX: 'Performance Max',
  VIDEO: 'YouTube', SHOPPING: 'Shopping',
};
export function channelLabel(c: string): string { return CHANNEL[c] ?? c; }

/** Célula de valor com cor condicional (bom/ruim). */
export function money0(v: number): string { return moeda0(v); }
