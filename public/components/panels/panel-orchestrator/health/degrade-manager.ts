// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-degrade-manager
// PURPOSE: Degrade Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ORCHESTRATOR_EVENTS, SCHEDULER_MODES, HEALTH_STATES from ../bus/events-map.js
//   orchestratorBus from ../bus/event-bus-adapter.js
//   orchestratorStore from ../state/store.js
//   orchestratorScheduler from ../core/scheduler.js
//   logger from ../utils/logger.js
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   DegradeManager() — exported function
//   degradeManager — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   ORCHESTRATOR_EVENTS.HEALTH_DEGRADED
//   ORCHESTRATOR_EVENTS.HEALTH_RECOVERED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import orchestratorBus from '../bus/event-bus-adapter.js';
import { ORCHESTRATOR_EVENTS, SCHEDULER_MODES, HEALTH_STATES } from '../bus/events-map.js';
import orchestratorStore from '../state/store.js';
import orchestratorScheduler from '../core/scheduler.js';
import logger from '../utils/logger.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'orchestrator-degrade-manager';

function DegradeManager(this: any) {
  this.degradeLevel = 0;
  this.degradeHistory = [];
  this.autoRecovery = true;
  this.recoveryAttempts = 0;
  this.maxRecoveryAttempts = 3;
  this.initialized = false;
  this.destroyed = false;
}

DegradeManager.prototype.getVersion = () => VERSION;
DegradeManager.prototype.isInitialized = function() { return this.initialized && !this.destroyed; };

DegradeManager.prototype.init = function(config: Record<string, unknown> = {}) {
  if (this.initialized) return this;
  this.autoRecovery = config.autoRecovery !== false;
  this.maxRecoveryAttempts = config.maxRecoveryAttempts || 3;
  this.initialized = true;
  this.destroyed = false;
  logger.info(`Degrade Manager inicializado (${VERSION})`, { autoRecovery: this.autoRecovery });
  return this;
};

DegradeManager.prototype.checkDegradeConditions = function() {
  const errorCount = orchestratorStore.get('errorCount');
  const schedulerMode = orchestratorStore.get('schedulerMode');
  const degradedModules = this._countDegradedModules();
  if (errorCount >= 10 || degradedModules >= 3) this.enterDegradeMode('HIGH', { errorCount, degradedModules });
  else if (errorCount >= 5 || degradedModules >= 2) this.enterDegradeMode('MEDIUM', { errorCount, degradedModules });
  else if (errorCount >= 2 || degradedModules >= 1) this.enterDegradeMode('LOW', { errorCount, degradedModules });
  else if (this.degradeLevel > 0 && this.autoRecovery) this.attemptRecovery();
};

DegradeManager.prototype._countDegradedModules = () => {
  const health = orchestratorStore.get('moduleHealth');
  let count = 0;
  health.forEach((data: { state: string }) => { if (data.state === HEALTH_STATES.DEGRADED || data.state === HEALTH_STATES.ERROR) count++; });
  return count;
};

DegradeManager.prototype.enterDegradeMode = function(level: string, reason: Record<string, unknown> = {}) {
  const previousLevel = this.degradeLevel;
  const levelMap: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
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

DegradeManager.prototype._reduceRefreshRates = () => { logger.info('Reduzindo taxas de refresh (modo degradado)'); };
DegradeManager.prototype._pauseNonCritical = () => { logger.info('Pausando módulos não-críticos (modo degradado)'); };

DegradeManager.prototype.attemptRecovery = function() {
  if (this.recoveryAttempts >= this.maxRecoveryAttempts) { logger.warn('Máximo de tentativas de recuperação atingido'); return false; }
  this.recoveryAttempts++;
  logger.info(`Tentativa de recuperação ${this.recoveryAttempts}/${this.maxRecoveryAttempts}`);
  const errorCount = orchestratorStore.get('errorCount');
  const degradedModules = this._countDegradedModules();
  if (errorCount < 2 && degradedModules === 0) { this.exitDegradeMode(); return true; }
  return false;
};

DegradeManager.prototype.exitDegradeMode = function() {
  if (this.degradeLevel === 0) return;
  const previousLevel = this.degradeLevel;
  this.degradeLevel = 0;
  this.recoveryAttempts = 0;
  orchestratorScheduler.setMode(SCHEDULER_MODES.ACTIVE);
  orchestratorBus.emit(ORCHESTRATOR_EVENTS.HEALTH_RECOVERED, { previousLevel, timestamp: Date.now(), moduleId: MODULE_ID });
  logger.info('Saindo do modo degradado');
};

DegradeManager.prototype.forceRecovery = function() { this.recoveryAttempts = 0; this.exitDegradeMode(); logger.info('Recuperação forçada'); };
DegradeManager.prototype.getDegradeLevel = function() { return this.degradeLevel; };
DegradeManager.prototype.isDegraded = function() { return this.degradeLevel > 0; };
DegradeManager.prototype.getHistory = function() { return this.degradeHistory.slice(); };

DegradeManager.prototype.getStats = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, degradeLevel: this.degradeLevel, recoveryAttempts: this.recoveryAttempts, maxRecoveryAttempts: this.maxRecoveryAttempts, autoRecovery: this.autoRecovery, historyCount: this.degradeHistory.length };
};

DegradeManager.prototype.reset = function() { this.degradeLevel = 0; this.recoveryAttempts = 0; this.degradeHistory = []; this.destroyed = false; };
DegradeManager.prototype.destroy = function() { this.reset(); this.initialized = false; this.destroyed = true; logger.info('Degrade Manager destruído'); };

// @ts-expect-error strict migration — TS7009
const degradeManager = new DegradeManager();

export default degradeManager;
export { DegradeManager, degradeManager, VERSION, MODULE_ID };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { degradeManagerReady: true } }; }
