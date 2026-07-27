// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v15.2.0-MODULAR)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   * from ./logger.js, ./error-handler.js, ./async-helpers/index.js,
//     ./responsive-manager.js, ./validator.js, ./debug-mode.js,
//     ./config-persistence.js, ./sanitizer.js, ./rate-limiter.js,
//     ./devtools-panel/index.js, ./worker-manager.js, ./console-commands.js,
//     ./telemetry-dashboard.js, ./request-queue.js, ./cache-manager.js,
//     ./event-recorder.js, ./notification-manager.js, ./form-validator.js,
//     ./storage-manager.js, ./clipboard-manager.js, ./drag-drop-manager.js,
//     ./modal-manager.js, ./tooltip-manager.js, ./context-menu-manager.js,
//     ./hotkey-manager.js, ./scroll-manager.js, ./focus-manager.js,
//     ./undo-manager.js, ./theme-manager-v2.js, ./animation-manager-v2.js,
//     ./media-query-manager.js, ./intersection-manager.js, ./resize-manager.js,
//     ./mutation-manager.js, ./permission-manager.js, ./network-manager.js,
//     ./geolocation-manager.js, ./device-manager.js, ./battery-manager.js,
//     ./fullscreen-manager.js, ./visibility-manager.js, ./wake-lock-manager.js,
//     ./share-manager.js, ./events.js, ./icons.js
//   * as telemetry from ./telemetry.js (namespace)
//   * as configCache from ./config-cache.js (namespace)
//   * as debounce from ./debounce.js (namespace)
//   * as idleScheduler from ./idle-scheduler.js (namespace)
//   * as visibilityObserver from ./visibility-observer.js (namespace)
//   * as domBatch from ./dom-batch.js (namespace)
//   * as weakRefs from ./weak-refs.js (namespace)
//   * as mutationBatch from ./mutation-batch.js (namespace)
//   * as lazyLoader from ./lazy-loader.js (namespace)
//   * as virtualScroller from ./virtual-scroller.js (namespace)
//   * as workerPool from ./worker-pool.js (namespace)
//   * as serviceWorker from ./service-worker-helper.js (namespace)
//   * as indexedDB from ./indexed-db.js (namespace)
//   * as stateCompression from ./state-compression.js (namespace)
//   * as objectPool from ./object-pool.js (namespace)
//   * as reactiveProxy from ./reactive-proxy.js (namespace)
//   * as customElements from ./custom-elements.js (namespace)
//   * as themeManager from ./theme-manager.js (namespace)
//   * as animationManager from ./animation-manager.js (namespace)
//   * as shortcutsManager from ./shortcuts-manager.js (namespace)
//   * as memoryMonitor from ./memory-monitor.js (namespace)
//   * as fpsMonitor from ./fps-monitor.js (namespace)
//   * as performanceTracker from ./performance-tracker.js (namespace)
//
// PROVIDES: All re-exports from 60+ utility modules,
//   AVAILABLE_MODULES constant (frozen array of module names),
//   healthCheckAll (async), healthCheck, info,
//   VERSION, MODULE_ID
// ═══════════════════════════════════════════════════════════════
// Container-Main Utils Index
// @version 15.2.0-MODULAR
// @changelog v15.2.0 - async-helpers modularizado
// Central export for all utility modules
'use strict';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'container-main:utils';

// === FASE 1 - Core Utils ===
export * from './logger.js';
export { default as Logger } from './logger.js';

// @ts-expect-error TS migration - TS2308
export * from './error-handler.js';
export { default as ErrorHandler } from './error-handler.js';

// @ts-expect-error TS migration - TS2308
export * from './async-helpers/index.js';
export { default as AsyncHelpers } from './async-helpers/index.js';

// @ts-expect-error TS migration - TS2308
export * from './responsive-manager.js';
export { default as ResponsiveManager } from './responsive-manager.js';

// === FASE 3 - Validator ===
export * from './validator.js';
export { default as Validator } from './validator.js';

// === FASE 4 ===
export * from './debug-mode.js';
export { default as DebugMode } from './debug-mode.js';
export * from './config-persistence.js';
export { default as ConfigPersistence } from './config-persistence.js';

