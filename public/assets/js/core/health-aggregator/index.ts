// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-OBSERVABILITY)
// ═══════════════════════════════════════════════════════════════
// MODULE: health-aggregator
// PURPOSE: Health Aggregator Global
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   HEALTH_EVENTS — phantom import (inline fallback)
//   CORE_MODULES, COMPONENT_MODULES, PANEL_MODULES from ./registry.js
//   isStrict, recordViolation, getViolationsSummary from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   HealthAggregator — exported value
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   HEALTH_EVENTS.SNAPSHOT_COLLECTED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.APP_CONFIG
//   (window as any).HealthAggregator
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
// PHANTOM IMPORT: HEALTH_EVENTS não existe em nenhum catálogo — import original do barrel já era inoperante
const HEALTH_EVENTS = { SNAPSHOT_COLLECTED: 'health:snapshot-collected' };
import { CORE_MODULES, COMPONENT_MODULES, PANEL_MODULES } from './registry.js';
import { isStrict, recordViolation, getViolationsSummary } from '/core/runtime/enterprise/strict-mode.js';

interface HealthResult {
  status: string;
  score: number;
  maxScore: number;
  scoreDisplay?: string;
  checks?: Record<string, boolean> | null;
  issues?: string[] | null;
  version?: string | null;
  moduleId?: string;
  timestamp?: number;
}

interface ModuleHealthEntry {
  path: string;
  status: string;
  available: boolean;
  error?: string;
  score?: number | null;
  scoreRaw?: number;
  scoreMax?: number;
  scoreDisplay?: string;
  checks?: Record<string, boolean> | null;
  issues?: string[] | null;
  version?: string | null;
  moduleId?: string;
  hasHealthCheck?: boolean;
  collectionTime?: number;
  timestamp?: number;
}

interface HealthSnapshot {
  timestamp: number;
  timestampISO: string;
  version: string;
  categories: Record<string, Record<string, ModuleHealthEntry>>;
  summary: { total: number; healthy: number; degraded: number; unhealthy: number; unavailable: number; unknown: number };
  overallStatus: string;
  overallScore: number;
  collectionDuration: number;
}

export var VERSION = '1.5.0-OBSERVABILITY';
export var MODULE_ID = 'health-aggregator';

var Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

var _debug = function() { return window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.debug ? true : false; };
var _log = function(level: string, ...rest: any[]) { var args = Array.prototype.slice.call(arguments, 1); var logger = _getPort('logger'); if (!logger) return; if (level === 'error') { if (logger.error) logger.error.apply(logger, ['[' + MODULE_ID + ']'].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, ['[' + MODULE_ID + ']'].concat(args)); return; } if (_debug() && logger.debug) logger.debug.apply(logger, ['[' + MODULE_ID + ']'].concat(args)); };

var _initialized = false;
var _lastSnapshot: HealthSnapshot | null = null;
var _snapshotInterval: ReturnType<typeof setInterval> | null = null;
var _metrics = { totalCollections: 0, totalModulesChecked: 0, totalHealthy: 0, totalDegraded: 0, totalUnhealthy: 0, totalUnavailable: 0, lastCollectionTime: null as number | null, avgCollectionDuration: 0, collectionErrors: 0 };

function normalizeStatus(status: number) { if (!status) return 'UNAVAILABLE'; var s = String(status).toUpperCase(); if (s === 'HEALTHY' || s === 'OK' || s === 'READY' || s === 'ACTIVE') return 'HEALTHY'; if (s === 'DEGRADED' || s === 'WARNING' || s === 'PARTIAL') return 'DEGRADED'; if (s === 'UNHEALTHY' || s === 'ERROR' || s === 'FAILED' || s === 'CRITICAL') return 'UNHEALTHY'; return 'UNKNOWN'; }
function normalizeScore(score: number, maxScore: number) { if (typeof score !== 'number' || typeof maxScore !== 'number') return null; if (maxScore === 0) return 0; return Math.round((score / maxScore) * 100); }

