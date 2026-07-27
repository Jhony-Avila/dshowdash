// screens/BigNumber.tsx — indicador executivo com variação, sparkline e drill-down.
// @version 1.0.0  @created 2026-07-27  (Fase 4 — visuais gerenciais)
//
// Substitui o <Tile> mudo da Visão Geral. Três acréscimos, todos OPCIONAIS — um tile
// sem série ou sem período anterior degrada para o visual antigo, nunca inventa número:
//   • variação vs. período anterior (chip ▲/▼ com o valor anterior no title);
//   • sparkline SVG (leve de propósito: 8 instâncias de ECharts numa faixa de KPIs
//     custam mais do que o gráfico principal da tela inteira);
//   • drill-down: com `onClick` o cartão vira <button> e leva para a tela filtrada.
import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { fmtBRL, fmtNum } from '../lib/format';

export type FormatoBN = 'brl' | 'num' | 'pct';

export function fmtPorFormato(v: number | null | undefined, f: FormatoBN): string {
  if (v == null) return '—';
  if (f === 'brl') return fmtBRL(v);
  if (f === 'pct') return `${Number.isInteger(v) ? v : v.toFixed(1)}%`;
  return fmtNum(v);
}

export interface BigNumberProps {
  rotulo: string;
  valor: number | null | undefined;
  formato?: FormatoBN;
  cor?: string;
  /** Valor do período anterior — sem ele o chip de variação não aparece. */
  anterior?: number | null;
  /** Série para o sparkline (ordem cronológica). */
  serie?: number[];
  /** Nota curta no rodapé quando não há sparkline (ex.: "5 sem previsão"). */
  nota?: ReactNode;
  /** Torna o cartão clicável (drill-down). */
  onClick?: () => void;
  /** Texto do title/aria quando clicável. */
  dica?: string;
  /** Em métricas onde crescer é RUIM (ex.: perdidos), inverte a cor do chip. */
  inverterCor?: boolean;
  /** Classe extra (ex.: `pp-c-3` para posicionar na grade de 12 colunas). */
  className?: string;
}

/** Variação percentual protegida contra divisão por zero. */
export function variacao(atual?: number | null, anterior?: number | null): number | null {
  if (atual == null || anterior == null) return null;
  if (anterior === 0) return atual === 0 ? 0 : null; // de 0 para N não é "∞%": é incomparável
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

function Delta({ pct, anterior, formato, inverter }: { pct: number; anterior: number; formato: FormatoBN; inverter?: boolean }) {
  const quase = Math.abs(pct) < 0.05;
  const positivo = inverter ? pct < 0 : pct > 0;
  const classe = quase ? 'igual' : positivo ? 'sobe' : 'desce';
  const Icone = quase ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`pp-delta ${classe}`} title={`Período anterior: ${fmtPorFormato(anterior, formato)}`}>
      <Icone size={12} strokeWidth={2.6} aria-hidden />
      {quase ? '0%' : `${pct > 0 ? '+' : ''}${Math.abs(pct) >= 10 ? Math.round(pct) : pct.toFixed(1)}%`}
    </span>
  );
}

/** Sparkline SVG: área + linha, sem eixos. Responsiva por viewBox. */
export function Sparkline({ serie, cor = 'var(--pp-primary)' }: { serie: number[]; cor?: string }) {
  const n = serie.length;
  if (n < 2) return <span className="pp-bn-spark" aria-hidden />;
  const W = 120, H = 28, pad = 2;
  const min = Math.min(...serie);
  const max = Math.max(...serie);
  const amp = max - min || 1;
  const x = (i: number) => (i / (n - 1)) * (W - 2 * pad) + pad;
  const y = (v: number) => H - pad - ((v - min) / amp) * (H - 2 * pad);
  const pts = serie.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `M ${x(0).toFixed(1)},${H} L ${pts.split(' ').join(' L ')} L ${x(n - 1).toFixed(1)},${H} Z`;
  return (
    <svg className="pp-bn-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden focusable="false">
      <path d={area} fill={cor} opacity={0.16} />
      <polyline points={pts} fill="none" stroke={cor} strokeWidth={1.6} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(n - 1)} cy={y(serie[n - 1])} r={1.8} fill={cor} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function BigNumber({
  rotulo, valor, formato = 'num', cor, anterior, serie, nota, onClick, dica, inverterCor, className,
}: BigNumberProps) {
  const cls = `pp-bn${className ? ' ' + className : ''}`;
  const pct = variacao(valor, anterior);
  const conteudo = (
    <>
      <span className="pp-bn-l">{rotulo}</span>
      <span className="pp-bn-n" style={cor ? { color: cor } : undefined}>{fmtPorFormato(valor, formato)}</span>
      <span className="pp-bn-foot">
        {serie && serie.length > 1 ? <Sparkline serie={serie} cor={cor ?? 'var(--pp-primary)'} />
          : nota ? <span className="pp-bn-nota">{nota}</span> : <span className="pp-bn-spark" />}
        {pct != null && anterior != null && <Delta pct={pct} anterior={anterior} formato={formato} inverter={inverterCor} />}
      </span>
    </>
  );

  if (!onClick) return <div className={cls} title={dica}>{conteudo}</div>;
  return (
    <button type="button" className={cls} onClick={onClick} title={dica} aria-label={dica ? `${rotulo}. ${dica}` : rotulo}>
      {conteudo}
    </button>
  );
}
