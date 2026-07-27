
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-metrics-hub
// PURPOSE: Sidebar Metrics Hub - Centralized Metrics Consolidation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   registerSource() — exported function
//   unregisterSource() — exported function
//   updateMetrics() — exported function
//   aggregate() — exported function
//   getSourceMetrics() — exported function
//   getMetricsByCategory() — exported function
//   takeSnapshot() — exported function
//   getSnapshots() — exported function
//   compareSnapshots() — exported function
//   subscribe() — exported function
//   listSources() — exported function
//   cleanup() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getMetrics() — exported function
//   METRIC_CATEGORIES — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar-metrics-hub';

// Ports Pattern
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// Metric Categories
const METRIC_CATEGORIES = Object.freeze({
  CORE: 'core',
  FEATURE: 'feature',
  UI: 'ui',
  PERFORMANCE: 'performance',
  ERROR: 'error',
  USER: 'user'
});

// Internal State
const _state = {
  initialized: false,
  initAt: null as number | null,
  sources: new Map(),
  snapshots: [] as DynObj[],
  maxSnapshots: 100,
  subscribers: new Set(),
  aggregationInterval: null as DynObj,
  lastAggregation: null as DynObj
};

// Core Metrics (always tracked)
const _coreMetrics = {
  hubInits: 0,
  registrations: 0,
  unregistrations: 0,
  aggregations: 0,
  snapshotsTaken: 0,
  errors: 0,
  lastError: null as string | null
};

// Envelope pattern for consistent returns
function _envelope(ok: boolean, data?: DynObj | null, errors?: Array<DynObj>) {
  return {
    ok,
    data: data || null,
    meta: { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() },
    errors: errors || []
  };
}

// Emit event via EventBus
function _emit(event: string, data: DynObj) {
  try {
    const eb = _getPort('eventBus');
    if (eb?.emit) {
      eb.emit(event, { source: MODULE_ID, timestamp: Date.now(), ...data });
    }
  } catch (e: any) {
    _coreMetrics.errors++;
    _coreMetrics.lastError = { event, message: e.message, timestamp: Date.now() } as DynObj;
  }
}

// Notify subscribers
function _notify(action: string, data: DynObj) {
  const payload = { action, data, timestamp: Date.now() };
  // @ts-expect-error strict migration — TS2345
  _state.subscribers.forEach((fn: (payload: DynObj) => void) => {
    try { fn(payload); } catch (e: any) { _coreMetrics.errors++; }
  });
}

// Initialize the hub
export function init(options: { ports?: DynObj; aggregationInterval?: number } = {}) {
  if (_state.initialized) {
    return _envelope(true, { alreadyInitialized: true });
  }
  
  try {
    _initPorts();
    
    if (options.ports) {
      Ports.inject(options.ports);
    }
    
    _state.initialized = true;
    _state.initAt = Date.now();
    _coreMetrics.hubInits++;
    
    // Start periodic aggregation if requested
    if (options.aggregationInterval && options.aggregationInterval > 0) {
      _state.aggregationInterval = setInterval(() => {
        aggregate();
      }, options.aggregationInterval);
    }
    
    _emit(SIDEBAR_EVENTS.MEMORY_INITIALIZED, { version: VERSION });
    
    return _envelope(true, { 
      initialized: true, 
      version: VERSION,
      sourcesCount: _state.sources.size 
    });
  } catch (e: any) {
    _coreMetrics.errors++;
    _coreMetrics.lastError = { phase: 'init', message: e.message, timestamp: Date.now() } as DynObj;
    return _envelope(false, null, [{ code: 'INIT_ERROR', message: e.message }]);
  }
}

// Register a metrics source
export function registerSource(sourceId: string, config: { category?: string; version?: string; getMetrics?: (() => DynObj) | null; healthCheck?: (() => DynObj) | null } = {}) {
  if (!sourceId) {
    return _envelope(false, null, [{ code: 'INVALID_SOURCE', message: 'sourceId is required' }]);
  }
  
  const source = {
    id: sourceId,
    category: config.category || METRIC_CATEGORIES.FEATURE,
    version: config.version || '0.0.0',
    getMetrics: config.getMetrics || null,
    healthCheck: config.healthCheck || null,
    registeredAt: Date.now(),
    lastUpdate: null as DynObj,
    updateCount: 0,
    errors: 0
  };
  
  _state.sources.set(sourceId, source);
  _coreMetrics.registrations++;
  
  _notify('source:registered', { sourceId, category: source.category });
  
  return _envelope(true, { sourceId, registered: true });
}

