import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { BOOT_EVENTS } from "/core/runtime/events/catalog/boot.events.js";
const VERSION = "5.2.0-P2-ENTERPRISE";
const MODULE_ID = "preloader-progress";
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
const PROGRESS_EVENTS = {
  START: "boot:progress:start",
  PHASE_START: "boot:progress:phase:start",
  PHASE_COMPLETE: "boot:progress:phase:complete",
  COMPLETE: "boot:progress:complete"
};
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
function _getLogger() {
  const portLogger = _getPort("logger");
  if (portLogger) return portLogger;
  if (hasWindow && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get("Logger");
    if (waLogger) return waLogger;
  }
  return null;
}
function _getEventBusStrict() {
  const portEventBus = _getPort("eventBus");
  if (portEventBus) return portEventBus;
  if (hasWindow && window.Core?.windowAdapter?.get) {
    const waEventBus = window.Core.windowAdapter.get("EventBus");
    if (waEventBus) return waEventBus;
  }
  return null;
}
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return hasWindow && cfg && cfg.app && cfg.app.debug === true;
};
const _log = function(level, ...rest) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getLogger();
  if (!logger) return;
  if (level === "error") {
    if (logger.error) logger.error(...[`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...[`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(...[`[${MODULE_ID}]`].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(...[`[${MODULE_ID}]`].concat(args));
};
const _moduleMetrics = {
  instancesCreated: 0,
  totalStarts: 0,
  totalStops: 0,
  totalFinalizes: 0,
  // v5.0.0: Novas métricas Enterprise
  bootstrapEventsReceived: 0,
  phaseStartEvents: 0,
  phaseCompleteEvents: 0,
  progressCompleteEvents: 0
};
function _emitComponentsReady(detail) {
  try {
    const eventBus = _getEventBusStrict();
    if (eventBus && eventBus.emit) {
      eventBus.emit(BOOT_EVENTS.COMPONENTS_READY, Object.assign({}, detail, {
        source: MODULE_ID,
        version: VERSION
      }));
      _log("info", "BOOT_EVENTS.COMPONENTS_READY emitted via EventBus");
    } else {
      _log("warn", "EventBus not available via Ports - COMPONENTS_READY not emitted");
    }
  } catch (e) {
    _log("warn", "Failed to emit BOOT_EVENTS.COMPONENTS_READY", { error: e.message });
  }
}
function ProgressMonitor(state) {
  this.state = state;
  this.done = false;
  this.cachedBar = null;
  this.cachedPercentage = null;
  this._startedAt = null;
  this._stoppedAt = null;
  this._eventCleanups = [];
  this._bootstrapConnected = false;
  this._metrics = {
    uiUpdateCount: 0,
    lastProgress: 0,
    lastUpdateAt: null,
    eventsReceived: 0,
    lastEventType: null,
    lastPhaseId: null
  };
  _moduleMetrics.instancesCreated++;
  _initPorts();
}
ProgressMonitor.prototype.start = function() {
  const self = this;
  if (self.done) return;
  if (!hasDocument) return;
  _log("info", "Iniciando monitoramento Enterprise (Bootstrap-integrated)");
  _moduleMetrics.totalStarts++;
  self._startedAt = Date.now();
  self.cachedBar = document.getElementById("loading-progress-bar");
  self.cachedPercentage = document.querySelector(".loading-percentage");
  self._connectToBootstrap();
};
ProgressMonitor.prototype._connectToBootstrap = function() {
  const self = this;
  const eventBus = _getEventBusStrict();
  if (!eventBus || !eventBus.on) {
    _log("warn", "EventBus not available - cannot connect to Bootstrap-v2");
    self._setupMinimalFallback();
    return;
  }
  _log("info", "Connecting to Bootstrap-v2 progress events");
  const cleanupStart = eventBus.on(PROGRESS_EVENTS.START, (data) => {
    _moduleMetrics.bootstrapEventsReceived++;
    self._metrics.eventsReceived++;
    self._metrics.lastEventType = "start";
    _log("debug", "Bootstrap progress START", data);
    self.updateUI(data.percentage || 0);
  });
  self._eventCleanups.push(cleanupStart);
  const cleanupPhaseStart = eventBus.on(PROGRESS_EVENTS.PHASE_START, (data) => {
    _moduleMetrics.bootstrapEventsReceived++;
    _moduleMetrics.phaseStartEvents++;
    self._metrics.eventsReceived++;
    self._metrics.lastEventType = "phase:start";
    self._metrics.lastPhaseId = data.phase || data.phaseId;
    _log("debug", "Bootstrap phase START", { phase: data.phase, percentage: data.percentage });
    self.updateUI(data.percentage || 0);
  });
  self._eventCleanups.push(cleanupPhaseStart);
  const cleanupPhaseComplete = eventBus.on(PROGRESS_EVENTS.PHASE_COMPLETE, (data) => {
    _moduleMetrics.bootstrapEventsReceived++;
    _moduleMetrics.phaseCompleteEvents++;
    self._metrics.eventsReceived++;
    self._metrics.lastEventType = "phase:complete";
    self._metrics.lastPhaseId = data.phase || data.phaseId;
    _log("debug", "Bootstrap phase COMPLETE", { phase: data.phase, percentage: data.percentage });
    self.updateUI(data.percentage || 0);
  });
  self._eventCleanups.push(cleanupPhaseComplete);
  const cleanupComplete = eventBus.on(PROGRESS_EVENTS.COMPLETE, (data) => {
    _moduleMetrics.bootstrapEventsReceived++;
    _moduleMetrics.progressCompleteEvents++;
    self._metrics.eventsReceived++;
    self._metrics.lastEventType = "complete";
    _log("info", "Bootstrap progress COMPLETE", { success: data.success, totalTime: data.totalTime });
    self.updateUI(100);
    setTimeout(() => {
      self.finalize("bootstrap-complete");
    }, 300);
  });
  self._eventCleanups.push(cleanupComplete);
  self._bootstrapConnected = true;
  _log("info", "Connected to Bootstrap-v2 progress events (4 listeners)");
};
ProgressMonitor.prototype._setupMinimalFallback = function() {
  const self = this;
  _log("warn", "Setting up minimal fallback (EventBus unavailable)");
  const startTime = Date.now();
  const duration = 5e3;
  const fallbackInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const percentage = Math.min(100, Math.round(elapsed / duration * 100));
    self.updateUI(percentage);
    if (percentage >= 100) {
      clearInterval(fallbackInterval);
      self.finalize("fallback-timeout");
    }
  }, 200);
  self._fallbackInterval = fallbackInterval;
  self._fallbackActive = true;
};
ProgressMonitor.prototype.updateUI = function(progresso) {
  if (this.done) return;
  this.state.setProgresso(progresso);
  this._metrics.uiUpdateCount++;
  this._metrics.lastProgress = progresso;
  this._metrics.lastUpdateAt = Date.now();
  if (this.cachedBar) {
    this.cachedBar.style.width = `${progresso}%`;
  }
  if (this.cachedPercentage) {
    this.cachedPercentage.textContent = `${Math.round(progresso)}%`;
  }
};
ProgressMonitor.prototype.finalize = function(reason) {
  if (this.done) return;
  this.done = true;
  this.stop();
  _moduleMetrics.totalFinalizes++;
  _log("info", `Finalizando (reason: ${reason}, eventsReceived: ${this._metrics.eventsReceived})`);
  const detail = {
    reason,
    bootstrapIntegrated: this._bootstrapConnected,
    eventsReceived: this._metrics.eventsReceived,
    lastPhaseId: this._metrics.lastPhaseId,
    timestamp: Date.now()
  };
  _emitComponentsReady(detail);
};
ProgressMonitor.prototype.stop = function() {
  _moduleMetrics.totalStops++;
  this._stoppedAt = Date.now();
  for (let i = 0; i < this._eventCleanups.length; i++) {
    try {
      if (typeof this._eventCleanups[i] === "function") {
        this._eventCleanups[i]();
      }
    } catch (e) {
      _log("warn", "Error cleaning up event listener", { error: e.message });
    }
  }
  this._eventCleanups = [];
  if (this._fallbackInterval) {
    clearInterval(this._fallbackInterval);
    this._fallbackInterval = null;
  }
  _log("debug", "ProgressMonitor stopped");
};
ProgressMonitor.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
ProgressMonitor.prototype.healthCheck = function() {
  const checks = {
    stateAvailable: !!this.state,
    notDone: !this.done,
    bootstrapConnected: this._bootstrapConnected,
    eventsReceived: this._metrics.eventsReceived > 0,
    progressValid: this._metrics.lastProgress >= 0 && this._metrics.lastProgress <= 100,
    portsInitialized: Ports.isInitialized()
  };
  let passed = 0;
  const checkKeys = Object.keys(checks);
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  const logger = _getLogger();
  return {
    status: passed === total ? "HEALTHY" : passed >= 4 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    bootstrapIntegrated: true,
    bootstrapConnected: this._bootstrapConnected,
    fallbackActive: !!this._fallbackActive,
    done: this.done,
    portsInitialized: Ports.isInitialized(),
    strictMode: isStrict(),
    eventUsed: "PROGRESS_EVENTS (Bootstrap-v2)",
    metrics: this._metrics,
    loggerAvailable: !!logger,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
};
ProgressMonitor.prototype.info = function() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    bootstrapIntegrated: true,
    bootstrapConnected: this._bootstrapConnected,
    fallbackActive: !!this._fallbackActive,
    eventsUsed: Object.keys(PROGRESS_EVENTS),
    done: this.done,
    startedAt: this._startedAt,
    stoppedAt: this._stoppedAt,
    duration: this._startedAt ? (this._stoppedAt || Date.now()) - this._startedAt : null,
    portsInitialized: Ports.isInitialized(),
    strictMode: isStrict(),
    metrics: this.getMetrics(),
    healthCheck: this.healthCheck()
  };
};
ProgressMonitor.prototype.getVersion = () => VERSION;
function getVersion() {
  return VERSION;
}
function getModuleMetrics() {
  return Object.assign({}, _moduleMetrics);
}
function moduleHealthCheck() {
  const checks = {
    hasWindow,
    hasDocument,
    instancesCreated: _moduleMetrics.instancesCreated > 0,
    bootstrapEventsReceived: _moduleMetrics.bootstrapEventsReceived > 0,
    portsInitialized: Ports.isInitialized()
  };
  let passed = 0;
  const checkKeys = Object.keys(checks);
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  const logger = _getLogger();
  return {
    status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    moduleMetrics: Object.assign({}, _moduleMetrics),
    portsInitialized: Ports.isInitialized(),
    strictMode: isStrict(),
    bootstrapIntegrated: true,
    eventsUsed: "PROGRESS_EVENTS (Bootstrap-v2)",
    loggerAvailable: !!logger,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
export {
  MODULE_ID,
  PROGRESS_EVENTS,
  ProgressMonitor,
  VERSION,
  getModuleMetrics,
  getPorts,
  getVersion,
  injectPorts,
  moduleHealthCheck
};