function collectModuleHealth(modulePath: string, moduleRef: unknown): Promise<ModuleHealthEntry> {
  var startTime = performance.now();
  return Promise.resolve().then(function(): Promise<ModuleHealthEntry> | ModuleHealthEntry {
    var mod: Record<string, unknown> | null = null;
    // @ts-expect-error strict migration — TS7015
    if (typeof moduleRef === 'string') { mod = window[moduleRef] as Record<string, unknown>; } else if (typeof moduleRef === 'function') { mod = (moduleRef as () => Record<string, unknown>)(); } else { mod = moduleRef as Record<string, unknown>; }
    if (!mod) { return { path: modulePath, status: 'UNAVAILABLE', available: false, error: 'Module not found' }; }
    var healthPromise: Promise<HealthResult> | null = null;
    if (typeof mod.healthCheck === 'function') { healthPromise = Promise.resolve((mod.healthCheck as () => HealthResult)()); } else if (typeof mod.health === 'function') { healthPromise = Promise.resolve((mod.health as () => HealthResult)()); } else if (mod.default && (mod.default as Record<string, unknown>).healthCheck) { healthPromise = Promise.resolve(((mod.default as Record<string, unknown>).healthCheck as () => HealthResult)()); }
    if (!healthPromise) { return { path: modulePath, status: 'UNKNOWN', available: true, hasHealthCheck: false, version: (mod.VERSION as string) || (mod.version as string) || (mod.getVersion ? (mod.getVersion as () => string)() : null) }; }
    return healthPromise.then(function(health: HealthResult): ModuleHealthEntry {
      var duration = performance.now() - startTime;
      return { path: modulePath, status: normalizeStatus(health.status as unknown as number), score: normalizeScore(health.score, health.maxScore), scoreRaw: health.score, scoreMax: health.maxScore, scoreDisplay: health.scoreDisplay || health.score + '/' + health.maxScore, checks: health.checks || null, issues: health.issues || null, version: health.version || (mod as Record<string, unknown>).VERSION as string || null, moduleId: health.moduleId || modulePath, available: true, hasHealthCheck: true, collectionTime: duration, timestamp: health.timestamp || Date.now() };
    });
  }).catch(function(error: Error) { _metrics.collectionErrors++; _log('warn', 'Health collection failed for ' + modulePath + ':', error.message); return { path: modulePath, status: 'UNAVAILABLE', available: false, error: error.message }; });
}

function collectCategory(category: string, modules: Record<string, unknown>) { var results: Record<string, ModuleHealthEntry> = {}; var entries = Object.entries(modules); return Promise.all(entries.map(function(entry) { return collectModuleHealth(entry[0], entry[1]).then(function(r) { results[entry[0]] = r; }); })).then(function() { return results; }); }

function collectSnapshot() {
  var startTime = performance.now();
  _metrics.totalCollections++;
  _log('info', 'Collecting health snapshot...');
  var snapshot: HealthSnapshot = { timestamp: Date.now(), timestampISO: new Date().toISOString(), version: VERSION, categories: {} as Record<string, Record<string, ModuleHealthEntry>>, summary: { total: 0, healthy: 0, degraded: 0, unhealthy: 0, unavailable: 0, unknown: 0 }, overallStatus: 'HEALTHY', overallScore: 0, collectionDuration: 0 };
  return Promise.all([
    collectCategory('core', CORE_MODULES).then(function(r) { snapshot.categories.core = r; }),
    collectCategory('components', COMPONENT_MODULES).then(function(r) { snapshot.categories.components = r; }),
    collectCategory('panels', PANEL_MODULES).then(function(r) { snapshot.categories.panels = r; })
  ]).then(function() {
    for (var catName in snapshot.categories) { var category = snapshot.categories[catName]; for (var modName in category) { var module = category[modName]; snapshot.summary.total++; _metrics.totalModulesChecked++; switch (module.status) { case 'HEALTHY': snapshot.summary.healthy++; _metrics.totalHealthy++; break; case 'DEGRADED': snapshot.summary.degraded++; _metrics.totalDegraded++; break; case 'UNHEALTHY': snapshot.summary.unhealthy++; _metrics.totalUnhealthy++; break; case 'UNAVAILABLE': snapshot.summary.unavailable++; _metrics.totalUnavailable++; break; default: snapshot.summary.unknown++; break; } } }
    var healthy = snapshot.summary.healthy, degraded = snapshot.summary.degraded, unhealthy = snapshot.summary.unhealthy;
    if (unhealthy > 0) { snapshot.overallStatus = 'UNHEALTHY'; } else if (degraded > 0) { snapshot.overallStatus = 'DEGRADED'; } else { snapshot.overallStatus = 'HEALTHY'; }
    var availableTotal = healthy + degraded + unhealthy;
    if (availableTotal > 0) { snapshot.overallScore = Math.round(((healthy * 100) + (degraded * 50)) / availableTotal); }
    snapshot.collectionDuration = performance.now() - startTime;
    _metrics.lastCollectionTime = Date.now();
    _metrics.avgCollectionDuration = (_metrics.avgCollectionDuration * (_metrics.totalCollections - 1) + snapshot.collectionDuration) / _metrics.totalCollections;
    _lastSnapshot = snapshot;
    _log('info', 'Health snapshot collected: ' + snapshot.overallStatus + ' (' + snapshot.overallScore + '%) - ' + snapshot.summary.total + ' modules in ' + snapshot.collectionDuration.toFixed(0) + 'ms');
    try { var eventBus = _getPort('eventBus'); if (eventBus && eventBus.emit) { eventBus.emit(HEALTH_EVENTS.SNAPSHOT_COLLECTED, { status: snapshot.overallStatus, score: snapshot.overallScore, summary: snapshot.summary, timestamp: snapshot.timestamp }); } } catch (e) {}
    return snapshot;
  });
}

