// components/charts.tsx — mini-gráficos SVG inline (sem dependências externas).
// @version 1.0.0  @created 2026-07-21
// Nota: na Fase 2 (produção) estes serão substituídos por ApexCharts/ECharts
// conforme docs/GOOGLE-ADS/01-arquitetura.md §7. Aqui, SVG puro = zero deps, theme-aware.
import { useId } from 'react';

/** Sparkline compacta para os Big Numbers. */
export function Sparkline({ data, color, width = 74, height = 30 }: {
  data: number[]; color: string; width?: number; height?: number;
}) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg className="ads-bignum-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.6}
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export interface Serie { name: string; color: string; data: number[]; }

/** Gráfico de linhas multi-série com grade e rótulos de eixo. */
export function LineChart({ series, labels, height = 200 }: {
  series: Serie[]; labels: string[]; height?: number;
}) {
  const gid = useId().replace(/[:]/g, '');
  const W = 720, H = height;
  const padL = 8, padR = 8, padT = 12, padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = labels.length;
  if (n < 2) return <div className="ads-grid-empty">Sem série suficiente.</div>;

  const allVals = series.flatMap((s) => s.data);
  const max = Math.max(...allVals, 1);
  const min = Math.min(...allVals, 0);
  const span = max - min || 1;
  const x = (i: number) => padL + (i / (n - 1)) * innerW;
  const y = (v: number) => padT + innerH - ((v - min) / span) * innerH;

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((f) => padT + f * innerH);
  const labelStep = Math.max(1, Math.ceil(n / 7));

  return (
    <div>
      <svg className="ads-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img">
        {gridYs.map((gy, i) => (
          <line key={i} className="ads-grid-line" x1={padL} y1={gy} x2={W - padR} y2={gy} />
        ))}
        {labels.map((lb, i) => (i % labelStep === 0 || i === n - 1) ? (
          <text key={i} className="ads-axis-lbl" x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : (i === n - 1 ? 'end' : 'middle')}>{lb}</text>
        ) : null)}
        {series.map((s, si) => {
          const path = s.data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
          const area = `${path} L${x(n - 1).toFixed(1)},${(padT + innerH).toFixed(1)} L${x(0).toFixed(1)},${(padT + innerH).toFixed(1)} Z`;
          return (
            <g key={s.name}>
              {si === 0 && (
                <>
                  <defs>
                    <linearGradient id={`ag${gid}${si}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                      <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={area} fill={`url(#ag${gid}${si})`} stroke="none" />
                </>
              )}
              <path d={path} fill="none" stroke={s.color} strokeWidth={1.9} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
      </svg>
      <div className="ads-legend">
        {series.map((s) => (
          <span key={s.name} className="ads-legend-item">
            <span className="ads-legend-dot" style={{ background: s.color }} /> {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
