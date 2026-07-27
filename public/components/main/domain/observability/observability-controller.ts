// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: observability-controller
// PURPOSE: Observability Controller - Metrics & Health Provider
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ACTION_EVENTS from /core/runtime/events/catalog/action.events.js
//   PERSISTENCE_EVENTS from /core/runtime/events/catalog/persistence.events.js
//   OBSERVABILITY_EVENTS from ./observability-contracts.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createController() — exported function
//   createObservabilityController — exported value
//   ObservabilityController() — exported function
//
// @changelog v3.0.0-P1-AAA: Fixed Record type leak and statuses undefined bug
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ACTION_EVENTS } from '/core/runtime/events/catalog/action.events.js';
import { PERSISTENCE_EVENTS } from '/core/runtime/events/catalog/persistence.events.js';
import { OBSERVABILITY_EVENTS } from './observability-contracts.js';

export const VERSION = '3.0.0-P1-HEX';
export const MODULE_ID = 'observability-controller';

function ObservabilityController(this: any) {
  this._events = null;
  this._timerPort = null;
  this._globalsPort = null;
  this._unsubs = [];
  this._rateIntervalId = null;
  this._metrics = {
    actions: { total: 0, accepted: 0, rejected: 0, errors: 0, completedAt: [], perMinute: 0 },
    replays: { total: 0, lastAt: null },
    snapshots: { total: 0, lastAt: null }
  };
  this._modules = {};
}

ObservabilityController.prototype.init = function(config: Record<string, unknown>) {
  if (config === undefined) config = {};
  this._events = config.events || config.eventBus || null;
  this._timerPort = (config.ports as any)?.timer || config.timerPort || null;
  this._globalsPort = (config.ports as any)?.globals || config.globalsPort || null;
  if (!this._events) return this;
  this._setupListeners();
  this._startRateCalculation();
  return this;
};

ObservabilityController.prototype._setupListeners = function() {
  const self = this;
  if (!this._events?.on) return;

  const unsubMetricsReq = this._events.on(OBSERVABILITY_EVENTS.METRICS_REQUEST, (p: unknown) => { self._handleMetricsRequest(p); });
  if (typeof unsubMetricsReq === 'function') this._unsubs.push(unsubMetricsReq);

  const unsubHealthReq = this._events.on(OBSERVABILITY_EVENTS.HEALTH_REQUEST, (p: unknown) => { self._handleHealthRequest(p); });
  if (typeof unsubHealthReq === 'function') this._unsubs.push(unsubHealthReq);

  const unsubAccepted = this._events.on(ACTION_EVENTS.ACCEPTED, () => { self._trackAction('accepted'); });
  if (typeof unsubAccepted === 'function') this._unsubs.push(unsubAccepted);

  const unsubRejected = this._events.on(ACTION_EVENTS.REJECTED, () => { self._trackAction('rejected'); });
  if (typeof unsubRejected === 'function') this._unsubs.push(unsubRejected);

  const unsubError = this._events.on(ACTION_EVENTS.ERROR, () => { self._trackAction('error'); });
  if (typeof unsubError === 'function') this._unsubs.push(unsubError);

  const unsubCompleted = this._events.on(ACTION_EVENTS.COMPLETED, () => { self._trackAction('completed'); });
  if (typeof unsubCompleted === 'function') this._unsubs.push(unsubCompleted);

  const unsubReplay = this._events.on(PERSISTENCE_EVENTS.REPLAY_COMPLETED, () => { self._trackReplay(); });
  if (typeof unsubReplay === 'function') this._unsubs.push(unsubReplay);

  const unsubSnapshot = this._events.on(PERSISTENCE_EVENTS.SNAPSHOT_SAVED, () => { self._trackSnapshot(); });
  if (typeof unsubSnapshot === 'function') this._unsubs.push(unsubSnapshot);
};

ObservabilityController.prototype._startRateCalculation = function() {
  const self = this;
  const timerFn = this._timerPort?.setInterval || setInterval;
  this._rateIntervalId = timerFn(() => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    self._metrics.actions.completedAt = self._metrics.actions.completedAt.filter((t: unknown) => (t as number) > oneMinuteAgo);
    self._metrics.actions.perMinute = self._metrics.actions.completedAt.length;
  }, 5000);
};

ObservabilityController.prototype._trackAction = function(type: string) {
  this._metrics.actions.total++;
  if (type === 'accepted') this._metrics.actions.accepted++;
  if (type === 'rejected') this._metrics.actions.rejected++;
  if (type === 'error') this._metrics.actions.errors++;
  if (type === 'completed') this._metrics.actions.completedAt.push(Date.now());
};

ObservabilityController.prototype._trackReplay = function() {
  this._metrics.replays.total++;
  this._metrics.replays.lastAt = Date.now();
};

