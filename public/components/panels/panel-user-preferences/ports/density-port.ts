// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences.ports.density
// PURPOSE: Density Port
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PREFERENCES_INTENTS, PREFERENCES_EVENTS, DENSITY_VALUES from /core/runtime/ev...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DENSITIES — exported value
//   DENSITY_VALUES — exported value
//   PREFERENCES_INTENTS — exported value
//   DENSITY_RESPONSES — exported value
//   setDensity() — exported function
//   previewDensity() — exported function
//   cancelPreview() — exported function
//   confirmPreview() — exported function
//   getCurrentDensity() — exported function
//   isManagerAvailable() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   ... and 3 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { PREFERENCES_INTENTS, PREFERENCES_EVENTS, DENSITY_VALUES } from '/core/runtime/events/catalog/preferences.events.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-user-preferences.ports.density';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: unknown) => Ports.inject(p);
const getPorts = () => Ports.snapshot();

const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug; };
const _log = (level: string, msg: string, extra?: unknown) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = (logger as Record<string, unknown>)[level] || (logger as Record<string, unknown>).info; (fn as ((m: string, e?: unknown) => void))?.(` [${MODULE_ID}] ${msg}`, extra); };

const DENSITIES = [DENSITY_VALUES.COMPACT, DENSITY_VALUES.COMFORTABLE, DENSITY_VALUES.SPACIOUS];
const DENSITY_RESPONSES = { DENSITY_APPLIED: PREFERENCES_EVENTS.DENSITY_APPLIED, DENSITY_ERROR: PREFERENCES_EVENTS.DENSITY_ERROR };

let _pendingPreview: string | null = null;
let _metrics = { intentsSent: 0, responsesReceived: 0, errors: 0 };

const setDensity = (density: string, options: Record<string, unknown> = {}) => { _initPorts(); if (!DENSITIES.includes(density as "compact" | "comfortable" | "spacious")) { _log('warn', `Invalid density: ${density}`); return { ok: false, error: 'invalid-density' }; } _metrics.intentsSent++; const intent = { density, source: options.source || 'panel-user-preferences', timestamp: Date.now(), persist: options.persist !== false }; const eb = _getPort('eventBus'); eb?.emit?.(PREFERENCES_INTENTS.SET_DENSITY, intent); return { ok: true, intent }; };
const previewDensity = (density: string) => { _initPorts(); if (!DENSITIES.includes(density as "compact" | "comfortable" | "spacious")) return { ok: false, error: 'invalid-density' }; _pendingPreview = density; _metrics.intentsSent++; const eb = _getPort('eventBus'); eb?.emit?.(PREFERENCES_INTENTS.PREVIEW_DENSITY, { density, source: 'panel-user-preferences', timestamp: Date.now(), isPreview: true }); return { ok: true, previewing: density }; };
const cancelPreview = () => { _initPorts(); if (!_pendingPreview) return { ok: false, reason: 'no-preview-active' }; const previous = _pendingPreview; _pendingPreview = null; _metrics.intentsSent++; const eb = _getPort('eventBus'); eb?.emit?.(PREFERENCES_INTENTS.CANCEL_DENSITY_PREVIEW, { source: 'panel-user-preferences', timestamp: Date.now() }); return { ok: true, cancelled: previous }; };
const confirmPreview = () => { if (!_pendingPreview) return { ok: false, reason: 'no-preview-active' }; const density = _pendingPreview; _pendingPreview = null; return setDensity(density, { persist: true }); };

const getCurrentDensity = () => {
  if (typeof document !== 'undefined') { const root = document.documentElement; for (const d of DENSITIES) { if (root.classList.contains(`density-${d}`)) return d; } }
  return DENSITY_VALUES.COMFORTABLE;
};

const isManagerAvailable = () => !!_getPort('eventBus');
const getMetrics = () => ({ hasPendingPreview: !!_pendingPreview, ..._metrics });
const resetMetrics = () => { _metrics = { intentsSent: 0, responsesReceived: 0, errors: 0 }; };

const healthCheck = () => {
  _initPorts();
  const eb = _getPort('eventBus');
  const logger = _getPort('logger');
  const checks = { eventBusAvailable: !!eb, canEmitIntents: !!(eb?.emit), loggerReady: !!logger, portsInitialized: Ports.isInitialized(), usingP18Core: true };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 4 ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID };
};

const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), currentDensity: getCurrentDensity(), hasPendingPreview: !!_pendingPreview, densities: DENSITIES, metrics: getMetrics(), p18Source: '/core/runtime/events/index.js', healthCheck: healthCheck() });

export { VERSION, MODULE_ID, DENSITIES, DENSITY_VALUES, PREFERENCES_INTENTS, DENSITY_RESPONSES, setDensity, previewDensity, cancelPreview, confirmPreview, getCurrentDensity, isManagerAvailable, getMetrics, resetMetrics, healthCheck, info, injectPorts, getPorts };
export default { setDensity, previewDensity, cancelPreview, confirmPreview, getCurrentDensity, isManagerAvailable, getMetrics, resetMetrics, info, healthCheck, injectPorts, getPorts, DENSITIES, DENSITY_VALUES, PREFERENCES_INTENTS, DENSITY_RESPONSES, VERSION, MODULE_ID };
