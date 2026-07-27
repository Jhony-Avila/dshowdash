

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main.feature.analytics-tracker
// PURPOSE: MainFeature: Analytics Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   destroy() — exported function
//   cleanup — exported value
//   track() — exported function
//   trackPageView() — exported function
//   trackInteraction() — exported function
//   trackError() — exported function
//   trackPerformance() — exported function
//   trackFeatureUsage() — exported function
//   trackCustom() — exported function
//   getEvents() — exported function
//   getSessionInfo() — exported function
//   flush() — exported function
//   updateConfig() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'beforeunload'
//   MAIN_EVENTS.NAVIGATION_COMPLETE
//   MAIN_EVENTS.NAVIGATION_ERROR
// WINDOW ACCESS:
//   window.addEventListener
//   window.location
//   window.removeEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';

export const MODULE_ID = 'main.feature.analytics-tracker';
export const VERSION = '1.0.0-ENTERPRISE';

const EVENT_TYPES = Object.freeze({
  PAGE_VIEW: 'page_view',
  NAVIGATION: 'navigation',
  INTERACTION: 'interaction',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  FEATURE_USAGE: 'feature_usage',
  CUSTOM: 'custom'
});

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _enabled = false;
let _cleanups: Array<() => void> = [];
let _events: Array<Record<string, unknown>> = [];
let _sessionId: string | null = null;
let _sessionStart: number | null = null;

const MAX_EVENTS = 1000;
const FLUSH_INTERVAL = 30000;
let _flushIntervalId: string | null = null;

let _config = {
  enabled: true,
  sampleRate: 1.0,
  trackPageViews: true,
  trackNavigation: true,
  trackErrors: true,
  trackPerformance: true,
  endpoint: null as string | null
};

