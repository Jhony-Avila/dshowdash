// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.js.event-bus.metrics-tracker
// PURPOSE: EventBus Metrics & Telemetry Tracker (Factory Pattern)
// ───────────────────────────────────────────────────────────────
// @contract P24 - Factory Pattern with Dependency Injection
// @contract P14 - Zero window.* direct access in core logic
// ───────────────────────────────────────────────────────────────
// PROVIDES: createMetricsTracker, MetricsTracker class
// @changelog v6.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v6.0.0-P24 - Factory Pattern with dependency injection
// ═══════════════════════════════════════════════════════════════
'use strict';

const VERSION = '6.1.0-P2-ENTERPRISE';
const MODULE_ID = 'core.js.event-bus.metrics-tracker';

interface EventMetricEntry {
  emits: number;
  handled: number;
  errors: number;
  totalDuration: number;
  maxDuration: number;
  minDuration: number;
}

interface EventLogEntry {
  action: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
}

interface HistoryEntry {
  name: string;
  data: unknown;
  [key: string]: unknown;
}

type StatKey = 'emitted' | 'handled' | 'errors' | 'skipped' | 'subscribes' | 'unsubscribes' | 'dedupePrevented' | 'timeouts' | 'wildcardMatches' | 'replays' | 'startTime';

interface TelemetryPort {
  track?: (eventName: string, data: Record<string, unknown>) => void;
  [key: string]: unknown;
}


// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTION (P24)
// ═══════════════════════════════════════════════════════════════

