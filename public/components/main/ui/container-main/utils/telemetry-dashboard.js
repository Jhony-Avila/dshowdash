import { createLogger } from "./logger.js";
import { getEnv, ENV } from "../config.js";
const VERSION = "1.0.0-PHASE5";
const MODULE_ID = "container-main:telemetry-dashboard";
function createTelemetryDashboard(options = {}) {
  const {
    position = "top-right",
    updateInterval = 1e3,
    theme = "dark",
    maxDataPoints = 60,
    autoHideInProduction = true
  } = options;
  const _logger = createLogger(MODULE_ID);
  let _container = null;
  let _bootstrap = null;
  let _eventBus = null;
  let _updateTimer = null;
  let _isVisible = false;
  let _metrics = { memory: [], fps: [], events: 0, errors: 0 };
  let _startTime = Date.now();
  const STYLES = `
    .cm-telemetry {
      position: fixed;
      z-index: 99998;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 11px;
      background: ${theme === "dark" ? "rgba(30,30,30,0.95)" : "rgba(245,245,245,0.95)"};
      color: ${theme === "dark" ? "#d4d4d4" : "#333"};
      border: 1px solid ${theme === "dark" ? "#444" : "#ccc"};
      border-radius: 8px;
      padding: 12px;
      min-width: 280px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .cm-telemetry.top-right { top: 80px; right: 20px; }
    .cm-telemetry.top-left { top: 80px; left: 20px; }
    .cm-telemetry.bottom-right { bottom: 80px; right: 20px; }
    .cm-telemetry.bottom-left { bottom: 80px; left: 20px; }
    .cm-telemetry-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid ${theme === "dark" ? "#444" : "#ddd"};
    }
    .cm-telemetry-title { font-weight: bold; font-size: 12px; }
    .cm-telemetry-close {
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      background: ${theme === "dark" ? "#444" : "#ddd"};
    }
    .cm-telemetry-close:hover { background: ${theme === "dark" ? "#555" : "#ccc"}; }
    .cm-telemetry-section { margin-bottom: 12px; }
    .cm-telemetry-label {
      font-size: 10px;
      text-transform: uppercase;
      color: ${theme === "dark" ? "#888" : "#666"};
      margin-bottom: 4px;
    }
    .cm-telemetry-value {
      font-size: 18px;
      font-weight: bold;
      color: ${theme === "dark" ? "#4fc3f7" : "#0066cc"};
    }
    .cm-telemetry-value.warning { color: #ffc107; }
    .cm-telemetry-value.error { color: #dc3545; }
    .cm-telemetry-value.success { color: #28a745; }
    .cm-telemetry-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .cm-telemetry-chart {
      height: 40px;
      background: ${theme === "dark" ? "#252525" : "#eee"};
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      align-items: flex-end;
    }
    .cm-telemetry-bar {
      flex: 1;
      background: #4fc3f7;
      margin: 0 1px;
      min-height: 2px;
      transition: height 0.2s;
    }
    .cm-telemetry-bar.warning { background: #ffc107; }
    .cm-telemetry-bar.error { background: #dc3545; }
    .cm-telemetry-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .cm-telemetry-status {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
    }
    .cm-telemetry-status.healthy { background: #28a745; }
    .cm-telemetry-status.warning { background: #ffc107; }
    .cm-telemetry-status.error { background: #dc3545; }
  `;
  function _collectMetrics() {
    const perfMonitor = _bootstrap?.getPerformanceMonitor();
    const snapshot = perfMonitor?.collect?.() || {};
    const memoryMB = snapshot.memory?.usedMB || 0;
    _metrics.memory.push(memoryMB);
    if (_metrics.memory.length > Number(maxDataPoints)) _metrics.memory.shift();
    const fps = snapshot.fps?.current || 60;
    _metrics.fps.push(fps);
    if (_metrics.fps.length > Number(maxDataPoints)) _metrics.fps.shift();
    return { memoryMB, fps, snapshot };
  }
  function _renderChart(data, max, warningThreshold = 0.7, errorThreshold = 0.9) {
    return data.map((value) => {
      const height = Math.min(100, value / max * 100);
      const ratio = value / max;
      let barClass = "";
      if (ratio > errorThreshold) barClass = "error";
      else if (ratio > warningThreshold) barClass = "warning";
      return `<div class="cm-telemetry-bar ${barClass}" style="height: ${height}%"></div>`;
    }).join("");
  }
  function _render() {
    if (!_container || !_isVisible) return;
    const { memoryMB, fps } = _collectMetrics();
    const uptime = Math.floor((Date.now() - _startTime) / 1e3);
    const errors = _bootstrap?.getErrors()?.length || 0;
    const state = _bootstrap?.getState() || "unknown";
    const memoryMax = 500;
    const memoryPercent = memoryMB / memoryMax * 100;
    const memoryClass = memoryPercent > 90 ? "error" : memoryPercent > 70 ? "warning" : "";
    const fpsClass = fps < 30 ? "error" : fps < 50 ? "warning" : "success";
    const statusClass = state === "running" ? "healthy" : state === "error" ? "error" : "warning";
    _container.innerHTML = `
      <div class="cm-telemetry-header">
        <span class="cm-telemetry-title">\u{1F4CA} Telemetry</span>
        <span class="cm-telemetry-close" onclick="window.__cmTelemetry.hide()">\u2715</span>
      </div>
      
      <div class="cm-telemetry-section">
        <div class="cm-telemetry-row">
          <span><span class="cm-telemetry-status ${statusClass}"></span>Status</span>
          <span style="text-transform: uppercase; font-weight: bold;">${state}</span>
        </div>
        <div class="cm-telemetry-row">
          <span>Uptime</span>
          <span>${Math.floor(uptime / 60)}m ${uptime % 60}s</span>
        </div>
        <div class="cm-telemetry-row">
          <span>Errors</span>
          <span class="${errors > 0 ? "cm-telemetry-value error" : ""}">${errors}</span>
        </div>
      </div>
      
      <div class="cm-telemetry-grid">
        <div class="cm-telemetry-section">
          <div class="cm-telemetry-label">Memory</div>
          <div class="cm-telemetry-value ${memoryClass}">${memoryMB.toFixed(1)} MB</div>
          <div class="cm-telemetry-chart">${_renderChart(_metrics.memory, memoryMax)}</div>
        </div>
        
        <div class="cm-telemetry-section">
          <div class="cm-telemetry-label">FPS</div>
          <div class="cm-telemetry-value ${fpsClass}">${fps}</div>
          <div class="cm-telemetry-chart">${_renderChart(_metrics.fps.map((f) => 60 - f), 60, 0.3, 0.5)}</div>
        </div>
      </div>
      
      <div class="cm-telemetry-section">
        <div class="cm-telemetry-label">Boot Metrics</div>
        <div class="cm-telemetry-row">
          <span>Boot Time</span>
          <span>${_bootstrap?.getBootMetrics()?.getTotalTime?.()?.toFixed?.(0) || "N/A"}ms</span>
        </div>
        <div class="cm-telemetry-row">
          <span>Rating</span>
          <span>${_bootstrap?.getBootMetrics()?.getPerformanceRating?.() || "N/A"}</span>
        </div>
      </div>

      <div class="cm-telemetry-section">
        <div class="cm-telemetry-label">Resources</div>
        <div class="cm-telemetry-row">
          <span>Managers</span>
          <span>${_bootstrap?.getKernel()?.listManagers?.()?.length || 0}</span>
        </div>
        <div class="cm-telemetry-row">
          <span>Plugins</span>
          <span>${_bootstrap?.getPluginSystem()?.listActive?.()?.length || 0}</span>
        </div>
        <div class="cm-telemetry-row">
          <span>Snapshots</span>
          <span>${_bootstrap?.getStateSnapshots()?.count?.() || 0}</span>
        </div>
      </div>
    `;
  }
  function _init() {
    if (typeof document === "undefined") return;
    if (autoHideInProduction && getEnv() === ENV.PRODUCTION) return;
    const styleEl = document.createElement("style");
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
    _container = document.createElement("div");
    _container.className = `cm-telemetry ${position}`;
    _container.style.display = "none";
    document.body.appendChild(_container);
    _logger.info("Telemetry dashboard initialized");
  }
  const dashboard = {
    // Injeta dependências
    inject({ bootstrap, eventBus }) {
      _bootstrap = bootstrap;
      _eventBus = eventBus;
      _startTime = Date.now();
      if (_eventBus) {
        _eventBus.on("bootstrap:error", () => _metrics.errors++);
        _eventBus.on("*", () => _metrics.events++);
      }
    },
    // Mostra
    show() {
      if (!_container) _init();
      if (!_container) return;
      _isVisible = true;
      _container.style.display = "block";
      _render();
      if (!_updateTimer) {
        _updateTimer = setInterval(() => _render(), Number(updateInterval));
      }
    },
    // Esconde
    hide() {
      _isVisible = false;
      if (_container) _container.style.display = "none";
      if (_updateTimer) {
        clearInterval(_updateTimer);
        _updateTimer = null;
      }
    },
    // Toggle
    toggle() {
      if (_isVisible) this.hide();
      else this.show();
    },
    // Obtém métricas
    getMetrics() {
      return {
        memory: [..._metrics.memory],
        fps: [..._metrics.fps],
        events: _metrics.events,
        errors: _metrics.errors,
        uptime: Date.now() - _startTime
      };
    },
    // Reset métricas
    resetMetrics() {
      _metrics = { memory: [], fps: [], events: 0, errors: 0 };
      _startTime = Date.now();
    },
    // Health check
    healthCheck() {
      return {
        status: "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        visible: _isVisible,
        dataPoints: _metrics.memory.length
      };
    },
    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        position,
        updateInterval,
        maxDataPoints
      };
    },
    // Destroy
    destroy() {
      this.hide();
      if (_container) {
        _container.remove();
        _container = null;
      }
    }
  };
  if (typeof window !== "undefined") {
    window.__cmTelemetry = dashboard;
  }
  _init();
  return dashboard;
}
let _instance = null;
function getTelemetryDashboard(options = {}) {
  if (!_instance) {
    _instance = createTelemetryDashboard(options);
  }
  return _instance;
}
function resetTelemetryDashboard() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var telemetry_dashboard_default = {
  VERSION,
  MODULE_ID,
  createTelemetryDashboard,
  getTelemetryDashboard,
  resetTelemetryDashboard,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  createTelemetryDashboard,
  telemetry_dashboard_default as default,
  getTelemetryDashboard,
  healthCheck,
  info,
  resetTelemetryDashboard
};
