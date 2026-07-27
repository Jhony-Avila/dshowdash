// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-08.core.controller
// PURPOSE: Panel-08 Controller Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_INTENTS from /core/runtime/events/catalog/ui.events.js
//   createPanelPorts from /core/runtime/ports-profiles.js
//   LOCAL_EVENTS, CONFIG from ./contracts.js
//   tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   mount() — exported function
//   unmount() — exported function
//   refresh() — exported function
//   acknowledgeAlert — exported value
//   toggleExpand() — exported function
//   startAutoRefresh() — exported function
//   toggleAutoRefresh() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
//   intent
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { LOCAL_EVENTS, CONFIG } from './contracts.js';
import * as BackendAPI from '../adapters/backend-api.js';
import * as Store from '../state/store.js';
import * as Template from '../ui/template.js';
import * as Events from '../ui/events.js';
import tracker from '../telemetry/tracker.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-08.core.controller';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);

export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _container: HTMLElement | null = null;
let _initialized = false;
let _config: Record<string, unknown> = {};
let _autoRefreshInterval: ReturnType<typeof setInterval> | null = null;
let _autoRefreshEnabled = true;
let _countdown = 60;
const _expandedIds = new Set();

const _emit = (event: string, data?: Record<string, unknown>) => {
  const eb = _getPort('eventBus');
  if (eb?.emit) { eb.emit(event, { ...(data || {}), source: MODULE_ID, timestamp: Date.now() }); }
};

const _emitIntent = (intent: string, data?: Record<string, unknown>) => {
  _initPorts();
  const eb = _getPort('eventBus');
  if (eb?.emit) eb.emit(intent, { source: MODULE_ID, timestamp: Date.now(), ...(data || {}) });
};

const _showToast = (message: string, type = 'success') => {
  _emitIntent(UI_INTENTS.SHOW_TOAST, { message, type });
};

export const init = (container: HTMLElement | null, config: Record<string, unknown> = {}) => {
  if (_initialized) return Promise.resolve({ ok: true });
  _initPorts();
  _container = container;
  _config = config;
  _initialized = true;
  return Promise.resolve({ ok: true });
};

export const mount = () => {
  if (!_initialized || !_container) return Promise.resolve({ ok: false, error: 'NOT_INITIALIZED' });
  // @ts-expect-error strict migration — TS2345
  Events.setup(_container, Store.getState(), _getHandlers(), _config);
  Store.subscribe(_onStateChange);
  _onStateChange(Store.getState());
  _setupKeyboardShortcuts();
  if (_autoRefreshEnabled) startAutoRefresh();
  return refresh().then(() => ({ ok: true }));
};

export const unmount = () => {
  _stopAutoRefresh();
  _removeKeyboardShortcuts();
  Events.destroy();
  Store.reset();
  _expandedIds.clear();
  _container = null;
  _initialized = false;
  return { ok: true };
};

export const refresh = () => {
  if (Store.isRefreshInProgress()) return Promise.resolve({ ok: false });

  _emit(LOCAL_EVENTS.REFRESH_START);
  Store.dispatch({ type: 'SET_LOADING', payload: true });
  Store.dispatch({ type: 'SET_REFRESH_IN_PROGRESS', payload: true });
  tracker.trackRefreshStart();
  const startTime = Date.now();

  return BackendAPI.loadAlerts().then((result) => {
    if (result.ok) {
      Store.dispatch({ type: 'SET_ALERTS', payload: result.data });
      Store.dispatch({ type: 'SET_META', payload: result.meta });
      Store.dispatch({ type: 'SET_ERROR', payload: null });
      tracker.trackRefreshSuccess((result.data as unknown[])?.length || 0, Date.now() - startTime);

      _emit(LOCAL_EVENTS.REFRESH_SUCCESS);
    } else { throw new Error(result.error); }
    return { ok: true };
  }).catch((error: Error) => {
    Store.dispatch({ type: 'SET_ERROR', payload: error.message });
    tracker.trackRefreshError(error);
    _emit(LOCAL_EVENTS.REFRESH_ERROR, { error: error.message });
    return { ok: false, error: error.message };
  }).finally(() => {
    Store.dispatch({ type: 'SET_LOADING', payload: false });
    Store.dispatch({ type: 'SET_REFRESH_IN_PROGRESS', payload: false });
    Store.dispatch({ type: 'SET_LAST_REFRESH', payload: Date.now() });
  });
};