function init(options: Record<string, unknown>) { if (_initialized) { _log('warn', 'Already initialized'); return HealthAggregator; } options = options || {}; var autoCollect = options.autoCollect || false; var interval = (options.interval as number) || 60000; if (autoCollect && interval > 0) { _snapshotInterval = setInterval(function() { collectSnapshot().catch(function(e) { _log('error', 'Auto-collect failed:', e); }); }, interval); } _initialized = true; _log('info', VERSION + ' initialized', { autoCollect: autoCollect, interval: interval }); return HealthAggregator; }
function shutdown() { if (_snapshotInterval) { clearInterval(_snapshotInterval); _snapshotInterval = null; } _initialized = false; _log('info', 'Shutdown complete'); }
function getSnapshot() { return _lastSnapshot; }
function refresh() { return collectSnapshot(); }
function getModuleHealth(modulePath: string) { if (!_lastSnapshot) return null; for (var catName in _lastSnapshot.categories) { var category = _lastSnapshot.categories[catName]; if (category[modulePath]) { return category[modulePath]; } } return null; }
function getCriticalModules() { if (!_lastSnapshot) return []; var critical: (ModuleHealthEntry & { category: string; module: string })[] = []; for (var catName in _lastSnapshot.categories) { var category = _lastSnapshot.categories[catName]; for (var modName in category) { var mod = category[modName]; if (mod.status === 'UNHEALTHY' || mod.status === 'DEGRADED') { critical.push(Object.assign({ category: catName, module: modName }, mod)); } } } return critical.sort(function(a, b) { var order: Record<string, number> = { UNHEALTHY: 0, DEGRADED: 1 }; return (order[a.status] !== undefined ? order[a.status] : 2) - (order[b.status] !== undefined ? order[b.status] : 2); }); }
function getMetrics() { return Object.assign({}, _metrics); }
function info() { var strictSummary = null; try { strictSummary = getViolationsSummary(); } catch (e) {} return { moduleId: MODULE_ID, version: VERSION, initialized: _initialized, strictMode: isStrict(), strictViolations: strictSummary ? strictSummary.total : 0, lastSnapshot: _lastSnapshot ? { timestamp: _lastSnapshot.timestamp, status: _lastSnapshot.overallStatus, score: _lastSnapshot.overallScore, total: _lastSnapshot.summary.total } : null, metrics: Object.assign({}, _metrics), autoCollectActive: !!_snapshotInterval, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }
function healthCheck() { var checks: Record<string, boolean> = { initialized: _initialized, hasSnapshot: !!_lastSnapshot, recentSnapshot: _lastSnapshot ? (Date.now() - _lastSnapshot.timestamp) < 300000 : false, lowErrorRate: _metrics.collectionErrors < _metrics.totalCollections * 0.1 || _metrics.totalCollections === 0, portsInitialized: Ports.isInitialized() }; var passed = 0; var total = 0; for (var k in checks) { if (checks.hasOwnProperty(k)) { total++; if (checks[k]) passed++; } } var status = 'HEALTHY'; if (passed < total * 0.5) status = 'UNHEALTHY'; else if (passed < total) status = 'DEGRADED'; var issues: string[] = []; for (var key in checks) { if (checks.hasOwnProperty(key) && !checks[key]) issues.push(key); } var strictSummary = null; try { strictSummary = getViolationsSummary(); } catch (e) {} return { status: status, score: passed, maxScore: total, scoreDisplay: passed + '/' + total, checks: checks, issues: issues.length > 0 ? issues : null, strictMode: isStrict(), strictViolations: strictSummary ? strictSummary.total : 0, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

var HealthAggregator = { init: init, shutdown: shutdown, refresh: refresh, getSnapshot: getSnapshot, getModuleHealth: getModuleHealth, getCriticalModules: getCriticalModules, getMetrics: getMetrics, info: info, healthCheck: healthCheck, injectPorts: injectPorts, getPorts: getPorts, getVersion: function() { return VERSION; } };

// DevTools sempre permitido
window.__dev = window.__dev || {};
window.__dev.health = function() { return HealthAggregator.refresh(); };
window.__dev.healthAggregator = { getVersion: function() { return VERSION; }, info: function() { return HealthAggregator.info(); }, healthCheck: function() { return HealthAggregator.healthCheck(); }, refresh: function() { return HealthAggregator.refresh(); }, getSnapshot: function() { return HealthAggregator.getSnapshot(); }, getCritical: function() { return HealthAggregator.getCriticalModules(); } };

// Exposição global apenas em modo não-strict
if (!isStrict()) {
  (window as any).HealthAggregator = HealthAggregator;
} else {
  recordViolation('GLOBAL_EXPOSURE_BLOCKED', {
    moduleId: MODULE_ID,
    globals: ['HealthAggregator'],
    reason: 'Strict mode active - use ES modules import'
  });
}

export { HealthAggregator };
export default HealthAggregator;
