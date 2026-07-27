// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.ports.panel
// PURPOSE: Main - Panel Port
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   createPanelPort() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   loadPanel() — exported function
//   unloadPanel() — exported function
//   getCurrentPanel() — exported function
//   getCurrentModule() — exported function
//   getModule() — exported function
//   isLoading() — exported function
//   isLoaded() — exported function
//   getLoadedPanels() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';

const MODULE_ID = 'components.main.ports.panel';
const VERSION = '2.4.0-P18EC';

interface EventBusPort {
  emit?(event: string, data: Record<string, unknown>): void;
  [key: string]: unknown;
}

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts(): void { Ports.init(); }
function _getPort(name: 'eventBus'): EventBusPort | null;
function _getPort(name: string): Record<string, unknown> | null;
function _getPort(name: string): Record<string, unknown> | null { return Ports.get(name) as Record<string, unknown> | null; }
export function injectPorts(p: Record<string, unknown>): boolean { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { currentPanel: string | null; currentModule: Record<string, unknown> | null; loadedPanels: Record<string, Record<string, unknown>>; loadedModules: Record<string, Record<string, unknown>>; loading: boolean } = { currentPanel: null, currentModule: null, loadedPanels: {}, loadedModules: {}, loading: false };
const _metrics = { loads: 0, loadSuccesses: 0, loadFailures: 0, unloads: 0, mounts: 0, errors: 0 };

function _emit(eventName: string, data: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }

// Build panel path from panelId
function _getPanelPath(panelId: string) {
  // Handle different panel ID formats
  // panel-01, panel-02, etc -> /components/panels/panel-01/index.js
  if (panelId.match(/^panel-\d+$/)) {
    return `/components/panels/${panelId}/index.js`;
  }
  // Already a path
  if (panelId.startsWith('/') || panelId.includes('.js')) {
    return panelId;
  }
  // Default: assume it's in panels folder
  return `/components/panels/${panelId}/index.js`;
}

async function loadPanel(panelId: string, options: Record<string, unknown> = {}) {
  _metrics.loads++;
  options = options || {};
  _state.loading = true;
  _emit(PANEL_EVENTS.LOAD_REQUEST, { panelId });
  
  try {
    // Check if already loaded
    if (_state.loadedModules[panelId]) {
      _state.currentPanel = panelId;
      _state.currentModule = _state.loadedModules[panelId];
      _state.loading = false;
      _emit(PANEL_EVENTS.LOADED, { panelId, cached: true });
      return _state.loadedModules[panelId];
    }
    
    // Dynamic import of the panel module
    const panelPath = _getPanelPath(panelId);
    const module = await import(panelPath);
    
    // Store the loaded module
    _state.loadedModules[panelId] = module;
    _state.loadedPanels[panelId] = { loadedAt: Date.now(), options, path: panelPath };
    _state.currentPanel = panelId;
    _state.currentModule = module;
    _state.loading = false;
    _metrics.loadSuccesses++;
    
    _emit(PANEL_EVENTS.LOADED, { panelId, path: panelPath });
    return module;
  } catch (error: any) {
    _metrics.loadFailures++;
    _metrics.errors++;
    _state.loading = false;
    _emit(PANEL_EVENTS.ERROR, { panelId, error: error.message });
    throw error;
  }
}

function unloadPanel(panelId: string) {
  _metrics.unloads++;
  // @ts-expect-error strict migration — TS2322
  panelId = panelId || _state.currentPanel;
  if (_state.loadedPanels[panelId]) {
    delete _state.loadedPanels[panelId];
    delete _state.loadedModules[panelId];
    _emit(PANEL_EVENTS.UNMOUNTED, { panelId });
  }
  if (_state.currentPanel === panelId) {
    _state.currentPanel = null;
    _state.currentModule = null;
  }
  return { ok: true };
}

function getCurrentPanel() { return _state.currentPanel; }
function getCurrentModule() { return _state.currentModule; }
function isLoading() { return _state.loading; }
function isLoaded(panelId: string) { return !!_state.loadedModules[panelId]; }
function getLoadedPanels() { return Object.keys(_state.loadedPanels); }
function getModule(panelId: string) { return _state.loadedModules[panelId] || null; }

function init(ctx: Record<string, unknown> & { ports?: Record<string, unknown> }) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { hasCurrentPanel: { ok: !!_state.currentPanel, severity: 'info' }, notLoading: { ok: !_state.loading, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, currentPanel: _state.currentPanel, loadedPanelsCount: Object.keys(_state.loadedPanels).length, loadedPanels: Object.keys(_state.loadedPanels), isLoading: _state.loading, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export function createPanelPort(options: Record<string, unknown> & { ports?: Record<string, unknown> }) { options = options || {}; init(options); return { loadPanel, unloadPanel, getCurrentPanel, getCurrentModule, getModule, isLoading, isLoaded, getLoadedPanels, healthCheck, info, VERSION, MODULE_ID }; }

export { MODULE_ID, VERSION, init, loadPanel, unloadPanel, getCurrentPanel, getCurrentModule, getModule, isLoading, isLoaded, getLoadedPanels, healthCheck, info };
export default { MODULE_ID, VERSION, createPanelPort, init, loadPanel, unloadPanel, getCurrentPanel, getCurrentModule, getModule, isLoading, isLoaded, getLoadedPanels, healthCheck, info, injectPorts, getPorts };
