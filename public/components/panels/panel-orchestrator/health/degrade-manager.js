import orchestratorBus from "../bus/event-bus-adapter.js";
import { ORCHESTRATOR_EVENTS, SCHEDULER_MODES, HEALTH_STATES } from "../bus/events-map.js";
import orchestratorStore from "../state/store.js";
import orchestratorScheduler from "../core/scheduler.js";
import logger from "../utils/logger.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-degrade-manager";
function DegradeManager() {
  this.degradeLevel = 0;
  this.degradeHistory = [];
  this.autoRecovery = true;
  this.recoveryAttempts = 0;
  this.maxRecoveryAttempts = 3;
  this.initialized = false;
  this.destroyed = false;
}
DegradeManager.prototype.getVersion = () => VERSION;
DegradeManager.prototype.isInitialized = function() {
  return this.initialized && !this.destroyed;
};
DegradeManager.prototype.init = function(config = {}) {
  if (this.initialized) return this;
  this.autoRecovery = config.autoRecovery !== false;
  this.maxRecoveryAttempts = config.maxRecoveryAttempts || 3;
  this.initialized = true;
  this.destroyed = false;
  logger.info(`Degrade Manager inicializado (${VERSION})`, { autoRecovery: this.autoRecovery });
  return this;
};
DegradeManager.prototype.checkDegradeConditions = function() {
  const errorCount = orchestratorStore.get("errorCount");
  const schedulerMode = orchestratorStore.get("schedulerMode");
  const degradedModules = this._countDegradedModules();
  if (errorCount >= 10 || degradedModules >= 3) this.enterDegradeMode("HIGH", { errorCount, degradedModules });
  else if (errorCount >= 5 || degradedModules >= 2) this.enterDegradeMode("MEDIUM", { errorCount, degradedModules });
  else if (errorCount >= 2 || degradedModules >= 1) this.enterDegradeMode("LOW", { errorCount, degradedModules });
  else if (this.degradeLevel > 0 && this.autoRecovery) this.attemptRecovery();
};
DegradeManager.prototype._countDegradedModules = () => {
  const health = orchestratorStore.get("moduleHealth");
  let count = 0;
  health.forEach((data) => {
    if (data.state === HEALTH_STATES.DEGRADED || data.state === HEALTH_STATES.ERROR) count++;
  });
  return count;
};
DegradeManager.prototype.enterDegradeMode = function(level, reason = {}) {
  const previousLevel = this.degradeLevel;
  const levelMap = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  const newLevel = levelMap[level] || 0;
  if (newLevel <= previousLevel) return;
  this.degradeLevel = newLevel;
  this.degradeHistory.push({ level, reason, timestamp: Date.now() });
  orchestratorScheduler.setMode(SCHEDULER_MODES.DEGRADED);
  if (newLevel >= 2) this._reduceRefreshRates();
  if (newLevel >= 3) this._pauseNonCritical();
  orchestratorBus.emit(ORCHESTRATOR_EVENTS.HEALTH_DEGRADED, { level, previousLevel, reason, moduleId: MODULE_ID });
  logger.warn(`Modo degradado: ${level}`, reason);
};
DegradeManager.prototype._reduceRefreshRates = () => {
  logger.info("Reduzindo taxas de refresh (modo degradado)");
};
DegradeManager.prototype._pauseNonCritical = () => {
  logger.info("Pausando m\xF3dulos n\xE3o-cr\xEDticos (modo degradado)");
};
DegradeManager.prototype.attemptRecovery = function() {
  if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
    logger.warn("M\xE1ximo de tentativas de recupera\xE7\xE3o atingido");
    return false;
  }
  this.recoveryAttempts++;
  logger.info(`Tentativa de recupera\xE7\xE3o ${this.recoveryAttempts}/${this.maxRecoveryAttempts}`);
  const errorCount = orchestratorStore.get("errorCount");
  const degradedModules = this._countDegradedModules();
  if (errorCount < 2 && degradedModules === 0) {
    this.exitDegradeMode();
    return true;
  }
  return false;
};
DegradeManager.prototype.exitDegradeMode = function() {
  if (this.degradeLevel === 0) return;
  const previousLevel = this.degradeLevel;
  this.degradeLevel = 0;
  this.recoveryAttempts = 0;
  orchestratorScheduler.setMode(SCHEDULER_MODES.ACTIVE);
  orchestratorBus.emit(ORCHESTRATOR_EVENTS.HEALTH_RECOVERED, { previousLevel, timestamp: Date.now(), moduleId: MODULE_ID });
  logger.info("Saindo do modo degradado");
};
DegradeManager.prototype.forceRecovery = function() {
  this.recoveryAttempts = 0;
  this.exitDegradeMode();
  logger.info("Recupera\xE7\xE3o for\xE7ada");
};
DegradeManager.prototype.getDegradeLevel = function() {
  return this.degradeLevel;
};
DegradeManager.prototype.isDegraded = function() {
  return this.degradeLevel > 0;
};
DegradeManager.prototype.getHistory = function() {
  return this.degradeHistory.slice();
};
DegradeManager.prototype.getStats = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, degradeLevel: this.degradeLevel, recoveryAttempts: this.recoveryAttempts, maxRecoveryAttempts: this.maxRecoveryAttempts, autoRecovery: this.autoRecovery, historyCount: this.degradeHistory.length };
};
DegradeManager.prototype.reset = function() {
  this.degradeLevel = 0;
  this.recoveryAttempts = 0;
  this.degradeHistory = [];
  this.destroyed = false;
};
DegradeManager.prototype.destroy = function() {
  this.reset();
  this.initialized = false;
  this.destroyed = true;
  logger.info("Degrade Manager destru\xEDdo");
};
const degradeManager = new DegradeManager();
var degrade_manager_default = degradeManager;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { degradeManagerReady: true } };
}
export {
  DegradeManager,
  MODULE_ID,
  VERSION,
  degrade_manager_default as default,
  degradeManager,
  healthCheck,
  info
};
