// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: layout-helpers
// PURPOSE: Layout Manager Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   setDebug() — exported function
//   getViewportSize() — exported function
//   getOrientation() — exported function
//   debounce() — exported function
//   throttle() — exported function
//   saveLayoutPreference() — exported function
//   loadLayoutPreference() — exported function
//   calculateGridColumns() — exported function
//   getGridColumnsMap() — exported function
//   isTouchDevice() — exported function
//   getDevicePixelRatio() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   resetMetrics() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '2.4.0-P17WI';
export const MODULE_ID = 'layout-helpers';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _debug = false;
let _metrics = { viewportCalls: 0, preferenceSaves: 0, preferenceSkipped: 0, preferenceLoads: 0, debouncesCreated: 0, throttlesCreated: 0 };

const GRID_COLUMNS_MAP = { xs: { max: 575, columns: 4 }, sm: { max: 767, columns: 6 }, md: { max: 991, columns: 8 }, lg: { max: 1199, columns: 10 }, xl: { max: Infinity, columns: 12 } };

const _log = function(level: string, ...extraArgs: any[]) {
  const args = Array.prototype.slice.call(arguments, 1);
  _initPorts(); const logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { if (logger.error) logger.error(...[`[${MODULE_ID}]`].concat(args)); return; }
  if (!_debug) return;
  if (logger.debug) logger.debug(...[`[${MODULE_ID}]`].concat(args));
};

export function setDebug(debug: boolean) { _debug = debug; }
export function getViewportSize() { _metrics.viewportCalls++; if (typeof window === 'undefined') return { width: 1920, height: 1080 }; return { width: window.innerWidth || document.documentElement.clientWidth, height: window.innerHeight || document.documentElement.clientHeight }; }
export function getOrientation() { const size = getViewportSize(); return size.width >= size.height ? 'landscape' : 'portrait'; }

export function debounce(fn: Function, delay: number) {
  delay = delay || 100;
  _metrics.debouncesCreated++;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return function(this: unknown) { const args = arguments; const self = this; clearTimeout(timeoutId); timeoutId = setTimeout(() => { fn.apply(self, args); }, delay); };
}

export function throttle(fn: Function, limit: number) {
  limit = limit || 100;
  _metrics.throttlesCreated++;
  let inThrottle: boolean | undefined;
  return function(this: unknown) { const args = arguments; const self = this; if (!inThrottle) { fn.apply(self, args); inThrottle = true; setTimeout(() => { inThrottle = false; }, limit); } };
}

export function saveLayoutPreference(key: string, value: unknown) {
  if (typeof localStorage === 'undefined') return false;
  const storageKey = `dshowdash-layout-${key}`;
  try { const newJson = JSON.stringify(value); const currentJson = localStorage.getItem(storageKey); if (currentJson === newJson) { _metrics.preferenceSkipped++; _log('info', 'Preference unchanged, skipped:', key); return true; } localStorage.setItem(storageKey, newJson); _metrics.preferenceSaves++; _log('info', 'Preference saved:', key); return true; }
  catch (err: any) { _log('error', 'Save preference error:', err.message); return false; }
}

export function loadLayoutPreference(key: string) { if (typeof localStorage === 'undefined') return null; try { const value = localStorage.getItem(`dshowdash-layout-${key}`); _metrics.preferenceLoads++; return value ? JSON.parse(value) : null; } catch (err: any) { _log('error', 'Load preference error:', err.message); return null; } }

export function calculateGridColumns(width: number) { const keys = Object.keys(GRID_COLUMNS_MAP); for (let i = 0; i < keys.length; i++) { const key = keys[i]; const item = (GRID_COLUMNS_MAP as Record<string, { max: number; columns: number }>)[key]; if (width <= item.max) return item.columns; } return 12; }

export function getGridColumnsMap() { return Object.assign({}, GRID_COLUMNS_MAP); }
export function isTouchDevice() { if (typeof window === 'undefined') return false; return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }
export function getDevicePixelRatio() { if (typeof window === 'undefined') return 1; return window.devicePixelRatio || 1; }

export function healthCheck() { _initPorts(); const logger = _getPort('logger'); const checks = { windowAvailable: typeof window !== 'undefined', localStorageAvailable: typeof localStorage !== 'undefined', gridMapValid: Object.keys(GRID_COLUMNS_MAP).length >= 4, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

export function info() { return { version: VERSION, moduleId: MODULE_ID, debug: _debug, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, _metrics), gridColumnsMap: Object.assign({}, GRID_COLUMNS_MAP), healthCheck: healthCheck(), environment: { windowAvailable: typeof window !== 'undefined', localStorageAvailable: typeof localStorage !== 'undefined', isTouch: isTouchDevice(), pixelRatio: getDevicePixelRatio() } }; }

export function resetMetrics() { _metrics = { viewportCalls: 0, preferenceSaves: 0, preferenceSkipped: 0, preferenceLoads: 0, debouncesCreated: 0, throttlesCreated: 0 }; }
export function getVersion() { return VERSION; }
