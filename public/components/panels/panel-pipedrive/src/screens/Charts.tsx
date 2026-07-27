// screens/Charts.tsx — graficos SVG leves e auto-contidos (sem lib externa).
// @version 1.0.0  @created 2026-07-22
//
// AreaChart: serie temporal (area + linha) responsiva por viewBox.
// BarrasDist: distribuicao categorica horizontal (baldes de ciclo).
import { fmtBRL, fmtNum } from '../lib/format';

export interface PontoSerie { label: string; valor: number; }

/** Grafico de area/linha responsivo (largura 100% via viewBox). */
export function AreaChart({ pontos, cor = 'var(--pp-ok)', formato }: { pontos: PontoSerie[]; cor?: string; formato: 'brl' | 'num' }) {
  const W = 640, H = 150, pad = 6;
  const n = pontos.length;
  const fmt = (v: number) => (formato === 'brl' ? fmtBRL(v) : fmtNum(v));

  if (n === 0) return <p className="pp-placeholder">Sem dados no período.</p>;

  const max = Math.max(1, ...pontos.map((p) => p.valor));
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * (W - 2 * pad) + pad);
  const y = (v: number) => H - pad - (v / max) * (H - 2 * pad);
  const linha = pontos.map((p, i) => `${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ');
  const area = `M ${x(0).toFixed(1)},${(H - pad).toFixed(1)} L ${linha.split(' ').join(' L ')} L ${x(n - 1).toFixed(1)},${(H - pad).toFixed(1)} Z`;

  const idxMeio = Math.floor((n - 1) / 2);

  return (
    <div className="pp-chart-wrap">
      <svg className="pp-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Gráfico de série temporal">
        <path d={area} fill={cor} opacity={0.14} />
        <polyline points={linha} fill="none" stroke={cor} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {n <= 60 && pontos.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.valor)} r={2.2} fill={cor} vectorEffect="non-scaling-stroke">
            <title>{`${p.label}: ${fmt(p.valor)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="pp-chart-x">
        <span>{pontos[0]?.label}</span>
        {n > 2 && <span>{pontos[idxMeio]?.label}</span>}
        <span>{pontos[n - 1]?.label}</span>
      </div>
    </div>
  );
}

export interface BarraCat { label: string; valor: number; cor?: string; }

/** Distribuição categórica horizontal (ex.: baldes de ciclo). */
export function BarrasDist({ itens }: { itens: BarraCat[] }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  const total = itens.reduce((a, i) => a + i.valor, 0);
  return (
    <div className="pp-dist">
      {itens.map((it) => (
        <div key={it.label} className="pp-dist-row">
          <span className="pp-dist-lbl" title={it.label}>{it.label}</span>
          <span className="pp-dist-bar"><span style={{ width: `${Math.max(2, (it.valor / max) * 100)}%`, background: it.cor ?? 'var(--pp-primary)' }} /></span>
          <span className="pp-dist-val">{fmtNum(it.valor)}{total > 0 ? <span style={{ color: 'var(--pp-text-dim)', fontWeight: 400 }}> · {Math.round((it.valor / total) * 100)}%</span> : null}</span>
        </div>
      ))}
    </div>
  );
}