// === FASE 5 - Security & DX ===
export * from './sanitizer.js';
export { default as Sanitizer } from './sanitizer.js';
export * from './rate-limiter.js';
export { default as RateLimiter } from './rate-limiter.js';
export * from './devtools-panel/index.js';
export { default as DevToolsPanel } from './devtools-panel/index.js';
// REMOVED 2026-04-29 — workers dormentes (ver /backup/remove-workers-20260429-183149/). 6 eval() sem consumidor real.
// export * from './worker-manager.js';
// export { default as WorkerManager } from './worker-manager.js';
export * from './console-commands.js';
export { default as ConsoleCommands } from './console-commands.js';
export * from './telemetry-dashboard.js';
export { default as TelemetryDashboard } from './telemetry-dashboard.js';

// === FASE 5 - Extended ===
export * from './request-queue.js';
export { default as RequestQueue } from './request-queue.js';
export * from './cache-manager.js';
export { default as CacheManager } from './cache-manager.js';
export * from './event-recorder.js';
export { default as EventRecorder } from './event-recorder.js';

// === FASE 6 - UI/UX Core ===
export * from './notification-manager.js';
export { default as NotificationManager } from './notification-manager.js';
export * from './form-validator.js';
export { default as FormValidator } from './form-validator.js';
export * from './storage-manager.js';
export { default as StorageManager } from './storage-manager.js';
export * from './clipboard-manager.js';
export { default as ClipboardManager } from './clipboard-manager.js';
export * from './drag-drop-manager.js';
export { default as DragDropManager } from './drag-drop-manager.js';
export * from './modal-manager.js';
export { default as ModalManager } from './modal-manager.js';

// === FASE 6 - UI/UX Extended ===

// @ts-expect-error TS migration - TS2308
export * from './tooltip-manager.js';
export { default as TooltipManager } from './tooltip-manager.js';
export * from './context-menu-manager.js';
export { default as ContextMenuManager } from './context-menu-manager.js';
export * from './hotkey-manager.js';
export { default as HotkeyManager } from './hotkey-manager.js';
export * from './scroll-manager.js';
export { default as ScrollManager } from './scroll-manager.js';
export * from './focus-manager.js';
export { default as FocusManager } from './focus-manager.js';
export * from './undo-manager.js';
export { default as UndoManager } from './undo-manager.js';

// === FASE 6 - Advanced ===
export * from './theme-manager-v2.js';
export { default as ThemeManagerV2 } from './theme-manager-v2.js';

// @ts-expect-error TS migration - TS2308
export * from './animation-manager-v2.js';
export { default as AnimationManagerV2 } from './animation-manager-v2.js';

// @ts-expect-error TS migration - TS2308
export * from './media-query-manager.js';
export { default as MediaQueryManager } from './media-query-manager.js';
export * from './intersection-manager.js';
export { default as IntersectionManager } from './intersection-manager.js';
export * from './resize-manager.js';
export { default as ResizeManager } from './resize-manager.js';
export * from './mutation-manager.js';
export { default as MutationManager } from './mutation-manager.js';

// === FASE 7 - Device & Browser APIs ===
export * from './permission-manager.js';
export { default as PermissionManager } from './permission-manager.js';
export * from './network-manager.js';
export { default as NetworkManager } from './network-manager.js';
export * from './geolocation-manager.js';
export { default as GeolocationManager } from './geolocation-manager.js';

// @ts-expect-error TS migration - TS2308
export * from './device-manager.js';
export { default as DeviceManager } from './device-manager.js';
export * from './battery-manager.js';
export { default as BatteryManager } from './battery-manager.js';
export * from './fullscreen-manager.js';
export { default as FullscreenManager } from './fullscreen-manager.js';
export * from './visibility-manager.js';
export { default as VisibilityManager } from './visibility-manager.js';
export * from './wake-lock-manager.js';
export { default as WakeLockManager } from './wake-lock-manager.js';
export * from './share-manager.js';
export { default as ShareManager } from './share-manager.js';

// === Core Utils ===
export * from './events.js';
export * from './icons.js';

// === Phase 1 - 30 Suggestions ===
export * as telemetry from './telemetry.js';
export * as configCache from './config-cache.js';
export * as debounce from './debounce.js';
export * as idleScheduler from './idle-scheduler.js';
export * as visibilityObserver from './visibility-observer.js';
export * as domBatch from './dom-batch.js';
export * as weakRefs from './weak-refs.js';
export * as mutationBatch from './mutation-batch.js';
export * as lazyLoader from './lazy-loader.js';
export * as virtualScroller from './virtual-scroller.js';
// REMOVED 2026-04-29 — worker-pool dormente (ver /backup/remove-workers-20260429-183149/). 5 new Function() sem consumidor real.
// export * as workerPool from './worker-pool.js';
export * as serviceWorker from './service-worker-helper.js';
export * as indexedDB from './indexed-db.js';
export * as stateCompression from './state-compression.js';
export * as objectPool from './object-pool.js';
export * as reactiveProxy from './reactive-proxy.js';
export * as customElements from './custom-elements.js';

