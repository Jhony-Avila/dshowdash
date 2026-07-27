// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.analytics-manager.state.store
// PURPOSE: State store for analytics data, events, metrics and sessions
// ───────────────────────────────────────────────────────────────
// @contract GET - get(key) retrieves store value by key
// @contract SET - set(key, value) sets store value
// @contract ADD_EVENT - addEvent(event) adds analytics event
// @contract GET_EVENTS - getEvents() returns all events
// @contract CLEAR_EVENTS - clearEvents() clears event buffer
// @contract SET_METRIC - setMetric(key, value) sets a metric
// @contract INCREMENT_METRIC - incrementMetric(key, amount) increments metric
// @contract GET_METRIC - getMetric(key) returns metric value
// @contract GET_ALL_METRICS - getAllMetrics() returns all metrics
// @contract START_SESSION - startSession() starts new analytics session
// @contract END_SESSION - endSession() ends current session
// @contract GET_CURRENT_SESSION - getCurrentSession() returns active session
// @contract SUBSCRIBE - subscribe(listener) registers change listener
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES: analyticsStore, injectPorts, getPorts, info, healthCheck, VERSION, MODULE_ID
// @changelog v1.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.4.0-P17WI: Migração para PortsFactory/PortsProfiles
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.analytics-manager.state.store';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() {
  Ports.init();
}

function _getPort(name: string) {
  return Ports.get(name);
}

export function injectPorts(p: Record<string, unknown>) {
  return Ports.inject(p);
}

export function getPorts() {
  return Ports.snapshot();
}

const _debug = () => {
  const cfg = _getPort('config');
  return (cfg && cfg.app && cfg.app.debug) ? true : false;
};

const _log = function(level: string, ...args: unknown[]) {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = '[AnalyticsStore]';
  if (level === 'error') {
    logger.error?.(prefix, ...args);
    return;
  }
  if (level === 'warn') {
    logger.warn?.(prefix, ...args);
    return;
  }
  if (_debug()) {
    logger.debug?.(prefix, ...args);
  }
};

const analyticsData: Record<string, any> = {
  events: [],
  metrics: {},
  sessions: [],
  currentSession: null,
  maxEvents: 1000,
  lastFlush: null
};

const storeListeners = new Set<Function>();

export const analyticsStore = {
  get(key: string) {
    if (key) return analyticsData[key];
    return { ...analyticsData };
  },

  set(key: string, value: unknown) {
    const oldValue = analyticsData[key];
    analyticsData[key] = value;
    this._notify('set', key, value, oldValue);
    return true;
  },

  addEvent(event: Record<string, unknown>) {
    const entry = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      name: event.name,
      category: event.category || 'general',
      action: event.action || null,
      label: event.label || null,
      value: event.value || null,
      metadata: event.metadata || {}
    };
    analyticsData.events.push(entry);
    if (analyticsData.events.length > analyticsData.maxEvents) {
      analyticsData.events.shift();
    }
    this._notify('event-added', 'events', entry, null);
    return entry;
  },

  getEvents() {
    return analyticsData.events.slice();
  },

  clearEvents() {
    analyticsData.events = [];
    this._notify('events-cleared', null, null, null);
    return true;
  },

  setMetric(key: string, value: number) {
    const old = analyticsData.metrics[key];
    analyticsData.metrics[key] = value;
    this._notify('metric-set', key, value, old);
    return true;
  },

  incrementMetric(key: string, amount = 1) {
    if (!analyticsData.metrics[key]) {
      analyticsData.metrics[key] = 0;
    }
    analyticsData.metrics[key] += amount;
    this._notify('metric-incremented', key, analyticsData.metrics[key], null);
    return analyticsData.metrics[key];
  },

  getMetric(key: string) {
    return analyticsData.metrics[key] || 0;
  },

  getAllMetrics() {
    return { ...analyticsData.metrics };
  },

  startSession() {
    const session: { id: string; startTime: number; endTime: number | null; events: number; pageViews: number } = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      endTime: null,
      events: 0,
      pageViews: 0
    };
    analyticsData.currentSession = session;
    analyticsData.sessions.push(session);
    this._notify('session-started', 'currentSession', session, null);
    return session;
  },

  endSession() {
    if (analyticsData.currentSession) {
      analyticsData.currentSession.endTime = Date.now();
      this._notify('session-ended', 'currentSession', analyticsData.currentSession, null);
    }
    return analyticsData.currentSession;
  },

  getCurrentSession() {
    return analyticsData.currentSession;
  },

  subscribe(listener: (...args: unknown[]) => void) {
    if (typeof listener !== 'function') return () => {};
    storeListeners.add(listener);
    return () => {
      storeListeners.delete(listener);
    };
  },

  _notify(action: string, key: string | null, newValue: unknown, oldValue: unknown) {
    for (const listener of storeListeners) {
      try {
        // @ts-expect-error strict migration — TS2554
        listener({ action, key, newValue, oldValue, state: this.get() });
      } catch (err) {
        _log('error', 'Listener error:', err);
      }
    }
  },

  toJSON() {
    return { ...analyticsData };
  }
};

export function info() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: ps._initialized,
    hasLogger: !!_getPort('logger'),
    eventCount: analyticsData.events.length,
    metricsCount: Object.keys(analyticsData.metrics).length,
    sessionCount: analyticsData.sessions.length,
    currentSessionActive: !!analyticsData.currentSession,
    timestamp: Date.now()
  };
}

export function healthCheck() {
  const ps = Ports.snapshot();
  const checks = {
    ready: true,
    hasStore: !!analyticsData,
    eventsBufferHealthy: analyticsData.events.length < analyticsData.maxEvents,
    portsInitialized: ps._initialized,
    hasLogger: !!_getPort('logger')
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}

export default analyticsStore;
