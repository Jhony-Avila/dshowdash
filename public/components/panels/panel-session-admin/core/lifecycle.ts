// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-session-admin.core.lifecycle
// PURPOSE: Panel Session Admin - Lifecycle Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_INTENTS from /core/runtime/events/catalog/ui.events.js
//   createPanelPorts from /core/runtime/ports-profiles.js
//   LOCAL_EVENTS from ./contracts.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   mount() — exported function
//   unmount() — exported function
//   refresh() — exported function
//   retry() — exported function
//   isMounted() — exported function
//   getConfig() — exported function
//   getContainer() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
//   intent
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import * as Store from '../state/store.js';
import * as BackendAPI from '../adapters/backend-api.js';
import * as Renderer from '../ui/renderer.js';
import * as Template from '../ui/template.js';
import * as Events from '../ui/events.js';
import { LOCAL_EVENTS } from './contracts.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-session-admin.core.lifecycle';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: string, ...rest: any[]) {
  const args = rest;
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  switch (level) {
    case 'error': if (logger.error) logger.error(...[prefix].concat(args)); break;
    case 'warn': if (logger.warn) logger.warn(...[prefix].concat(args)); break;
    case 'info': if (logger.info) logger.info(...[prefix].concat(args)); break;
    default: if (logger.debug) logger.debug(...[prefix].concat(args));
  }
};

let _mounted = false;
let _cssLoaded = false;
let _mountedAt: number | null = null;
let _container: HTMLElement | null = null;
let _config: Record<string, any> = {};

const CSS_PATH = '/components/panels/panel-session-admin/styles/index.css';
const CSS_ID = 'psa-styles';

function _emit(event?: string, data?: Record<string, unknown>) {
  if (data === undefined) data = {};
  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) {
    eventBus.emit(event, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
  }
}

function _emitIntent(intent: string, data?: Record<string, unknown>) {
  _initPorts();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(intent, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
}

function _loadCSS() {
  if (_cssLoaded) return Promise.resolve({ ok: true });
  const existing = document.getElementById(CSS_ID) || document.querySelector('link[href*="panel-session-admin/styles"]');
  if (existing) { _cssLoaded = true; _log('debug', 'CSS already loaded'); return Promise.resolve({ ok: true }); }
  return new Promise(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = CSS_PATH; link.id = CSS_ID;
    const timeout = setTimeout(() => { _log('warn', 'CSS load timeout, continuing anyway'); _cssLoaded = true; resolve({ ok: true, warning: 'timeout' }); }, 5000);
    link.onload = () => { clearTimeout(timeout); _cssLoaded = true; _log('debug', 'CSS loaded'); resolve({ ok: true }); };
    link.onerror = () => { clearTimeout(timeout); _log('error', 'CSS load failed'); resolve({ ok: false, error: 'CSS load failed' }); };
    document.head.appendChild(link);
  });
}

function _unloadCSS() { const link = document.getElementById(CSS_ID); if (link) { link.remove(); _cssLoaded = false; _log('debug', 'CSS unloaded'); } }

function _loadConfig(signal: AbortSignal | undefined) {
  return fetch('/components/panels/panel-session-admin/config.json', { signal }).then(res => {
    if (res.ok) { return res.json().then(data => { _config = data; _log('debug', 'Config loaded'); return _config; }); }
    return _config;
  }).catch(() => { _log('warn', 'Config load failed, using defaults'); return _config; });
}

function mount(container: HTMLElement, config: Record<string, unknown> = {}) {
  _initPorts();
  if (_mounted) { _log('warn', 'Already mounted, skipping'); return Promise.resolve({ ok: true, warning: 'already_mounted' }); }
  if (!container) { _log('error', 'Container required'); return Promise.resolve({ ok: false, error: 'Container required' }); }
  _container = container;
  _container.setAttribute('data-panel', 'panel-session-admin');
  return _loadConfig(undefined as any).then(() => {
    Object.assign(_config, config);
    return _loadCSS();
  }).then(cssResult => {
    if (!(cssResult as any).ok) { _log('warn', 'CSS failed but continuing:', (cssResult as any).error); }
    const authResult = Store.ensureAuth();
    if (!authResult.ok) {
      // @ts-expect-error strict migration — TS2345
      Renderer.renderAuthRequired(_container, _config);
      _emit(LOCAL_EVENTS.AUTH_REQUIRED, { reason: 'mount-no-auth' });
      _mounted = true; _mountedAt = Date.now();
      return { ok: false, error: 'AUTH_REQUIRED' };
    }
    BackendAPI.initAbortController();
    // @ts-expect-error strict migration — TS2345
    Renderer.renderSkeleton(_container);
    return refresh().then(() => {
      _mounted = true; _mountedAt = Date.now();
      _emit(LOCAL_EVENTS.MOUNTED, { moduleId: MODULE_ID });
      _log('debug', 'Lifecycle mounted successfully');
      return { ok: true };
    });
  }).catch(err => {
    _log('error', 'Mount error:', err);
    // @ts-expect-error strict migration — TS2345
    Renderer.renderError(_container, err.message || 'Erro ao carregar sessões', retry);
    return { ok: false, error: err.message };
  });
}

