import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
const MODULE_ID = "connection-status";
const VERSION = "1.3.1-P18EC";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const TOKENS = {
  size: 30,
  colors: {
    excellent: "#22c55e",
    good: "#84cc16",
    fair: "#f59e0b",
    poor: "#ef4444",
    offline: "#6b7280",
    inactive: "#374151"
  },
  thresholds: {
    excellent: 100,
    good: 300,
    fair: 500,
    poor: Infinity
  }
};
const STYLES = `.cs-container {    display: flex;    align-items: center;    justify-content: center;    width: ${TOKENS.size}px;    height: ${TOKENS.size}px;    border-radius: 50%;    cursor: pointer;    transition: background-color 0.2s ease, box-shadow 0.3s ease;    position: relative;}.cs-container:hover {    background: rgba(139, 92, 246, 0.08);}.cs-icon {    width: 16px;    height: 16px;    transition: filter 0.3s ease;}.cs-icon path {    transition: fill 0.3s ease, opacity 0.3s ease;}.cs-glow {    position: absolute;    inset: 0;    border-radius: 50%;    opacity: 0;    transition: opacity 0.5s ease;    pointer-events: none;}.cs-container[data-status="excellent"] .cs-glow {    box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);    opacity: 1;}.cs-container[data-status="good"] .cs-glow {    box-shadow: 0 0 10px rgba(132, 204, 22, 0.35);    opacity: 1;}.cs-container[data-status="fair"] .cs-glow {    box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);    opacity: 1;}.cs-container[data-status="poor"] .cs-glow {    box-shadow: 0 0 8px rgba(239, 68, 68, 0.35);    opacity: 1;}.cs-container[data-status="offline"] .cs-glow {    opacity: 0;}.cs-tooltip {    position: absolute;    bottom: calc(100% + 8px);    left: 50%;    transform: translateX(-50%);    background: #1f2937;    color: #f3f4f6;    padding: 6px 10px;    border-radius: 6px;    font-size: 11px;    font-weight: 500;    white-space: nowrap;    opacity: 0;    visibility: hidden;    transition: opacity 0.2s ease, visibility 0.2s ease;    pointer-events: none;    z-index: 1000;    box-shadow: 0 4px 12px rgba(0,0,0,0.3);}.cs-tooltip::after {    content: "";    position: absolute;    top: 100%;    left: 50%;    transform: translateX(-50%);    border: 5px solid transparent;    border-top-color: #1f2937;}.cs-container:hover .cs-tooltip {    opacity: 1;    visibility: visible;}`;
let stylesInjected = false;
function ConnectionStatus(config) {
  this._config = Object.assign({}, TOKENS, config || {});
  this._container = null;
  this._elements = {};
  this._mounted = false;
  this._currentStatus = "offline";
  this._currentLatency = null;
  this._checkInterval = null;
  this._instanceId = `cs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}
ConnectionStatus.prototype._injectStyles = () => {
  if (stylesInjected) return;
  const style = document.createElement("style");
  style.id = "connection-status-styles";
  style.textContent = STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
};
ConnectionStatus.prototype.mount = function(container) {
  if (this._mounted) return this;
  _initPorts();
  this._injectStyles();
  this._container = container;
  this._render();
  this._mounted = true;
  this._startMonitoring();
  return this;
};
ConnectionStatus.prototype._render = function() {
  const self = this;
  const wrapper = document.createElement("div");
  wrapper.className = "cs-container";
  wrapper.id = this._instanceId;
  wrapper.setAttribute("data-status", "offline");
  wrapper.setAttribute("role", "status");
  wrapper.setAttribute("aria-label", "Status de conex\xE3o");
  wrapper.innerHTML = `        <div class="cs-glow"></div>        <svg class="cs-icon" viewBox="0 0 510.875 510.875" xmlns="http://www.w3.org/2000/svg">            <path class="cs-arc cs-arc-3" d="M434.975,219.174c-98.952-98.952-259.373-98.952-358.325,0c-17.242,17.242-45.728,17.242-63.719,0c-17.242-17.242-17.242-45.728,0-63.719c134.184-134.184,351.578-134.184,485.013,0c17.242,17.242,17.242,45.728,0,63.719C481.452,236.416,452.966,236.416,434.975,219.174z" fill="${TOKENS.colors.inactive}"/>            <path class="cs-arc cs-arc-2" d="M334.524,319.625c-43.479-43.479-113.195-43.479-156.674,0c-17.242,17.242-45.728,17.242-63.719,0c-17.242-17.242-17.242-45.728,0-63.719c77.962-77.962,205.4-77.962,283.362,0c17.242,17.242,17.242,45.728,0,63.719C380.252,337.616,351.766,337.616,334.524,319.625z" fill="${TOKENS.colors.inactive}"/>            <path class="cs-arc cs-arc-1" d="M315.034,396.088c0,32.984-26.987,59.971-59.971,59.971s-59.971-26.987-59.971-59.971s26.987-59.971,59.971-59.971S315.034,363.104,315.034,396.088z" fill="${TOKENS.colors.inactive}"/>        </svg>        <div class="cs-tooltip">Verificando conex\xE3o...</div>    `;
  this._container.appendChild(wrapper);
  wrapper.addEventListener("click", () => {
    const eventBus = _getPort("eventBus");
    if (eventBus && eventBus.emit) {
      eventBus.emit(UI_EVENTS.ACTION, {
        actionId: "footer:wifi",
        source: MODULE_ID,
        timestamp: Date.now(),
        kind: "navigation",
        meta: { label: "WiFi Status", status: self._currentStatus, latency: self._currentLatency }
      });
    }
  });
  this._elements = {
    wrapper,
    arc1: wrapper.querySelector(".cs-arc-1"),
    arc2: wrapper.querySelector(".cs-arc-2"),
    arc3: wrapper.querySelector(".cs-arc-3"),
    tooltip: wrapper.querySelector(".cs-tooltip")
  };
};
ConnectionStatus.prototype._startMonitoring = function() {
  const self = this;
  this._checkConnection();
  this._checkInterval = setInterval(() => {
    self._checkConnection();
  }, 3e4);
};
ConnectionStatus.prototype._checkConnection = function() {
  const self = this;
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 5e3);
  fetch("/api/metrics/server.php", {
    method: "HEAD",
    cache: "no-store",
    signal: controller.signal
  }).then((response) => {
    clearTimeout(timeoutId);
    if (response.ok) {
      const latency = Math.round(performance.now() - startTime);
      self._updateStatus(latency);
    } else {
      self._setOffline();
    }
  }).catch((error) => {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      self._updateStatus(5e3);
    } else {
      self._setOffline();
    }
  });
};
ConnectionStatus.prototype._updateStatus = function(latency) {
  this._currentLatency = latency;
  const thresholds = this._config.thresholds;
  const colors = this._config.colors;
  let status, color, arcsActive;
  if (latency < thresholds.excellent) {
    status = "excellent";
    color = colors.excellent;
    arcsActive = 3;
  } else if (latency < thresholds.good) {
    status = "good";
    color = colors.good;
    arcsActive = 2;
  } else if (latency < thresholds.fair) {
    status = "fair";
    color = colors.fair;
    arcsActive = 1;
  } else {
    status = "poor";
    color = colors.poor;
    arcsActive = 1;
  }
  this._currentStatus = status;
  this._applyVisualState(color, arcsActive, status, latency);
};
ConnectionStatus.prototype._applyVisualState = function(color, arcsActive, status, latency) {
  const els = this._elements;
  const colors = this._config.colors;
  els.arc1.setAttribute("fill", color);
  els.arc2.setAttribute("fill", arcsActive >= 2 ? color : colors.inactive);
  els.arc2.style.opacity = arcsActive >= 2 ? "1" : "0.3";
  els.arc3.setAttribute("fill", arcsActive >= 3 ? color : colors.inactive);
  els.arc3.style.opacity = arcsActive >= 3 ? "1" : "0.3";
  els.wrapper.setAttribute("data-status", status);
  const statusText = { excellent: "Excelente", good: "Bom", fair: "Regular", poor: "Ruim" };
  els.tooltip.textContent = `${statusText[status]} \u2022 ${latency}ms`;
};
ConnectionStatus.prototype._setOffline = function() {
  this._currentStatus = "offline";
  this._currentLatency = null;
  const els = this._elements;
  const colors = this._config.colors;
  els.arc1.setAttribute("fill", colors.offline);
  els.arc2.setAttribute("fill", colors.inactive);
  els.arc2.style.opacity = "0.3";
  els.arc3.setAttribute("fill", colors.inactive);
  els.arc3.style.opacity = "0.3";
  els.wrapper.setAttribute("data-status", "offline");
  els.tooltip.textContent = "Sem conex\xE3o";
};
ConnectionStatus.prototype.checkNow = function() {
  this._checkConnection();
  return this;
};
ConnectionStatus.prototype.unmount = function() {
  if (!this._mounted) return;
  if (this._checkInterval) {
    clearInterval(this._checkInterval);
    this._checkInterval = null;
  }
  if (this._elements.wrapper) {
    this._elements.wrapper.remove();
  }
  this._mounted = false;
  this._elements = {};
};
ConnectionStatus.prototype.info = function() {
  const portsSnapshot = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, instanceId: this._instanceId, mounted: this._mounted, status: this._currentStatus, latency: this._currentLatency, config: this._config, portsInitialized: portsSnapshot._initialized };
};
ConnectionStatus.prototype.healthCheck = function() {
  const portsSnapshot = Ports.snapshot();
  return { healthy: this._mounted && this._elements.wrapper !== null, status: this._currentStatus, latency: this._currentLatency, monitoring: this._checkInterval !== null, portsInitialized: portsSnapshot._initialized };
};
function createConnectionStatus(config) {
  return new ConnectionStatus(config);
}
var connection_status_default = ConnectionStatus;
export {
  ConnectionStatus,
  MODULE_ID,
  VERSION,
  createConnectionStatus,
  connection_status_default as default,
  getPorts,
  injectPorts
};
