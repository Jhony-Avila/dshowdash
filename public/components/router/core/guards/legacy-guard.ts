// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.6.0-P25)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.core.guards.legacy-guard
// PURPOSE: Router - Legacy Guard (minLevel)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   GUARD_POLICIES from /components/router/registry/definitions/constants.js
//
// PROVIDES:
//   LegacyGuard — exported value
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

const MODULE_ID = 'router.core.guards.legacy-guard';
const VERSION = '1.6.0-P25';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _log(level: 'error' | 'warn' | 'info' | 'debug', msg: string, ctx?: Record<string, unknown>) { if (!ctx) ctx = {}; const logger = _getPort('logger'); if (!logger || typeof logger[level] !== 'function') return; ctx.component = MODULE_ID; logger[level](msg, ctx); }

function _getAuth() { if (hasWindow) { return (window as any).AuthAdapter || (window as any).CoreAuthAdapter || null; } return null; }

let metrics = { checks: 0, blocks: 0, minLevelUsage: 0, skippedByPolicy: 0, bypassedByMode: 0 };

const LegacyGuard = {
  name: 'LegacyGuard',
  order: 3,
  deprecated: true,
  version: VERSION,
  metrics,
  getUserLevel() { const auth = _getAuth(); return auth && auth.getLevel ? auth.getLevel() : 0; },
  check(route: Record<string, unknown>, context: Record<string, unknown>) {
    if (!context) context = {};
    metrics.checks++;
    const auth = _getAuth();
    const policy = context.policy;
    const permissionsMode = context.permissionsMode || 'allow-all';
    if (permissionsMode === 'allow-all') { metrics.bypassedByMode++; _log('debug', '[LegacyGuard] Bypassed by allow-all mode'); return Promise.resolve({ passed: true, reason: 'bypassed-by-mode', guard: this.name, skipped: true, policy, permissionsMode }); }
    if (policy && policy !== GUARD_POLICIES.LEGACY && policy !== GUARD_POLICIES.HYBRID) { metrics.skippedByPolicy++; _log('debug', '[LegacyGuard] Skipped by policy', { policy }); return Promise.resolve({ passed: true, reason: 'skipped-by-policy', guard: this.name, skipped: true, policy, permissionsMode }); }
    const minLevel = route ? route.minLevel : null;
    if (typeof minLevel !== 'number' || minLevel <= 0) { return Promise.resolve({ passed: true, reason: 'no-min-level', guard: this.name, policy, permissionsMode }); }
    metrics.minLevelUsage++;
    _log('warn', '[LegacyGuard] minLevel usage detected (deprecated)', { minLevel, route: route ? route.path : null });
    const userLevel = auth && auth.getLevel ? auth.getLevel() : 0;
    if (userLevel < minLevel) { metrics.blocks++; _log('debug', '[LegacyGuard] Blocked by minLevel', { userLevel, minLevel, policy, permissionsMode }); return Promise.resolve({ passed: false, reason: 'insufficient-level', redirect: '/forbidden', guard: this.name, details: { required: minLevel, current: userLevel }, policy, permissionsMode }); }
    return Promise.resolve({ passed: true, reason: 'level-ok', guard: this.name, policy, permissionsMode });
  },
  resetMetrics() { metrics = { checks: 0, blocks: 0, minLevelUsage: 0, skippedByPolicy: 0, bypassedByMode: 0 }; this.metrics = metrics; },
  healthCheck() {
    const checks = { portsInitialized: Ports.isInitialized(), authAdapterAvailable: !!_getAuth() };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed >= 1 ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, metrics, deprecated: true, p25Compliant: true, timestamp: Date.now() };
  },
  info() { return { moduleId: MODULE_ID, version: VERSION, deprecated: true, metrics, p25Compliant: true }; }
};

export { LegacyGuard, VERSION, MODULE_ID, injectPorts, getPorts };
export default LegacyGuard;