function refresh() {
  _initPorts();
  if (Store.isRefreshInProgress()) { _log('debug', 'Refresh already in progress, skipping'); return Promise.resolve({ ok: false, warning: 'already_in_progress' }); }
  const authResult = Store.ensureAuth();
  // @ts-expect-error strict migration — TS2345
  if (!authResult.ok) { Renderer.renderAuthRequired(_container, _config); return Promise.resolve({ ok: false, error: 'AUTH_REQUIRED' }); }
  _emit(LOCAL_EVENTS.REFRESH_START, undefined);
  Store.dispatch({ type: 'SET_LOADING', payload: true });
  Store.dispatch({ type: 'SET_REFRESH_IN_PROGRESS', payload: true });
  const startTime = Date.now();
  return BackendAPI.loadAllSessions().then(sessions => {
    // scope=all: backend decide — admin (level>=80, gate server-side) recebe TODAS (cross-user, read-only);
    // não-admin recebe só as próprias. Sem dependência da detecção de admin no front.
    Store.dispatch({ type: 'SET_SESSIONS', payload: sessions });
  }).then(() => {
    Store.dispatch({ type: 'SET_ERROR', payload: null });
    Store.dispatch({ type: 'SET_LOADING', payload: false });
    Store.dispatch({ type: 'SET_REFRESH_IN_PROGRESS', payload: false });
    Store.dispatch({ type: 'SET_LAST_REFRESH', payload: Date.now() });
    _renderUI();
    const duration = Date.now() - startTime;
    _emit(LOCAL_EVENTS.REFRESH_SUCCESS, { duration, count: Store.getSessions().length });
    _log('debug', `Refresh completed in ${duration}ms`);
    return { ok: true, duration };
  }).catch(error => {
    Store.dispatch({ type: 'SET_ERROR', payload: error.message });
    Store.dispatch({ type: 'SET_LOADING', payload: false });
    Store.dispatch({ type: 'SET_REFRESH_IN_PROGRESS', payload: false });
    _renderUI();
    _emit(LOCAL_EVENTS.REFRESH_ERROR, { error: error.message });
    _log('error', 'Refresh failed:', error);
    return { ok: false, error: error.message };
  });
}

// @ts-expect-error strict migration — TS2345
function retry() { Store.dispatch({ type: 'SET_ERROR', payload: null }); Renderer.renderSkeleton(_container); return refresh(); }

function _renderUI() {
  if (!_container) return;
  const currentState = Store.getState();
  Template.render(_container, currentState, _config);
  // @ts-expect-error strict migration — TS2345
  Events.setup(_container, currentState, _getHandlers(), _config);
}

function _getHandlers() {
  return {
    refresh, retry,
    setFilter(key: string, value: string) { const payload: Record<string, string> = {}; payload[key] = value; Store.dispatch({ type: 'SET_FILTER', payload }); _renderUI(); },
    terminateSession(sessionToken: string) {
      return BackendAPI.terminateSession(sessionToken).then(() => {
        Store.dispatch({ type: 'INCREMENT_TERMINATE' });
        _showToast(_config.i18n && _config.i18n.successTerminate ? _config.i18n.successTerminate : 'Sessão encerrada com sucesso');
        _emit(LOCAL_EVENTS.SESSION_TERMINATED, { sessionToken });
        return refresh().then(() => ({
          ok: true
        }));
      }).catch(error => { _showToast(_config.i18n && _config.i18n.errorTerminate ? _config.i18n.errorTerminate : 'Erro ao encerrar sessão', 'error'); return { ok: false, error: error.message }; });
    },
    terminateAllOthers() {
      return BackendAPI.terminateAllOthers().then(() => {
        Store.dispatch({ type: 'INCREMENT_TERMINATE' });
        _showToast(_config.i18n && _config.i18n.successTerminateAll ? _config.i18n.successTerminateAll : 'Outras sessões encerradas');
        _emit(LOCAL_EVENTS.SESSION_TERMINATE_ALL, undefined);
        return refresh().then(() => ({
          ok: true
        }));
      }).catch(error => { _showToast(_config.i18n && _config.i18n.errorTerminate ? _config.i18n.errorTerminate : 'Erro ao encerrar sessões', 'error'); return { ok: false, error: error.message }; });
    }
  };
}

function _showToast(message?: string, type?: string) {
  if (type === undefined) type = 'success';
  _emitIntent(UI_INTENTS.SHOW_TOAST, { message, type });
  const toast = _getPort('toast');
  if (toast && toast.show) { toast.show(message, type); }
}

function unmount() {
  if (!_mounted) return { ok: true };
  try { Events.destroy(); BackendAPI.cleanupAbortController(); (Store as any).reset(); } catch (err) { _log('error', 'Unmount error:', err); }
  if (_container) { _container.innerHTML = ''; }
  _mounted = false; _mountedAt = null; _container = null; _config = {};
  _emit(LOCAL_EVENTS.UNMOUNTED, undefined);
  _log('debug', 'Lifecycle unmounted');
  return { ok: true };
}

function isMounted() { return _mounted; }
function getConfig() { return Object.assign({}, _config); }
function getContainer() { return _container; }

function healthCheck() {
  const logger = _getPort('logger');
  const storeHealth = Store.healthCheck ? Store.healthCheck() : null;
  const apiHealth = BackendAPI.healthCheck ? BackendAPI.healthCheck() : null;
  return { status: _mounted ? 'HEALTHY' : 'DEGRADED', mounted: _mounted, mountedAt: _mountedAt, uptime: _mountedAt ? Date.now() - _mountedAt : 0, cssLoaded: _cssLoaded, hasContainer: !!_container, store: storeHealth, api: apiHealth, loggerReady: !!logger, portsInitialized: Ports.isInitialized(), usingP18Intents: true, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

function getVersion() { return VERSION; }

export { VERSION, MODULE_ID, mount, unmount, refresh, retry, isMounted, getConfig, getContainer, healthCheck, getVersion };
export default { VERSION, MODULE_ID, mount, unmount, refresh, retry, isMounted, getConfig, getContainer, healthCheck, getVersion, injectPorts, getPorts };
