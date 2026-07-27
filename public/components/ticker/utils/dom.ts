// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.utils.dom
// PURPOSE: Ticker DOM Utilities (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createElement() — exported function
//   clearElement() — exported function
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
export const VERSION = '5.4.0-P17WI';
export const MODULE_ID = 'ticker.utils.dom';
const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
function _log(level: string, ...args: unknown[]) { const logger = _getPort('logger'); if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args); }
const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug ?? false; };
export function createElement(tag: string, className: string, content: string = '') { const el = document.createElement(tag); if (className) el.className = className; if (content) el.textContent = content; return el; }
export function clearElement(el: HTMLElement) { while (el.firstChild) el.removeChild(el.firstChild); }
export function healthCheck() { const logger = _getPort('logger'); const checks = { documentReady: hasDocument && !!document.body, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() }; }
export function getVersion() { return VERSION; }
export default { createElement, clearElement, healthCheck, info, getVersion, injectPorts, getPorts, VERSION };
