// components/GChart.tsx — wrapper de gráficos ECharts (import dinâmico).
// @version 1.0.0  @created 2026-07-28
//
// A biblioteca só é baixada quando o primeiro gráfico monta (chunk próprio).
// O builder recebe os tokens de cor do tema atual e devolve a option.
import { useEffect, useRef } from 'react';

export interface TokensGrafico {
  primaria: string;    // cor primária do dash
  apoio: string;       // série secundária
  ok: string; warn: string; bad: string;
  texto: string; textoDim: string; borda: string; superficie: string;
}

type Echarts = typeof import('echarts');

export function GChart({ altura = 260, montar, deps }: {
  altura?: number;
  montar: (echarts: Echarts, tokens: TokensGrafico) => Record<string, unknown>;
  deps: unknown[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vivo = true;
    let grafico: { resize: () => void; dispose: () => void } | null = null;
    let observador: ResizeObserver | null = null;

    void import('echarts').then((echarts) => {
      const el = ref.current;
      if (!vivo || !el) return;
      const css = getComputedStyle(el);
      const t: TokensGrafico = {
        primaria: css.getPropertyValue('--ger-azul').trim() || '#6366f1',
        apoio: css.getPropertyValue('--ger-roxo').trim() || '#8b5cf6',
        ok: css.getPropertyValue('--ger-ok').trim() || '#22c55e',
        warn: css.getPropertyValue('--ger-warn').trim() || '#f59e0b',
        bad: css.getPropertyValue('--ger-bad').trim() || '#ef4444',
        texto: css.getPropertyValue('--ger-texto').trim() || '#e9e9f2',
        textoDim: css.getPropertyValue('--ger-texto-dim').trim() || '#9a9ab2',
        borda: css.getPropertyValue('--ger-borda').trim() || '#2c2c42',
        superficie: css.getPropertyValue('--ger-superficie').trim() || '#1a1a28',
      };
      const instancia = echarts.init(el);
      instancia.setOption({
        textStyle: { color: t.textoDim },
        tooltip: { backgroundColor: t.superficie, borderColor: t.borda, textStyle: { color: t.texto, fontSize: 12 } },
        ...montar(echarts, t),
      });
      grafico = instancia;
      observador = new ResizeObserver(() => grafico?.resize());
      observador.observe(el);
    });

    return () => { vivo = false; observador?.disconnect(); grafico?.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return <div ref={ref} className="ger-chart" style={{ height: altura }} role="img"
    aria-label="Gráfico (os valores estão disponíveis nas tabelas da seção)" />;
}
