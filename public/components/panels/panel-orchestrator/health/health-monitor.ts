// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-health-monitor
// PURPOSE: Health Monitor
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ORCHESTRATOR_EVENTS, HEALTH_STATES from ../bus/events-map.js
//   normalizeHealthState from ../utils/normalization.js
//   orchestratorBus from ../bus/event-bus-adapter.js
//   orchestratorStore from ../state/store.js
//   moduleRegistry from ../core/registry.js
//   logger from ../utils/logger.js
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   HealthMonitor() — exported function
//   healthMonitor — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   ORCHESTRATOR_EVENTS.HEALTH_CHECK
//   ORCHESTRATOR_EVENTS.MODULE_DEGRADED
//   ORCHESTRATOR_EVENTS.MODULE_RECOVERED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import orchestratorBus from '../bus/event-bus-adapter.js';
import { ORCHESTRATOR_EVENTS, HEALTH_STATES } from '../bus/events-map.js';
import orchestratorStore from '../state/store.js';
import moduleRegistry from '../core/registry.js';
import logger from '../utils/logger.js';
import { normalizeHealthState } from '../utils/normalization.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'orchestrator-health-monitor';

function HealthMonitor(this: any) {
  this.checkInterval = null;
  this.config = { interval: 30000, timeout: 5000, degradeThreshold: 3, recoverThreshold: 2 };
  this.successStreak = new Map();
  this.initialized = false;
  this.destroyed = false;
}

HealthMonitor.prototype.getVersion = () => VERSION;
HealthMonitor.prototype.isInitialized = function() { return this.initialized && !this.destroyed; };

HealthMonitor.prototype.init = function(config: Record<string, unknown> = {}) {
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
  this.checkInterval = setInterval(() => { self.checkAll(); }, this.config.interval);
  this.checkAll();
};

HealthMonitor.prototype.checkAll = function() {
  const self = this;
  const modules = moduleRegistry.getAll();
  const results: Array<{ moduleId: string; health: Record<string, unknown> }> = [];
  modules.forEach((module: Record<string, unknown>) => {
    const health = self._checkModule(module);
    results.push({ moduleId: module.id as string, health });
  });
  orchestratorBus.emit(ORCHESTRATOR_EVENTS.HEALTH_CHECK, { timestamp: Date.now(), results, summary: this._summarize(results), moduleId: MODULE_ID });
  orchestratorStore.set('lastHealthCheck', Date.now());
};

HealthMonitor.prototype._checkModule = function(module: Record<string, unknown>) {
  let state = HEALTH_STATES.OK;
  const reasons: string[] = [];
  if ((module.errorCount as number) >= this.config.degradeThreshold) { state = HEALTH_STATES.ERROR; reasons.push(`Erros: ${module.errorCount}`); }
  else if ((module.errorCount as number) > 0) { state = HEALTH_STATES.WARN; reasons.push(`Erros: ${module.errorCount}`); }
  if (module.lastError) {
    const errorAge = Date.now() - (module.lastError as { timestamp: number }).timestamp;
    if (errorAge < 60000) { state = state === HEALTH_STATES.OK ? HEALTH_STATES.WARN : state; reasons.push('Erro recente'); }
  }
  const normalizedState = normalizeHealthState(state);
  orchestratorStore.setModuleHealth(module.id, normalizedState);
  this._trackRecovery(module.id, normalizedState);
  return { state: normalizedState, reasons, timestamp: Date.now() };
};

HealthMonitor.prototype._trackRecovery = function(moduleId: string, currentState: string) {
  if (currentState === HEALTH_STATES.OK) {
    const streak = (this.successStreak.get(moduleId) || 0) + 1;
    this.successStreak.set(moduleId, streak);
    if (streak >= this.config.recoverThreshold) {
      const previousHealth = orchestratorStore.getModuleHealth(moduleId);
      if (previousHealth.state === HEALTH_STATES.DEGRADED || previousHealth.state === HEALTH_STATES.ERROR) {
        moduleRegistry.resetErrorCount(moduleId);
        orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_RECOVERED, { moduleId });
        logger.info(`Módulo recuperado: ${moduleId}`);
      }
    }
  } else {
    this.successStreak.set(moduleId, 0);
    if (currentState === HEALTH_STATES.ERROR) orchestratorBus.emit(ORCHESTRATOR_EVENTS.MODULE_DEGRADED, { moduleId, state: currentState });
  }
};

HealthMonitor.prototype._summarize = (results: Array<{ moduleId: string; health: Record<string, unknown> }>) => {
  const summary: Record<string, number> = { total: results.length, ok: 0, warn: 0, error: 0, degraded: 0, unknown: 0 };
  results.forEach((r: { moduleId: string; health: Record<string, unknown> }) => { const state = (r.health.state as string).toLowerCase(); if (summary[state] !== undefined) summary[state]++; });
  return summary;
};

HealthMonitor.prototype.checkModule = function(moduleId: string) {
  const module = moduleRegistry.get(moduleId);
  if (!module) { logger.warn(`Módulo não encontrado: ${moduleId}`); return null; }
  return this._checkModule(module);
};

HealthMonitor.prototype.getModuleHealth = (moduleId: string) => orchestratorStore.getModuleHealth(moduleId);

HealthMonitor.prototype.getAllHealth = () => {
  const modules = moduleRegistry.getAllIds();
  const health: Record<string, unknown> = {};
  modules.forEach((id: string) => { health[id] = orchestratorStore.getModuleHealth(id); });
  return health;
};

HealthMonitor.prototype.isHealthy = function(moduleId: string) { const health = this.getModuleHealth(moduleId); return health.state === HEALTH_STATES.OK; };
HealthMonitor.prototype.isDegraded = function(moduleId: string) { const health = this.getModuleHealth(moduleId); return health.state === HEALTH_STATES.DEGRADED || health.state === HEALTH_STATES.ERROR; };

HealthMonitor.prototype.getStats = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, config: this.config, lastCheck: orchestratorStore.get('lastHealthCheck'), moduleHealth: this.getAllHealth(), successStreaks: Array.from(this.successStreak.entries()) };
};

HealthMonitor.prototype.reset = function() { this.successStreak.clear(); this.destroyed = false; };

HealthMonitor.prototype.destroy = function() {
  if (this.checkInterval) { clearInterval(this.checkInterval); this.checkInterval = null; }
  this.successStreak.clear();
  this.initialized = false;
  this.destroyed = true;
  logger.info('Health Monitor destruído');
};

// @ts-expect-error strict migration — TS7009
const healthMonitor = new HealthMonitor();

export default healthMonitor;
export { HealthMonitor, healthMonitor, VERSION, MODULE_ID };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() {
  const checks = {
    initialized: healthMonitor.initialized,
    notDestroyed: !healthMonitor.destroyed,
    monitoringActive: healthMonitor.checkInterval !== null,
    hasConfig: !!healthMonitor.config
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY';
  return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
