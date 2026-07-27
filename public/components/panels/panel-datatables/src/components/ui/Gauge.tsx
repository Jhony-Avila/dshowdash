// components/ui/Gauge.tsx — indicador de score em arco (§19.1).
// @version 1.0.0  @created 2026-07-20
// SVG puro: não vale carregar biblioteca de gráfico para um arco.
import type { JSX } from 'react';
import css from './Gauge.module.css';

export function Gauge({ valor, max = 100, rotulo, tamanho = 168 }: {
  valor: number | null; max?: number; rotulo?: string; tamanho?: number;
}): JSX.Element {
  const v = valor ?? 0;
  const pct = Math.max(0, Math.min(1, v / max));
  const tom = valor === null ? 'var(--dt-neutral)'
            : v >= 80 ? 'var(--dt-success)'
            : v >= 55 ? 'var(--dt-warning)' : 'var(--dt-danger)';

  // Arco de 240°, aberto embaixo — leitura imediata do "quanto falta".
  const r = tamanho / 2 - 14;
  const circ = 2 * Math.PI * r;
  const arco = circ * (240 / 360);

  return (
    <div className={css.raiz} style={{ width: tamanho, height: tamanho * 0.78 }}
         role="img" aria-label={`${rotulo ?? 'Score'}: ${valor ?? 'não avaliado'} de ${max}`}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} className={css.svg}>
        <g transform={`rotate(150 ${tamanho / 2} ${tamanho / 2})`}>
          <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none"
                  stroke="var(--dt-border)" strokeWidth="11" strokeLinecap="round"
                  strokeDasharray={`${arco} ${circ}`} />
          <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none"
                  stroke={tom} strokeWidth="11" strokeLinecap="round"
                  strokeDasharray={`${arco * pct} ${circ}`} className={css.arco} />
        </g>
      </svg>
      <div className={css.centro}>
        <strong className={css.valor} style={{ color: tom }}>{valor ?? '—'}</strong>
        <span className={css.max}>de {max}</span>
        {rotulo && <span className={css.rotulo}>{rotulo}</span>}
      </div>
    </div>
  );
}
