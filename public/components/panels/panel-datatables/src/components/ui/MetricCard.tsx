import type { JSX, ReactNode } from 'react';
// components/ui/MetricCard.tsx — big number COM contexto, estado e mini-gráfico.
// @version 2.1.0  @updated 2026-07-21 (Elevação §8/§21: ícone em chip com
// gradiente por estado, sparkline, tendência, tooltip, hover elevado, ação, e
// agora COUNT-UP animado do número — respeitando prefers-reduced-motion.)
import { Icone } from './Icone';
import { fmtInt } from '../../lib/format';
import { useContador } from './animacao';
import css from './MetricCard.module.css';

export type TomMetrica = 'neutro' | 'ok' | 'atencao' | 'alerta' | 'info';

interface Props {
  icone: string;
  rotulo: string;
  valor: number | string | null | undefined;
  contexto?: string;
  tom?: TomMetrica;
  serie?: number[];
  tendencia?: { dir: 'up' | 'down' | 'flat'; texto: string; bom?: boolean };
  onClick?: () => void;
  titulo?: string;
  dica?: string;
  rodape?: ReactNode;
}

export function MetricCard({ icone, rotulo, valor, contexto, tom = 'neutro', serie, tendencia, onClick, titulo, dica, rodape }: Props): JSX.Element {
  const clicavel = typeof onClick === 'function';
  const Tag = clicavel ? 'button' : 'div';

  // Count-up: só quando o valor é número. Para string/null, o hook recebe 0 (sem
  // efeito visível) e usamos o valor original abaixo. Hook chamado sempre (regra).
  const ehNumero = typeof valor === 'number' && Number.isFinite(valor);
  const animado = useContador(ehNumero ? (valor as number) : 0);

  return (
    <Tag
      type={clicavel ? 'button' : undefined}
      className={`${css.cartao} ${css[tom]} ${clicavel ? css.clicavel : ''}`}
      onClick={onClick}
      title={titulo ?? dica}
    >
      <div className={css.topo}>
        <span className={css.icone}><Icone nome={icone} size={17} /></span>
        <span className={css.rotulo}>{rotulo}</span>
        {clicavel && <Icone nome="ChevronRight" size={14} className={css.ir} />}
      </div>
      <div className={css.corpo}>
        <strong className={css.valor}>
          {ehNumero ? fmtInt(animado) : (valor ?? '—')}
        </strong>
        {serie && serie.length > 1 && <Sparkline dados={serie} />}
      </div>
      <div className={css.baixo}>
        {contexto && <span className={css.contexto}>{contexto}</span>}
        {tendencia && (
          <span className={`${css.tend} ${tendencia.bom ? css.tendBom : tendencia.bom === false ? css.tendRuim : ''}`}>
            <Icone nome={tendencia.dir === 'up' ? 'TrendingUp' : tendencia.dir === 'down' ? 'TrendingDown' : 'Minus'} size={12} />
            {tendencia.texto}
          </span>
        )}
      </div>
      {rodape && <div className={css.rodape}>{rodape}</div>}
    </Tag>
  );
}

/** Sparkline em SVG puro — sem carregar biblioteca de gráfico para isto. */
function Sparkline({ dados }: { dados: number[] }): JSX.Element {
  const max = Math.max(...dados, 1);
  const min = Math.min(...dados, 0);
  const amp = max - min || 1;
  const pontos = dados
    .map((v, i) => `${(i / (dados.length - 1)) * 100},${28 - ((v - min) / amp) * 24}`)
    .join(' ');
  return (
    <svg className={css.spark} viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pontos} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
