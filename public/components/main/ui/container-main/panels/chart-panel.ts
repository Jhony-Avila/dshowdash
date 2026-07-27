
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:panels:chart
// PURPOSE: Chart Panel - Painel adaptativo para gráficos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanel, PANEL_CATEGORIES, PANEL_CAPABILITIES from ../contracts/panel-con...
//   createCanvasResource from ../contracts/resource-contract.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CHART_TYPES — exported value
//   createChartPanel() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanel, PANEL_CATEGORIES, PANEL_CAPABILITIES } from '../contracts/panel-contract.js';
import { createCanvasResource } from '../contracts/resource-contract.js';

export const VERSION = '1.0.0-ADAPTIVE';
export const MODULE_ID = 'container-main:panels:chart';

// Tipos de gráfico suportados
export const CHART_TYPES = Object.freeze({
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  DOUGHNUT: 'doughnut',
  AREA: 'area'
});

// Cria um painel de gráfico
export function createChartPanel(config: Record<string, any> = {}) {
  const {
    id = `chart-panel-${Date.now()}`,
    title = 'Chart',
    type = CHART_TYPES.LINE,
    data = { labels: [], datasets: [] },
    options = {},
    refreshInterval = 0,
    onDataUpdate,
    onError
  } = config;

  let _canvasEl: HTMLCanvasElement | null = null;
  let _resource: Record<string, (...args: unknown[]) => unknown> | null = null;
  let _containerEl: HTMLElement | null = null;
  let _chartInstance: Record<string, unknown> | null = null;
  let _currentData: Record<string, unknown> = { ...data };
  let _animationId: number | null = null;

  const panelConfig = {
    id,
    title,
    category: PANEL_CATEGORIES.DYNAMIC,
    capabilities: [
      PANEL_CAPABILITIES.RESIZABLE,
      PANEL_CAPABILITIES.REFRESHABLE,
      PANEL_CAPABILITIES.EXPORTABLE,
      PANEL_CAPABILITIES.FULLSCREEN
    ],
    refreshInterval,
    priority: 2
  };

  const implementation = {
    async render(element: HTMLElement) {
      _containerEl = element;
      
      _containerEl.innerHTML = `
        <div class="dsd-chart-panel">
          <div class="dsd-chart-panel__header">
            <span class="dsd-chart-panel__title">${title}</span>
            <div class="dsd-chart-panel__actions">
              <button class="dsd-chart-panel__btn" data-action="refresh" title="Atualizar">↻</button>
              <button class="dsd-chart-panel__btn" data-action="export" title="Exportar">⬇</button>
            </div>
          </div>
          <div class="dsd-chart-panel__body">
            <canvas class="dsd-chart-panel__canvas"></canvas>
          </div>
          <div class="dsd-chart-panel__loading" hidden>
            <div class="dsd-chart-panel__spinner"></div>
          </div>
        </div>
      `;

      _canvasEl = _containerEl!.querySelector('.dsd-chart-panel__canvas') as HTMLCanvasElement;
      
      // Event listeners
      _containerEl.querySelector('[data-action="refresh"]')?.addEventListener('click', () => {
        this.refresh();
      });
      
      _containerEl.querySelector('[data-action="export"]')?.addEventListener('click', () => {
        this.export('png');
      });

      // Cria resource
      // @ts-expect-error strict migration — TS2322
      _resource = createCanvasResource(_canvasEl, {
        onDispose: () => {
          _canvasEl = null;
          _chartInstance = null;
        }
      });

      await (_resource!.load as (...args: unknown[]) => Promise<unknown>)(async () => {
        _renderChart();
        return { memoryEstimate: 10 * 1024 * 1024 };
      });
    },

    async refresh() {
      _showLoading(true);
      try {
        if (onDataUpdate) {
          const newData = await onDataUpdate();
          if (newData) {
            _currentData = newData;
            _renderChart();
          }
        }
      } catch (e) {
        onError?.(e);
      } finally {
        _showLoading(false);
      }
    },

    pause() {
      if (_animationId) {
        cancelAnimationFrame(_animationId as number);
        _animationId = null;
      }
      (_resource?.pause as (() => void) | undefined)?.();
    },

    resume() {
      (_resource?.resume as (() => void) | undefined)?.();
      if ((_chartInstance as Record<string, unknown>)?.options) {
        _renderChart();
      }
    },

    async destroy() {
      if (_animationId) cancelAnimationFrame(_animationId as number);
      await (_resource?.dispose as (() => Promise<void>) | undefined)?.();
      if (_containerEl) _containerEl.innerHTML = '';
      _canvasEl = null;
      _chartInstance = null;
      _containerEl = null;
    },

    resize(dimensions: Record<string, unknown>) {
      if (_canvasEl && dimensions) {
        _canvasEl.width = dimensions.width as number;
        _canvasEl.height = dimensions.height as number;
        _renderChart();
      }
    },

    async export(format = 'png') {
      if (!_canvasEl) return null;
      
      if (format === 'png' || format === 'jpeg') {
        return _canvasEl.toDataURL(`image/${format}`);
      }
      
      if (format === 'json') {
        return JSON.stringify(_currentData);
      }
      
      return null;
    },

    healthCheck() {
      return {
        status: _canvasEl ? 'HEALTHY' : 'NOT_INITIALIZED',
        hasCanvas: !!_canvasEl,
        chartType: type,
        dataPoints: (_currentData.labels as Array<unknown>)?.length || 0,
        resource: _resource?.healthCheck?.() || null
      };
    }
  };

  // Renderiza gráfico (implementação simplificada com Canvas 2D)
  function _renderChart() {
    if (!_canvasEl) return;
    
    const ctx = _canvasEl.getContext('2d');
    const width = _canvasEl.width || _canvasEl.offsetWidth || 400;
    const height = _canvasEl.height || _canvasEl.offsetHeight || 300;
    
    _canvasEl.width = width;
    _canvasEl.height = height;
    
    // Limpa canvas
    ctx!.clearRect(0, 0, width, height);
    
    // Renderiza baseado no tipo
    switch (type) {
      case CHART_TYPES.LINE:
        // @ts-expect-error strict migration — TS2345
        _renderLineChart(ctx, width, height);
        break;
      case CHART_TYPES.BAR:
        // @ts-expect-error strict migration — TS2345
        _renderBarChart(ctx, width, height);
        break;
      case CHART_TYPES.PIE:
      case CHART_TYPES.DOUGHNUT:
        // @ts-expect-error strict migration — TS2345
        _renderPieChart(ctx, width, height, type === CHART_TYPES.DOUGHNUT);
        break;
      default:
        // @ts-expect-error strict migration — TS2345
        _renderLineChart(ctx, width, height);
    }
  }

  function _renderLineChart(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    if (!(_currentData.datasets as Array<unknown>)?.length) return;
    
    (_currentData.datasets as Array<Record<string, unknown>>).forEach((dataset: Record<string, unknown>, di: number) => {
      const dsData = (dataset.data || []) as number[];
      if (dsData.length < 2) return;

      const maxVal = Math.max(...dsData, 1);
      const minVal = Math.min(...dsData, 0);
      const range = maxVal - minVal || 1;

      ctx.beginPath();
      ctx.strokeStyle = (dataset.borderColor as string) || `hsl(${di * 60}, 70%, 50%)`;
      ctx.lineWidth = 2;

      dsData.forEach((val: number, i: number) => {
        const x = padding + (i / (dsData.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((val - minVal) / range) * chartHeight;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
    });
    
    // Eixos
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
  }

  function _renderBarChart(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const padding = 40;
    const chartHeight = height - padding * 2;
    
    if (!(_currentData.datasets as Array<unknown>)?.length) return;
    
    const datasets = _currentData.datasets as Array<Record<string, unknown>>;
    const dataset = datasets[0];
    const barData = (dataset.data || []) as number[];
    const labels = (_currentData.labels || []) as string[];

    if (barData.length === 0) return;

    const maxVal = Math.max(...barData, 1);
    const barWidth = (width - padding * 2) / barData.length * 0.8;
    const gap = (width - padding * 2) / barData.length * 0.2;

    ctx.fillStyle = (dataset.backgroundColor as string) || 'rgba(59, 130, 246, 0.8)';

    barData.forEach((val: number, i: number) => {
      const barHeight = (val / maxVal) * chartHeight;
      const x = padding + i * (barWidth + gap) + gap / 2;
      const y = height - padding - barHeight;
      
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  }

  function _renderPieChart(ctx: CanvasRenderingContext2D, width: number, height: number, isDoughnut: boolean) {
    if (!(_currentData.datasets as Array<unknown>)?.length) return;
    
    const pieDatasets = _currentData.datasets as Array<Record<string, unknown>>;
    const pieDataset = pieDatasets[0];
    const pieData = (pieDataset.data || []) as number[];

    if (pieData.length === 0) return;

    const total = pieData.reduce((a: number, b: number) => a + b, 0) || 1;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const innerRadius = isDoughnut ? radius * 0.6 : 0;
    
    let startAngle = -Math.PI / 2;
    
    pieData.forEach((val: number, i: number) => {
      const sliceAngle = (val / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      const colors = (pieDataset.backgroundColor || []) as string[];
      ctx.fillStyle = colors[i] || `hsl(${i * 45}, 70%, 50%)`;
      ctx.fill();
      
      startAngle = endAngle;
    });
    
    if (isDoughnut) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a2e';
      ctx.fill();
    }
  }

  function _showLoading(show: boolean) {
    const el = _containerEl?.querySelector('.dsd-chart-panel__loading') as HTMLElement | null;
    if (el) el.hidden = !show;
  }

  // Cria painel usando contract
  const panel = createPanel(panelConfig, implementation);

  return {
    ...panel.getComponent(),
    
    setData(newData: Record<string, unknown>) {
      _currentData = newData;
      _renderChart();
    },
    
    getData() {
      return { ..._currentData };
    },
    
    addDataPoint(label: string, values: Record<string, unknown>) {
      _currentData.labels = (_currentData.labels || []) as unknown[];
      (_currentData.labels as unknown[]).push(label);

      ((_currentData.datasets || []) as Array<Record<string, unknown>>)?.forEach((dataset: Record<string, unknown>, i: number) => {
        dataset.data = (dataset.data || []) as unknown[];
        (dataset.data as unknown[]).push(values[i] || 0);
      });
      
      _renderChart();
    },
    
    getCanvas() {
      return _canvasEl;
    }
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    chartTypes: Object.keys(CHART_TYPES)
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID
  };
}

export default {
  VERSION, MODULE_ID,
  CHART_TYPES,
  createChartPanel,
  info, healthCheck
};
