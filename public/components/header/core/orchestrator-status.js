import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { HEADER_EVENTS } from "/core/runtime/events/catalog/header.events.js";
const VERSION = "2.5.0-ES6";
const MODULE_ID = "header.core.orchestrator-status";
const hasWindow = typeof window !== "undefined";
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
function _debugEnabled() {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug || false;
}
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) {
    logger.error.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "warn" && logger.warn) {
    logger.warn.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "info" && logger.info) {
    logger.info.apply(logger, [prefix].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug.apply(logger, [prefix].concat(args));
}
function OrchestratorStatus(header) {
  this.header = header;
  this.container = null;
  this.status = "unknown";
  this.eventCleanups = [];
  this.presetName = "default";
  this._debug = false;
  this._metrics = { initCount: 0, statusChanges: 0, presetChanges: 0, lastStatusAt: null, lastPresetAt: null };
  this._isInitialized = false;
  this._isDestroyed = false;
}
OrchestratorStatus.prototype.init = function() {
  if (this._isDestroyed) {
    _log("warn", "OrchestratorStatus destru\xEDdo - init ignorado");
    return;
  }
  if (this._isInitialized) {
    _log("warn", "OrchestratorStatus j\xE1 inicializado");
    return;
  }
  this._metrics.initCount++;
  this._createUI();
  this._setupEventListeners();
  this._syncInitialStatus();
  this._isInitialized = true;
  _log("info", "OrchestratorStatus initialized");
};
OrchestratorStatus.prototype._createUI = function() {
  const statusTray = this.header && this.header.elements ? this.header.elements.statusTray : null;
  if (!statusTray) {
    _log("warn", "Status tray not found, skipping orchestrator indicator");
    return;
  }
  this.container = document.createElement("div");
  this.container.className = "header-orchestrator-status";
  this.container.setAttribute("role", "status");
  this.container.setAttribute("aria-live", "polite");
  this.container.setAttribute("data-tooltip", "Status do Orchestrator");
  this.container.innerHTML = '<span class="header-orchestrator-icon">\u{1F39B}\uFE0F</span><span class="header-orchestrator-dot header-orchestrator-dot--unknown"></span><span class="header-orchestrator-preset">default</span>';
  statusTray.appendChild(this.container);
  _log("debug", "Orchestrator status UI created");
};
OrchestratorStatus.prototype._setupEventListeners = function() {
  const self = this;
  const eventBus = _getPort("eventBus");
  if (!eventBus) {
    _log("warn", "EventBus n\xE3o dispon\xEDvel");
    return;
  }
  const handlers = { "orchestrator:preset:applied": function(data) {
    self._updatePreset(data && data.presetId ? data.presetId : "unknown");
    self._setStatus("healthy");
  }, "orchestrator:health:healthy": function() {
    self._setStatus("healthy");
  }, "orchestrator:health:degraded": function() {
    self._setStatus("degraded");
  }, "orchestrator:module:failed": function() {
    self._setStatus("error");
  }, "main:orchestrator:initialized": function() {
    self._setStatus("healthy");
  }, "main:orchestrator:error": function() {
    self._setStatus("error");
  } };
  Object.keys(handlers).forEach((event) => {
    const handler = handlers[event];
    eventBus.on(event, handler);
    self.eventCleanups.push(() => {
      eventBus.off(event, handler);
    });
  });
  _log("debug", `${Object.keys(handlers).length} event listeners registrados`);
};
OrchestratorStatus.prototype._syncInitialStatus = function() {
  if (hasWindow && window.Orchestrator && window.Orchestrator.getSnapshot) {
    const snapshot = window.Orchestrator.getSnapshot();
    if (snapshot) {
      this._updatePreset(snapshot.currentPreset || "default");
      this._setStatus("healthy");
      return;
    }
  }
  if (hasWindow && window.Main && window.Main.getOrchestratorStatus) {
    const status = window.Main.getOrchestratorStatus();
    if (status) {
      this._updatePreset(status.currentPreset || "default");
      this._setStatus(status.health && status.health.status ? status.health.status : "unknown");
    }
  }
};
OrchestratorStatus.prototype._setStatus = function(status) {
  if (!this.container || this._isDestroyed) return;
  if (this.status !== status) {
    this._metrics.statusChanges++;
    this._metrics.lastStatusAt = Date.now();
  }
  this.status = status;
  const dot = this.container.querySelector(".header-orchestrator-dot");
  if (dot) dot.className = `header-orchestrator-dot header-orchestrator-dot--${status}`;
  const tooltipMap = { healthy: "Orchestrator ativo", degraded: "Orchestrator em modo degradado", error: "Orchestrator com erro", unknown: "Orchestrator - status desconhecido" };
  this.container.setAttribute("data-tooltip", tooltipMap[status] || "Orchestrator");
  _log("debug", "Orchestrator status updated", { status });
  if (this.header && this.header.telemetry) this.header.telemetry.track(HEADER_EVENTS.ORCHESTRATOR_STATUS_CHANGED, { status });
};
OrchestratorStatus.prototype._updatePreset = function(presetId) {
  if (!this.container || this._isDestroyed) return;
  if (this.presetName !== presetId) {
    this._metrics.presetChanges++;
    this._metrics.lastPresetAt = Date.now();
  }
  this.presetName = presetId;
  const presetEl = this.container.querySelector(".header-orchestrator-preset");
  if (presetEl) presetEl.textContent = presetId;
  _log("debug", "Orchestrator preset updated", { presetId });
};
OrchestratorStatus.prototype.getStatus = function() {
  return this.status;
};
OrchestratorStatus.prototype.getPreset = function() {
  return this.presetName;
};
OrchestratorStatus.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics, { currentStatus: this.status, currentPreset: this.presetName, isInitialized: this._isInitialized, isDestroyed: this._isDestroyed });
};
OrchestratorStatus.prototype.resetMetrics = function() {
  this._metrics = { initCount: 0, statusChanges: 0, presetChanges: 0, lastStatusAt: null, lastPresetAt: null };
};
OrchestratorStatus.prototype.healthCheck = function() {
  const checks = { notDestroyed: !this._isDestroyed, isInitialized: this._isInitialized, hasContainer: !!this.container, hasHeader: !!this.header, statusKnown: this.status !== "unknown" || !this._isInitialized, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 4 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, orchestratorStatus: this.status, preset: this.presetName, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
OrchestratorStatus.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, status: this.status, preset: this.presetName, metrics: this.getMetrics(), portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
};
OrchestratorStatus.prototype.setDebug = function(enabled) {
  this._debug = !!enabled;
};
OrchestratorStatus.prototype.destroy = function() {
  if (this._isDestroyed) {
    _log("warn", "OrchestratorStatus j\xE1 destru\xEDdo");
    return;
  }
  this.eventCleanups.forEach((cleanup) => {
    try {
      cleanup();
    } catch (e) {
      _log("error", "Erro no cleanup:", e.message);
    }
  });
  this.eventCleanups = [];
  if (this.container) {
    this.container.remove();
    this.container = null;
  }
  this._isDestroyed = true;
  this._isInitialized = false;
  _log("info", "OrchestratorStatus destru\xEDdo");
};
function getVersion() {
  return VERSION;
}
var orchestrator_status_default = OrchestratorStatus;
export {
  MODULE_ID,
  OrchestratorStatus,
  VERSION,
  orchestrator_status_default as default,
  getPorts,
  getVersion,
  injectPorts
};
