// viz/echarts-core.ts — ECharts MODULAR (tree-shaking) para o painel Pipedrive.
// @version 1.0.0  @created 2026-07-27  (Fase 4 — visuais gerenciais)
//
// `import('echarts')` puxa o pacote INTEIRO (~1MB). Aqui registramos SO os tipos de
// grafico e componentes que o painel usa; o EChart.tsx importa este arquivo de forma
// dinamica, entao ele vira o mesmo chunk assincrono (vite.config ja tira echarts/zrender
// do vendor eager) — porem muito menor.
//
// ⚠️ Ao usar um tipo de grafico NOVO, registre-o aqui. Sem isso o ECharts falha em
// silencio ("Series ... is not registered") e o cartao aparece vazio.
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart, FunnelChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent,
  DataZoomInsideComponent, DataZoomSliderComponent, MarkLineComponent, MarkPointComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart, BarChart, PieChart, FunnelChart,
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent,
  DataZoomInsideComponent, DataZoomSliderComponent, MarkLineComponent, MarkPointComponent,
  CanvasRenderer,
]);

export const init = echarts.init;
export const connect = echarts.connect;
export type { ECharts } from 'echarts/core';
