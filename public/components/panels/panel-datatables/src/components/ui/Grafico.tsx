// components/ui/Grafico.tsx — wrapper de gráfico ECharts (Elevação visual §10).
// @version 1.0.0  @created 2026-07-21
//
// ECharts é PESADO: importado DINAMICAMENTE aqui → vira chunk assíncrono próprio
// (fora do vendor eager, via vite.config manualChunks). Só baixa quando um
// gráfico entra em tela. Theme-aware: as cores vêm dos tokens do shell e o
// gráfico é reconstruído ao trocar de tema (canvas não reage a CSS sozinho).
import { useEffect, useRef, type JSX } from 'react';
import { useShellTheme, useShellTokens } from '../../shell/useShellTheme';
import { Skeleton } from './Estados';
import css from './Grafico.module.css';

export type OpcaoECharts = Record<string, unknown>;
export interface PaletaGrafico {
  primary: string; success: string; warning: string; danger: string; info: string;
  neutral: string; slow: string; cred: string; texto: string; grade: string; muted: string; surface: string;
}

/** Cores resolvidas dos tokens do shell — recalculadas ao trocar de tema. */
export function usePaletaGrafico(): PaletaGrafico {
  return useShellTokens({
    primary: '--dt-primary', success: '--dt-success', warning: '--dt-warning',
    danger: '--dt-danger', info: '--dt-info', neutral: '--dt-neutral',
    slow: '--dt-slow', cred: '--dt-cred', texto: '--dt-text-secondary',
    grade: '--dt-border', muted: '--dt-text-muted', surface: '--dt-bg-surface',
  }) as PaletaGrafico;
}

export function Grafico({ opcao, altura = 220, aria }: {
  opcao: OpcaoECharts | null; altura?: number; aria?: string;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<{ setOption: (o: OpcaoECharts, b?: boolean) => void; resize: () => void; dispose: () => void } | null>(null);
  const prontoRef = useRef(false);
  const theme = useShellTheme();

  // Init/dispose. Reinicia ao trocar de tema (dispose + recria com paleta nova).
  useEffect(() => {
    let vivo = true;
    let ro: ResizeObserver | null = null;
    (async () => {
      const echarts = await import('echarts');
      if (!vivo || !ref.current) return;
      inst.current = echarts.init(ref.current, undefined, { renderer: 'canvas' }) as unknown as typeof inst.current;
      prontoRef.current = true;
      if (opcao) inst.current!.setOption(opcao, true);
      ro = new ResizeObserver(() => inst.current?.resize());
      ro.observe(ref.current);
    })();
    return () => {
      vivo = false; prontoRef.current = false;
      ro?.disconnect(); inst.current?.dispose(); inst.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Atualiza a opção quando os dados mudam (sem reinit).
  useEffect(() => {
    if (prontoRef.current && inst.current && opcao) inst.current.setOption(opcao, true);
  }, [opcao]);

  return (
    <div className={css.wrap} style={{ height: altura }}>
      <div ref={ref} className={css.canvas} role="img" aria-label={aria} />
      {!prontoRef.current && <div className={css.skel}><Skeleton linhas={4} altura={altura / 6} /></div>}
    </div>
  );
}

/** Base comum de tooltip/grade coerente com o tema. */
export function baseGrafico(p: PaletaGrafico): OpcaoECharts {
  return {
    textStyle: { color: p.texto, fontFamily: 'inherit' },
    tooltip: {
      backgroundColor: p.surface, borderColor: p.grade, borderWidth: 1,
      textStyle: { color: p.texto, fontSize: 12 }, confine: true,
    },
    grid: { left: 8, right: 12, top: 12, bottom: 8, containLabel: true },
  };
}
