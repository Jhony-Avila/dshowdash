// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.audit-trail.loggers
// PURPOSE: Logging utilities and entry creators for audit trail events
// ───────────────────────────────────────────────────────────────
// @contract CREATE_LOG_ENTRY - createLogEntry(actionKey, options) creates log entry object
// @contract LOG_LOGIN - logLogin(userId, meta) creates login log options
// @contract LOG_LOGOUT - logLogout(userId, meta) creates logout log options
// @contract LOG_PERMISSION_CHANGE - logPermissionChange(userId, old, new) creates permission log
// @contract LOG_FEATURE_FLAG_CHANGE - logFeatureFlagChange(key, old, new) creates flag log
// @contract LOG_PANEL_ACTION - logPanelAction(panelId, action, meta) creates panel log
// @contract LOG_JOB_ACTION - logJobAction(jobId, action, meta) creates job log
// @contract LOG_EXPORT - logExport(rt, ri, fmt, meta) creates export log
// @contract LOG_CREATE - logCreate(rt, ri, nv, meta) creates create log
// @contract LOG_UPDATE - logUpdate(rt, ri, ov, nv, meta) creates update log
// @contract LOG_DELETE - logDelete(rt, ri, ov, meta) creates delete log
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: Buffer from ./buffer.js (for legacy logAction, logNavigation, etc.)
// PROVIDES: createLogEntry, logLogin, logLogout, logPermissionChange,
//           logFeatureFlagChange, logPanelAction, logJobAction, logExport,
//           logCreate, logUpdate, logDelete, logAction, logNavigation,
//           logError, logAuth, healthCheck, info, VERSION, MODULE_ID
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header,
//            expanded with full entry creator functions
// @changelog v2.0.0-ENTERPRISE-AAA: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

import * as Buffer from './buffer.js';

export const VERSION = '2.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.audit-trail.loggers';

const hasWindow = typeof window !== 'undefined';

function getUserAgent(): string {
  return hasWindow && navigator ? navigator.userAgent : 'server';
}

function getSessionId(): string | null {
  if (!hasWindow) return null;
  try {
    return sessionStorage.getItem('session_id') || null;
  } catch {
    return null;
  }
}

export function createLogEntry(actionKey: string, options: { resource_type?: string; resource_id?: string; old_value?: unknown; new_value?: unknown; metadata?: Record<string, unknown> } & Record<string, unknown> = {}) {
  return {
    action: actionKey,
    timestamp: Date.now(),
    user_agent: getUserAgent(),
    session_id: getSessionId(),
    resource_type: options.resource_type || null,
    resource_id: options.resource_id || null,
    old_value: options.old_value || null,
    new_value: options.new_value || null,
    metadata: options.metadata || {},
    ...options
  };
}

export function logLogin(userId: string, meta: Record<string, unknown> = {}) {
  return {
    resource_type: 'user',
    resource_id: userId,
    metadata: { ...meta, event: 'login' }
  };
}

export function logLogout(userId: string, meta: Record<string, unknown> = {}) {
  return {
    resource_type: 'user',
    resource_id: userId,
    metadata: { ...meta, event: 'logout' }
  };
}

export function logPermissionChange(userId: string, oldPerms: unknown, newPerms: unknown) {
  return {
    resource_type: 'permission',
    resource_id: userId,
    old_value: oldPerms,
    new_value: newPerms
  };
}

export function logFeatureFlagChange(flagKey: string, oldValue: unknown, newValue: unknown) {
  return {
    resource_type: 'feature_flag',
    resource_id: flagKey,
    old_value: oldValue,
    new_value: newValue
  };
}

export function logPanelAction(panelId: string, action: string, meta: Record<string, unknown> = {}) {
  return {
    resource_type: 'panel',
    resource_id: panelId,
    metadata: { action, ...meta }
  };
}

export function logJobAction(jobId: string, action: string, meta: Record<string, unknown> = {}) {
  return {
    resource_type: 'job',
    resource_id: jobId,
    metadata: { action, ...meta }
  };
}

export function logExport(resourceType: string, resourceId: string, format: string, meta: Record<string, unknown> = {}) {
  return {
    resource_type: resourceType,
    resource_id: resourceId,
    metadata: { format, export: true, ...meta }
  };
}

export function logCreate(resourceType: string, resourceId: string, newValue: unknown, meta: Record<string, unknown> = {}) {
  return {
    resource_type: resourceType,
    resource_id: resourceId,
    new_value: newValue,
    metadata: { operation: 'create', ...meta }
  };
}

export function logUpdate(resourceType: string, resourceId: string, oldValue: unknown, newValue: unknown, meta: Record<string, unknown> = {}) {
  return {
    resource_type: resourceType,
    resource_id: resourceId,
    old_value: oldValue,
    new_value: newValue,
    metadata: { operation: 'update', ...meta }
  };
}

export function logDelete(resourceType: string, resourceId: string, oldValue: unknown, meta: Record<string, unknown> = {}) {
  return {
    resource_type: resourceType,
    resource_id: resourceId,
    old_value: oldValue,
    metadata: { operation: 'delete', ...meta }
  };
}

// Legacy functions for backward compatibility
export function logAction(action: string, data: Record<string, unknown> = {}): void {
  Buffer.add({ type: 'action', action, data });
}

export function logNavigation(from: string, to: string): void {
  Buffer.add({ type: 'navigation', from, to });
}

export function logError(error: Error | unknown, context: Record<string, unknown> = {}): void {
  Buffer.add({
    type: 'error',
    message: (error as Error)?.message || String(error),
    context
  });
}

export function logAuth(event: string, userId: string): void {
  Buffer.add({ type: 'auth', event, userId });
}

export function healthCheck() {
  const checks = {
    available: true,
    bufferAccessible: typeof Buffer.add === 'function',
    createLogEntryAvailable: typeof createLogEntry === 'function'
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = passed === total ? 'HEALTHY' : passed >= 1 ? 'DEGRADED' : 'UNHEALTHY';

  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    loggers: [
      'createLogEntry', 'logLogin', 'logLogout', 'logPermissionChange',
      'logFeatureFlagChange', 'logPanelAction', 'logJobAction',
      'logExport', 'logCreate', 'logUpdate', 'logDelete',
      'logAction', 'logNavigation', 'logError', 'logAuth'
    ],
    timestamp: Date.now()
  };
}

export default {
  createLogEntry,
  logLogin,
  logLogout,
  logPermissionChange,
  logFeatureFlagChange,
  logPanelAction,
  logJobAction,
  logExport,
  logCreate,
  logUpdate,
  logDelete,
  logAction,
  logNavigation,
  logError,
  logAuth,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
