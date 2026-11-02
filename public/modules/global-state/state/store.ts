// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.2.0-P0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state-store
// PURPOSE: Global State Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from ../api/contracts.js
//   from ../utils/validators.js
//   from ../utils/middleware.js
//   from ../telemetry/tracker.js
//   from ./store-config.js
//   from ./store-reducer.js
//   from ./store-subscribers.js
//   from /core/runtime/events/index.js
//   from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   default export
//   GlobalStateStore
//   MODULE_ID
//   VERSION
//   getEmitMetrics
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ACTIONS, INITIAL_STATE, EVENTS } from '../api/contracts.js';
import StateValidators from '../utils/validators.js';
import StateMiddleware from '../utils/middleware.js';
import GlobalStateTelemetry from '../telemetry/tracker.js';
import { metrics, log, deepClone, getNestedValue } from './store-config.js';
import { reducer } from './store-reducer.js';
import { notifySubscribers, addSubscriber, removeSubscriber } from './store-subscribers.js';
import { STATE_EVENTS } from '/core/runtime/events/catalog/state.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'global-state-store';
const VERSION = '7.2.0-P0-ENTERPRISE';

// P24: Métricas de emissão
const _emitMetrics: { total: number; byEvent: Record<string, number>; lastEmitAt: number | null } = { total: 0, byEvent: {}, lastEmitAt: null };
function _trackEmit(eventName: string) { _emitMetrics.total++; _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1; _emitMetrics.lastEmitAt = Date.now(); }

// P0 ENTERPRISE: Ports-based EventBus access (no window fallback)
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _ports: Record<string, unknown> & { _initialized: boolean } = { eventBus: null, _initialized: false };
function _initPorts() { if (_ports._initialized) return; Ports.init(); _ports.eventBus = Ports.get('eventBus'); _ports._initialized = true; }
function _getPort(name: string) { if (!_ports._initialized) _initPorts(); return _ports[name] || null; }

function GlobalStateStore(this: any) {
  this.state = deepClone(INITIAL_STATE);
  this.subscribers = new Map();
  this.subscriberCounter = { value: 0 };
  this.isDestroyed = false;
  this.isInitialized = false;
  this.eventBus = null;
  this.telemetry = GlobalStateTelemetry;
}

GlobalStateStore.prototype.injectPorts = function(ports: Record<string, unknown>) { if (ports) { for (const k in ports) { if (ports.hasOwnProperty(k)) _ports[k] = ports[k]; } } _ports._initialized = true; if (ports && ports.eventBus) this.eventBus = ports.eventBus; };
GlobalStateStore.prototype.getPorts = () => Object.assign({}, _ports);

GlobalStateStore.prototype.init = function(options: Record<string, unknown>) {
  if (!options) options = {};
  if (typeof window === 'undefined' || typeof document === 'undefined') { log('warn', 'No window/document - running in no-op mode'); return this; }
  if (this.isDestroyed) throw new Error('[GlobalState] Store is destroyed. Create new instance.');
  if (this.isInitialized) { log('warn', 'Store already initialized'); return this; }
  _initPorts();
  this.telemetry.init({ enabled: options.telemetryEnabled !== false, maxHistory: options.maxHistory || 100 });
  StateMiddleware.clear();
  // @ts-expect-error strict migration — TS2345
  if (options.useDefaultMiddlewares !== false) { StateMiddleware.use(StateMiddleware.validationMiddleware); StateMiddleware.use(StateMiddleware.timestampMiddleware); }
  this.connectEventBus();
  if (options.initialState) this.hydrate(options.initialState);
  this.isInitialized = true;
  this.telemetry.track(STATE_EVENTS.STORE_INITIALIZED, { options, portsInitialized: _ports._initialized });
  _trackEmit(EVENTS.READY);
  this.emit(EVENTS.READY, { state: this.getState() });
  return this;
};

GlobalStateStore.prototype.connectEventBus = function() {
  try {
    // P0 ENTERPRISE: Use only Ports pattern (no window fallback)
    const eb = _getPort('eventBus');
    if (eb) { this.eventBus = eb; _ports.eventBus = eb; }
  } catch (e) { log('warn', 'EventBus connection failed:', e); }
};

