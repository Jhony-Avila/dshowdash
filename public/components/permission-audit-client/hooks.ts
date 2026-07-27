// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: permission-audit-client-hooks
// PURPOSE: PermissionAuditClient - Hooks Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   logger from ./config.js
//
// PROVIDES:
//   isHooked() — exported function
//   hookPermissionsGuard() — exported function
//   unhookPermissionsGuard() — exported function
//   canWithAudit() — exported function
//   getAuditedCan() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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
import { logger } from './config.js';
const VERSION = '2.2.0-P17WI';
const MODULE_ID = 'permission-audit-client-hooks';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts(): void { Ports.init(); }
function _getPort(name: string): ReturnType<typeof Ports.get> { return Ports.get(name); }
function injectPorts(p: Parameters<typeof Ports.inject>[0]): ReturnType<typeof Ports.inject> { return Ports.inject(p); }
function getPorts(): ReturnType<typeof Ports.snapshot> { return Ports.snapshot(); }
let _permissionsGuardHooked = false;
let _originalCan: ((...args: unknown[]) => unknown) | null = null;
let _bufferFn: ((capability: string, action: string, opts: Record<string, unknown>) => void) | null = null;
function isHooked(): boolean { return _permissionsGuardHooked; }
function canWithAudit(capability: string, options: Record<string, unknown> = {}): boolean { if (options === undefined) options = {}; const pg = _getPort('permissionsGuard'); if (!pg || !_originalCan) { if (logger && logger.warn) logger.warn('PermissionsGuard not available'); return false; } const result = _originalCan.call(pg, capability, options); if (_bufferFn) { _bufferFn(capability, result ? 'allowed' : 'denied', { resourceType: options['resourceType'], resourceId: options['resourceId'], context: { source: 'PermissionsGuard.can' } }); } return !!result; }
function hookPermissionsGuard(bufferFn: (capability: string, action: string, opts: Record<string, unknown>) => void): boolean { _initPorts(); const pg = _getPort('permissionsGuard'); if (!pg) { if (logger && logger.warn) logger.warn('PermissionsGuard not found'); return false; } if (_permissionsGuardHooked) { if (logger && logger.warn) logger.warn('Already hooked'); return true; } _originalCan = pg.can; _bufferFn = bufferFn; if (_originalCan) { _permissionsGuardHooked = true; if (logger && logger.info) logger.info('Hooked into PermissionsGuard (local wrapper)'); return true; } return false; }
function unhookPermissionsGuard(): boolean { if (!_permissionsGuardHooked || !_originalCan) return false; _permissionsGuardHooked = false; _originalCan = null; _bufferFn = null; if (logger && logger.info) logger.info('Unhooked from PermissionsGuard'); return true; }
function getAuditedCan() { if (!_permissionsGuardHooked) return null; return canWithAudit; }
function info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, hooked: _permissionsGuardHooked, portsInitialized: ps._initialized }; }
function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { ready: true, hooked: _permissionsGuardHooked, portsInitialized: ps._initialized } }; }
export { isHooked, hookPermissionsGuard, unhookPermissionsGuard, canWithAudit, getAuditedCan, injectPorts, getPorts, info, healthCheck, MODULE_ID, VERSION };
export default { isHooked, hookPermissionsGuard, unhookPermissionsGuard, canWithAudit, getAuditedCan, injectPorts, getPorts, info, healthCheck };
