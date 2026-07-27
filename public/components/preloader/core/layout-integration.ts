// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-layout-integration
// PURPOSE: Preloader Layout Integration
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
//   emitLayoutRequest() — exported function
//   notifyPreloaderActive() — exported function
//   notifyPreloaderInactive() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   UI_INTENTS.REQUEST_LAYOUT
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.4.0-P17WI';
export const MODULE_ID = 'preloader-layout-integration';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const log = { debug(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {})); } };

export function emitLayoutRequest(mode: string, source?: string) {
  if (source === undefined) source = 'preloader-system';
  if (!hasWindow) return false;
  _initPorts();
  const lm = _getPort('layoutManager');
  if (lm && lm.setPreloaderActive) {
    const isActive = mode === 'preloader-active';
    lm.setPreloaderActive(isActive);
    if (lm.setScrollLocked) lm.setScrollLocked(isActive);
    log.debug('LayoutManager called via port', { preloaderActive: isActive });
    return true;
  }
  const eb = _getPort('eventBus');
  if (eb && eb.emit) { eb.emit(UI_INTENTS.REQUEST_LAYOUT, { mode, source, timestamp: Date.now() }); return true; }
  return false;
}


export function notifyPreloaderActive() { return emitLayoutRequest('preloader-active'); }

export function notifyPreloaderInactive() { return emitLayoutRequest('preloader-inactive'); }

export function healthCheck() {
  _initPorts();
  const lm = _getPort('layoutManager');
  const eb = _getPort('eventBus');
  const checks = { hasLayoutManager: !!lm, hasEventBus: !!eb, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed >= 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, version: VERSION, moduleId: MODULE_ID, checks, portsInitialized: Ports.isInitialized() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() }; }

export default { emitLayoutRequest, notifyPreloaderActive, notifyPreloaderInactive, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
