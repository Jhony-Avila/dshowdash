// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.utils.helpers
// PURPOSE: Ticker Helper Utilities (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   debounce() — exported function
//   prefersReducedMotion() — exported function
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
//   window.matchMedia
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '5.4.0-P17WI';
export const MODULE_ID = 'ticker.utils.helpers';
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug ?? false; };
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args); };
// @ts-expect-error strict migration — TS2769
export function debounce(func: (...args: unknown[]) => void, wait: number) { let timeout: ReturnType<typeof setTimeout> | null = null; return function executedFunction(...args: unknown[]) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }
export function prefersReducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
export function healthCheck() { const logger = _getPort('logger'); const checks = { ready: true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, reducedMotion: prefersReducedMotion(), portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() }; }
export function getVersion() { return VERSION; }
export default { debounce, prefersReducedMotion, healthCheck, info, getVersion, injectPorts, getPorts, VERSION };
