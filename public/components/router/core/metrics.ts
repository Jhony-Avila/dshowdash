// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.core.metrics
// PURPOSE: Router - Metrics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   metrics — exported value
//   aaaMetrics — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   incrementResolve() — exported function
//   incrementStatic() — exported function
//   incrementDynamic() — exported function
//   incrementPattern() — exported function
//   incrementNotFound() — exported function
//   incrementLegacyInference() — exported function
//   recordInferredRoute() — exported function
//   setDynamicRoutesLoaded() — exported function
//   isDynamicRoutesLoaded() — exported function
//   getAAAMetrics() — exported function
//   getMetricsSummary() — exported function
//   resetMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
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
export const VERSION = '1.1.0-P17WI';
export const MODULE_ID = 'router.core.metrics';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export const metrics = { lastResolvedPath: null as string | null, lastResolveTime: null as number | null, resolveCount: 0, notFoundCount: 0, dynamicHits: 0, dynamicRoutesLoaded: false, inferredRouteCount: 0, inferredRoutePaths: new Set(), strictModeBlockCount: 0, strictModeBlockedPaths: new Set(), hardenedBlockCount: 0, hardenedBlockedPaths: new Set() };
export const aaaMetrics = { routesResolved: 0, routesFromStatic: 0, routesFromDynamic: 0, routesFromPattern: 0, routesBlocked: 0, legacyInferenceAttempts: 0, aaaCompliant: true };
export function incrementResolve(path: string) { metrics.resolveCount++; aaaMetrics.routesResolved++; metrics.lastResolvedPath = path; metrics.lastResolveTime = Date.now(); }
export function incrementStatic() { aaaMetrics.routesFromStatic++; }
export function incrementDynamic() { metrics.dynamicHits++; aaaMetrics.routesFromDynamic++; }
export function incrementPattern() { aaaMetrics.routesFromPattern++; }
export function incrementNotFound() { metrics.notFoundCount++; aaaMetrics.routesBlocked++; }
export function incrementLegacyInference(path: string) { aaaMetrics.legacyInferenceAttempts++; metrics.hardenedBlockCount++; metrics.hardenedBlockedPaths.add(path); }
export function recordInferredRoute(path: string) { metrics.inferredRouteCount++; metrics.inferredRoutePaths.add(path); aaaMetrics.aaaCompliant = false; }
export function setDynamicRoutesLoaded(loaded: boolean) { metrics.dynamicRoutesLoaded = loaded; }
export function isDynamicRoutesLoaded() { return metrics.dynamicRoutesLoaded; }
export function getAAAMetrics() { return { routesResolved: aaaMetrics.routesResolved, routesFromStatic: aaaMetrics.routesFromStatic, routesFromDynamic: aaaMetrics.routesFromDynamic, routesFromPattern: aaaMetrics.routesFromPattern, routesBlocked: aaaMetrics.routesBlocked, legacyInferenceAttempts: aaaMetrics.legacyInferenceAttempts, aaaCompliant: aaaMetrics.aaaCompliant, legacyInference: { count: metrics.inferredRouteCount, uniquePaths: metrics.inferredRoutePaths.size, paths: Array.from(metrics.inferredRoutePaths) }, blockedByAAA: { count: metrics.hardenedBlockCount, paths: Array.from(metrics.hardenedBlockedPaths) } }; }
export function getMetricsSummary() { return { resolved: metrics.resolveCount, notFound: metrics.notFoundCount, dynamicHits: metrics.dynamicHits, lastPath: metrics.lastResolvedPath, lastTime: metrics.lastResolveTime, inferredCount: metrics.inferredRouteCount, hardenedBlockCount: metrics.hardenedBlockCount }; }
export function resetMetrics() { metrics.resolveCount = 0; metrics.notFoundCount = 0; metrics.dynamicHits = 0; metrics.lastResolvedPath = null; metrics.lastResolveTime = null; metrics.inferredRouteCount = 0; metrics.inferredRoutePaths.clear(); metrics.strictModeBlockCount = 0; metrics.strictModeBlockedPaths.clear(); metrics.hardenedBlockCount = 0; metrics.hardenedBlockedPaths.clear(); aaaMetrics.routesResolved = 0; aaaMetrics.routesFromStatic = 0; aaaMetrics.routesFromDynamic = 0; aaaMetrics.routesFromPattern = 0; aaaMetrics.routesBlocked = 0; aaaMetrics.legacyInferenceAttempts = 0; aaaMetrics.aaaCompliant = true; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, resolveCount: metrics.resolveCount, portsInitialized: Ports.isInitialized() }; }
export default { metrics, aaaMetrics, incrementResolve, incrementStatic, incrementDynamic, incrementPattern, incrementNotFound, incrementLegacyInference, recordInferredRoute, getAAAMetrics, getMetricsSummary, resetMetrics, healthCheck, injectPorts, getPorts };