export const acknowledgeAlert = (alertId: number | string) => BackendAPI.acknowledgeAlert(alertId).then((result) => {
  if (result.ok) { Store.dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: alertId }); _showToast('Alerta reconhecido'); (tracker as any).track('alert:acknowledged', { alertId }); }
  return result;
});

export const toggleExpand = (alertId: number | string) => {
  if (_expandedIds.has(alertId)) _expandedIds.delete(alertId);
  else _expandedIds.add(alertId);
  _onStateChange(Store.getState());
};

export const startAutoRefresh = () => {
  if (_autoRefreshInterval) return;
  _autoRefreshEnabled = true;
  _countdown = Math.floor(CONFIG.REFRESH_INTERVAL / 1000);
  _autoRefreshInterval = setInterval(() => {
    if (document.hidden) return;
    _countdown--;
    if (_countdown <= 0) { refresh(); _countdown = Math.floor(CONFIG.REFRESH_INTERVAL / 1000); }
    _updateCountdownUI();
  }, 1000);

  // @ts-expect-error TS migration - TS2339
  tracker.track('autorefresh:start');
};

const _stopAutoRefresh = () => {
  if (_autoRefreshInterval) { clearInterval(_autoRefreshInterval); _autoRefreshInterval = null; }
  _autoRefreshEnabled = false;
};

export const toggleAutoRefresh = () => {
  if (_autoRefreshEnabled) { _stopAutoRefresh(); _showToast('Auto-refresh desativado', 'info'); }
  else { startAutoRefresh(); _showToast('Auto-refresh ativado'); }
  _onStateChange(Store.getState());

  // @ts-expect-error TS migration - TS2339
  tracker.track('autorefresh:toggle', { enabled: _autoRefreshEnabled });
  return _autoRefreshEnabled;
};

const _updateCountdownUI = () => {
  const el = _container?.querySelector('[data-countdown]');
  if (el) el.textContent = _autoRefreshEnabled ? `${_countdown}s` : 'Off';
};

let _keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
let _abortController: AbortController | null = null;
const _setupKeyboardShortcuts = () => {
  _abortController = new AbortController();
  _keyboardHandler = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
    const key = e.key.toLowerCase();
    if (key === 'r') { e.preventDefault(); refresh(); }
    else if (key === 'a') { e.preventDefault(); toggleAutoRefresh(); }
  };
  document.addEventListener('keydown', _keyboardHandler, { signal: _abortController.signal });
};

const _removeKeyboardShortcuts = () => { if (_abortController) { _abortController.abort(); _abortController = null; _keyboardHandler = null; } };

const _onStateChange = (state: Record<string, unknown>) => {
  if (!state) return;
  if (!_container) return;
  Template.render(_container, { ...state, expandedIds: _expandedIds, autoRefreshEnabled: _autoRefreshEnabled, countdown: _countdown }, _config);
  // @ts-expect-error strict migration — TS2345
  Events.setup(_container, state, _getHandlers(), _config);
};

const _getHandlers = () => ({ refresh, acknowledgeAlert, toggleExpand, toggleAutoRefresh, startAutoRefresh });

export const healthCheck = () => ({ status: _initialized ? 'healthy' : 'not_initialized', initialized: _initialized, autoRefreshEnabled: _autoRefreshEnabled, version: VERSION, portsInitialized: Ports.isInitialized(), usingP18Intents: true });
export const getVersion = () => VERSION;

export default { VERSION, MODULE_ID, init, mount, unmount, refresh, acknowledgeAlert, toggleExpand, toggleAutoRefresh, healthCheck, getVersion, injectPorts, getPorts };
