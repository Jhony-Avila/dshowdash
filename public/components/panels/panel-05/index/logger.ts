// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.1.0-VISIBILITY-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05.index.logger
// PURPOSE: Panel-05 Index - Logger
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   MODULE_ID as PANEL_MODULE_ID from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   setDebug() — exported function
//   getLogs() — exported function
//   log() — exported function
//   info() — exported function
//   healthCheck() — exported function
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
import { MODULE_ID as PANEL_MODULE_ID } from './constants.js';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05.index.logger';
let _debug = false; let _logBuffer: Array<{ level: string; args: unknown[]; ts: number }> = [];
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getLogs() { return [..._logBuffer]; }
export function log(level: string, ...args: unknown[]) { const prefix = `[${PANEL_MODULE_ID}]`; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); const logger = _getPort('logger'); if (logger?.[level]) { logger[level](prefix, ...args); } else if (level === 'error') { console.log(`%c[ERROR]%c ${prefix}`, 'color:#ef4444;font-weight:bold', 'color:inherit', ...args); } else if (level === 'warn') { console.log(`%c[WARN]%c ${prefix}`, 'color:#f59e0b;font-weight:bold', 'color:inherit', ...args); } }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { loggerReady: true, portsInitialized: Ports.isInitialized() }, timestamp: Date.now() }; }
export default { log, info, healthCheck, injectPorts, getPorts, setDebug, getLogs, VERSION, MODULE_ID };
