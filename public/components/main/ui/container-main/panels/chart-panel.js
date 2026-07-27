import { createPanel, PANEL_CATEGORIES, PANEL_CAPABILITIES } from "../contracts/panel-contract.js";
import { createCanvasResource } from "../contracts/resource-contract.js";
const VERSION = "1.0.0-ADAPTIVE";
const MODULE_ID = "container-main:panels:chart";
const CHART_TYPES = Object.freeze({
  LINE: "line",
  BAR: "bar",
  PIE: "pie",
  DOUGHNUT: "doughnut",
  AREA: "area"
});
function createChartPanel(config = {}) {
  const {
    id = `chart-panel-${Date.now()}`,
    title = "Chart",
    type = CHART_TYPES.LINE,
    data = { labels: [], datasets: [] },
    options = {},
    refreshInterval = 0,
    onDataUpdate,
    onError
  } = config;
  let _canvasEl = null;
  let _resource = null;
  let _containerEl = null;
  let _chartInstance = null;
  let _currentData = { ...data };
  let _animationId = null;
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
    async render(element) {
      _containerEl = element;
      _containerEl.innerHTML = `
        <div class="dsd-chart-panel">
          <div class="dsd-chart-panel__header">
            <span class="dsd-chart-panel__title">${title}</span>
            <div class="dsd-chart-panel__actions">
              <button class="dsd-chart-panel__btn" data-action="refresh" title="Atualizar">\u21BB</button>
              <button class="dsd-chart-panel__btn" data-action="export" title="Exportar">\u2B07</button>
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
      _canvasEl = _containerEl.querySelector(".dsd-chart-panel__canvas");
      _containerEl.querySelector('[data-action="refresh"]')?.addEventListener("click", () => {
        this.refresh();
      });
      _containerEl.querySelector('[data-action="export"]')?.addEventListener("click", () => {
        this.export("png");
      });
      _resource = createCanvasResource(_canvasEl, {
        onDispose: () => {
          _canvasEl = null;
          _chartInstance = null;
        }
      });
      await _resource.load(async () => {
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
        cancelAnimationFrame(_animationId);
        _animationId = null;
      }
      _resource?.pause?.();
    },
    resume() {
      _resource?.resume?.();
      if (_chartInstance?.options) {
        _renderChart();
      }
    },
    async destroy() {
      if (_animationId) cancelAnimationFrame(_animationId);
      await _resource?.dispose?.();
      if (_containerEl) _containerEl.innerHTML = "";
      _canvasEl = null;
      _chartInstance = null;
      _containerEl = null;
    },
    resize(dimensions) {
      if (_canvasEl && dimensions) {
        _canvasEl.width = dimensions.width;
        _canvasEl.height = dimensions.height;
        _renderChart();
      }
    },
    async export(format = "png") {
      if (!_canvasEl) return null;
      if (format === "png" || format === "jpeg") {
        return _canvasEl.toDataURL(`image/${format}`);
      }
      if (format === "json") {
        return JSON.stringify(_currentData);
      }
      return null;
    },
    healthCheck() {
      return {
        status: _canvasEl ? "HEALTHY" : "NOT_INITIALIZED",
        hasCanvas: !!_canvasEl,
        chartType: type,
        dataPoints: _currentData.labels?.length || 0,
        resource: _resource?.healthCheck?.() || null
      };
    }
  };
  function _renderChart() {
    if (!_canvasEl) return;
    const ctx = _canvasEl.getContext("2d");
    const width = _canvasEl.width || _canvasEl.offsetWidth || 400;
    const height = _canvasEl.height || _canvasEl.offsetHeight || 300;
    _canvasEl.width = width;
    _canvasEl.height = height;
    ctx.clearRect(0, 0, width, height);
    switch (type) {
      case CHART_TYPES.LINE:
        _renderLineChart(ctx, width, height);
        break;
      case CHART_TYPES.BAR:
        _renderBarChart(ctx, width, height);
        break;
      case CHART_TYPES.PIE:
      case CHART_TYPES.DOUGHNUT:
        _renderPieChart(ctx, width, height, type === CHART_TYPES.DOUGHNUT);
        break;
      default:
        _renderLineChart(ctx, width, height);
    }
  }
  function _renderLineChart(ctx, width, height) {
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    if (!_currentData.datasets?.length) return;
    _currentData.datasets.forEach((dataset, di) => {
      const dsData = dataset.data || [];
      if (dsData.length < 2) return;
      const maxVal = Math.max(...dsData, 1);
      const minVal = Math.min(...dsData, 0);
      const range = maxVal - minVal || 1;
      ctx.beginPath();
      ctx.strokeStyle = dataset.borderColor || `hsl(${di * 60}, 70%, 50%)`;
      ctx.lineWidth = 2;
      dsData.forEach((val, i) => {
        const x = padding + i / (dsData.length - 1) * chartWidth;
        const y = padding + chartHeight - (val - minVal) / range * chartHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
  }
  function _renderBarChart(ctx, width, height) {
    const padding = 40;
    const chartHeight = height - padding * 2;
    if (!_currentData.datasets?.length) return;
    const datasets = _currentData.datasets;
    const dataset = datasets[0];
    const barData = dataset.data || [];
    const labels = _currentData.labels || [];
    if (barData.length === 0) return;
    const maxVal = Math.max(...barData, 1);
    const barWidth = (width - padding * 2) / barData.length * 0.8;
    const gap = (width - padding * 2) / barData.length * 0.2;
    ctx.fillStyle = dataset.backgroundColor || "rgba(59, 130, 246, 0.8)";
    barData.forEach((val, i) => {
      const barHeight = val / maxVal * chartHeight;
      const x = padding + i * (barWidth + gap) + gap / 2;
      const y = height - padding - barHeight;
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  }
  function _renderPieChart(ctx, width, height, isDoughnut) {
    if (!_currentData.datasets?.length) return;
    const pieDatasets = _currentData.datasets;
    const pieDataset = pieDatasets[0];
    const pieData = pieDataset.data || [];
    if (pieData.length === 0) return;
    const total = pieData.reduce((a, b) => a + b, 0) || 1;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const innerRadius = isDoughnut ? radius * 0.6 : 0;
    let startAngle = -Math.PI / 2;
    pieData.forEach((val, i) => {
      const sliceAngle = val / total * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      const colors = pieDataset.backgroundColor || [];
      ctx.fillStyle = colors[i] || `hsl(${i * 45}, 70%, 50%)`;
      ctx.fill();
      startAngle = endAngle;
    });
    if (isDoughnut) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#1a1a2e";
      ctx.fill();
    }
  }
  function _showLoading(show) {
    const el = _containerEl?.querySelector(".dsd-chart-panel__loading");
    if (el) el.hidden = !show;
  }
  const panel = createPanel(panelConfig, implementation);
  return {
    ...panel.getComponent(),
    setData(newData) {
      _currentData = newData;
      _renderChart();
    },
    getData() {
      return { ..._currentData };
    },
    addDataPoint(label, values) {
      _currentData.labels = _currentData.labels || [];
      _currentData.labels.push(label);
      (_currentData.datasets || [])?.forEach((dataset, i) => {
        dataset.data = dataset.data || [];
        dataset.data.push(values[i] || 0);
      });
      _renderChart();
    },
    getCanvas() {
      return _canvasEl;
    }
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    chartTypes: Object.keys(CHART_TYPES)
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID
  };
}
var chart_panel_default = {
  VERSION,
  MODULE_ID,
  CHART_TYPES,
  createChartPanel,
  info,
  healthCheck
};
export {
  CHART_TYPES,
  MODULE_ID,
  VERSION,
  createChartPanel,
  chart_panel_default as default,
  healthCheck,
  info
};
