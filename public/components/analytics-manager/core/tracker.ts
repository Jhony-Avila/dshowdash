// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.analytics-manager.core.tracker
// PURPOSE: Analytics event tracking with standard payload builder
// ───────────────────────────────────────────────────────────────
// @contract SET_USER_ID - setUserId(userId) sets current user ID
// @contract GET_USER_ID - getUserId() returns current user ID
// @contract TRACK - track(eventName, data) tracks analytics event
// @contract TRACK_PAGE_VIEW - trackPageView(path, title) tracks page view
// @contract TRACK_CLICK - trackClick(elementId, elementType) tracks click
// @contract TRACK_FORM_SUBMIT - trackFormSubmit(formName, success) tracks form submission
// @contract TRACK_ERROR - trackError(errorType, errorMessage) tracks error
// @contract TRACK_SEARCH - trackSearch(query, resultsCount) tracks search
// @contract TRACK_CONVERSION - trackConversion(conversionType, value) tracks conversion
// @contract TRACK_TIMING - trackTiming(name, durationMs, category) tracks timing
// @contract GET_RECENT_EVENTS - getRecentEvents(count) returns recent events
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: ANALYTICS_EVENTS from /core/runtime/events/index.js
// IMPORTS: analyticsStore from state/store.js
// IMPORTS: trackAnalyticsEvent from telemetry/reporter.js
// IMPORTS: sanitizeEventData, getDeviceInfo, getPageInfo from utils/helpers.js
// PROVIDES: AnalyticsTracker, injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v1.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.4.1-ENTERPRISE: ES5 conversion
// @changelog P18EC: Events Contracts Migration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ANALYTICS_EVENTS } from '/core/runtime/events/catalog/analytics.events.js';
import { analyticsStore } from '../state/store.js';
import { trackAnalyticsEvent } from '../telemetry/reporter.js';
import { sanitizeEventData, getDeviceInfo, getPageInfo } from '../utils/helpers.js';

export const VERSION = '1.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.analytics-manager.core.tracker';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

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

const _metrics: { trackCount: number; pageViewCount: number; clickCount: number; errorCount: number; lastTrackAt: number | null } = {
  trackCount: 0,
  pageViewCount: 0,
  clickCount: 0,
  errorCount: 0,
  lastTrackAt: null
};

let _userId: string | null = null;

