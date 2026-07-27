// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: ui-orchestrator.adapters.permissions-adapter
// PURPOSE: PermissionsAdapter v1.4.0-P18EC
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   UI_ORCHESTRATOR_EVENTS — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   canExecuteIntent() — exported function
//   canExecuteIntents() — exported function
//   filterAccessibleRules() — exported function
//   getDenialReason() — exported function
//   isConnected() — exported function
//   getCurrentUserInfo() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   UI_ORCHESTRATOR_EVENTS.INTENT_DENIED
//   UI_ORCHESTRATOR_EVENTS.INTENT_GRANTED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
const VERSION = '1.4.0-P18EC';
const MODULE_ID = 'ui-orchestrator.adapters.permissions-adapter';
const UI_ORCHESTRATOR_EVENTS = { INTENT_DENIED: 'ui-orchestrator:intent-denied', INTENT_GRANTED: 'ui-orchestrator:intent-granted' };
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts(): void { Ports.init(); }
function _getPort(name: string): Record<string, unknown> { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>): unknown { return Ports.inject(p); }
function getPorts(): Record<string, unknown> { return Ports.snapshot(); }
let _metrics = { checks: 0, granted: 0, denied: 0, bypassedNoGuard: 0, errors: 0 };
function init(options: Record<string, unknown> = {}): { success: boolean; connected: boolean } {
  return { success: true, connected: !!_getPort('permissionsGuard') };
}
function canExecuteIntent(rule: Record<string, unknown>): Record<string, unknown> { _metrics.checks++; const pg = _getPort('permissionsGuard') as Record<string, unknown> | null; if (!pg) { _metrics.bypassedNoGuard++; return { allowed: true, reason: 'no-guard-available', degraded: true }; } try { const requiresPermission = rule.requiresPermission; const minLevel = rule.minLevel; const intentId = rule.intentId; if (!requiresPermission && !minLevel) { _metrics.granted++; return { allowed: true, reason: 'no-restrictions' }; } if (requiresPermission) { const hasPermission = ((pg.can as ((p: unknown) => boolean) | undefined)?.(requiresPermission)) || ((pg.hasCapability as ((p: unknown) => boolean) | undefined)?.(requiresPermission)); if (!hasPermission) { _metrics.denied++; _emitDenied(intentId as string, 'permission', requiresPermission as string); return { allowed: false, reason: 'missing-permission', required: requiresPermission }; } } if (minLevel) { const hasLevel = (pg.isAtLeastLevel as ((l: unknown) => boolean) | undefined)?.(minLevel); if (!hasLevel) { _metrics.denied++; _emitDenied(intentId as string, 'level', minLevel as string); return { allowed: false, reason: 'insufficient-level', required: minLevel, current: ((pg.getUserLevel as (() => number) | undefined)?.()) || 0 }; } } _metrics.granted++; _emitGranted(rule.intentId as string); return { allowed: true, reason: 'all-checks-passed' }; } catch (error) { _metrics.errors++; return { allowed: false, reason: 'error', error: (error as Error).message }; } }
function canExecuteIntents(rules: Record<string, unknown>[]): Record<string, unknown>[] { return rules.map((rule: Record<string, unknown>) => { const result = canExecuteIntent(rule); return Object.assign({ intentId: rule.intentId }, result); }); }
function filterAccessibleRules(rules: Record<string, unknown>[]): Record<string, unknown>[] { return rules.filter((rule: Record<string, unknown>) => canExecuteIntent(rule).allowed); }
function getDenialReason(rule: Record<string, unknown>): Record<string, unknown> | null { const result = canExecuteIntent(rule); if (result.allowed) return null; return result; }
function _emitDenied(intentId: string, type: string, required: string): void { const eb = _getPort('eventBus') as { emit?: (e: string, d: unknown) => void } | null; if (eb && eb.emit) { eb.emit(UI_ORCHESTRATOR_EVENTS.INTENT_DENIED, { intentId, type, required, timestamp: Date.now() }); } }
function _emitGranted(intentId: string): void { const eb = _getPort('eventBus') as { emit?: (e: string, d: unknown) => void } | null; if (eb && eb.emit) { eb.emit(UI_ORCHESTRATOR_EVENTS.INTENT_GRANTED, { intentId, timestamp: Date.now() }); } }
function isConnected(): boolean { return !!_getPort('permissionsGuard'); }
function getCurrentUserInfo(): Record<string, unknown> | null { const pg = _getPort('permissionsGuard') as Record<string, unknown> | null; if (!pg) return null; return { level: ((pg.getUserLevel as (() => number) | undefined)?.()) || 0, roles: ((pg.getRoles as (() => unknown[]) | undefined)?.()) || [], capabilities: ((pg.getCapabilities as (() => unknown[]) | undefined)?.()) || [] }; }
function getMetrics(): typeof _metrics { return Object.assign({}, _metrics); }
function resetMetrics(): void { _metrics = { checks: 0, granted: 0, denied: 0, bypassedNoGuard: 0, errors: 0 }; }
function info(): Record<string, unknown> { const pg = _getPort('permissionsGuard') as Record<string, unknown> | null; return { moduleId: MODULE_ID, version: VERSION, connected: isConnected(), portsInitialized: Ports.isInitialized(), permissionsGuardVersion: (pg && pg.getVersion) ? (pg.getVersion as () => unknown)() : null, userInfo: getCurrentUserInfo(), metrics: getMetrics() }; }
function healthCheck(): Record<string, unknown> { const pg = _getPort('permissionsGuard') as Record<string, unknown> | null; const connected = isConnected(); const lowErrors = _metrics.errors < 5; const checksWorking = _metrics.checks >= 0; const pgHealthy = pg && pg.healthCheck && (pg.healthCheck as () => { status: string })().status === 'HEALTHY'; const checks = { connected, lowErrors, checksWorking, permissionsGuardHealthy: pgHealthy, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; const status = passed >= 4 ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'; return { status, score: `${passed}/${total}`, checks, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export { VERSION, MODULE_ID, UI_ORCHESTRATOR_EVENTS };
export { injectPorts, getPorts };
export { init, canExecuteIntent, canExecuteIntents, filterAccessibleRules, getDenialReason };
export { isConnected, getCurrentUserInfo };
export { getMetrics, resetMetrics, info, healthCheck };
export default { init, canExecuteIntent, canExecuteIntents, filterAccessibleRules, getDenialReason, isConnected, getCurrentUserInfo, getMetrics, resetMetrics, info, healthCheck, UI_ORCHESTRATOR_EVENTS, injectPorts, getPorts, VERSION, MODULE_ID };
