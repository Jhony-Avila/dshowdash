// components/viz/echarts-core.ts — ECharts MODULAR (tree-shaking).
// @version 1.0.0  @created 2026-07-22
//
// Em vez de `import('echarts')` (puxa o pacote INTEIRO ~1MB), registramos só os
// tipos de gráfico e componentes que o módulo usa. Importado dinamicamente pelo
// EChart → vira o mesmo chunk assíncrono, porém muito menor.
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart, FunnelChart, GaugeChart, HeatmapChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, LegendComponent, VisualMapComponent,
  DataZoomComponent, DataZoomInsideComponent, DataZoomSliderComponent, MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart, BarChart, PieChart, FunnelChart, GaugeChart, HeatmapChart, ScatterChart,
  GridComponent, TooltipComponent, LegendComponent, VisualMapComponent,
  DataZoomComponent, DataZoomInsideComponent, DataZoomSliderComponent, MarkLineComponent,
  CanvasRenderer,
]);

export const init = echarts.init;
export const connect = echarts.connect;
export type { ECharts } from 'echarts/core';
