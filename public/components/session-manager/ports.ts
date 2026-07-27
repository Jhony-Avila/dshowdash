// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: session-manager.ports
// PURPOSE: Session Manager - Ports v1.3.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   log — exported value
//   initPorts() — exported function
//   injectPorts() — exported function
//   getPort() — exported function
//   getPorts() — exported function
//   isInitialized() — exported function
//   isLoggerAvailable() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.3.0-P17WI';
export const MODULE_ID = 'session-manager.ports';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function initPorts() { Ports.init(); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPort(name: string) { return Ports.get(name); }
export function getPorts() { return Ports.snapshot(); }
export function isInitialized() { return Ports.isInitialized(); }
export const log = { info(msg: string, ctx?: unknown) { if (!ctx) ctx = {}; const logger: any = getPort('logger'); if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx)); }, warn(msg: string, ctx?: unknown) { if (!ctx) ctx = {}; const logger: any = getPort('logger'); if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx)); }, error(msg: string, ctx?: unknown) { if (!ctx) ctx = {}; const logger: any = getPort('logger'); if (logger && logger.error) logger.error(msg, Object.assign({ component: MODULE_ID }, ctx)); }, debug(msg: string, ctx?: unknown) { if (!ctx) ctx = {}; const logger: any = getPort('logger'); if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx)); } };
export function isLoggerAvailable() { return !!getPort('logger'); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: Ports.isInitialized(), loggerAvailable: isLoggerAvailable() }; }
export default { initPorts, injectPorts, getPort, getPorts, isInitialized, log, isLoggerAvailable };