// Unregister a metrics source
export function unregisterSource(sourceId: string) {
  if (!_state.sources.has(sourceId)) {
    return _envelope(false, null, [{ code: 'NOT_FOUND', message: `Source not found: ${sourceId}` }]);
  }
  
  _state.sources.delete(sourceId);
  _coreMetrics.unregistrations++;
  
  _notify('source:unregistered', { sourceId });
  
  return _envelope(true, { sourceId, unregistered: true });
}

// Update metrics from a source
export function updateMetrics(sourceId: string, metrics: DynObj) {
  const source = _state.sources.get(sourceId);
  if (!source) {
    return _envelope(false, null, [{ code: 'NOT_FOUND', message: `Source not found: ${sourceId}` }]);
  }
  
  source.lastMetrics = metrics;
  source.lastUpdate = Date.now();
  source.updateCount++;
  
  return _envelope(true, { sourceId, updated: true });
}

// Aggregate all metrics
export function aggregate() {
  _coreMetrics.aggregations++;
  _state.lastAggregation = Date.now();
  
  const aggregated = {
    timestamp: Date.now(),
    hub: { ..._coreMetrics },
    sources: {},
    byCategory: {},
    summary: {
      totalSources: _state.sources.size,
      activeSources: 0,
      errorSources: 0,
      categories: {}
    }
  };
  
  // Collect from all sources
  _state.sources.forEach((source, id) => {
    try {
      let metrics = source.lastMetrics;
      
      // If source has getMetrics function, call it
      if (!metrics && typeof source.getMetrics === 'function') {
        metrics = source.getMetrics();
        source.lastMetrics = metrics;
        source.lastUpdate = Date.now();
      }
      
      if (metrics) {
        (aggregated.sources as DynObj)[id] = {
          category: source.category,
          version: source.version,
          metrics,
          lastUpdate: source.lastUpdate,
          updateCount: source.updateCount
        };
        
        aggregated.summary.activeSources++;
        
        // Group by category
        if (!(aggregated.byCategory as DynObj)[source.category]) {
          (aggregated.byCategory as DynObj)[source.category] = {};
        }
        (aggregated.byCategory as DynObj)[source.category][id] = metrics;
        
        // Count categories
        (aggregated.summary.categories as DynObj)[source.category] = 
          ((aggregated.summary.categories as DynObj)[source.category] || 0) + 1;
      }
    } catch (e: any) {
      source.errors++;
      aggregated.summary.errorSources++;
      _coreMetrics.errors++;
    }
  });
  
  return _envelope(true, aggregated);
}

// Get metrics for a specific source
export function getSourceMetrics(sourceId: string) {
  const source = _state.sources.get(sourceId);
  if (!source) {
    return _envelope(false, null, [{ code: 'NOT_FOUND', message: `Source not found: ${sourceId}` }]);
  }
  
  let metrics = source.lastMetrics;
  if (!metrics && typeof source.getMetrics === 'function') {
    try {
      metrics = source.getMetrics();
      source.lastMetrics = metrics;
      source.lastUpdate = Date.now();
    } catch (e: any) {
      source.errors++;
      return _envelope(false, null, [{ code: 'FETCH_ERROR', message: e.message }]);
    }
  }
  
  return _envelope(true, {
    sourceId,
    category: source.category,
    version: source.version,
    metrics,
    lastUpdate: source.lastUpdate
  });
}

// Get metrics by category
export function getMetricsByCategory(category: string) {
  const result = {};
  
  _state.sources.forEach((source, id) => {
    if (source.category === category) {
      let metrics = source.lastMetrics;
      if (!metrics && typeof source.getMetrics === 'function') {
        try { metrics = source.getMetrics(); } catch { }
      }
      if (metrics) {
        (result as DynObj)[id] = metrics;
      }
    }
  });
  
  return _envelope(true, { category, sources: result, count: Object.keys(result).length });
}

// Take a snapshot
export function takeSnapshot(label = '') {
  const snapshot = {
    id: `snap_${Date.now()}`,
    label,
    timestamp: Date.now(),
    data: aggregate().data
  };
  
  _state.snapshots.push(snapshot);
  _coreMetrics.snapshotsTaken++;
  
  // Trim old snapshots
  while (_state.snapshots.length > _state.maxSnapshots) {
    _state.snapshots.shift();
  }
  
  return _envelope(true, { snapshotId: snapshot.id, label });
}

// Get snapshots
export function getSnapshots(limit = 10) {
  const snapshots = _state.snapshots.slice(-limit);
  return _envelope(true, { snapshots, total: _state.snapshots.length });
}

