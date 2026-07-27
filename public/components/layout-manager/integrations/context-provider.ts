// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-FASE-C)
// ═══════════════════════════════════════════════════════════════
// MODULE: layout-manager.integrations.context-provider
// PURPOSE: Layout Manager - ContextProvider Integration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict from /core/runtime/enterprise/strict-mode.js
//   layoutStore from ../state/store.js
//   trackLayoutEvent from ../telemetry/tracker.js
//   getCurrentState, getAllowedTransitions from ../core/state-machine.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setDebug() — exported function
//   getRetryState() — exported function
//   isConnected() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   sync() — exported function
//   setup() — exported function
//   cleanup() — exported function
//   retry() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Core
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import { layoutStore } from '../state/store.js';
import { trackLayoutEvent } from '../telemetry/tracker.js';
import { getCurrentState, getAllowedTransitions } from '../core/state-machine.js';

const MODULE_ID = 'layout-manager.integrations.context-provider';
const VERSION = '1.5.0-FASE-C';
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_BASE_DELAY = 300;

const hasWindow = typeof window !== 'undefined';

// ============================================================================
// CONTEXTPROVIDER RESOLUTION (Core.windowAdapter only in strict mode)
// ============================================================================

/**
 * Resolve ContextProvider via Core.windowAdapter
 * @contract STRICT_MODE - Em modo strict, sem fallback para window.*
 * @returns {Object|null}
 */
function _getContextProvider() {
  if (!hasWindow) return null;

  // Primary: Core.windowAdapter (único canal — Fase C)
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    let cp = window.Core.windowAdapter.get('ContextProvider');
    if (cp) return cp;
  }

  return null;
}

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

let _debug = false;
let contextProviderCleanups: Array<() => void> = [];
let _retryState = { attempts: 0, connected: false };
let _metrics = { syncs: 0 };

function _log(level: string, msg: string, ctx?: unknown) { if (!ctx) ctx = {}; const logger = _getPort('logger'); if (!logger) return; if (level === 'error') { if (logger.error) logger.error(`[${MODULE_ID}] ${msg}`, ctx); return; } if (level === 'warn') { if (logger.warn) logger.warn(`[${MODULE_ID}] ${msg}`, ctx); return; } if (_debug && logger.debug) logger.debug(`[${MODULE_ID}] ${msg}`, ctx); }

function setDebug(debug: boolean) { _debug = debug; }
function getRetryState() { return Object.assign({}, _retryState); }
function isConnected() { return _retryState.connected; }
function getMetrics() { return Object.assign({}, _metrics); }
function resetMetrics() { _metrics = { syncs: 0 }; _retryState = { attempts: 0, connected: false }; }

function sync() {
  let cp = _getContextProvider();
  if (!cp || !cp.set) return;
  try {
    const snapshot = { layoutState: getCurrentState(), breakpoint: layoutStore.getBreakpoint(), dimensions: layoutStore.getDimensions(), orientation: layoutStore.get('orientation'), compact: layoutStore.isCompact(), sidebarCollapsed: layoutStore.isSidebarCollapsed(), sidebarMobileOpen: layoutStore.isSidebarMobileOpen(), fullscreen: layoutStore.isFullscreen(), globalLoading: layoutStore.isGlobalLoading(), scrollLocked: layoutStore.isScrollLocked(), preloaderActive: layoutStore.isPreloaderActive(), modalOpen: layoutStore.isModalOpen(), mode: layoutStore.get('mode'), gridColumns: layoutStore.get('gridColumns'), lastChange: layoutStore.get('lastChange'), allowedTransitions: getAllowedTransitions(), compliance: 'ENTERPRISE-AAA' };
    cp.set('layout', snapshot, { owner: 'LayoutManager', silent: true });
    _metrics.syncs++;
    _log('info', 'ContextProvider synced');
  } catch (error: any) { _log('error', `ContextProvider sync error: ${error.message}`); }
}

function setup(attempt?: number): Promise<boolean> {
  if (!attempt) attempt = 1;
  _retryState.attempts = attempt;
  const cp = _getContextProvider();
  if (!cp || !cp.set) {
    if (attempt < MAX_RETRY_ATTEMPTS) {
      const delay = RETRY_BASE_DELAY * attempt;
      _log('warn', `ContextProvider not available, retry ${attempt}/${MAX_RETRY_ATTEMPTS} in ${delay}ms`);
      return new Promise<void>(r => { setTimeout(r, delay); }).then(() => setup(attempt! + 1));
    }
    _log('error', 'ContextProvider not available after max retries');
    trackLayoutEvent('layout:context-provider:retry-exhausted', { attempts: attempt, strictMode: isStrict() });
    return Promise.resolve(false);
  }
  try {
    sync();
    _retryState.connected = true;
    trackLayoutEvent('layout:context-provider:connected', { attempts: attempt });
    _log('info', `ContextProvider connected (attempt ${attempt})`);
    return Promise.resolve(true);
  } catch (error: any) { _log('error', `ContextProvider integration error: ${error.message}`); return Promise.resolve(false); }
}

function cleanup() { contextProviderCleanups.forEach(fn => { try { if (typeof fn === 'function') fn(); } catch (e) {} }); contextProviderCleanups = []; _retryState.connected = false; }
function retry() { cleanup(); _retryState.attempts = 0; return setup(1); }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), connected: _retryState.connected, strictMode: isStrict(), metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), connected: _retryState.connected, strictMode: isStrict(), retryState: _retryState, metrics: _metrics }; }

export { VERSION, MODULE_ID, setDebug, getRetryState, isConnected, getMetrics, resetMetrics, sync, setup, cleanup, retry, healthCheck, info, injectPorts, getPorts };
