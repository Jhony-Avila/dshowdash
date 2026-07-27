// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.security.permissions-matrix
// PURPOSE: Router Security - Permissions Matrix
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   PERMISSIONS_TELEMETRY — exported value
//   init() — exported function
//   cleanup() — exported function
//   setRoutePermissions() — exported function
//   getRoutePermissions() — exported function
//   clearRoutePermissions() — exported function
//   setRolePermissions() — exported function
//   getRolePermissions() — exported function
//   checkAccess() — exported function
//   getMatrix() — exported function
//   getRoles() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.router.security.permissions-matrix';
const VERSION = '2.2.0-P18EC';

const PERMISSIONS_TELEMETRY = {
  DENIED: 'router:permissions:denied'
};

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; matrix: Record<string, string[]>; roles: Record<string, string[]> } = { initialized: false, matrix: {}, roles: {} };
const _metrics = { checks: 0, allowed: 0, denied: 0 };

function _track(eventKey: string, payload: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

function setRoutePermissions(routePattern: string, permissions: string | string[]) { _state.matrix[routePattern] = Array.isArray(permissions) ? permissions : [permissions]; return { ok: true, pattern: routePattern }; }
function getRoutePermissions(routePattern: string) { return _state.matrix[routePattern] || []; }
function clearRoutePermissions(routePattern: string) { if (_state.matrix[routePattern]) { delete _state.matrix[routePattern]; return { ok: true }; } return { ok: false, reason: 'Not found' }; }

function setRolePermissions(role: string, permissions: string | string[]) { _state.roles[role] = Array.isArray(permissions) ? permissions : [permissions]; return { ok: true, role }; }
function getRolePermissions(role: string) { return _state.roles[role] || []; }

function checkAccess(routePattern: string, userPermissions: string[], userRoles: string[]) { _metrics.checks++; const required = _state.matrix[routePattern]; if (!required || required.length === 0) { _metrics.allowed++; return { allowed: true, reason: 'No permissions required' }; } userPermissions = userPermissions || []; userRoles = userRoles || []; const allUserPerms = userPermissions.slice(); for (let i = 0; i < userRoles.length; i++) { const rolePerms = _state.roles[userRoles[i]] || []; for (let j = 0; j < rolePerms.length; j++) { if (allUserPerms.indexOf(rolePerms[j]) < 0) allUserPerms.push(rolePerms[j]); } } for (let k = 0; k < required.length; k++) { if (allUserPerms.indexOf(required[k]) < 0) { _metrics.denied++; _track(PERMISSIONS_TELEMETRY.DENIED, { route: routePattern, missing: required[k] }); return { allowed: false, reason: `Missing permission: ${required[k]}`, missing: required[k] }; } } _metrics.allowed++; return { allowed: true }; }

function getMatrix() { return Object.assign({}, _state.matrix); }
function getRoles() { return Object.assign({}, _state.roles); }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); if (ctx && ctx.matrix) Object.assign(_state.matrix, ctx.matrix as Record<string, string[]>); if (ctx && ctx.roles) Object.assign(_state.roles, ctx.roles as Record<string, string[]>); _state.initialized = true; return { ok: true, version: VERSION }; }
function cleanup() { _state.matrix = {}; _state.roles = {}; _state.initialized = false; return { ok: true }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, routesCount: Object.keys(_state.matrix).length, rolesCount: Object.keys(_state.roles).length, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, PERMISSIONS_TELEMETRY, init, cleanup, setRoutePermissions, getRoutePermissions, clearRoutePermissions, setRolePermissions, getRolePermissions, checkAccess, getMatrix, getRoles, healthCheck, info };
export default { MODULE_ID, VERSION, PERMISSIONS_TELEMETRY, init, cleanup, setRoutePermissions, getRoutePermissions, clearRoutePermissions, setRolePermissions, getRolePermissions, checkAccess, getMatrix, getRoles, healthCheck, info, injectPorts, getPorts };
