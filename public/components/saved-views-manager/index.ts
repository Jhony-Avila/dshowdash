// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.8.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.saved-views-manager
// PURPOSE: Saved views manager with CRUD operations and view persistence
// ───────────────────────────────────────────────────────────────
// @contract INIT - init() initializes saved views manager
// @contract DESTROY - destroy() destroys saved views manager
// @contract RESET - reset() resets saved views manager
// @contract LIST - list(options) lists saved views
// @contract GET - get(idOrKey) gets a saved view
// @contract GET_TYPES - getTypes() gets view types
// @contract CREATE - create(viewData) creates a saved view
// @contract UPDATE - update(viewId, updates) updates a saved view
// @contract SET_DEFAULT - setDefault(viewId) sets default view
// @contract REMOVE - remove(viewId) removes a saved view
// @contract APPLY - apply(viewId) applies a saved view
// @contract ON - on(event, callback) subscribes to events
// @contract OFF - off(event, callback) unsubscribes from events
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// IMPORTS: createUiPorts from /core/runtime/ports-profiles.js
// IMPORTS: SAVED_VIEWS_EVENTS from /core/runtime/events/index.js
// IMPORTS: MODULE_ID, VIEW_TYPES, createMetrics, logger from ./config.js
// IMPORTS: state functions from ./state.js
// IMPORTS: api functions from ./api.js
// IMPORTS: helpers functions from ./helpers.js
// PROVIDES: SavedViewsManager, init, destroy, reset, list, get, getTypes, create,
//           update, setDefault, remove, apply, on, off, getByType, getDefault,
//           getShared, getOwned, getViewById, getViewByKey, saveCurrentView,
//           getViews, getViewTypes, isInitialized, healthCheck, info, getMetrics,
//           injectPorts, getPorts, VIEW_TYPES, VERSION, MODULE_ID
// @changelog v2.8.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.7.0-STRICT-MODE: Strict mode integration
// @changelog v2.6.0-ENTERPRISE: ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { SAVED_VIEWS_EVENTS } from '/core/runtime/events/catalog/saved-views.events.js';
import { VERSION as MODULE_ID, VIEW_TYPES, createMetrics, logger } from './config.js';
import * as state from './state.js';
import * as api from './api.js';
import * as helpers from './helpers.js';

export const VERSION = '2.8.0-P2-ENTERPRISE';

const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = (): void => { Ports.init(); };
const _getPort = (name: string): Record<string, unknown> | null => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>): unknown => Ports.inject(p);
export const getPorts = (): Record<string, unknown> => Ports.snapshot();

const _isDebugEnabled = (): boolean => {
  const cfg = _getPort('config');
  return !!(cfg as Record<string, Record<string, unknown>> | null)?.app?.debug;
};

let _metrics = createMetrics();
const _listeners = new Map<string, Set<(data: Record<string, unknown>) => void>>();

const emit = (event: string, data: Record<string, unknown>): void => {
  const shortName = (typeof event === 'string' && event.indexOf('saved-views:') === 0) ? event.replace('saved-views:', '') : event;
  if (_listeners.has(shortName)) {
    for (const fn of _listeners.get(shortName)!) { try { fn(data); } catch (e) { logger.error('Listener error:', { e }); } }
  }
  const eb = _getPort('eventBus');
  if (eb && typeof (eb as Record<string, unknown>).emit === 'function') {
    const fullEvent = (typeof event === 'string' && event.indexOf('saved-views:') === 0) ? event : `saved-views:${event}`;
    (eb as Record<string, (e: string, d: Record<string, unknown>) => void>).emit(fullEvent, data);
  }
};

const on = (event: string, callback: (data: Record<string, unknown>) => void): (() => void) => { if (!_listeners.has(event)) _listeners.set(event, new Set()); _listeners.get(event)!.add(callback); return () => { _listeners.get(event)!.delete(callback); }; };
const off = (event: string, callback?: (data: Record<string, unknown>) => void): void => { if (_listeners.has(event)) { if (callback) _listeners.get(event)!.delete(callback); else _listeners.delete(event); } };

const trackTelemetry = (action: string, data: Record<string, unknown> = {}): void => {
  _metrics.lastActivity = Date.now();
  const tt = _getPort('telemetryTracker');
  if (tt && typeof (tt as Record<string, unknown>).track === 'function') {
    (tt as Record<string, (key: string, payload: Record<string, unknown>) => void>).track(`${MODULE_ID}:${action}`, { timestamp: Date.now(), ...data });
  }
};

