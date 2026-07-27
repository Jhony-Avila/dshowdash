// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.ui.template-enterprise
// PURPOSE: Ticker Template Enterprise (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createTickerTemplateEnterprise() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getVersion() — exported function
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
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '5.5.0-P17WI';
export const MODULE_ID = 'ticker.ui.template-enterprise';
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug ?? false; };
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args); };
export function createTickerTemplateEnterprise() { return `<div class="ticker-wrapper ticker-wrapper--full"><div class="ticker-content-container"><div class="ticker-track" role="marquee" aria-live="polite"></div></div></div>`; }
export function healthCheck() { const logger = _getPort('logger'); const checks = { ready: true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() }; }
export function getVersion() { return VERSION; }
export default createTickerTemplateEnterprise;
