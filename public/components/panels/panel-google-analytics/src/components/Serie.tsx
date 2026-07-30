// components/Serie.tsx — gráfico de evolução (§16) com Apache ECharts.
// @version 1.0.0  @created 2026-07-30
//
// ⚠️ IMPORT SELETIVO, não `import * as echarts`. O painel Google Calendar mediu isso semana
// passada: o pacote inteiro levava o bundle de 496 kB para 1.126 kB. Aqui entram só o motor,
// os dois tipos de série usados, os componentes de eixo/tooltip/legenda/zoom e o renderer SVG.
//
// ⚠️ SVGRenderer (não Canvas): o painel vive dentro do app-shell, que redimensiona quando a
// sub-sidebar colapsa (§11.4). SVG reflui melhor e não fica borrado em tela de alta densidade.
import { useEffect, useRef } from 'react';
import * as core from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkLineComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { fmtCompacto, fmtDiaCurto, fmtInt } from '../lib/fmt';

core.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, MarkLineComponent, SVGRenderer]);

export interface SerieDef {
  nome: string;
  dados: number[];
  cor: string;
  tipo?: 'line' | 'bar';
  eixo?: 0 | 1;
  tracejada?: boolean;
}

export function SerieTemporal({
  datas, series, altura = 300, empilhado = false,
}: {
  datas: string[];
  series: SerieDef[];
  altura?: number;
  empilhado?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inst = useRef<core.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Lê os tokens do tema VIGENTE. ⚠️ Não usar constante de cor aqui: o painel troca de tema
    // em tempo de execução e o gráfico tem de acompanhar.
    const est = getComputedStyle(ref.current);
    const txt = est.getPropertyValue('--ga-txt-2').trim() || '#A9A9BE';
    const linha = est.getPropertyValue('--ga-borda').trim() || '#2F2F45';
    const fundo = est.getPropertyValue('--ga-surface-opaca').trim() || '#232334';

    inst.current ??= core.init(ref.current, undefined, { renderer: 'svg' });

    inst.current.setOption({
      animationDuration: 260,
      backgroundColor: 'transparent',
      grid: { left: 54, right: series.some((s) => s.eixo === 1) ? 54 : 16, top: 28, bottom: 46 },
      legend: {
        top: 0, left: 0, itemWidth: 10, itemHeight: 10, icon: 'roundRect',
        textStyle: { color: txt, fontSize: 11 },
      },
      tooltip: {
        trigger: 'axis',                       // tooltip compartilhado (§16.2)
        backgroundColor: fundo,
        borderColor: linha,
        textStyle: { color: est.getPropertyValue('--ga-txt').trim() || '#ECECF2', fontSize: 12 },
        axisPointer: { type: 'line', lineStyle: { color: linha } },
        valueFormatter: (v: unknown) => (typeof v === 'number' ? fmtInt(v) : String(v)),
      },
      xAxis: {
        type: 'category',
        data: datas.map(fmtDiaCurto),
        axisLine: { lineStyle: { color: linha } },
        axisLabel: { color: txt, fontSize: 10, hideOverlap: true },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          splitLine: { lineStyle: { color: linha, type: 'dashed' } },
          axisLabel: { color: txt, fontSize: 10, formatter: (v: number) => fmtCompacto(v) },
        },
        {
          type: 'value',
          splitLine: { show: false },
          axisLabel: { color: txt, fontSize: 10, formatter: (v: number) => fmtCompacto(v) },
        },
      ],
      dataZoom: [{ type: 'inside', throttle: 60 }],   // zoom/brush temporal (§16.2)
      series: series.map((s) => ({
        name: s.nome,
        type: s.tipo ?? 'line',
        data: s.dados,
        yAxisIndex: s.eixo ?? 0,
        smooth: 0.22,
        symbol: 'none',
        stack: empilhado ? 'total' : undefined,
        areaStyle: empilhado ? { opacity: 0.18 } : undefined,
        lineStyle: { width: 2, color: s.cor, type: s.tracejada ? 'dashed' : 'solid' },
        itemStyle: { color: s.cor },
      })),
    }, true);
  }, [datas, series, empilhado]);

  // ⚠️ §11.4: ao colapsar/expandir a sub-sidebar o container muda de largura sem que a janela
  // dispare `resize`. Sem ResizeObserver o gráfico fica cortado — é o defeito clássico deste
  // shell, e o briefing pede explicitamente que ECharts execute resize.
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(() => inst.current?.resize());
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => { inst.current?.dispose(); inst.current = null; }, []);

  return <div ref={ref} style={{ width: '100%', height: altura }} role="img" aria-label="Gráfico de evolução temporal" />;
}
