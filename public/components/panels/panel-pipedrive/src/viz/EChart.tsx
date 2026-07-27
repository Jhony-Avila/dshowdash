// viz/EChart.tsx — wrapper React do ECharts.
// @version 1.0.0  @created 2026-07-27  (Fase 4)
//
// ECharts e pesado -> import DINAMICO de ./echarts-core: vira chunk assincrono proprio
// (vite.config manualChunks devolve undefined para echarts/zrender) que so baixa quando
// um grafico entra em tela. Quem fica so nos grids nao paga nada.
//
// Theme-aware: canvas nao reage a CSS, entao trocar de tema DESTROI e recria a instancia.
// A instancia e exposta por ref para exportar PNG e para drill-down (dispatchAction).
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ECharts } from 'echarts/core';
import { useTemaPipe, usePaleta } from './tema';
import type { Opcao } from './opts';

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
}

export const EChart = forwardRef<EChartHandle, EChartProps>(function EChart(
  { opcao, altura = '100%', aria, eventos }, ref,
) {
  const elRef = useRef<HTMLDivElement>(null);
  const instRef = useRef<ECharts | null>(null);
  const prontoRef = useRef(false);
  const opcaoRef = useRef<Opcao | null>(opcao);
  const eventosRef = useRef<MapaEventos | undefined>(eventos);
  opcaoRef.current = opcao;
  eventosRef.current = eventos;
  const tema = useTemaPipe();
  const pal = usePaleta();

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
    void (async () => {
      const { init } = await import('./echarts-core');
      if (!vivo || !elRef.current) return;
      const inst = init(elRef.current, undefined, { renderer: 'canvas' });
      instRef.current = inst;
      prontoRef.current = true;
      if (opcaoRef.current) inst.setOption(opcaoRef.current, true);
      const evs = eventosRef.current;
      if (evs) for (const [nome, fn] of Object.entries(evs)) inst.on(nome, (params: unknown) => fn(params, inst));
      ro = new ResizeObserver(() => inst.resize());
      ro.observe(elRef.current);
      // Resize defensivo: o canvas pode inicializar antes do layout final assentar
      // (cadeia de alturas em grid) — recalcula nos proximos frames.
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

  // Atualiza a opcao quando os dados mudam (sem reinit).
  useEffect(() => {
    if (prontoRef.current && instRef.current && opcao) instRef.current.setOption(opcao, true);
  }, [opcao]);

  return (
    <div className="pp-ec-wrap" style={{ height: altura }}>
      <div ref={elRef} className="pp-ec-canvas" role="img" aria-label={aria} />
    </div>
  );
});
