// components/ui/Badge.tsx — etiqueta com ícone, cor e tooltip (§15.3).
// @version 1.0.0  @created 2026-07-20
// Substitui texto cru como "active", "órfã", "sem PK" por sinal visual legível.
import type { JSX } from 'react';
import { Icone } from './Icone';
import css from './Badge.module.css';

export type TomBadge = 'neutro' | 'ok' | 'atencao' | 'alerta' | 'info';

export function Badge({ texto, icone, tom = 'neutro', dica, fraco }: {
  texto: string; icone?: string; tom?: TomBadge; dica?: string; fraco?: boolean;
}): JSX.Element {
  return (
    <span className={`${css.badge} ${css[tom]} ${fraco ? css.fraco : ''}`} title={dica}>
      {icone && <Icone nome={icone} size={11} />}
      {texto}
    </span>
  );
}

/** Barra proporcional — dá noção de grandeza sem ler o número (§15.2). */
export function BarraProporcao({ valor, maximo, dica }: { valor: number; maximo: number; dica?: string }): JSX.Element {
  const pct = maximo > 0 ? Math.min(100, (valor / maximo) * 100) : 0;
  return (
    <span className={css.barraWrap} title={dica}>
      <span className={css.barra} style={{ width: `${pct}%` }} />
    </span>
  );
}

/** Anel de score 0-100 com cor semântica (§14.2). */
export function AnelScore({ score, tamanho = 34 }: { score: number | null | undefined; tamanho?: number }): JSX.Element {
  const s = score ?? -1;
  const tom = s < 0 ? 'var(--dt-neutral)' : s >= 80 ? 'var(--dt-success)' : s >= 55 ? 'var(--dt-warning)' : 'var(--dt-danger)';
  const r = (tamanho - 5) / 2;
  const circ = 2 * Math.PI * r;
  const preenchido = s < 0 ? 0 : (s / 100) * circ;

  return (
    <span className={css.anel} style={{ width: tamanho, height: tamanho }}
          title={s < 0 ? 'Score ainda não calculado' : `Score de saúde: ${s}/100`}>
      <svg width={tamanho} height={tamanho} aria-hidden="true">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none"
                stroke="var(--dt-border)" strokeWidth="3" />
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none"
                stroke={tom} strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${preenchido} ${circ}`}
                transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`} />
      </svg>
      <span className={css.anelTexto} style={{ color: tom }}>{s < 0 ? '—' : s}</span>
    </span>
  );
}

/** Heatmap de problemas (§15.5): zero verde → muitos vermelho. */
export function HeatProblemas({ n }: { n: number }): JSX.Element {
  const tom: TomBadge = n === 0 ? 'ok' : n <= 3 ? 'atencao' : n <= 10 ? 'atencao' : 'alerta';
  return (
    <Badge texto={n === 0 ? 'nenhum' : String(n)} tom={tom}
      icone={n === 0 ? 'CircleCheck' : 'TriangleAlert'}
      dica={n === 0 ? 'Sem problemas de qualidade abertos' : `${n} problema(s) de qualidade em aberto`} />
  );
}
