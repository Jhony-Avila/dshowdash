// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: app-shell/core/init-shutdown
// PURPOSE: AppShell Init, Shutdown & Finalize Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ADAPTER_CONFIG, connectAdapter, disconnectAllAdapters, getConnectedAdaptersList from ../adapters/adapter-manager.js
//   mountShell, unmountShell, finalizeShellReady from ./mount.js
//   isSystemRoute, renderSystemPage from ../utils/system-pages.js
//   setLoadingState, setErrorState from ../ui/transitions.js
//   getBootTime from ../state/store.js
//   trackShellEvent, trackError from ../telemetry/tracker.js
//   PerformanceMetrics, AutoHealthCheck, Logger, ConfigValidator, etc. (14 modules for options processing)
//
// PROVIDES:
//   VERSION — module constant
//   createInitFn() — factory that returns init()
//   createDoInitFn() — factory that returns _doInit()
//   createShutdownFn() — factory that returns shutdown()
//   createFinalizeFn() — factory that returns finalize()
//   setDebug() — exported function
//   getLogs() — exported function
//
// RECEIVES (via factory): ctx = { getStatus, shutdown, doInit, logger, metrics, initialized getter/setter }
// EMITS (eventos):
//   kernel:init:called, kernel:init:start, kernel:init:complete, kernel:shutdown:called, kernel:shutdown:complete (via tracker)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).AppShellReady — set to true on finalize (always, boot flag independent of strict mode)
// ═══════════════════════════════════════════════════════════════
// @changelog v1.2.0: FIX — (window as any).AppShellReady independente de strict mode (é flag de boot, não API)
// @changelog v1.1.0: FIX — (window as any).AppShellReady embutido no createFinalizeFn
// @changelog v1.0.0: Extracted from app-shell/index.js v7.4.0
'use strict';

import {
  ADAPTER_CONFIG, connectAdapter, disconnectAllAdapters, getConnectedAdaptersList,
  ResponsiveAdapter
} from '../adapters/adapter-manager.js';
import { mountShell, unmountShell, finalizeShellReady } from './mount.js';
import { isSystemRoute, renderSystemPage } from '../utils/system-pages.js';
import { setLoadingState, setErrorState } from '../ui/transitions.js';
import { getBootTime } from '../state/store.js';
import { trackShellEvent, trackError } from '../telemetry/tracker.js';

import PerformanceMetrics from '../devtools/performance-metrics.js';
import AutoHealthCheck from '../devtools/auto-health-check.js';
import APIUsageMetrics from '../devtools/api-usage-metrics.js';
import MemoryLeakDetector from '../devtools/memory-leak-detector.js';
import AnalyticsExporter from '../devtools/analytics-exporter.js';
import DebugPanel from '../devtools/debug-panel.js';
import DebugPresets from '../devtools/debug-presets.js';
import RegionMetrics from '../devtools/region-metrics.js';
import StateSnapshots from '../devtools/state-snapshots.js';

import Logger from '../utils/logger.js';
import ConfigValidator from '../utils/config-validator.js';
import CircuitBreaker from '../utils/circuit-breaker.js';
import RateLimiter from '../utils/rate-limiter.js';
import ServiceWorkerManager from '../utils/service-worker-manager/index.js';
import OfflineManager from '../utils/offline-manager/index.js';

import SlotPersistence from '../state/slot-persistence.js';

import AnimationAPI from '../ui/animation-api/index.js';
import ContentVirtualizer from '../ui/content-virtualizer.js';
import NotificationCenter from '../ui/notification-center/index.js';
import KeyboardShortcuts from '../ui/keyboard-shortcuts/index.js';
import GestureHandler from '../ui/gesture-handler/index.js';
import CommandPalette from '../ui/command-palette.js';
import LayoutPresets from '../ui/layout-presets.js';
import AccessibilityPresets from '../ui/accessibility-presets/index.js';
import SkeletonLoader from '../ui/skeleton-loader/index.js';
import KeyboardNavigation from '../ui/keyboard-navigation/index.js';

import MaintenanceMode from '../core/maintenance-mode/index.js';
import RegionEvents from '../core/region-events/index.js';
import ThemeIntegration from '../adapters/theme-integration.js';

import { setCacheTTL } from '../core/dom-regions/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.2.0-ENTERPRISE';
export const MODULE_ID = 'app-shell/core/init-shutdown';