ObservabilityController.prototype._trackSnapshot = function() {
  this._metrics.snapshots.total++;
  this._metrics.snapshots.lastAt = Date.now();
};

ObservabilityController.prototype._handleMetricsRequest = function(payload: Record<string, unknown>) {
  this._events?.emit?.(OBSERVABILITY_EVENTS.METRICS, {
    actions: {
      total: this._metrics.actions.total,
      accepted: this._metrics.actions.accepted,
      rejected: this._metrics.actions.rejected,
      errors: this._metrics.actions.errors,
      perMinute: this._metrics.actions.perMinute
    },
    replays: { total: this._metrics.replays.total, lastAt: this._metrics.replays.lastAt },
    snapshots: { total: this._metrics.snapshots.total, lastAt: this._metrics.snapshots.lastAt },
    timestamp: Date.now(),
    requestedBy: (payload as any)?.source || 'unknown'
  });
};

ObservabilityController.prototype._handleHealthRequest = function(payload: Record<string, unknown>) {
  const modules = this._collectModuleHealth();
  const status = this._calculateOverallStatus(modules);
  this._events?.emit?.(OBSERVABILITY_EVENTS.HEALTH, {
    status,
    modules,
    timestamp: Date.now(),
    requestedBy: (payload as any)?.source || 'unknown'
  });
};

ObservabilityController.prototype._collectModuleHealth = function() {
  const modules: Record<string, unknown> = {};
  const gp = this._globalsPort;
  const globalModules = [
    { name: 'Main', getter: gp?.getMain },
    { name: 'Sidebar', getter() { const s = gp?.getSidebar?.(); return s?.getInstance ? s.getInstance() : s; } },
    { name: 'EventBus', getter: gp?.getEventBus },
    { name: 'RouterGlobal', getter: gp?.getRouterGlobal },
    { name: 'LayoutManager', getter: gp?.getLayoutManager },
    { name: 'GlobalState', getter: gp?.getGlobalState }
  ];
  globalModules.forEach(m => {
    try {
      const ref = m.getter ? m.getter() : null;
      if (ref && typeof ref.healthCheck === 'function') {
        const health = ref.healthCheck();
        modules[m.name] = { status: health?.status || 'unknown', score: health?.score || health?.scoreDisplay || 'N/A' };
      } else if (ref) {
        modules[m.name] = { status: 'available', score: 'N/A' };
      } else {
        modules[m.name] = { status: 'unavailable', score: 'N/A' };
      }
    } catch (e: any) {
      modules[m.name] = { status: 'error', score: 'N/A', error: e.message };
    }
  });
  return modules;
};

ObservabilityController.prototype._calculateOverallStatus = function(modules: Record<string, unknown>) {
  const statuses = Object.values(modules).map((m: any) => m?.status || 'unknown');
  const hasError = statuses.some(s => s === 'error' || s === 'UNHEALTHY');
  const hasDegraded = statuses.some(s => s === 'degraded' || s === 'DEGRADED' || s === 'unavailable');
  if (hasError) return 'unhealthy';
  if (hasDegraded) return 'degraded';
  return 'healthy';
};

ObservabilityController.prototype.registerModule = function(name: string, healthFn: unknown) {
  this._modules[name] = healthFn;
};

ObservabilityController.prototype.getMetrics = function() {
  return {
    actions: { total: this._metrics.actions.total, accepted: this._metrics.actions.accepted, rejected: this._metrics.actions.rejected, errors: this._metrics.actions.errors, perMinute: this._metrics.actions.perMinute },
    replays: { total: this._metrics.replays.total, lastAt: this._metrics.replays.lastAt },
    snapshots: { total: this._metrics.snapshots.total, lastAt: this._metrics.snapshots.lastAt }
  };
};

ObservabilityController.prototype.healthCheck = function() {
  return {
    status: 'healthy',
    version: VERSION,
    moduleId: MODULE_ID,
    metrics: this.getMetrics(),
    registeredModules: Object.keys(this._modules).length,
    listenersActive: this._unsubs.length,
    p1HexCompliant: true
  };
};

ObservabilityController.prototype.info = function() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: !!this._events,
    metrics: this.getMetrics(),
    p1HexCompliant: true
  };
};

ObservabilityController.prototype.destroy = function() {
  if (this._rateIntervalId) {
    const clearFn = this._timerPort?.clearInterval || clearInterval;
    clearFn(this._rateIntervalId);
    this._rateIntervalId = null;
  }
  this._unsubs.forEach((u: unknown) => { try { if (typeof u === 'function') (u as () => void)(); } catch (e: any) {} });
  this._unsubs = [];
  this._events = null;
};

export function createController(config: Record<string, unknown>) {
  return new (ObservabilityController as unknown as new () => any)().init(config);
}

export const createObservabilityController = createController;

export { ObservabilityController };
export default { ObservabilityController, createController, createObservabilityController: createController, VERSION, MODULE_ID };
