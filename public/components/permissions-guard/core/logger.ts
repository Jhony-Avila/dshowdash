// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: components/permissions-guard/core/logger
// PURPOSE: Permissions Guard - Logger
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   debug() — exported function
//   info() — exported function
//   warn() — exported function
//   error() — exported function
//   healthCheck() — exported function
//   getInfo() — exported function
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
export const VERSION = '8.2.0-P17WI';
export const MODULE_ID = 'components/permissions-guard/core/logger';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export function debug(...args: unknown[]) { _getPort('logger')?.debug(`[${MODULE_ID}]`, ...args); }
export function info(...args: unknown[]) { _getPort('logger')?.info(`[${MODULE_ID}]`, ...args); }
export function warn(...args: unknown[]) { _getPort('logger')?.warn(`[${MODULE_ID}]`, ...args); }
export function error(...args: unknown[]) { _getPort('logger')?.error(`[${MODULE_ID}]`, ...args); }
export function healthCheck() { return { status: 'healthy', portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID }; }
export function getInfo() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
export const _metrics = { debugCount: 0, infoCount: 0, warnCount: 0, errorCount: 0 };
export default { debug, info, warn, error, healthCheck, getInfo, VERSION, MODULE_ID, injectPorts, getPorts };