const _metrics = {
  inits: 0,
  eventsTracked: 0,
  eventsFlushed: 0,
  flushErrors: 0,
  byType: {} as Record<string, number>
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function _generateSessionId() {
  return `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function _shouldSample() {
  return Math.random() < _config.sampleRate;
}

function _createEvent(type: string, name: string, data: Record<string, unknown>) {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    type,
    name,
    data: data || {},
    sessionId: _sessionId,
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
  };
}

function _addEvent(event: Record<string, unknown>) {
  _events.push(event);
  _metrics.eventsTracked++;
  const eventType = event.type as string;
  _metrics.byType[eventType] = (_metrics.byType[eventType] || 0) + 1;
  
  if (_events.length > MAX_EVENTS) {
    _events.shift();
  }
}

function _flush() {
  if (_events.length === 0) return { ok: true, flushed: 0 };
  
  const eventsToFlush = _events.slice();
  
  if (_config.endpoint) {
    try {
      fetch(_config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToFlush, sessionId: _sessionId })
      }).catch(e => {
        _metrics.flushErrors++;
      });
    } catch (e: any) {
      _metrics.flushErrors++;
    }
  }
  
  _metrics.eventsFlushed += eventsToFlush.length;
  _events = [];
  
  return { ok: true, flushed: eventsToFlush.length };
}

// ═══════════════════════════════════════════════════════════════
// LIFECYCLE
// ═══════════════════════════════════════════════════════════════

export function init(options: Record<string, unknown>) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  
  try {
    _initPorts();
    _metrics.inits++;
    
    if (options && options.config) {
      _config = Object.assign({}, _config, options.config);
    }
    
    _sessionId = _generateSessionId();
    _sessionStart = Date.now();
    
    const eb = _getPort('eventBus');
    
    if (eb && eb.on) {
      // Track navegação
      if (_config.trackNavigation && MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_COMPLETE) {
        const navHandler = (data: Record<string, unknown>) => {
          track(EVENT_TYPES.NAVIGATION, 'navigation_complete', {
            path: data && data.path,
            panelId: data && data.panelId,
            duration: data && data.duration
          });
        };
        eb.on(MAIN_EVENTS.NAVIGATION_COMPLETE, navHandler);
        _cleanups.push(() => { if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_COMPLETE, navHandler); });
      }
      
      // Track erros
      if (_config.trackErrors && MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_ERROR) {
        const errorHandler = (data: Record<string, unknown>) => {
          track(EVENT_TYPES.ERROR, 'navigation_error', {
            error: data && data.error,
            path: data && data.path
          });
        };
        eb.on(MAIN_EVENTS.NAVIGATION_ERROR, errorHandler);
        _cleanups.push(() => { if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_ERROR, errorHandler); });
      }
    }
    
    // Track page view inicial
    if (_config.trackPageViews) {
      track(EVENT_TYPES.PAGE_VIEW, 'session_start', { url: typeof window !== 'undefined' ? window.location.href : null });
    }
    
    // Flush periódico
// @ts-expect-error TS migration - TS2322
    _flushIntervalId = setInterval(_flush, FLUSH_INTERVAL);
    
    // Flush no unload
    if (typeof window !== 'undefined') {
      const unloadHandler = () => { _flush(); };
      window.addEventListener('beforeunload', unloadHandler);
      _cleanups.push(() => { window.removeEventListener('beforeunload', unloadHandler); });
    }
    
    _enabled = true;
    return { ok: true, version: VERSION, sessionId: _sessionId };
    
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export function destroy() {
  _flush();
  
  if (_flushIntervalId) {
    clearInterval(_flushIntervalId);
    _flushIntervalId = null;
  }
  
  for (let i = 0; i < _cleanups.length; i++) {
    try { _cleanups[i](); } catch (e: any) { }
  }
  _cleanups = [];
  
  _enabled = false;
  return { ok: true };
}

export const cleanup = destroy;

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function track(type: string, name: string, data: Record<string, unknown>) {
  if (!_enabled || !_config.enabled) return { ok: false, error: 'Not enabled' };
  if (!_shouldSample()) return { ok: true, sampled: false };
  
  const event = _createEvent(type, name, data);
  _addEvent(event);
  
  return { ok: true, eventId: event.id };
}

export function trackPageView(url: string, title: string) {
  return track(EVENT_TYPES.PAGE_VIEW, 'page_view', { url, title });
}

export function trackInteraction(element: HTMLElement | string, action: Record<string, unknown>, data: Record<string, unknown>) {
// @ts-expect-error TS migration - TS2345
  return track(EVENT_TYPES.INTERACTION, action, Object.assign({ element }, data || {}));
}

export function trackError(error: Error, context: Record<string, unknown>) {
  return track(EVENT_TYPES.ERROR, 'error', {
    message: error && error.message,
    stack: error && error.stack,
    context
  });
}

export function trackPerformance(metric: string, value: unknown, unit: string) {
  return track(EVENT_TYPES.PERFORMANCE, metric, { value, unit: unit || 'ms' });
}

export function trackFeatureUsage(featureId: string, action: Record<string, unknown>, data: Record<string, unknown>) {
// @ts-expect-error TS migration - TS2345
  return track(EVENT_TYPES.FEATURE_USAGE, action, Object.assign({ featureId }, data || {}));
}

export function trackCustom(name: string, data: Record<string, unknown>) {
  return track(EVENT_TYPES.CUSTOM, name, data);
}

export function getEvents(filter: Record<string, unknown>) {
  if (!filter) return _events.slice();
  
  return _events.filter(e => {
    if (filter.type && e.type !== filter.type) return false;
    if (filter.name && e.name !== filter.name) return false;
    // @ts-expect-error strict migration — TS18046
    if (filter.since && e.timestamp < filter.since) return false;
    return true;
  });
}

export function getSessionInfo() {
  return {
    sessionId: _sessionId,
    sessionStart: _sessionStart,
    duration: _sessionStart ? Date.now() - _sessionStart : 0,
    eventsCount: _events.length
  };
}

export function flush() {
  return _flush();
}

export function updateConfig(newConfig: Record<string, unknown>) {
  _config = Object.assign({}, _config, newConfig);
  return { ok: true, config: Object.assign({}, _config) };
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function getMetrics() {
  return Object.assign({}, _metrics, {
    eventsInBuffer: _events.length,
    sessionDuration: _sessionStart ? Date.now() - _sessionStart : 0
  });
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    eventTypes: EVENT_TYPES,
    config: Object.assign({}, _config),
    session: getSessionInfo(),
    metrics: getMetrics()
  };
}

export function healthCheck() {
  const checks = {
    enabled: _enabled,
    hasSession: !!_sessionId,
    bufferNotFull: _events.length < MAX_EVENTS
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!_enabled) status = 'NOT_INITIALIZED';
  else if (_events.length >= MAX_EVENTS * 0.9) status = 'DEGRADED';
  
  return {
    status,
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}

export default {
  MODULE_ID,
  VERSION,
  EVENT_TYPES,
  init,
  destroy,
  cleanup,
  track,
  trackPageView,
  trackInteraction,
  trackError,
  trackPerformance,
  trackFeatureUsage,
  trackCustom,
  getEvents,
  getSessionInfo,
  flush,
  updateConfig,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
