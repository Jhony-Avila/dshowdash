// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-session-admin:permissions-guard-adapter
// PURPOSE: Panel Session Admin - Permissions Guard Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   isAuthenticated() — exported function
//   isReady() — exported function
//   getUser() — exported function
//   getLevel() — exported function
//   getRoles() — exported function
//   isAdmin() — exported function
//   can() — exported function
//   canViewOwnSessions() — exported function
//   canViewAllSessions() — exported function
//   canTerminateOwnSessions() — exported function
//   canTerminateAllSessions() — exported function
//   canAccessPanel() — exported function
//   getPermissionContext() — exported function
//   ... and 3 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Logger (fallback with recordViolation in non-strict mode)
// ═══════════════════════════════════════════════════════════════
// @changelog v2.5.0-STRICT-MODE - NR-FULL strict mode migration with recordViolation
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-session-admin:permissions-guard-adapter';

const _CorePorts = createCorePorts({ moduleId: MODULE_ID });

function _getLogger() {
  const logger = _CorePorts.get('logger');
  if (logger) return logger;
  if (window.Core?.windowAdapter?.get) {
    const wl = window.Core.windowAdapter.get('Logger');
    if (wl) return wl;
  }
  return null;
}

const _log = (level: string, ...args: unknown[]) => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getLogger();
  if (logger?.[level]) { logger[level](prefix, ...args); }
  else if (level === 'error' || level === 'warn') { console.log(prefix, ...args); }
};

const PERMISSIONS = {
  VIEW_OWN: 'sessions:view:own', VIEW_ALL: 'sessions:view:all',
  TERMINATE_OWN: 'sessions:terminate:own', TERMINATE_ALL: 'sessions:terminate:all', ADMIN: 'sessions:admin'
};

const UARPS_TRIGGERS = {
  VIEW_OWN: 'trigger:panel:session-admin:view-own', VIEW_ALL: 'trigger:panel:session-admin:view-all',
  TERMINATE_OWN: 'trigger:panel:session-admin:terminate-own', TERMINATE_ALL: 'trigger:panel:session-admin:terminate-all',
  ADMIN: 'trigger:panel:session-admin:admin'
};

const ADMIN_ROLES = ['super_admin', 'admin', 'system_admin'];

const LEVEL_REQUIREMENTS = {
  [PERMISSIONS.VIEW_OWN]: 20, [PERMISSIONS.VIEW_ALL]: 80,
  [PERMISSIONS.TERMINATE_OWN]: 20, [PERMISSIONS.TERMINATE_ALL]: 80, [PERMISSIONS.ADMIN]: 80
};

let _ports: Record<string, unknown> = {};
let _uarpsCache: Record<string, boolean> | null = null;
let _uarpsCacheTime = 0;
const UARPS_CACHE_TTL = 60000;

function _getPort(name: string) { return (_ports[name] || null) as Record<string, (...args: unknown[]) => unknown> | null; }
export function injectPorts(ports: Record<string, unknown>) { _ports = ports || {}; if (ports && ports.logger) { _CorePorts.inject({ logger: ports.logger }); } }
export function getPorts() { return { ..._ports }; }

export function isAuthenticated() {
  const auth = _getPort('auth');
  if (auth?.isAuthenticated) return auth.isAuthenticated();
  if (auth?.getUser) return !!auth.getUser();
  return false;
}

export function isReady() { return isAuthenticated(); }

export function getUser() {
  const auth = _getPort('auth');
  return auth?.getUser?.() || null;
}

export function getLevel() {
  const auth = _getPort('auth');
  if (auth?.getLevel) return auth.getLevel();
  const user = getUser() as Record<string, unknown> | null;
  return (user?.level as number) || 0;
}

export function getRoles() {
  const auth = _getPort('auth');
  if (auth?.getRoles) return auth.getRoles();
  const user = getUser() as Record<string, unknown> | null;
  return (user?.roles as unknown[]) || [];
}

async function checkUARPSTrigger(trigger: string, { signal }: { signal?: AbortSignal } = {}) {
  try {
    if (_uarpsCache && (Date.now() - _uarpsCacheTime) < UARPS_CACHE_TTL) { return _uarpsCache[trigger] === true; }
    const response = await fetch('/api/permissions/uarps?action=user-permissions', { credentials: 'include', signal });
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.triggers) {
        _uarpsCache = {};
        data.data.triggers.forEach((t: Record<string, unknown>) => { if (_uarpsCache) _uarpsCache[t.trigger_id as string] = t.state === 'allow'; });
        _uarpsCacheTime = Date.now();
        return _uarpsCache[trigger] === true;
      }
    }
  } catch (e) { _log('warn', 'UARPS check failed, using fallback:', (e as Error).message); }
  return null;
}

export function isAdmin() {
  const auth = _getPort('auth');
  if (auth?.can?.(PERMISSIONS.ADMIN)) return true;
  const roles = getRoles();
  if ((roles as string[]).some((r: string) => ADMIN_ROLES.includes(r))) return true;
  const level = getLevel() as number;
  if (level >= LEVEL_REQUIREMENTS[PERMISSIONS.ADMIN]) return true;
  return false;
}

export function can(permission: string) {
  const auth = _getPort('auth');
  if (auth?.can?.(permission)) return true;
  const level = getLevel() as number;
  const required = LEVEL_REQUIREMENTS[permission];
  if (required !== undefined && level >= required) return true;
  if (isAdmin()) return true;
  return false;
}

export function canViewOwnSessions() { return can(PERMISSIONS.VIEW_OWN); }
export function canViewAllSessions() { return can(PERMISSIONS.VIEW_ALL); }
export function canTerminateOwnSessions() { return can(PERMISSIONS.TERMINATE_OWN); }
export function canTerminateAllSessions() { return can(PERMISSIONS.TERMINATE_ALL); }

export function canAccessPanel() {
  if (!isAuthenticated()) return { allowed: false, reason: 'NOT_AUTHENTICATED' };
  if (!canViewOwnSessions()) return { allowed: false, reason: 'NO_PERMISSION' };
  return { allowed: true, isAdmin: isAdmin() };
}

export function getPermissionContext() {
  return {
    isAuthenticated: isAuthenticated(), isAdmin: isAdmin(), user: getUser(), level: getLevel(), roles: getRoles(),
    permissions: { viewOwn: canViewOwnSessions(), viewAll: canViewAllSessions(), terminateOwn: canTerminateOwnSessions(), terminateAll: canTerminateAllSessions() },
    uarps_mode: 'hybrid'
  };
}

export function guard(requiredPermission: string) { return can(requiredPermission); }

export function healthCheck() {
  return { status: 'healthy', authenticated: isAuthenticated(), isAdmin: isAdmin(), portsInjected: Object.keys(_ports).length > 0, uarpsCache: _uarpsCache !== null, portsInitialized: _CorePorts.isInitialized(), strictMode: isStrict(), version: VERSION };
}

export function getVersion() { return VERSION; }

export default { VERSION, MODULE_ID, PERMISSIONS, UARPS_TRIGGERS, isAuthenticated, isReady, isAdmin, getUser, getLevel, getRoles, can, canViewOwnSessions, canViewAllSessions, canTerminateOwnSessions, canTerminateAllSessions, canAccessPanel, getPermissionContext, guard, healthCheck, getVersion, injectPorts, getPorts };