GlobalStateStore.prototype.emit = function(eventName: string, data: unknown) {
  if (!data) data = {};
  _trackEmit(eventName);
  if (this.eventBus && typeof this.eventBus.emit === 'function') { try { this.eventBus.emit(eventName, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() })); } catch (e) { log('warn', 'EventBus emit failed:', e); } }
  try { window.dispatchEvent(new CustomEvent(eventName, { detail: data })); } catch (e) {}
};

GlobalStateStore.prototype.getState = function() { return deepClone(this.state); };
GlobalStateStore.prototype.get = function(path: string) { if (!path || typeof path !== 'string') return this.getState(); return getNestedValue(this.state, path); };
GlobalStateStore.prototype.has = function(path: string) { if (!path || typeof path !== 'string') return false; return getNestedValue(this.state, path) !== undefined; };
GlobalStateStore.prototype.select = function(selector: unknown) { if (typeof selector === 'function') return (selector as (...args: unknown[]) => unknown)(this.getState()); if (typeof selector === 'string') return getNestedValue(this.state, selector); return null; };

GlobalStateStore.prototype.dispatch = function(action: { type: string; payload?: unknown }) {
  const self = this;
  if (this.isDestroyed) throw new Error('[GlobalState] Store is destroyed. Cannot dispatch.');
  if (!this.isInitialized) { log('warn', 'Store not initialized. Call init() first.'); return Promise.resolve(false); }
  metrics.dispatches++;
  const startTime = performance.now();
  const actionValidation = StateValidators.validateAction(action);
  if (!actionValidation.valid) {
    metrics.dispatchesFailed++;
    // @ts-expect-error strict migration — TS2769
    this.telemetry.trackError(new Error(actionValidation.error), { action });
    this.emit(EVENTS.VALIDATION_FAILED, { action, error: actionValidation.error });
    // @ts-expect-error strict migration — TS2769
    return Promise.reject(new Error(actionValidation.error));
  }
  // @ts-expect-error strict migration — TS2345
  return StateMiddleware.execute(action, this.state, this.dispatch.bind(this)).then((middlewareResult: { blocked: boolean; action: { type: string; payload?: unknown }; error?: string }) => {
    if (middlewareResult.blocked) { metrics.dispatchesFailed++; self.telemetry.track(STATE_EVENTS.ACTION_BLOCKED, { action: action.type, reason: middlewareResult.error }); return false; }
    const processedAction = middlewareResult.action;
    const prevState = self.getState();
    try { self.state = reducer(self.state, processedAction, { telemetry: self.telemetry, emit: self.emit.bind(self), eventBus: self.eventBus }); }
    catch (error) { metrics.dispatchesFailed++; self.telemetry.trackError(error, { action: processedAction }); self.emit(EVENTS.ERROR, { error, action: processedAction }); throw error; }
    const nextState = self.getState();
    notifySubscribers(self.subscribers, prevState, nextState, processedAction, self.telemetry);
    const duration = performance.now() - startTime;
    metrics.dispatchesSucceeded++;
    self.telemetry.trackStateChange(processedAction, prevState, nextState);
    self.telemetry.trackPerformance('dispatch', duration);
    self.emit(EVENTS.STATE_CHANGED, { action: processedAction, prevState, nextState, duration });
    return true;
  });
};

GlobalStateStore.prototype.subscribe = function(callback: (...args: unknown[]) => void, selector: unknown, options: Record<string, unknown>) {
  if (!options) options = {};
  const id = addSubscriber(this.subscribers, this.subscriberCounter, callback, selector, options);
  this.telemetry.track(STATE_EVENTS.SUBSCRIBER_ADDED, { id, hasSelector: !!selector, deepCompare: options.deepCompare });
  this.emit(EVENTS.SUBSCRIBER_ADDED, { id });
  const self = this;
  return () => { removeSubscriber(self.subscribers, id); self.telemetry.track(STATE_EVENTS.SUBSCRIBER_REMOVED, { id }); self.emit(EVENTS.SUBSCRIBER_REMOVED, { id }); };
};

GlobalStateStore.prototype.onChange = function(path: string, callback: (...args: unknown[]) => void, options: Record<string, unknown>) {
  if (typeof path !== 'string' || typeof callback !== 'function') throw new Error('onChange requires path string and callback function');
  return this.subscribe(callback, path, options);
};

