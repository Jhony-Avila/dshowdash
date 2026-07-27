// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.adapters.panel-loader
// PURPOSE: Main - Panel Loader Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_LOADER_EVENTS from /core/runtime/events/catalog/panel-loader.events.js
//   createCorePorts from /core/runtime/ports-profiles.js
//   PANEL_ID_PATHS, ITEM_TO_PANEL, CRITICAL_PANELS, resolvePanelPath, resolvePane...
//   LRUCache from ./lru-cache.js
//   retryWithBackoff from ./retry.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   createPanelLoaderAdapter() — exported function
//   PANEL_ID_PATHS — exported value
//   ITEM_TO_PANEL — exported value
//   CRITICAL_PANELS — exported value
//   resolvePanelPath — exported value
//   resolvePanelId — exported value
//   LRUCache — exported value
//   retryWithBackoff — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   cleanup() — exported function
//   loadPanel() — exported function
//   unloadPanel() — exported function
//   isLoaded() — exported function
//   isLoading() — exported function
//   getLoadedPanels() — exported function
//   getPanel() — exported function
//   ... and 2 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PANEL_LOADER_EVENTS } from '/core/runtime/events/catalog/panel-loader.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { PANEL_ID_PATHS, ITEM_TO_PANEL, CRITICAL_PANELS, resolvePanelPath, resolvePanelId } from './panel-paths.js';
import { LRUCache } from './lru-cache.js';
import { retryWithBackoff } from './retry.js';

const MODULE_ID = 'components.main.adapters.panel-loader';
const VERSION = '2.3.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; loadedPanels: Record<string, Record<string, unknown>>; loading: Record<string, Promise<Record<string, unknown>>> } = { initialized: false, loadedPanels: {}, loading: {} };
const _metrics = { loads: 0, cacheHits: 0, errors: 0 };
const _cache = new LRUCache(30, 10 * 60 * 1000);

function _emit(eventName: string, data: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }
function _track(eventName: string, payload: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

function loadPanel(panelId: string, options: Record<string, unknown> = {}) {
  options = options || {};
  const resolvedId = resolvePanelId(panelId);
  
  if (_state.loadedPanels[resolvedId] && !options.forceReload) {
    _metrics.cacheHits++;
    return Promise.resolve({ ok: true, cached: true, panel: _state.loadedPanels[resolvedId] });
  }
  
  // @ts-expect-error strict migration — TS2801
  if (_state.loading[resolvedId]) return _state.loading[resolvedId];
  
  _metrics.loads++;
  const startTime = Date.now();
  _emit(PANEL_LOADER_EVENTS.LOADING, { panelId: resolvedId });
  
  const panelPath = resolvePanelPath(resolvedId);
  
  // @ts-expect-error strict migration — TS2345
  _state.loading[resolvedId] = retryWithBackoff(() => import(panelPath), { maxRetries: 2, baseDelay: 300 }).then((module: Record<string, unknown>) => {
    const panel = { id: resolvedId, module, loadedAt: Date.now(), path: panelPath };
    _state.loadedPanels[resolvedId] = panel;
    _cache.set(resolvedId, panel);
    delete _state.loading[resolvedId];
    const loadTime = Date.now() - startTime;
    _emit(PANEL_LOADER_EVENTS.LOADED, { panelId: resolvedId, loadTime });
    _track('panel-loader:loaded', { panelId: resolvedId, loadTime });
    return { ok: true, panel, loadTime };
  }).catch(error => {
    delete _state.loading[resolvedId];
    _metrics.errors++;
    _emit(PANEL_LOADER_EVENTS.ERROR, { panelId: resolvedId, error: error.message });
    _track('panel-loader:error', { panelId: resolvedId, error: error.message });
    return { ok: false, error: error.message, panelId: resolvedId };
  });
  
  return _state.loading[resolvedId];
}

function unloadPanel(panelId: string) {
  const resolvedId = resolvePanelId(panelId);
  if (_state.loadedPanels[resolvedId]) {
    delete _state.loadedPanels[resolvedId];
    _cache.delete(resolvedId);
    _emit(PANEL_LOADER_EVENTS.UNLOADED, { panelId: resolvedId });
    return { ok: true };
  }
  return { ok: false, reason: 'Not loaded' };
}

function isLoaded(panelId: string) { return !!_state.loadedPanels[resolvePanelId(panelId)]; }
function isLoading(panelId: string) { return !!_state.loading[resolvePanelId(panelId)]; }
function getLoadedPanels() { return Object.keys(_state.loadedPanels); }
function getPanel(panelId: string) { return _state.loadedPanels[resolvePanelId(panelId)] || null; }

function init(ctx: Record<string, unknown>) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>);
  _state.initialized = true;
  return { ok: true, version: VERSION };
}

function cleanup() {
  _state.loadedPanels = {};
  _state.loading = {};
  _cache.clear();
  _state.initialized = false;
  return { ok: true };
}

function healthCheck() {
  return {
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
    score: 100,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      initialized: { ok: _state.initialized, severity: 'info' },
      portsInitialized: { ok: Ports.isInitialized(), severity: 'info' }
    },
    metrics: _metrics,
    cacheStats: _cache.getStats()
  };
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _state.initialized,
    loadedCount: Object.keys(_state.loadedPanels).length,
    loadingCount: Object.keys(_state.loading).length,
    metrics: _metrics,
    cacheStats: _cache.getStats(),
    portsInitialized: Ports.isInitialized()
  };
}

// Factory function for adapter creation (expected by PanelLoaderAdapter.js wrapper)
export function createPanelLoaderAdapter(options: Record<string, unknown>) {
  options = options || {};
  init(options);
  return {
    loadPanel,
    unloadPanel,
    isLoaded,
    isLoading,
    getLoadedPanels,
    getPanel,
    cleanup,
    healthCheck,
    info,
    resolvePanelPath,
    resolvePanelId,
    VERSION,
    MODULE_ID
  };
}

// Re-export panel-paths, lru-cache, retry for wrapper compatibility
export { PANEL_ID_PATHS, ITEM_TO_PANEL, CRITICAL_PANELS, resolvePanelPath, resolvePanelId };
export { LRUCache };
export { retryWithBackoff };

export { MODULE_ID, VERSION, init, cleanup, loadPanel, unloadPanel, isLoaded, isLoading, getLoadedPanels, getPanel, healthCheck, info };

export default {
  MODULE_ID,
  VERSION,
  createPanelLoaderAdapter,
  init,
  cleanup,
  loadPanel,
  unloadPanel,
  isLoaded,
  isLoading,
  getLoadedPanels,
  getPanel,
  healthCheck,
  info,
  injectPorts,
  getPorts,
  PANEL_ID_PATHS,
  ITEM_TO_PANEL,
  CRITICAL_PANELS,
  LRUCache,
  retryWithBackoff
};
