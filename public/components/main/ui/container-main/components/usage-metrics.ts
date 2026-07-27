// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-usage-metrics
// PURPOSE: Container Usage Metrics Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TELEMETRY_EVENTS from /core/runtime/events/catalog/telemetry.events.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   createUsageMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   'beforeunload'
//   'scroll'
//   'visibilitychange'
// WINDOW ACCESS:
//   window.addEventListener
//   window.removeEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TELEMETRY_EVENTS } from '/core/runtime/events/catalog/telemetry.events.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-usage-metrics';
import { createLogger } from '../utils/logger.js';
const logger = createLogger(MODULE_ID);

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _getEventBus() { return _injectedEventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  const eb = _getEventBus();
  if (eb?.emit) { eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload }); return true; }
  return false;
}

// Options validation
function _validateOptions(options: Record<string, unknown>) {
  const errors = [];
  if (options.trackInteractions !== undefined && typeof options.trackInteractions !== 'boolean') errors.push('trackInteractions must be a boolean');
  if (options.trackVisibility !== undefined && typeof options.trackVisibility !== 'boolean') errors.push('trackVisibility must be a boolean');
  if (options.trackTime !== undefined && typeof options.trackTime !== 'boolean') errors.push('trackTime must be a boolean');
  if (options.sampleRate !== undefined && (typeof options.sampleRate !== 'number' || options.sampleRate < 0 || options.sampleRate > 1)) errors.push('sampleRate must be a number between 0 and 1');
  if (options.batchSize !== undefined && (typeof options.batchSize !== 'number' || options.batchSize < 1)) errors.push('batchSize must be a positive number');
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

export function createUsageMetrics(container: HTMLElement, options: Record<string, any> = {}) {
  _validateOptions(options);
  const { trackInteractions = true, trackVisibility = true, trackTime = true, sampleRate = 1.0, onMetric, batchSize = 10, flushInterval = 30000, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _metrics: unknown[] = [];
  let _sessionStart = Date.now();
  let _visibleTime = 0;
  let _lastVisibleStart: number | null = null;
  let _interactionCount = 0;
  let _flushTimer: ReturnType<typeof setInterval> | null = null;
  let _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let _intersectionObserver: IntersectionObserver | null = null;
  let _boundInteractionHandlers: { eventType: string; handler: EventListener }[] = [];
  let _boundScrollHandler: EventListener | null = null;
  let _boundVisibilityChange: EventListener | null = null;
  let _boundBeforeUnload: EventListener | null = null;

  function _shouldSample() { return Math.random() < sampleRate; }

  function _createMetric(type: string, data: Record<string, any> = {}) {
    return { type, containerId: container.id, timestamp: Date.now(), sessionDuration: Date.now() - _sessionStart, ...data };
  }

  function _recordMetric(type: string, data: Record<string, any> = {}) {
    if (!_shouldSample()) return;
    const metric = _createMetric(type, data);
    _metrics.push(metric);
    onMetric?.(metric);
    _emitEvent(TELEMETRY_EVENTS.METRICS_RECORD, { metric, containerId: container.id });
    if (_metrics.length >= batchSize) metricsApi.flush();
  }

  function _setupInteractionTracking() {
    if (!trackInteractions) return;
    const events = ['click', 'keydown', 'focus'];
    events.forEach(eventType => {
      const handler = (e: Event) => {
        _interactionCount++;
        _recordMetric('interaction', { eventType, target: (e.target as HTMLElement).tagName, targetClass: (e.target as HTMLElement).className?.split?.(' ')?.[0] || '', interactionCount: _interactionCount });
      };
      container.addEventListener(eventType, handler as EventListener, { passive: true });
      _boundInteractionHandlers.push({ eventType, handler });
    });
    const content = container.querySelector('.dsd-container__content');
    if (content) {
      let lastScrollTop = 0;
      _boundScrollHandler = () => {
        const scrollTop = content.scrollTop;
        const scrollHeight = content.scrollHeight;
        const clientHeight = content.clientHeight;
        const scrollPercent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100) || 0;
        if (Math.abs(scrollTop - lastScrollTop) > 100) {
          _recordMetric('scroll', { scrollPercent, scrollTop });
          lastScrollTop = scrollTop;
        }
      };
      content.addEventListener('scroll', _boundScrollHandler as EventListener, { passive: true });
    }
  }

  function _setupVisibilityTracking() {
    if (!trackVisibility) return;
    _intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          _lastVisibleStart = Date.now();
          _recordMetric('visibility', { visible: true, visibilityRatio: entry.intersectionRatio });
        } else {
          if (_lastVisibleStart) { _visibleTime += Date.now() - _lastVisibleStart; _lastVisibleStart = null; }
          _recordMetric('visibility', { visible: false, totalVisibleTime: _visibleTime });
        }
      });
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    _intersectionObserver.observe(container);
    _boundVisibilityChange = () => {
      if (document.hidden) {
        if (_lastVisibleStart) { _visibleTime += Date.now() - _lastVisibleStart; _lastVisibleStart = null; }
        _recordMetric('page-hidden', { totalVisibleTime: _visibleTime });
      } else {
        _lastVisibleStart = Date.now();
        _recordMetric('page-visible', {});
      }
    };
    document.addEventListener('visibilitychange', _boundVisibilityChange as EventListener);
  }

  function _setupTimeTracking() {
    if (!trackTime) return;
    _heartbeatTimer = setInterval(() => {
      _recordMetric('heartbeat', { sessionDuration: Date.now() - _sessionStart, visibleTime: _visibleTime + (_lastVisibleStart ? Date.now() - _lastVisibleStart : 0), interactionCount: _interactionCount });
    }, 60000);
    _boundBeforeUnload = () => metricsApi.flush();
    window.addEventListener('beforeunload', _boundBeforeUnload as EventListener);
  }

  function _removeAllListeners() {
    _boundInteractionHandlers.forEach(({ eventType, handler }) => container.removeEventListener(eventType, handler as EventListener));
    _boundInteractionHandlers = [];
    const content = container.querySelector('.dsd-container__content');
    if (content && _boundScrollHandler) content.removeEventListener('scroll', _boundScrollHandler as EventListener);
    _boundScrollHandler = null;
    if (_boundVisibilityChange) { document.removeEventListener('visibilitychange', _boundVisibilityChange as EventListener); _boundVisibilityChange = null; }
    if (_boundBeforeUnload) { window.removeEventListener('beforeunload', _boundBeforeUnload as EventListener); _boundBeforeUnload = null; }
  }

  const metricsApi = {
    init() {
      if (_initialized) return this;
      _sessionStart = Date.now();
      _setupInteractionTracking();
      _setupVisibilityTracking();
      _setupTimeTracking();
      _flushTimer = setInterval(() => { if (_metrics.length > 0) metricsApi.flush(); }, flushInterval);
      _recordMetric('session-start', {});
      _initialized = true;
      return this;
    },
    track(eventName: string, data: Record<string, any> = {}) { _recordMetric(eventName, data); return this; },
    trackTiming(name: string, duration: number, data: Record<string, any> = {}) { _recordMetric('timing', { name, duration, ...data }); return this; },
    startTimer(name: string) {
      const start = performance.now();
      return { stop: () => { const duration = performance.now() - start; this.trackTiming(name, duration); return duration; } };
    },
    getMetrics() { return [..._metrics]; },
    getStats() {
      return { sessionDuration: Date.now() - _sessionStart, visibleTime: _visibleTime + (_lastVisibleStart ? Date.now() - _lastVisibleStart : 0), interactionCount: _interactionCount, metricsCount: _metrics.length };
    },
    flush() {
      if (_metrics.length === 0) return [];
      const batch = [..._metrics];
      _metrics = [];
      _emitEvent(TELEMETRY_EVENTS.METRICS_FLUSH, { metrics: batch, count: batch.length, containerId: container.id });
      return batch;
    },
    clear() { _metrics = []; return this; },
    isInitialized() { return _initialized; },
    destroy() {
      _removeAllListeners();
      if (_flushTimer) clearInterval(_flushTimer);
      if (_heartbeatTimer) clearInterval(_heartbeatTimer);
      _intersectionObserver?.disconnect();
      metricsApi.flush();
      _flushTimer = null;
      _heartbeatTimer = null;
      _intersectionObserver = null;
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true, ...metricsApi.getStats() };
    }
  };
  return metricsApi;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true }; }

export default { createUsageMetrics, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
