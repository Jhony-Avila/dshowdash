import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { CONFIG } from "./dashboard-config.js";
const VERSION = "1.1.0-P17WI";
const MODULE_ID = "router.analytics.chart-renderer";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
class ChartRenderer {
  canvas;
  ctx;
  // @ts-expect-error strict migration — TS2322
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }
  drawLineChart(data, options = {}) {
    const { ctx, canvas } = this;
    const { label = "", color = CONFIG.colors.primary, maxValue = null } = options;
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    ctx.fillStyle = CONFIG.colors.background;
    ctx.fillRect(0, 0, width, height);
    if (data.length === 0) {
      ctx.fillStyle = CONFIG.colors.textMuted;
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Aguardando dados...", width / 2, height / 2);
      return;
    }
    const max = maxValue || Math.max(...data, 1);
    const min = 0;
    ctx.strokeStyle = CONFIG.colors.surface;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + chartHeight / 4 * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      ctx.fillStyle = CONFIG.colors.textMuted;
      ctx.font = "10px system-ui";
      ctx.textAlign = "right";
      const value = max - max / 4 * i;
      ctx.fillText(value.toFixed(1), padding - 5, y + 3);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((value, index) => {
      const x = padding + chartWidth / (data.length - 1 || 1) * index;
      const y = padding + chartHeight - (value - min) / (max - min || 1) * chartHeight;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.closePath();
    ctx.fillStyle = `${color}20`;
    ctx.fill();
    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(label, padding, 20);
    if (data.length > 0) {
      const currentValue = data[data.length - 1];
      ctx.textAlign = "right";
      ctx.fillText(currentValue.toFixed(2), width - padding, 20);
    }
  }
  drawBarChart(data, options = {}) {
    const { ctx, canvas } = this;
    const { labels = [], color = CONFIG.colors.primary, title = "" } = options;
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    ctx.fillStyle = CONFIG.colors.background;
    ctx.fillRect(0, 0, width, height);
    if (data.length === 0) {
      ctx.fillStyle = CONFIG.colors.textMuted;
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Sem dados", width / 2, height / 2);
      return;
    }
    const max = Math.max(...data, 1);
    const barWidth = chartWidth / data.length - 10;
    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(title, padding, 20);
    data.forEach((value, index) => {
      const x = padding + chartWidth / data.length * index + 5;
      const barHeight = value / max * chartHeight;
      const y = padding + chartHeight - barHeight;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);
      ctx.fillStyle = CONFIG.colors.text;
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
      if (labels[index]) {
        ctx.fillStyle = CONFIG.colors.textMuted;
        ctx.font = "9px system-ui";
        ctx.fillText(labels[index].substring(0, 8), x + barWidth / 2, height - 5);
      }
    });
  }
  drawGauge(value, options = {}) {
    const { ctx, canvas } = this;
    const { label = "", max = 100, thresholds = { warning: 60, danger: 80 } } = options;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2 + 20;
    const radius = Math.min(width, height) / 2 - 30;
    ctx.fillStyle = CONFIG.colors.background;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = CONFIG.colors.surface;
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.stroke();
    const percentage = Math.min(value / max, 1);
    let color = CONFIG.colors.success;
    if (value >= thresholds.danger) color = CONFIG.colors.danger;
    else if (value >= thresholds.warning) color = CONFIG.colors.warning;
    ctx.strokeStyle = color;
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + percentage * Math.PI);
    ctx.stroke();
    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = "bold 24px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(value.toFixed(1), centerX, centerY);
    ctx.fillStyle = CONFIG.colors.textMuted;
    ctx.font = "12px system-ui";
    ctx.fillText(label, centerX, centerY + 25);
  }
  clear() {
    const { ctx, canvas } = this;
    ctx.fillStyle = CONFIG.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
function createChartRenderer(canvas) {
  return new ChartRenderer(canvas);
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
}
export {
  ChartRenderer,
  MODULE_ID,
  VERSION,
  createChartRenderer,
  getPorts,
  healthCheck,
  injectPorts
};
