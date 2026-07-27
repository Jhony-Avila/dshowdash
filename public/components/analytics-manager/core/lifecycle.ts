// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.analytics-manager.core.lifecycle
// PURPOSE: Lifecycle management for analytics manager component
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes analytics manager
// @contract SHUTDOWN - shutdown() shuts down analytics manager
// @contract RESET - reset() resets analytics manager
// @contract IS_INITIALIZED - isInitialized() returns initialization status
// @contract IS_INITIALIZING - isInitializing() returns initializing status
// @contract GET_STATUS - getStatus() returns lifecycle status
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: analyticsStore from state/store.js
// IMPORTS: AnalyticsTracker from core/tracker.js
// IMPORTS: MetricsManager from core/metrics.js
// IMPORTS: trackAnalyticsEvent from telemetry/reporter.js
// IMPORTS: generateUserId, getDeviceInfo, getPageInfo from utils/helpers.js
// PROVIDES: AnalyticsLifecycle, VERSION, MODULE_ID
// @changelog v1.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.1.1-ENTERPRISE: ES5 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

import { analyticsStore } from '../state/store.js';
import { AnalyticsTracker } from './tracker.js';
import { MetricsManager } from './metrics.js';
import { trackAnalyticsEvent } from '../telemetry/reporter.js';
import { generateUserId, getDeviceInfo, getPageInfo } from '../utils/helpers.js';

export const VERSION = '1.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.analytics-manager.core.lifecycle';

const hasWindow = typeof window !== 'undefined';

let initialized = false;
let initializing = false;
let flushInterval: ReturnType<typeof setInterval> | null = null;
let pageViewListener: Function | null = null;

const _metrics: { initCount: number; shutdownCount: number; resetCount: number; lastInitAt: number | null; lastShutdownAt: number | null } = {
  initCount: 0,
  shutdownCount: 0,
  resetCount: 0,
  lastInitAt: null,
  lastShutdownAt: null
};

export const AnalyticsLifecycle = {
  init(options: Record<string, unknown> = {}) {
    if (initialized) {
      trackAnalyticsEvent('analytics:lifecycle:init:already-initialized');
      return Promise.resolve(false);
    }
    if (initializing) {
      trackAnalyticsEvent('analytics:lifecycle:init:already-initializing');
      return Promise.resolve(false);
    }

    initializing = true;
    _metrics.initCount++;
    _metrics.lastInitAt = Date.now();
    trackAnalyticsEvent('analytics:lifecycle:init:start');

    return new Promise(resolve => {
      try {
        const session = analyticsStore.startSession();

        if (options.trackUserId !== false) {
          const userId = generateUserId();
          analyticsStore.set('userId', userId);
        }

        const deviceInfo = getDeviceInfo();
        analyticsStore.set('deviceInfo', deviceInfo);

        if (options.trackPageViews !== false && hasWindow) {
          this._setupPageViewTracking();
        }

        if (options.flushInterval && hasWindow) {
          // @ts-expect-error strict migration — TS2345
          this._startFlushInterval(options.flushInterval);
        }

        if (options.trackInitialPageView !== false) {
          const pageInfo = getPageInfo();
          if (pageInfo.path) {
            AnalyticsTracker.trackPageView(pageInfo.path, pageInfo.title);
          }
        }

        initialized = true;
        initializing = false;
        trackAnalyticsEvent('analytics:lifecycle:init:complete', { sessionId: session.id });
        resolve(true);
      } catch (error) {
        initializing = false;
        trackAnalyticsEvent('analytics:lifecycle:init:error', { error: (error as any).message });
        resolve(false);
      }
    });
  },

  shutdown() {
    if (!initialized) return false;

    _metrics.shutdownCount++;
    _metrics.lastShutdownAt = Date.now();
    trackAnalyticsEvent('analytics:lifecycle:shutdown:start');

    analyticsStore.endSession();
    this._stopFlushInterval();
    this._removePageViewTracking();

    initialized = false;
    initializing = false;
    trackAnalyticsEvent('analytics:lifecycle:shutdown:complete');
    return true;
  },

  reset() {
    _metrics.resetCount++;
    trackAnalyticsEvent('analytics:lifecycle:reset');
    analyticsStore.clearEvents();
    MetricsManager.resetAll();
    analyticsStore.startSession();
    return true;
  },

  isInitialized() {
    return initialized;
  },

  isInitializing() {
    return initializing;
  },

  getStatus() {
    const session = analyticsStore.getCurrentSession();
    const allMetrics = analyticsStore.getAllMetrics();
    return {
      initialized,
      initializing,
      sessionId: session ? session.id : null,
      sessionDuration: session ? Date.now() - session.startTime : 0,
      eventCount: analyticsStore.getEvents().length,
      metricsCount: Object.keys(allMetrics).length,
      lastFlush: analyticsStore.get('lastFlush')
    };
  },

  _setupPageViewTracking() {
    if (!hasWindow) return;
    if (pageViewListener) this._removePageViewTracking();

    pageViewListener = () => {
      const pageInfo = getPageInfo();
      if (pageInfo.path) {
        AnalyticsTracker.trackPageView(pageInfo.path, pageInfo.title);
        MetricsManager.trackPageView(pageInfo.path);
      }
    };

    window.addEventListener('popstate', pageViewListener as EventListener);
  },

  _removePageViewTracking() {
    if (pageViewListener && hasWindow) {
      window.removeEventListener('popstate', pageViewListener as EventListener);
      pageViewListener = null;
    }
  },

  _startFlushInterval(intervalMs: number) {
    if (!hasWindow) return;
    if (flushInterval) return;

    flushInterval = setInterval(() => {
      analyticsStore.set('lastFlush', Date.now());
      trackAnalyticsEvent('analytics:flush');
    }, intervalMs);
  },

  _stopFlushInterval() {
    if (flushInterval) {
      clearInterval(flushInterval);
      flushInterval = null;
    }
  },

  getVersion() {
    return VERSION;
  },

  getMetrics() {
    return { ..._metrics };
  },

  healthCheck() {
    const checks = {
      initialized,
      notInitializing: !initializing,
      storeAvailable: !!analyticsStore,
      trackerAvailable: !!AnalyticsTracker,
      metricsManagerAvailable: !!MetricsManager,
      hasSession: !!analyticsStore.getCurrentSession()
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;

    return {
      status: passed === total ? 'HEALTHY' : (passed >= total * 0.5 ? 'DEGRADED' : 'UNHEALTHY'),
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  },

  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      status: this.getStatus(),
      metrics: this.getMetrics(),
      hasPageViewListener: !!pageViewListener,
      hasFlushInterval: !!flushInterval,
      timestamp: Date.now()
    };
  }
};

export default AnalyticsLifecycle;