// Compare two snapshots
export function compareSnapshots(snapshotId1: DynObj, snapshotId2: DynObj) {
  const snap1 = _state.snapshots.find(s => s.id === snapshotId1);
  const snap2 = _state.snapshots.find(s => s.id === snapshotId2);
  
  if (!snap1 || !snap2) {
    return _envelope(false, null, [{ code: 'NOT_FOUND', message: 'One or both snapshots not found' }]);
  }
  
  const diff = {
    timeDelta: snap2.timestamp - snap1.timestamp,
    sourcesDelta: snap2.data.summary.totalSources - snap1.data.summary.totalSources,
    changes: {}
  };
  
  // Compare sources
  const allSources = new Set([
    ...Object.keys(snap1.data.sources || {}),
    ...Object.keys(snap2.data.sources || {})
  ]);
  
  allSources.forEach(sourceId => {
    const m1 = snap1.data.sources?.[sourceId]?.metrics;
    const m2 = snap2.data.sources?.[sourceId]?.metrics;
    
    if (!m1 && m2) {
      (diff.changes as Record<string, DynObj>)[sourceId] = { status: 'added' };
    } else if (m1 && !m2) {
      (diff.changes as Record<string, DynObj>)[sourceId] = { status: 'removed' };
    } else if (m1 && m2 && JSON.stringify(m1) !== JSON.stringify(m2)) {
      (diff.changes as Record<string, DynObj>)[sourceId] = { status: 'changed', before: m1, after: m2 };
    }
  });
  
  return _envelope(true, diff);
}

// Subscribe to metrics changes
export function subscribe(callback: DynObj) {
  if (typeof callback !== 'function') {
    return () => {};
  }
  
  _state.subscribers.add(callback);
  return () => _state.subscribers.delete(callback);
}

// List all registered sources
export function listSources() {
  const sources: DynObj[] = [];
  _state.sources.forEach((source, id) => {
    sources.push({
      id,
      category: source.category,
      version: source.version,
      registeredAt: source.registeredAt,
      lastUpdate: source.lastUpdate,
      updateCount: source.updateCount,
      errors: source.errors
    });
  });
  return _envelope(true, { sources, count: sources.length });
}

// Cleanup
export function cleanup() {
  if (_state.aggregationInterval) {
    clearInterval(_state.aggregationInterval);
    _state.aggregationInterval = null;
  }
  
  _state.sources.clear();
  _state.snapshots = [];
  _state.subscribers.clear();
  _state.initialized = false;
  
  return _envelope(true, { cleanedUp: true });
}

// Health Check
export function healthCheck() {
  const checks = {
    initialized: { ok: _state.initialized, severity: 'crit' },
    hasSources: { ok: _state.sources.size > 0, severity: 'warn' },
    noErrors: { ok: _coreMetrics.errors === 0, severity: 'warn' },
    portsInitialized: { ok: Ports.isInitialized(), severity: 'warn' },
    recentAggregation: { 
      ok: _state.lastAggregation && (Date.now() - _state.lastAggregation) < 60000, 
      severity: 'info' 
    }
  };
  
  const issues = [];
  let score = 100;
  
  if (!_state.initialized) {
    issues.push({ code: 'NOT_INIT', severity: 'crit', message: 'Hub not initialized' });
    score -= 50;
  }
  if (_state.sources.size === 0) {
    issues.push({ code: 'NO_SOURCES', severity: 'warn', message: 'No metric sources registered' });
    score -= 10;
  }
  if (_coreMetrics.errors > 0) {
    issues.push({ code: 'HAS_ERRORS', severity: 'warn', message: `${_coreMetrics.errors} errors recorded` });
    score -= 5 * Math.min(_coreMetrics.errors, 10);
  }
  
  const status = score >= 80 ? 'HEALTHY' : score >= 50 ? 'DEGRADED' : 'UNHEALTHY';
  
  return {
    status,
    score,
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    issues,
    metrics: { ..._coreMetrics },
    sourcesCount: _state.sources.size,
    snapshotsCount: _state.snapshots.length,
    subscribersCount: _state.subscribers.size,
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
}

// Info
export function info() {
  return _envelope(true, {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _state.initialized,
    initAt: _state.initAt,
    portsInitialized: Ports.isInitialized(),
    sourcesCount: _state.sources.size,
    snapshotsCount: _state.snapshots.length,
    subscribersCount: _state.subscribers.size,
    categories: Object.values(METRIC_CATEGORIES),
    metrics: { ..._coreMetrics },
    lastAggregation: _state.lastAggregation
  });
}

// Get consolidated metrics (main export for backward compatibility)
export function getMetrics() {
  return aggregate().data;
}

// Export constants
export { METRIC_CATEGORIES };

// Default export
export default {
  VERSION,
  MODULE_ID,
  METRIC_CATEGORIES,
  init,
  cleanup,
  registerSource,
  unregisterSource,
  updateMetrics,
  aggregate,
  getMetrics,
  getSourceMetrics,
  getMetricsByCategory,
  takeSnapshot,
  getSnapshots,
  compareSnapshots,
  subscribe,
  listSources,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
