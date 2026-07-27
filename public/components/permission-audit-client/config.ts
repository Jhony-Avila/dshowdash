// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: components/permission-audit-client/config
// PURPOSE: Permission Audit Client - Config
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CONFIG — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   healthCheck() — exported function
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
export const VERSION = '8.2.0-P17WI';
export const MODULE_ID = 'components/permission-audit-client/config';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string): ReturnType<typeof Ports.get> { return Ports.get(name); }
export function injectPorts(p: Parameters<typeof Ports.inject>[0]): ReturnType<typeof Ports.inject> { return Ports.inject(p); }
export function getPorts(): ReturnType<typeof Ports.snapshot> { return Ports.snapshot(); }
export const CONFIG = { enabled: true, logLevel: 'info', auditEndpoint: '/api/audit', batchSize: 100, flushInterval: 30000 };
export function getConfig(): typeof CONFIG { return { ...CONFIG }; }
export function setConfig(updates: Partial<typeof CONFIG>): void { Object.assign(CONFIG, updates); _getPort('logger')?.info(`[${MODULE_ID}] Config updated`); }
export function healthCheck() { return { status: 'healthy', config: CONFIG, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, config: CONFIG, portsInitialized: Ports.isInitialized() }; }
export const ACTIONS = Object.freeze({ CHECK: 'check', GRANT: 'grant', DENY: 'deny', ELEVATE: 'elevate', REVOKE: 'revoke' });
export function createMetrics() { return { checks: 0, grants: 0, denials: 0, errors: 0, lastActivity: null as number | null, errorCount: 0, logCount: 0, flushCount: 0 }; }
export const logger = { info: function(...args: any[]) {}, warn: function(...args: any[]) {}, error: function(...args: any[]) {}, debug: function(...args: any[]) {} };
export default { CONFIG, getConfig, setConfig, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };
