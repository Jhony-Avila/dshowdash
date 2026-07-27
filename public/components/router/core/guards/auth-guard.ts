// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.core.guards.auth-guard
// PURPOSE: Router - Auth Guard v1.5.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   GUARD_POLICIES from /components/router/registry/definitions/constants.js
//
// PROVIDES:
//   AuthGuard — exported value
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
//   window.AuthAdapter
//   window.CoreAuthAdapter
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { GUARD_POLICIES } from '/components/router/registry/definitions/constants.js';

const MODULE_ID = 'router.core.guards.auth-guard';
const VERSION = '1.5.0-P17WI';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _log(level: 'error' | 'warn' | 'info' | 'debug', msg: string, ctx?: Record<string, unknown>) { if (!ctx) ctx = {}; const logger = _getPort('logger'); if (!logger || typeof logger[level] !== 'function') return; ctx.component = MODULE_ID; logger[level](msg, ctx); }

function _getAuth() { if (hasWindow) { return (window as any).AuthAdapter || (window as any).CoreAuthAdapter || null; } return null; }

let metrics = { checks: 0, blocks: 0, skippedByPolicy: 0 };

const AuthGuard = {
  name: 'AuthGuard',
  order: 1,
  version: VERSION,
  metrics,
  isAuthenticated() { const auth = _getAuth(); return auth && auth.isAuthenticated ? auth.isAuthenticated() : false; },
  isReady() { const auth = _getAuth(); return auth && auth.isReady ? auth.isReady() : false; },
  check(route: Record<string, unknown>, context: Record<string, unknown>) {
    if (!context) context = {};
    metrics.checks++;
    const auth = _getAuth();
    const policy = context.policy;
    const permissionsMode = context.permissionsMode || 'allow-all';
    if ((route && route.public === true) || policy === GUARD_POLICIES.PUBLIC) { metrics.skippedByPolicy++; _log('debug', '[AuthGuard] Skipped - public route'); return Promise.resolve({ passed: true, reason: 'public-route', guard: this.name, skipped: true, policy, permissionsMode }); }
    if (route && route.requiresAuth === false) { return Promise.resolve({ passed: true, reason: 'no-auth-required', guard: this.name, policy, permissionsMode }); }
    const isAuthenticated = auth && auth.isAuthenticated ? auth.isAuthenticated() : false;
    if (!isAuthenticated) { metrics.blocks++; _log('debug', '[AuthGuard] Blocked - not authenticated', { policy, permissionsMode }); return Promise.resolve({ passed: false, reason: 'not-authenticated', redirect: '/login', guard: this.name, policy, permissionsMode }); }
    return Promise.resolve({ passed: true, reason: 'authenticated', guard: this.name, policy, permissionsMode });
  },
  resetMetrics() { metrics = { checks: 0, blocks: 0, skippedByPolicy: 0 }; this.metrics = metrics; }
};

export { AuthGuard, VERSION, MODULE_ID, injectPorts, getPorts };
export default AuthGuard;
