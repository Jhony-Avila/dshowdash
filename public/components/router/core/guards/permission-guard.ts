// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.core.guards.permission-guard
// PURPOSE: Router - Permission Guard (UARPS) v1.5.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   GUARD_POLICIES from /components/router/registry/definitions/constants.js
//
// PROVIDES:
//   PermissionGuard — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Permissions
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { GUARD_POLICIES } from '/components/router/registry/definitions/constants.js';

const MODULE_ID = 'router.core.guards.permission-guard';
const VERSION = '1.5.0-P17WI';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _log(level: 'error' | 'warn' | 'info' | 'debug', msg: string, ctx?: Record<string, unknown>) { if (!ctx) ctx = {}; const logger = _getPort('logger'); if (!logger || typeof logger[level] !== 'function') return; ctx.component = MODULE_ID; logger[level](msg, ctx); }

function _getPermissions(): any { if (hasWindow) { return (window as any).Permissions || null; } return null; }

let metrics = { checks: 0, blocks: 0, skippedByPolicy: 0, bypassedByMode: 0 };

const PermissionGuard = {
  name: 'PermissionGuard',
  order: 2,
  version: VERSION,
  metrics,
  routeTriggerMap: {},
  isAvailable() { const permissions = _getPermissions(); return permissions && typeof permissions.canTrigger === 'function'; },
  check(route: Record<string, unknown>, context: Record<string, unknown>) {
    if (!context) context = {};
    metrics.checks++;
    const policy = context.policy;
    const permissionsMode = context.permissionsMode || 'allow-all';
    if (permissionsMode === 'allow-all') { metrics.bypassedByMode++; _log('debug', '[PermissionGuard] Bypassed by allow-all mode'); return Promise.resolve({ passed: true, reason: 'bypassed-by-mode', guard: this.name, skipped: true, policy, permissionsMode }); }
    if (policy && policy !== GUARD_POLICIES.UARPS && policy !== GUARD_POLICIES.HYBRID) { metrics.skippedByPolicy++; _log('debug', '[PermissionGuard] Skipped by policy', { policy }); return Promise.resolve({ passed: true, reason: 'skipped-by-policy', guard: this.name, skipped: true, policy, permissionsMode }); }
    const triggerId = route ? (route.uarpsTrigger || route.trigger) : null;
    if (!triggerId) { return Promise.resolve({ passed: true, reason: 'no-uarps-trigger', guard: this.name, policy, permissionsMode }); }
    const permissions = _getPermissions();
    const canTrigger = permissions && permissions.canTrigger ? permissions.canTrigger(triggerId) : true;
    if (!canTrigger) { metrics.blocks++; _log('debug', '[PermissionGuard] Blocked by UARPS', { triggerId, policy, permissionsMode }); return Promise.resolve({ passed: false, reason: 'uarps-denied', redirect: '/forbidden', guard: this.name, details: { triggerId }, policy, permissionsMode }); }
    return Promise.resolve({ passed: true, reason: 'uarps-ok', guard: this.name, policy, permissionsMode });
  },
  resetMetrics() { metrics = { checks: 0, blocks: 0, skippedByPolicy: 0, bypassedByMode: 0 }; this.metrics = metrics; }
};

export { PermissionGuard, VERSION, MODULE_ID, injectPorts, getPorts };
export default PermissionGuard;
