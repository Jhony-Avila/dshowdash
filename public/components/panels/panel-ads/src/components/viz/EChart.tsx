// components/viz/EChart.tsx — wrapper React para ECharts (Fase 2).
// @version 1.0.0  @created 2026-07-22
//
// ECharts é PESADO → import DINÂMICO aqui: vira chunk assíncrono próprio (ver
// vite.config manualChunks) que só baixa quando um gráfico entra em tela.
// Theme-aware: reinit (dispose+recria) ao trocar de tema, pois canvas não reage a CSS.
// Expõe a instância via ref (forwardRef) para export PNG / fullscreen / dispatchAction.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ECharts } from 'echarts/core';
import { useShellTheme, useTokensAds } from '../../shell/useShellTheme';
import type { Opcao } from './echarts-opts';
import css from './EChart.module.css';

export interface EChartHandle {
  instancia: () => ECharts | null;
  exportarPNG: (nome?: string) => void;
  redimensionar: () => void;
}

export type MapaEventos = Record<string, (params: unknown, inst: ECharts) => void>;

export interface EChartProps {
  opcao: Opcao | null;
  altura?: number | string;
  aria?: string;
  /** Handlers de eventos ECharts (ex.: { click: (p) => ... }) para drill-down. */
  eventos?: MapaEventos;
  /** Nome de grupo para conectar tooltips/zoom entre gráficos (echarts.connect). */
  grupo?: string;
}

export const EChart = forwardRef<EChartHandle, EChartProps>(function EChart(
  { opcao, altura = '100%', aria, eventos, grupo }, ref,
) {
  const elRef = useRef<HTMLDivElement>(null);
  const instRef = useRef<ECharts | null>(null);
  const prontoRef = useRef(false);
  const opcaoRef = useRef<Opcao | null>(opcao);
  const eventosRef = useRef<MapaEventos | undefined>(eventos);
  opcaoRef.current = opcao;
  eventosRef.current = eventos;
  const tema = useShellTheme();
  const pal = useTokensAds();

  useImperativeHandle(ref, () => ({
    instancia: () => instRef.current,
    redimensionar: () => instRef.current?.resize(),
    exportarPNG: (nome = 'grafico') => {
      const inst = instRef.current;
      if (!inst) return;
      const url = inst.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: pal.surface });
      const a = document.createElement('a');
      a.href = url; a.download = `${nome}.png`;
      document.body.appendChild(a); a.click(); a.remove();
    },
  }), [pal.surface]);

  // Init/dispose. Reinicia ao trocar de tema (dispose + recria).
  useEffect(() => {
    let vivo = true;
    let ro: ResizeObserver | null = null;
    const timers: number[] = [];
    (async () => {
      const { init, connect } = await import('./echarts-core');
      if (!vivo || !elRef.current) return;
      const inst = init(elRef.current, undefined, { renderer: 'canvas' });
      instRef.current = inst;
      prontoRef.current = true;
      if (grupo) { inst.group = grupo; connect(grupo); }
      if (opcaoRef.current) inst.setOption(opcaoRef.current, true);
      // (re)liga eventos
      const evs = eventosRef.current;
      if (evs) for (const [nome, fn] of Object.entries(evs)) inst.on(nome, (params: unknown) => fn(params, inst));
      ro = new ResizeObserver(() => inst.resize());
      ro.observe(elRef.current);
      elRef.current.classList.add(css.pronto);
      // Resize defensivo: se o canvas inicializou antes do layout final assentar
      // (chain de altura), força recalcular as dimensões nos próximos frames.
      requestAnimationFrame(() => instRef.current?.resize());
      timers.push(window.setTimeout(() => instRef.current?.resize(), 260));
    })();
    return () => {
      vivo = false; prontoRef.current = false;
      ro?.disconnect();
      timers.forEach((t) => clearTimeout(t));
      instRef.current?.dispose(); instRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema]);

  // Atualiza a opção quando os dados mudam (sem reinit).
  useEffect(() => {
    if (prontoRef.current && instRef.current && opcao) instRef.current.setOption(opcao, true);
  }, [opcao]);

  return (
    <div className={css.wrap} style={{ height: altura }}>
      <div ref={elRef} className={css.canvas} role="img" aria-label={aria} />
    </div>
  );
});