function generateEventId() {
  return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function buildStandardPayload(eventName: string, data: Record<string, unknown> = {}) {
  const session = analyticsStore.getCurrentSession();
  const pageInfo = getPageInfo();
  const deviceInfo = getDeviceInfo();

  return {
    id: generateEventId(),
    eventName,
    category: data.category || 'general',
    timestamp: Date.now(),
    sessionId: session ? session.id : null,
    userId: _userId || analyticsStore.get('userId') || null,
    path: pageInfo.path || '',
    referrer: pageInfo.referrer || '',
    deviceInfo: {
      viewportWidth: deviceInfo.viewportWidth || 0,
      viewportHeight: deviceInfo.viewportHeight || 0,
      userAgent: deviceInfo.userAgent || '',
      language: deviceInfo.language || ''
    },
    payload: sanitizeEventData(data)
  };
}

export const AnalyticsTracker = {
  setUserId(userId: string) {
    _userId = userId;
    trackAnalyticsEvent('analytics:tracker:user-set', { userId });
  },

  getUserId() {
    return _userId || analyticsStore.get('userId') || null;
  },

  track(eventName: string, data: Record<string, unknown> = {}) {
    _metrics.trackCount++;
    _metrics.lastTrackAt = Date.now();

    const standardPayload = buildStandardPayload(eventName, data);
    const entry = analyticsStore.addEvent({
      name: eventName,
      category: data.category || 'general',
      action: data.action || null,
      label: data.label || null,
      value: data.value || null,
      metadata: standardPayload
    });

    const session = analyticsStore.getCurrentSession();
    if (session) session.events++;

    trackAnalyticsEvent('analytics:event:tracked', {
      eventName,
      category: entry.category,
      eventId: standardPayload.id
    });

    this._emitEvent(entry);
    return entry;
  },

  trackPageView(pagePath: string, pageTitle: string) {
    _metrics.pageViewCount++;
    const title = pageTitle || (hasDocument ? document.title : '');
    return this.track('page_view', {
      category: 'navigation',
      action: 'view',
      label: pagePath,
      metadata: { title, path: pagePath }
    });
  },

  trackClick(elementId: string, elementType = 'button') {
    _metrics.clickCount++;
    return this.track('click', {
      category: 'interaction',
      action: 'click',
      label: elementId,
      metadata: { type: elementType, elementId }
    });
  },

  trackFormSubmit(formName: string, success = true) {
    return this.track('form_submit', {
      category: 'form',
      action: success ? 'submit_success' : 'submit_error',
      label: formName,
      metadata: { formName, success }
    });
  },

  trackError(errorType: string, errorMessage: string) {
    _metrics.errorCount++;
    return this.track('error', {
      category: 'error',
      action: errorType,
      label: errorMessage,
      metadata: { errorType, errorMessage }
    });
  },

  trackSearch(query: string, resultsCount = 0) {
    return this.track('search', {
      category: 'search',
      action: 'query',
      label: query,
      value: resultsCount,
      metadata: { query, resultsCount }
    });
  },

  trackConversion(conversionType: string, value: number) {
    return this.track('conversion', {
      category: 'conversion',
      action: conversionType,
      value,
      metadata: { conversionType, value }
    });
  },

  trackTiming(name: string, durationMs: number, category = 'performance') {
    return this.track('timing', {
      category,
      action: name,
      value: durationMs,
      metadata: { name, durationMs, unit: 'ms' }
    });
  },

  getRecentEvents(count = 10) {
    const events = analyticsStore.getEvents();
    return events.slice(-count);
  },

  getEventsByCategory(category: string) {
    const events = analyticsStore.getEvents();
    return events.filter((e: Record<string, unknown>) => e.category === category);
  },

  getEventsByName(eventName: string) {
    const events = analyticsStore.getEvents();
    return events.filter((e: Record<string, unknown>) => e.name === eventName);
  },

  _emitEvent(entry: Record<string, unknown>) {
    const eventBus = _getPort('eventBus');
    if (hasWindow && eventBus && eventBus.emit) {
      try {
        eventBus.emit(ANALYTICS_EVENTS.EVENT, entry);
      } catch (err) {
        /* ignore */
      }
    }
  },

  injectPorts,
  getPorts,

  getVersion() {
    return VERSION;
  },

  getMetrics() {
    return { ..._metrics };
  },

  resetMetrics() {
    _metrics.trackCount = 0;
    _metrics.pageViewCount = 0;
    _metrics.clickCount = 0;
    _metrics.errorCount = 0;
    _metrics.lastTrackAt = null;
  },

  healthCheck() {
    const storeAvailable = !!analyticsStore;
    const hasSession = !!analyticsStore.getCurrentSession();
    const lowErrorRate = _metrics.trackCount === 0 || (_metrics.errorCount / _metrics.trackCount) < 0.1;
    const eventBus = _getPort('eventBus');
    const portsSnapshot = Ports.snapshot();

    const checks = {
      storeAvailable,
      hasSession,
      lowErrorRate,
      eventBusAvailable: !!(hasWindow && eventBus),
      trackFunctionAvailable: typeof this.track === 'function',
      portsInitialized: portsSnapshot._initialized
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;

    return {
      status: passed === total ? 'HEALTHY' : (passed >= 3 ? 'DEGRADED' : 'UNHEALTHY'),
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      metrics: { ..._metrics },
      version: VERSION,
      moduleId: MODULE_ID,
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  },

  info() {
    const portsSnapshot = Ports.snapshot();
    const session = analyticsStore.getCurrentSession();
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      userId: this.getUserId(),
      sessionId: session ? session.id : null,
      totalEvents: analyticsStore.getEvents().length,
      metrics: this.getMetrics(),
      portsInitialized: portsSnapshot._initialized,
      timestamp: Date.now()
    };
  }
};

export default AnalyticsTracker;