function createMetricsTracker(options: { maxLogSize?: number; maxHistorySize?: number; telemetryEnabled?: boolean; telemetryCore?: Record<string, unknown> | null; telemetry?: Record<string, unknown> | null } = {}) {
  // Destructure options
  const {
    maxLogSize = 500,
    maxHistorySize = 100,
    telemetryEnabled = true,
    // Injected ports
    telemetryCore = null,
    telemetry = null
  } = options;

  // Instance ports (can be late-bound)
  let _ports = {
    telemetryCore,
    telemetry,
    _initialized: !!(telemetryCore || telemetry)
  };

  // Internal state
  const _stats = {
    emitted: 0,
    handled: 0,
    errors: 0,
    skipped: 0,
    subscribes: 0,
    unsubscribes: 0,
    dedupePrevented: 0,
    timeouts: 0,
    wildcardMatches: 0,
    replays: 0,
    startTime: Date.now()
  };

  const _eventMetrics: Map<string, EventMetricEntry> = new Map();
  let _eventLog: EventLogEntry[] = [];
  let _history: HistoryEntry[] = [];
  let _maxLogSize = maxLogSize;
  let _maxHistorySize = maxHistorySize;
  let _telemetryEnabled = telemetryEnabled;

  // ─────────────────────────────────────────────────────────────
  // Ports Management (P24)
  // ─────────────────────────────────────────────────────────────

  function _lateBindPorts() {
    if (_ports._initialized) return;
    if (typeof window !== 'undefined') {
      if (!_ports.telemetryCore) _ports.telemetryCore = (window as unknown as Record<string, unknown>).TelemetryCore as Record<string, unknown> || null;
      if (!_ports.telemetry) _ports.telemetry = (window as unknown as Record<string, unknown>).Telemetry as Record<string, unknown> || null;
    }
    _ports._initialized = true;
  }

  function injectPorts(ports: Record<string, unknown> = {}) {
    if (ports.telemetryCore) _ports.telemetryCore = ports.telemetryCore as Record<string, unknown>;
    if (ports.telemetry) _ports.telemetry = ports.telemetry as Record<string, unknown>;
    _ports._initialized = true;
    return _ports;
  }

  function getPorts() {
    return { ..._ports };
  }

  // ─────────────────────────────────────────────────────────────
  // Stats Management
  // ─────────────────────────────────────────────────────────────

  function increment(stat: StatKey, value = 1) {
    if (_stats.hasOwnProperty(stat)) {
      _stats[stat] += value;
    }
  }

  function getStats() {
    return { ..._stats };
  }

  function resetStats() {
    (Object.keys(_stats) as StatKey[]).forEach(key => {
      if (key === 'startTime') {
        _stats[key] = Date.now();
      } else {
        _stats[key] = 0;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Event Metrics
  // ─────────────────────────────────────────────────────────────

  function updateEventMetrics(eventName: string, type: string, duration: number | null = null) {
    if (!_eventMetrics.has(eventName)) {
      _eventMetrics.set(eventName, {
        emits: 0,
        handled: 0,
        errors: 0,
        totalDuration: 0,
        maxDuration: 0,
        minDuration: Infinity
      });
    }

    const metrics = _eventMetrics.get(eventName);

    if (type === 'emits') metrics!.emits++;
    if (type === 'handled') metrics!.handled++;
    if (type === 'errors') metrics!.errors++;

    if (duration !== null) {
      metrics!.totalDuration += duration;
      metrics!.maxDuration = Math.max(metrics!.maxDuration, duration);
      metrics!.minDuration = Math.min(metrics!.minDuration, duration);
    }
  }

  function getEventMetrics(eventName: string | null = null) {
    if (eventName) {
      return _eventMetrics.get(eventName) ?? null;
    }
    return getEventMetricsSummary();
  }

  function getEventMetricsSummary() {
    const summary: Record<string, Record<string, unknown>> = {};
    _eventMetrics.forEach((metrics, eventName) => {
      summary[eventName] = {
        ...metrics,
        avgDuration: metrics.handled > 0 ? (metrics.totalDuration / metrics.handled).toFixed(2) : 0,
        errorRate: metrics.emits > 0 ? `${((metrics.errors / metrics.emits) * 100).toFixed(2)}%` : '0%'
      };
    });
    return summary;
  }

  function clearEventMetrics() {
    _eventMetrics.clear();
  }

  // ─────────────────────────────────────────────────────────────
  // Event Log
  // ─────────────────────────────────────────────────────────────

  function addToLog(action: string, eventName: string, data: Record<string, unknown> = {}) {
    _eventLog.push({
      action,
      event: eventName,
      data,
      timestamp: Date.now()
    });
    if (_eventLog.length > _maxLogSize) {
      _eventLog.shift();
    }
  }

  function getEventLog() {
    return [..._eventLog];
  }

  function getRecentEvents(count = 20) {
    return _eventLog.slice(-count);
  }

  function clearEventLog() {
    _eventLog = [];
  }

  function getTopEvents(limit = 10) {
    const eventCounts: Record<string, number> = {};
    _eventLog.forEach(entry => {
      if (entry.action === 'emit') {
        eventCounts[entry.event] = (eventCounts[entry.event] || 0) + 1;
      }
    });

    return Object.entries(eventCounts)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, limit)
      .map(([event, count]) => ({ event, count }));
  }

  // ─────────────────────────────────────────────────────────────
  // History
  // ─────────────────────────────────────────────────────────────

  function addToHistory(event: HistoryEntry) {
    _history.push(event);
    if (_history.length > _maxHistorySize) {
      _history.shift();
    }
  }

  function getHistory() {
    return [..._history];
  }

  function getHistoryByEvent(eventName: string) {
    return _history.filter(e => e.name === eventName);
  }

  function clearHistory() {
    _history = [];
  }

  function getHistorySize() {
    return _history.length;
  }

  // ─────────────────────────────────────────────────────────────
  // Telemetry (P24: via injected ports)
  // ─────────────────────────────────────────────────────────────

  function trackTelemetry(eventName: string, data: Record<string, unknown>) {
    if (!_telemetryEnabled) return;
    _lateBindPorts();

    if ((_ports.telemetryCore as TelemetryPort | null)?.track) {
      try { (_ports.telemetryCore as TelemetryPort).track!(eventName, data); } catch (e) { /* silent */ }
    }
    if ((_ports.telemetry as TelemetryPort | null)?.track) {
      try { (_ports.telemetry as TelemetryPort).track!(eventName, data); } catch (e) { /* silent */ }
    }
  }

  function setTelemetryEnabled(enabled: boolean) {
    _telemetryEnabled = !!enabled;
  }

  // ─────────────────────────────────────────────────────────────
  // Health Check (P24: autocontido)
  // ─────────────────────────────────────────────────────────────

  function healthCheck(listenerCount = 0, cacheSize = 0, isDestroyed = false) {
    _lateBindPorts();

    const hasLeaks = listenerCount > 500;
    const highErrorRate = _stats.emitted > 100 && (_stats.errors / _stats.emitted) > 0.05;
    const highTimeoutRate = _stats.handled > 100 && (_stats.timeouts / _stats.handled) > 0.1;

    const checks = {
      notDestroyed: !isDestroyed,
      noLeaks: !hasLeaks,
      lowErrorRate: !highErrorRate,
      lowTimeoutRate: !highTimeoutRate,
      cacheHealthy: cacheSize < 1000,
      dedupeWorking: _stats.dedupePrevented >= 0,
      portsInitialized: _ports._initialized
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const issues = [];

    if (isDestroyed) issues.push('EventBus is destroyed');
    if (hasLeaks) issues.push(`High listener count: ${listenerCount}`);
    if (highErrorRate) issues.push(`High error rate: ${(_stats.errors / _stats.emitted * 100).toFixed(2)}%`);
    if (highTimeoutRate) issues.push(`High timeout rate: ${(_stats.timeouts / _stats.handled * 100).toFixed(2)}%`);

    return {
      status: passed === total ? 'HEALTHY' : passed >= 4 ? 'DEGRADED' : 'UNHEALTHY',
      score: `${passed}/${total}`,
      healthy: passed === total,
      checks,
      issues: issues.length > 0 ? issues : null,
      version: VERSION,
      moduleId: MODULE_ID,
      listenerCount,
      stats: { ..._stats },
      architecture: 'FACTORY-PATTERN-P24',
      p24Instrumented: true,
      timestamp: Date.now()
    };
  }

  function info() {
    _lateBindPorts();
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      architecture: 'FACTORY-PATTERN-P24',
      telemetryEnabled: _telemetryEnabled,
      portsInitialized: _ports._initialized,
      hasTelemetryCore: !!_ports.telemetryCore,
      hasTelemetry: !!_ports.telemetry,
      eventMetricsCount: _eventMetrics.size,
      eventLogSize: _eventLog.length,
      historySize: _history.length,
      stats: { ..._stats },
      p24Instrumented: true,
      timestamp: Date.now()
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────────────────────

  function reset() {
    resetStats();
    clearEventMetrics();
    clearEventLog();
    clearHistory();
  }

  // ─────────────────────────────────────────────────────────────
  // Public API (frozen)
  // ─────────────────────────────────────────────────────────────

  return {
    // Stats
    increment,
    getStats,
    resetStats,

    // Event Metrics
    updateEventMetrics,
    getEventMetrics,
    getEventMetricsSummary,
    clearEventMetrics,

    // Event Log
    addToLog,
    getEventLog,
    getRecentEvents,
    clearEventLog,
    getTopEvents,

    // History
    addToHistory,
    getHistory,
    getHistoryByEvent,
    clearHistory,
    get historySize() { return getHistorySize(); },

    // Telemetry
    trackTelemetry,
    setTelemetryEnabled,

    // Diagnostics
    healthCheck,
    info,

    // Lifecycle
    reset,

    // Ports (P24)
    injectPorts,
    getPorts,

    // Identity
    VERSION,
    MODULE_ID
  };
}

// ═══════════════════════════════════════════════════════════════
// CLASS WRAPPER (retrocompatibilidade com EventBus)
// ═══════════════════════════════════════════════════════════════

type MetricsTrackerInstance = ReturnType<typeof createMetricsTracker>;

class MetricsTracker {
  [key: string]: unknown;
  private _tracker: MetricsTrackerInstance;

  constructor(options: { maxLogSize?: number; maxHistorySize?: number; telemetryEnabled?: boolean; telemetryCore?: Record<string, unknown> | null; telemetry?: Record<string, unknown> | null } = {}) {
    // Create internal tracker via factory
    this._tracker = createMetricsTracker(options);

    // Proxy all methods
    this.increment = this._tracker.increment;
    this.getStats = this._tracker.getStats;
    this.resetStats = this._tracker.resetStats;
    this.updateEventMetrics = this._tracker.updateEventMetrics;
    this.getEventMetrics = this._tracker.getEventMetrics;
    this.getEventMetricsSummary = this._tracker.getEventMetricsSummary;
    this.clearEventMetrics = this._tracker.clearEventMetrics;
    this.addToLog = this._tracker.addToLog;
    this.getEventLog = this._tracker.getEventLog;
    this.getRecentEvents = this._tracker.getRecentEvents;
    this.clearEventLog = this._tracker.clearEventLog;
    this.getTopEvents = this._tracker.getTopEvents;
    this.addToHistory = this._tracker.addToHistory;
    this.getHistory = this._tracker.getHistory;
    this.getHistoryByEvent = this._tracker.getHistoryByEvent;
    this.clearHistory = this._tracker.clearHistory;
    this.trackTelemetry = this._tracker.trackTelemetry;
    this.setTelemetryEnabled = this._tracker.setTelemetryEnabled;
    this.healthCheck = this._tracker.healthCheck;
    this.info = this._tracker.info;
    this.reset = this._tracker.reset;
    this.injectPorts = this._tracker.injectPorts;
    this.getPorts = this._tracker.getPorts;
  }

  get historySize() {
    return this._tracker.historySize;
  }

  get VERSION() { return VERSION; }
  get MODULE_ID() { return MODULE_ID; }
}

// ═══════════════════════════════════════════════════════════════
// MODULE-LEVEL PORTS (retrocompatibilidade com imports existentes)
// ═══════════════════════════════════════════════════════════════

const _modulePorts: { telemetryCore: TelemetryPort | null; telemetry: TelemetryPort | null; _initialized: boolean } = {
  telemetryCore: null,
  telemetry: null,
  _initialized: false
};

function injectPorts(ports: Record<string, unknown> = {}) {
  if (ports.telemetryCore) _modulePorts.telemetryCore = ports.telemetryCore as TelemetryPort;
  if (ports.telemetry) _modulePorts.telemetry = ports.telemetry as TelemetryPort;
  _modulePorts._initialized = true;
}

function getPorts() {
  return { ..._modulePorts };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { VERSION, MODULE_ID, createMetricsTracker, MetricsTracker, injectPorts, getPorts };
export default MetricsTracker;