let _debug = false;
let _logBuffer: DynObj[] = [];
function _log(level: DynObj, ...args: DynObj[]) {
  if (!_debug && level === 'debug') return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}

// ── Init Factory ────────────────────────────────────────────
export function createInitFn(ctx: DynObj) {
  return (options: Record<string, any> = {}) => {
    const validation = ConfigValidator.validateInitOptions(options);
    if (!validation.valid) {
      ctx.logger.error('Invalid init options', { errors: validation.errors });
      return Promise.resolve({ ok: false, error: 'Invalid configuration', validationErrors: validation.errors });
    }
    if (validation.warnings.length > 0) {
      ctx.logger.warn('Init options warnings', { warnings: validation.warnings });
    }

    const force = options.force === true;
    const startTime = performance.now();
    PerformanceMetrics.mark('app-shell:init:start');
    trackShellEvent('kernel:init:called', { force, alreadyInitialized: ctx.isInitialized() });
    ctx.logger.debug('Init called', { force, alreadyInitialized: ctx.isInitialized() });

    // @ts-expect-error TS migration - TS2554
    APIUsageMetrics.trackCall('AppShell', 'init');

    if (ctx.isInitialized() && !force) return Promise.resolve({ ok: true, alreadyInitialized: true, status: ctx.getStatus() });
    if (ctx.isInitialized() && force) return ctx.shutdown().then(() => ctx.doInit(startTime, options));
    return ctx.doInit(startTime, options);
  };
}

// ── DoInit Factory ──────────────────────────────────────────
export function createDoInitFn(ctx: DynObj) {
  return (startTime: number, options: Record<string, any> = {}) => {
    trackShellEvent('kernel:init:start');
    ctx.logger.debug('Init starting');

    return mountShell().then((mountResult) => {
      if (!mountResult) throw new Error('Mount failed');
      return connectAdapter('globalState', ADAPTER_CONFIG.globalState, {
        globalState: { onLoading: setLoadingState, onMaintenance: (mode: DynObj) => { if (mode) setErrorState(true); } }
      }, ctx.logger, ctx.metrics);
    }).then(() => connectAdapter('layout', ADAPTER_CONFIG.layout, {
      layout: { onFullscreen: (route: string, main: DynObj) => { if (route && isSystemRoute(route) && main) return renderSystemPage(route, main); return Promise.resolve(); } }
    }, ctx.logger, ctx.metrics)).then(() => {
      ctx.setInitialized(true);
      ctx.metrics.initCount++;
      ctx.metrics.lastInitAt = Date.now();
      ctx.metrics.lastActivity = Date.now();
      ctx.metrics.initDuration = Math.round(performance.now() - startTime);
      PerformanceMetrics.mark('app-shell:init:end');
      PerformanceMetrics.measure('app-shell:init', 'app-shell:init:start', 'app-shell:init:end');
      PerformanceMetrics.setInitDuration(ctx.metrics.initDuration);

      if (options.healthCheck?.autoEnabled) {
        AutoHealthCheck.start({
          interval: options.healthCheck.interval || 30000,
          onDegraded: (result: DynObj) => ctx.logger.warn('Health degraded', result),
          onUnhealthy: (result: DynObj) => ctx.logger.error('Health unhealthy', result),
          onRecovered: (result: DynObj) => ctx.logger.debug('Health recovered', result)
        });
      }

      if (options.logger) Logger.configure(options.logger);
      if (options.cache?.ttlMs) setCacheTTL(options.cache.ttlMs);
      if (options.circuitBreaker) CircuitBreaker.setDefaultConfig(options.circuitBreaker);
      if (options.layoutPreset) LayoutPresets.apply(options.layoutPreset);
      if (options.a11yPresets) options.a11yPresets.forEach((p: DynObj) => AccessibilityPresets.enable(p));
      if (options.animations) AnimationAPI.configure(options.animations);
      if (options.serviceWorker?.autoRegister) ServiceWorkerManager.register(options.serviceWorker);
      if (options.offline) OfflineManager.configure(options.offline);
      if (options.notifications) NotificationCenter.configure(options.notifications);
      if (options.shortcuts) options.shortcuts.forEach((s: DynObj) => KeyboardShortcuts.register(s.combo, s.handler, s));
      if (options.gestures) GestureHandler.configure(options.gestures);
      if (options.debugPreset) DebugPresets.apply(options.debugPreset);
      if (options.regionMetrics) RegionMetrics.configure(options.regionMetrics);
      if (options.commands) options.commands.forEach((c: DynObj) => CommandPalette.register(c));

      AnalyticsExporter.trackPerformance('app-shell:init', ctx.metrics.initDuration, { adapters: getConnectedAdaptersList().length });
      trackShellEvent('kernel:init:complete', { initCount: ctx.metrics.initCount, duration: ctx.metrics.initDuration, adaptersConnected: getConnectedAdaptersList().length });
      ctx.logger.debug('Init complete', { duration: `${ctx.metrics.initDuration}ms`, adapters: getConnectedAdaptersList().length });

      return { ok: true, alreadyInitialized: false, duration: ctx.metrics.initDuration, status: ctx.getStatus() };
    }).catch((error) => {
      trackError(error, { context: 'init' });
      ctx.logger.error('Init failed', error);
      ctx.metrics.errors++;
      AnalyticsExporter.trackError(error, { context: 'init' });
      return { ok: false, error: error.message, status: ctx.getStatus() };
    });
  };
}