// === Phase 2 - UI Managers ===
export * as themeManager from './theme-manager.js';
export * as animationManager from './animation-manager.js';
export * as shortcutsManager from './shortcuts-manager.js';

// === Phase 5 - Performance Monitoring ===
export * as memoryMonitor from './memory-monitor.js';
export * as fpsMonitor from './fps-monitor.js';
export * as performanceTracker from './performance-tracker.js';

export const AVAILABLE_MODULES = Object.freeze([
  'logger', 'errorHandler', 'asyncHelpers', 'responsiveManager',
  'validator',
  'debugMode', 'configPersistence',
  'sanitizer', 'rateLimiter', 'devToolsPanel', 'workerManager', 'consoleCommands', 'telemetryDashboard',
  'requestQueue', 'cacheManager', 'eventRecorder',
  'notificationManager', 'formValidator', 'storageManager', 'clipboardManager', 'dragDropManager', 'modalManager',
  'tooltipManager', 'contextMenuManager', 'hotkeyManager', 'scrollManager', 'focusManager', 'undoManager',
  'themeManagerV2', 'animationManagerV2', 'mediaQueryManager', 'intersectionManager', 'resizeManager', 'mutationManager',
  'permissionManager', 'networkManager', 'geolocationManager', 'deviceManager', 'batteryManager', 'fullscreenManager', 'visibilityManager', 'wakeLockManager', 'shareManager',
  'events', 'icons',
  'telemetry', 'configCache', 'debounce', 'idleScheduler', 'visibilityObserver', 'domBatch', 'weakRefs', 'mutationBatch', 'lazyLoader', 'virtualScroller', /* 'workerPool' REMOVED 2026-04-29 */ 'serviceWorker', 'indexedDB', 'stateCompression', 'objectPool', 'reactiveProxy', 'customElements',
  'themeManager', 'animationManager', 'shortcutsManager',
  'memoryMonitor', 'fpsMonitor', 'performanceTracker'
]);

export async function healthCheckAll() {
  const results: Record<string, unknown> = {};
  const modules = [
    'logger', 'error-handler', 'async-helpers/index', 'responsive-manager', 'validator', 'debug-mode', 'config-persistence',
    'sanitizer', 'rate-limiter', 'devtools-panel/index', /* 'worker-manager' REMOVED 2026-04-29 */ 'console-commands', 'telemetry-dashboard',
    'request-queue', 'cache-manager', 'event-recorder',
    'notification-manager', 'form-validator', 'storage-manager', 'clipboard-manager', 'drag-drop-manager', 'modal-manager',
    'tooltip-manager', 'context-menu-manager', 'hotkey-manager', 'scroll-manager', 'focus-manager', 'undo-manager',
    'theme-manager-v2', 'animation-manager-v2', 'media-query-manager', 'intersection-manager', 'resize-manager', 'mutation-manager',
    'permission-manager', 'network-manager', 'geolocation-manager', 'device-manager', 'battery-manager', 'fullscreen-manager', 'visibility-manager', 'wake-lock-manager', 'share-manager'
  ];
  
  for (const name of modules) {
    try {
      const mod = await import(`./${name}.js`);
      results[name] = mod.healthCheck?.() || { status: 'NO_HEALTHCHECK' };
    } catch (e: any) {
      results[name] = { status: 'IMPORT_ERROR', error: e.message };
    }
  }

  // @ts-expect-error strict migration — TS2769
  const healthy = Object.values(results).filter((r: Record<string, unknown>) => r.status === 'HEALTHY' || r.status === 'NOT_INITIALIZED').length;
  
  return {
    summary: { healthy, total: Object.keys(results).length, percentage: Math.round((healthy / Object.keys(results).length) * 100) },
    modules: results
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    availableModules: AVAILABLE_MODULES,
    totalModules: AVAILABLE_MODULES.length
  };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, totalModules: AVAILABLE_MODULES.length };
}

export default { VERSION, MODULE_ID, AVAILABLE_MODULES, info, healthCheck, healthCheckAll };
