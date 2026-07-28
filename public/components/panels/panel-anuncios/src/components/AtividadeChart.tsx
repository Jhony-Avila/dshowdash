// components/AtividadeChart.tsx — perguntas por dia (Aprendizado, Fase 3).
// @version 1.0.0  @created 2026-07-28
//
// ECharts carregado por import dinâmico: o bundle principal do painel não
// paga o peso da biblioteca — ela só chega quando o Aprendizado abre.
// Série única de magnitude → um matiz (primário dos tokens), linha fina,
// eixos recessivos, tooltip com crosshair; sem legenda (o título nomeia).
import { useEffect, useRef } from 'react';

interface Ponto { dia: string; n: number; }

export function AtividadeChart({ dados }: { dados: Ponto[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vivo = true;
    let grafico: { resize: () => void; dispose: () => void } | null = null;
    let observador: ResizeObserver | null = null;

    void import('echarts').then((echarts) => {
      const el = ref.current;
      if (!vivo || !el) return;

      const css = getComputedStyle(el);
      const cor = css.getPropertyValue('--anx-primary').trim() || '#4c6ef5';
      const tinta = css.getPropertyValue('--anx-text-dim').trim() || '#9a9ab2';
      const borda = css.getPropertyValue('--anx-border').trim() || '#2c2c42';
      const superficie = css.getPropertyValue('--anx-surface').trim() || '#1a1a28';

      // Preenche os 30 dias (dias sem pergunta = 0) para a linha ser contínua.
      const mapa = new Map(dados.map((d) => [d.dia, d.n]));
      const rotulos: string[] = [];
      const valores: number[] = [];
      const hoje = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(hoje);
        d.setDate(hoje.getDate() - i);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        rotulos.push(`${iso.slice(8, 10)}/${iso.slice(5, 7)}`);
        valores.push(mapa.get(iso) ?? 0);
      }

      const instancia = echarts.init(el);
      instancia.setOption({
        grid: { left: 34, right: 12, top: 14, bottom: 26 },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'line', lineStyle: { color: borda } },
          backgroundColor: superficie,
          borderColor: borda,
          textStyle: { color: tinta, fontSize: 12 },
          valueFormatter: (v: number) => `${v} pergunta${v === 1 ? '' : 's'}`,
        },
        xAxis: {
          type: 'category',
          data: rotulos,
          axisLine: { lineStyle: { color: borda } },
          axisTick: { show: false },
          axisLabel: { color: tinta, fontSize: 10, interval: 4 },
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { color: tinta, fontSize: 10 },
          splitLine: { lineStyle: { color: borda, opacity: 0.5 } },
        },
        series: [{
          name: 'Perguntas',
          type: 'line',
          data: valores,
          smooth: 0.25,
          symbol: 'circle',
          symbolSize: 5,
          showSymbol: false,
          lineStyle: { width: 2, color: cor },
          itemStyle: { color: cor },
          areaStyle: { color: cor, opacity: 0.12 },
        }],
      });
      grafico = instancia;
      observador = new ResizeObserver(() => grafico?.resize());
      observador.observe(el);
    });

    return () => {
      vivo = false;
      observador?.disconnect();
      grafico?.dispose();
    };
  }, [dados]);

  return <div ref={ref} className="anx-chart" role="img"
    aria-label="Gráfico de perguntas por dia nos últimos 30 dias (valores detalhados na lista de últimas perguntas)" />;
}