const list = (options: Record<string, unknown> = {}): Promise<import('./state.js').SavedView[]> => api.list(options, state, _metrics, trackTelemetry, emit);
const get = (idOrKey: number | string): Promise<import('./state.js').SavedView> => api.get(idOrKey, trackTelemetry, emit);
const getTypes = (): Promise<import('./state.js').ViewType[]> => api.getTypes(state, trackTelemetry);
const create = (viewData: Record<string, unknown>): Promise<import('./api.js').ApiResponse> => api.create(viewData, list, _metrics, trackTelemetry, emit);
const update = (viewId: number | string, updates: Record<string, unknown>): Promise<import('./api.js').ApiResponse> => api.update(viewId, updates, list, _metrics, trackTelemetry, emit);
const setDefault = (viewId: number | string): Promise<import('./api.js').ApiResponse> => api.setDefault(viewId, state, trackTelemetry, emit);
const remove = (viewId: number | string): Promise<import('./api.js').ApiResponse> => api.remove(viewId, state, _metrics, trackTelemetry, emit);
const apply = (viewId: number | string): Promise<import('./state.js').SavedView | null> => helpers.apply(viewId, get, _metrics, trackTelemetry, emit);
const saveCurrentView = (key: string, label: string, type: string, config: Record<string, unknown>, options: Record<string, unknown> = {}): Promise<unknown> => helpers.saveCurrentView(key, label, type, config, options, create);

const init = (): Promise<boolean> => {
  if (state.isInitialized()) return Promise.resolve(true);
  _initPorts();
  api.createAbortController();
  return list().then(() => {
    state.setInitialized(true);
    trackTelemetry('ready', { viewsCount: state.getViews().length });
    emit(SAVED_VIEWS_EVENTS.READY, { initialized: true, viewsCount: state.getViews().length });
    logger.info(`${VERSION} initialized with ${state.getViews().length} views`);
    return true;
  }).catch((error: Error) => { logger.error('Init error:', { error }); emit(SAVED_VIEWS_EVENTS.ERROR, { action: 'init', error: error.message }); return false; });
};

const destroy = (): void => { api.abortAll(); _listeners.clear(); state.reset(); logger.info('Destroyed'); };
const reset = (): void => { destroy(); _metrics = createMetrics(); logger.info('Reset complete'); };

const healthCheck = (): Record<string, unknown> => {
  const checks: Record<string, boolean> = { initialized: state.isInitialized(), hasViews: state.getViews().length >= 0, abortControllerActive: !!api.getAbortController() && !api.getAbortController()!.signal.aborted, lowErrorRate: _metrics.errorCount < (_metrics.listCount + _metrics.createCount) * 0.1 || _metrics.listCount === 0, portsInitialized: Ports.isInitialized() };
  let passed = 0, total = 0;
  for (const key of Object.keys(checks)) { total++; if (checks[key]) passed++; }
  const status = passed === total ? 'HEALTHY' : passed >= total * 0.5 ? 'DEGRADED' : 'UNHEALTHY';
  return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};

const getStatus = (): Record<string, unknown> => ({ name: MODULE_ID, version: VERSION, initialized: state.isInitialized(), viewsCount: state.getViews().length, ownedCount: state.getOwned().length, sharedCount: state.getShared().length, viewTypesCount: state.getViewTypes().length, metrics: { ..._metrics }, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() });
const info = (): Record<string, unknown> => ({ version: VERSION, moduleId: MODULE_ID, initialized: state.isInitialized(), portsInitialized: Ports.isInitialized(), viewsCount: state.getViews().length, ownedCount: state.getOwned().length, sharedCount: state.getShared().length, metrics: { ..._metrics } });
const getMetrics = (): Record<string, unknown> => ({ ..._metrics });

const SavedViewsManager = {
  init, destroy, reset, list, get, getTypes, create, update, setDefault, remove, apply, on, off,
  getByType: state.getByType, getDefault: state.getDefault, getShared: state.getShared, getOwned: state.getOwned,
  getViewById: state.getViewById, getViewByKey: state.getViewByKey, saveCurrentView, getViews: state.getViews,
  getViewTypes: state.getViewTypes, isInitialized: state.isInitialized,
  healthCheck, getStatus, info, getMetrics, getVersion: (): string => VERSION, injectPorts, getPorts,
  VIEW_TYPES, VERSION, MODULE_ID
};

if (typeof window !== 'undefined') {
  // DevTools sempre permitido
  window.__dev = window.__dev || {};
  window.__dev.savedViewsManager = SavedViewsManager;

  // Exposição global apenas fora de strict mode
  if (!isStrict()) {
    (window as unknown as Record<string, unknown>).SavedViewsManager = SavedViewsManager;
  } else {
    Object.defineProperty(window, 'SavedViewsManager', {
      get() {
        recordViolation('WINDOW_ACCESS', { module: MODULE_ID, property: 'SavedViewsManager', access: 'global-access' });
        return SavedViewsManager;
      },
      configurable: true
    });
  }
}

export default SavedViewsManager;
export { SavedViewsManager, VIEW_TYPES, MODULE_ID };
