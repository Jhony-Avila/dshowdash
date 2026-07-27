import orchestratorBus from "../bus/event-bus-adapter.js";
import { ORCHESTRATOR_EVENTS, HEALTH_STATES } from "../bus/events-map.js";
import orchestratorStore from "../state/store.js";
import moduleRegistry from "../core/registry.js";
import logger from "../utils/logger.js";
import { normalizeHealthState } from "../utils/normalization.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-health-monitor";
function HealthMonitor() {
  this.checkInterval = null;
  this.config = { interval: 3e4, timeout: 5e3, degradeThreshold: 3, recoverThreshold: 2 };
  this.successStreak = /* @__PURE__ */ new Map();
  this.initialized = false;
  this.destroyed = false;
}
HealthMonitor.prototype.getVersion = () => VERSION;
HealthMonitor.prototype.isInitialized = function() {
  return this.initialized && !this.destroyed;
};
HealthMonitor.prototype.init = function(config = {}) {
  if (this.initialized) return this;
  this.config = Object.assign({}, this.config, config);
  this._startMonitoring();
  this.initialized = true;
  this.destroyed = false;
  logger.info(`Health Monitor inicializado (${VERSION})`, this.config);
  return this;
};
HealthMonitor.prototype._startMonitoring = function() {
  const self = this;
  if (this.checkInterval) clearInterval(this.checkInterval);
  this.checkInterval = setInterval(() => {
    self.checkAll();
  }, this.config.interval);
  this.checkAll();
};
HealthMonitor.prototype.checkAll = function() {
  const self = this;
  const modules = moduleRegistry.getAll();
  const results = [];
  modules.forEach((module) => {
    const health = self._checkModule(module);
    results.push({ moduleId: module.id, health });
  });
  orchestratorBus.emit(ORCHESTRATOR_EVENTS.HEALTH_CHECK, { timestamp: Date.now(), results, summary: this._summarize(results), moduleId: MODULE_ID });
  orchestratorStore.set("lastHealthCheck", Date.now());
};
HealthMonitor.prototype._checkModule = function(module) {
  let state = HEALTH_STATES.OK;
  const reasons = [];
  if (module.errorCount >= this.config.degradeThreshold) {
    state = HEALTH_STATES.ERROR;
    reasons.push(`Erros: ${module.errorCount}`);
  } else if (module.errorCount > 0) {
    state = HEALTH_STATES.WARN;
    reasons.push(`Erros: ${module.errorCount}`);
  }
  if (module.lastError) {
    const errorAge = Date.now() - module.lastError.timestamp;
    if (errorAge < 6e4) {
      state = state === HEALTH_STATES.OK ? HEALTH_STATES.WARN : state;
      reasons.push("Erro recente");
    }
  }
  const normalizedState = normalizeHealthState(state);
  orchestratorStore.setModuleHealth(module.id, normalizedState);
  this._trackRecovery(module.id, normalizedState);
  return { state: normalizedState, reasons, timestamp: Date.now() };
};
HealthMonitor.prototype._trackRecovery = function(moduleId, currentState) {
  if (currentState === HEALTH_STATES.OK) {
    const streak = (this.successStreak.get(moduleId) || 0) + 1;
    this.successStreak.set(moduleId, streak);
    if (streak >= this.config.recoverThreshold) {
      const previousHealth = orchestratorStore.getModuleHealth(moduleId);
      if (previousHealth.state === HEALTH_STATES.DEGRADED || previousHealth.state === HEALTH_STATES.ERROR) {
        moduleRegistry.resetErrorCount(moduleId);
        orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_RECOVERED, { moduleId });
        logger.info(`M\xF3dulo recuperado: ${moduleId}`);
      }
    }
  } else {
    this.successStreak.set(moduleId, 0);
    if (currentState === HEALTH_STATES.ERROR) orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_DEGRADED, { moduleId, state: currentState });
  }
};
HealthMonitor.prototype._summarize = (results) => {
  const summary = { total: results.length, ok: 0, warn: 0, error: 0, degraded: 0, unknown: 0 };
  results.forEach((r) => {
    const state = r.health.state.toLowerCase();
    if (summary[state] !== void 0) summary[state]++;
  });
  return summary;
};
HealthMonitor.prototype.checkModule = function(moduleId) {
  const module = moduleRegistry.get(moduleId);
  if (!module) {
    logger.warn(`M\xF3dulo n\xE3o encontrado: ${moduleId}`);
    return null;
  }
  return this._checkModule(module);
};
HealthMonitor.prototype.getModuleHealth = (moduleId) => orchestratorStore.getModuleHealth(moduleId);
HealthMonitor.prototype.getAllHealth = () => {
  const modules = moduleRegistry.getAllIds();
  const health = {};
  modules.forEach((id) => {
    health[id] = orchestratorStore.getModuleHealth(id);
  });
  return health;
};
HealthMonitor.prototype.isHealthy = function(moduleId) {
  const health = this.getModuleHealth(moduleId);
  return health.state === HEALTH_STATES.OK;
};
HealthMonitor.prototype.isDegraded = function(moduleId) {
  const health = this.getModuleHealth(moduleId);
  return health.state === HEALTH_STATES.DEGRADED || health.state === HEALTH_STATES.ERROR;
};
HealthMonitor.prototype.getStats = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, config: this.config, lastCheck: orchestratorStore.get("lastHealthCheck"), moduleHealth: this.getAllHealth(), successStreaks: Array.from(this.successStreak.entries()) };
};
HealthMonitor.prototype.reset = function() {
  this.successStreak.clear();
  this.destroyed = false;
};
HealthMonitor.prototype.destroy = function() {
  if (this.checkInterval) {
    clearInterval(this.checkInterval);
    this.checkInterval = null;
  }
  this.successStreak.clear();
  this.initialized = false;
  this.destroyed = true;
  logger.info("Health Monitor destru\xEDdo");
};
const healthMonitor = new HealthMonitor();
var health_monitor_default = healthMonitor;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  const checks = {
    initialized: healthMonitor.initialized,
    notDestroyed: !healthMonitor.destroyed,
    monitoringActive: healthMonitor.checkInterval !== null,
    hasConfig: !!healthMonitor.config
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY";
  return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
export {
  HealthMonitor,
  MODULE_ID,
  VERSION,
  health_monitor_default as default,
  healthCheck,
  healthMonitor,
  info
};
