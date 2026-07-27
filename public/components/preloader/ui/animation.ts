// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-animation
// PURPOSE: Animation & Transitions - Preloader System
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_INTENTS from /core/runtime/events/index.js
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   hidePreloader() — exported function
//   showDashboard() — exported function
//   getVersion() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   UI_INTENTS.REQUEST_LAYOUT
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';

import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '5.4.0-P17WI';
export const MODULE_ID = 'preloader-animation';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return hasWindow && cfg && cfg.app && cfg.app.debug === true; };

const _log = function(level?: any, ...rest: any[]) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort('logger');
  if (!logger) return;
  if (level === 'error') { if (logger.error) logger.error(...[`[${MODULE_ID}]`].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(...[`[${MODULE_ID}]`].concat(args)); return; }
  if (_debugEnabled() && logger.debug) logger.debug(...[`[${MODULE_ID}]`].concat(args));
};

const _metrics = { hidePreloaderCount: 0, showDashboardCount: 0, callbacksExecuted: 0, lastHideAt: null as number | null, lastShowAt: null as number | null };

function _emitLayoutRequest(mode: string) {
  const lm = _getPort('layoutManager');
  if (lm && lm.setPreloaderActive) { lm.setPreloaderActive(mode === 'preloader-active'); if (lm.setScrollLocked) lm.setScrollLocked(mode === 'preloader-active'); _log('info', 'LayoutManager.setPreloaderActive called via port:', mode === 'preloader-active'); return true; }
  const eb = _getPort('eventBus');
  if (eb && eb.emit) { eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode, source: MODULE_ID, timestamp: Date.now() }); _log('info', 'Emitted layout:request:', mode); return true; }
  _log('warn', 'No LayoutManager or EventBus available for layout request');
  return false;
}

export function hidePreloader(callback?: () => void) {
  _metrics.hidePreloaderCount++;
  _metrics.lastHideAt = Date.now();
  if (!hasDocument) { if (typeof callback === 'function') { callback(); _metrics.callbacksExecuted++; } return; }
  const screen = document.getElementById('loading-screen');
  _emitLayoutRequest('preloader-inactive');
  if (!screen) { if (typeof callback === 'function') { callback(); _metrics.callbacksExecuted++; } return; }
  screen.classList.add('loaded');
  setTimeout(() => {
    screen.style.opacity = '0';
    screen.style.visibility = 'hidden';
    setTimeout(() => { screen.style.display = 'none'; screen.setAttribute('hidden', 'true'); if (typeof callback === 'function') { callback(); _metrics.callbacksExecuted++; } }, 600);
  }, 300);
}

export function showDashboard() {
  _metrics.showDashboardCount++;
  _metrics.lastShowAt = Date.now();
  if (!hasDocument) return;
  _log('info', 'Dashboard visível');
  _emitLayoutRequest('preloader-inactive');
  const appContainer = document.getElementById('app-container');
  if (appContainer) { appContainer.hidden = false; appContainer.style.display = 'block'; appContainer.style.opacity = '0'; appContainer.style.visibility = 'visible'; setTimeout(() => { appContainer.style.transition = 'opacity 0.6s ease-in-out'; appContainer.style.opacity = '1'; }, 50); }
  const mainContent = document.querySelector('.main-content') as any;
  if (mainContent) { mainContent.style.opacity = '1'; mainContent.style.visibility = 'visible'; }
}

export function getVersion() { return VERSION; }
export function getMetrics() { return Object.assign({}, _metrics); }
export function resetMetrics() { const metricsReset = _metrics as Record<string, number | null>; for (const k in metricsReset) { if (metricsReset.hasOwnProperty(k)) metricsReset[k] = typeof metricsReset[k] === 'number' ? 0 : null; } }

export function healthCheck() {
  const lm = _getPort('layoutManager');
  const checks = { hasDocument, hasWindow, bodyAccessible: hasDocument && !!document.body, loadingScreenExists: hasDocument && !!document.getElementById('loading-screen'), appContainerExists: hasDocument && !!document.getElementById('app-container'), layoutManagerAvailable: !!lm, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() };
  let passed = 0; let total = 0;
  for (const k in checks) { if (checks.hasOwnProperty(k)) { total++; if ((checks as Record<string, boolean>)[k]) passed++; } }
  return { status: passed >= 6 ? 'HEALTHY' : passed >= 4 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: Object.assign({}, _metrics), compliance: 'P17WI-AAA', portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, compliance: 'P17WI-AAA', metrics: getMetrics(), healthCheck: healthCheck(), portsInitialized: Ports.isInitialized() }; }

if (hasWindow) { window.__dev = window.__dev || {}; window.__dev.preloaderAnimation = { getVersion, getMetrics, resetMetrics, healthCheck, info }; }