GlobalStateStore.prototype.hydrate = function(newState: unknown) {
  const validation = StateValidators.validateState(newState);
  // @ts-expect-error strict migration — TS2769
  if (!validation.valid) { this.telemetry.trackError(new Error(validation.error), { action: 'hydrate' }); log('error', 'Hydrate failed:', validation.error); return false; }
  this.state = deepClone(newState);
  this.telemetry.track(STATE_EVENTS.HYDRATED, {});
  this.emit(EVENTS.STATE_HYDRATED, { state: this.getState() });
  return true;
};

GlobalStateStore.prototype.reset = function() {
  const prevState = this.getState();
  this.state = deepClone(INITIAL_STATE);
  notifySubscribers(this.subscribers, prevState, this.getState(), { type: ACTIONS.RESET_STATE }, this.telemetry);
  this.telemetry.track(STATE_EVENTS.RESET, {});
  this.emit(EVENTS.STATE_RESET, { state: this.getState() });
};

GlobalStateStore.prototype.destroy = function() {
  if (this.isDestroyed) return;
  this.subscribers.clear();
  StateMiddleware.clear();
  this.telemetry.destroy();
  this.isDestroyed = true;
  this.isInitialized = false;
  this.eventBus = null;
  _ports.eventBus = null;
  _ports._initialized = false;
  this.emit(EVENTS.DESTROYED, {});
};

GlobalStateStore.prototype.getSubscriberCount = function() { return this.subscribers.size; };
GlobalStateStore.prototype.getTelemetryHistory = function() { return this.telemetry.getHistory(); };

GlobalStateStore.prototype.healthCheck = function() {
  const state = this.getState();
  const checks = { initialized: this.isInitialized, notDestroyed: !this.isDestroyed, hasEventBus: !!this.eventBus, subscribersHealthy: this.subscribers.size < 100, sessionValid: StateValidators.validateSession(state.session).valid, stateValid: StateValidators.validateState(state).valid, hasPermissionsState: !!state.permissions, hasEnforcementState: !!(state.permissions && state.permissions.enforcement), lowFailureRate: metrics.dispatches === 0 || (metrics.dispatchesFailed / metrics.dispatches) < 0.2, portsInitialized: _ports._initialized };
  let passed = 0, total = 0;
  for (const k in checks) { if ((checks as Record<string, unknown>).hasOwnProperty(k)) { total++; if ((checks as Record<string, boolean>)[k]) passed++; } }
  return { status: passed === total ? 'HEALTHY' : (passed >= 7 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/${total}`, healthy: passed >= 8, checks, subscriberCount: this.subscribers.size, metrics: Object.assign({}, metrics), emitMetrics: Object.assign({}, _emitMetrics), moduleId: MODULE_ID, version: VERSION, portsInitialized: _ports._initialized, p0Enterprise: true, p24Instrumented: true, timestamp: Date.now() };
};

GlobalStateStore.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, isInitialized: this.isInitialized, isDestroyed: this.isDestroyed, subscriberCount: this.subscribers.size, hasEventBus: !!this.eventBus, portsInitialized: _ports._initialized, metrics: Object.assign({}, metrics), emitMetrics: Object.assign({}, _emitMetrics), telemetryStats: this.telemetry.getTrackerStats(), stateKeys: Object.keys(this.state), permissionsMode: this.state && this.state.permissions ? this.state.permissions.mode : 'unknown', enforcementEnabled: this.state && this.state.permissions && this.state.permissions.enforcement ? this.state.permissions.enforcement.enabled : false, timestamp: Date.now() };
};

GlobalStateStore.prototype.exportState = function() {
  return { state: this.getState(), subscriberCount: this.getSubscriberCount(), telemetry: this.telemetry.export(), healthCheck: this.healthCheck(), info: this.info(), timestamp: new Date().toISOString() };
};

function getEmitMetrics() { return Object.assign({}, _emitMetrics); }

const store = new (GlobalStateStore as unknown as new () => typeof GlobalStateStore.prototype)();
export default store;
export { GlobalStateStore, MODULE_ID, VERSION, getEmitMetrics };