// ── Shutdown Factory ────────────────────────────────────────
export function createShutdownFn(ctx: DynObj) {
  return () => {
    trackShellEvent('kernel:shutdown:called');
    ctx.logger.info('Shutdown called');

    // @ts-expect-error TS migration - TS2554
    APIUsageMetrics.trackCall('AppShell', 'shutdown');

    return Promise.resolve().then(() => {
      AutoHealthCheck.stop();
      MemoryLeakDetector.disable();
      AnalyticsExporter.flushAll();
      SlotPersistence.persist();
      AnimationAPI.cancelAll();
      ContentVirtualizer.destroyAll();
      NotificationCenter.dismissAll();
      KeyboardShortcuts.destroy();
      GestureHandler.destroy();
      CommandPalette.hide();
      StateSnapshots.stopAutoSnapshot();
      OfflineManager.destroy();
      ServiceWorkerManager.stopPeriodicCheck();
      CircuitBreaker.resetAll();
      SkeletonLoader.destroyAll();
      MaintenanceMode.deactivate();
      ResponsiveAdapter.destroy();
      KeyboardNavigation.destroy();
      RegionEvents.destroy();
      ThemeIntegration.destroy();
      PerformanceMetrics.destroy();
      DebugPanel.close();
      DebugPresets.disable();
      RegionMetrics.reset();
      RateLimiter.clearAll();
      disconnectAllAdapters();
      ctx.setInitialized(false);
      ctx.metrics.shutdownCount++;
      ctx.metrics.lastShutdownAt = Date.now();
      return unmountShell();
    }).then((result) => {
      trackShellEvent('kernel:shutdown:complete');
      ctx.logger.info('Shutdown complete');
      return { ok: true, result };
    }).catch((error) => {
      trackError(error, { context: 'shutdown' });
      ctx.logger.error('Shutdown failed', error);
      ctx.metrics.errors++;
      return { ok: false, error: error.message };
    });
  };
}

// ── Finalize Factory ────────────────────────────────────────
// v1.2.0: (window as any).AppShellReady é flag de boot — SEMPRE setada, independente de strict mode
// Consumidores: header/auto-init, phase-5-ui, boot-ready-dom-bridge
export function createFinalizeFn(ctx: DynObj) {
  return () => {
    const result = finalizeShellReady();
    if (result) {
      connectAdapter('auth', ADAPTER_CONFIG.auth, null, ctx.logger, ctx.metrics);
      connectAdapter('theme', ADAPTER_CONFIG.theme, null, ctx.logger, ctx.metrics);
      connectAdapter('notification', ADAPTER_CONFIG.notification, null, ctx.logger, ctx.metrics);
      connectAdapter('router', ADAPTER_CONFIG.router, null, ctx.logger, ctx.metrics);
      PerformanceMetrics.setBootTime(getBootTime());
      ctx.logger.debug('Finalized - Phase 2 Complete');
      if (typeof window !== 'undefined') {
        (window as any).AppShellReady = true;
      }
    }
    return result;
  };
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getLogs() { return [..._logBuffer]; }
