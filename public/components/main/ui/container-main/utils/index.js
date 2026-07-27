const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "container-main:utils";
export * from "./logger.js";
import { default as default2 } from "./logger.js";
export * from "./error-handler.js";
import { default as default3 } from "./error-handler.js";
export * from "./async-helpers/index.js";
import { default as default4 } from "./async-helpers/index.js";
export * from "./responsive-manager.js";
import { default as default5 } from "./responsive-manager.js";
export * from "./validator.js";
import { default as default6 } from "./validator.js";
export * from "./debug-mode.js";
import { default as default7 } from "./debug-mode.js";
export * from "./config-persistence.js";
import { default as default8 } from "./config-persistence.js";
export * from "./sanitizer.js";
import { default as default9 } from "./sanitizer.js";
export * from "./rate-limiter.js";
import { default as default10 } from "./rate-limiter.js";
export * from "./devtools-panel/index.js";
import { default as default11 } from "./devtools-panel/index.js";
export * from "./console-commands.js";
import { default as default12 } from "./console-commands.js";
export * from "./telemetry-dashboard.js";
import { default as default13 } from "./telemetry-dashboard.js";
export * from "./request-queue.js";
import { default as default14 } from "./request-queue.js";
export * from "./cache-manager.js";
import { default as default15 } from "./cache-manager.js";
export * from "./event-recorder.js";
import { default as default16 } from "./event-recorder.js";
export * from "./notification-manager.js";
import { default as default17 } from "./notification-manager.js";
export * from "./form-validator.js";
import { default as default18 } from "./form-validator.js";
export * from "./storage-manager.js";
import { default as default19 } from "./storage-manager.js";
export * from "./clipboard-manager.js";
import { default as default20 } from "./clipboard-manager.js";
export * from "./drag-drop-manager.js";
import { default as default21 } from "./drag-drop-manager.js";
export * from "./modal-manager.js";
import { default as default22 } from "./modal-manager.js";
export * from "./tooltip-manager.js";
import { default as default23 } from "./tooltip-manager.js";
export * from "./context-menu-manager.js";
import { default as default24 } from "./context-menu-manager.js";
export * from "./hotkey-manager.js";
import { default as default25 } from "./hotkey-manager.js";
export * from "./scroll-manager.js";
import { default as default26 } from "./scroll-manager.js";
export * from "./focus-manager.js";
import { default as default27 } from "./focus-manager.js";
export * from "./undo-manager.js";
import { default as default28 } from "./undo-manager.js";
export * from "./theme-manager-v2.js";
import { default as default29 } from "./theme-manager-v2.js";
export * from "./animation-manager-v2.js";
import { default as default30 } from "./animation-manager-v2.js";
export * from "./media-query-manager.js";
import { default as default31 } from "./media-query-manager.js";
export * from "./intersection-manager.js";
import { default as default32 } from "./intersection-manager.js";
export * from "./resize-manager.js";
import { default as default33 } from "./resize-manager.js";
export * from "./mutation-manager.js";
import { default as default34 } from "./mutation-manager.js";
export * from "./permission-manager.js";
import { default as default35 } from "./permission-manager.js";
export * from "./network-manager.js";
import { default as default36 } from "./network-manager.js";
export * from "./geolocation-manager.js";
import { default as default37 } from "./geolocation-manager.js";
export * from "./device-manager.js";
import { default as default38 } from "./device-manager.js";
export * from "./battery-manager.js";
import { default as default39 } from "./battery-manager.js";
export * from "./fullscreen-manager.js";
import { default as default40 } from "./fullscreen-manager.js";
export * from "./visibility-manager.js";
import { default as default41 } from "./visibility-manager.js";
export * from "./wake-lock-manager.js";
import { default as default42 } from "./wake-lock-manager.js";
export * from "./share-manager.js";
import { default as default43 } from "./share-manager.js";
export * from "./events.js";
export * from "./icons.js";
import * as telemetry from "./telemetry.js";
import * as configCache from "./config-cache.js";
import * as debounce from "./debounce.js";
import * as idleScheduler from "./idle-scheduler.js";
import * as visibilityObserver from "./visibility-observer.js";
import * as domBatch from "./dom-batch.js";
import * as weakRefs from "./weak-refs.js";
import * as mutationBatch from "./mutation-batch.js";
import * as lazyLoader from "./lazy-loader.js";
import * as virtualScroller from "./virtual-scroller.js";
import * as serviceWorker from "./service-worker-helper.js";
import * as indexedDB from "./indexed-db.js";
import * as stateCompression from "./state-compression.js";
import * as objectPool from "./object-pool.js";
import * as reactiveProxy from "./reactive-proxy.js";
import * as customElements from "./custom-elements.js";
import * as themeManager from "./theme-manager.js";
import * as animationManager from "./animation-manager.js";
import * as shortcutsManager from "./shortcuts-manager.js";
import * as memoryMonitor from "./memory-monitor.js";
import * as fpsMonitor from "./fps-monitor.js";
import * as performanceTracker from "./performance-tracker.js";
const AVAILABLE_MODULES = Object.freeze([
  "logger",
  "errorHandler",
  "asyncHelpers",
  "responsiveManager",
  "validator",
  "debugMode",
  "configPersistence",
  "sanitizer",
  "rateLimiter",
  "devToolsPanel",
  "workerManager",
  "consoleCommands",
  "telemetryDashboard",
  "requestQueue",
  "cacheManager",
  "eventRecorder",
  "notificationManager",
  "formValidator",
  "storageManager",
  "clipboardManager",
  "dragDropManager",
  "modalManager",
  "tooltipManager",
  "contextMenuManager",
  "hotkeyManager",
  "scrollManager",
  "focusManager",
  "undoManager",
  "themeManagerV2",
  "animationManagerV2",
  "mediaQueryManager",
  "intersectionManager",
  "resizeManager",
  "mutationManager",
  "permissionManager",
  "networkManager",
  "geolocationManager",
  "deviceManager",
  "batteryManager",
  "fullscreenManager",
  "visibilityManager",
  "wakeLockManager",
  "shareManager",
  "events",
  "icons",
  "telemetry",
  "configCache",
  "debounce",
  "idleScheduler",
  "visibilityObserver",
  "domBatch",
  "weakRefs",
  "mutationBatch",
  "lazyLoader",
  "virtualScroller",
  /* 'workerPool' REMOVED 2026-04-29 */
  "serviceWorker",
  "indexedDB",
  "stateCompression",
  "objectPool",
  "reactiveProxy",
  "customElements",
  "themeManager",
  "animationManager",
  "shortcutsManager",
  "memoryMonitor",
  "fpsMonitor",
  "performanceTracker"
]);
async function healthCheckAll() {
  const results = {};
  const modules = [
    "logger",
    "error-handler",
    "async-helpers/index",
    "responsive-manager",
    "validator",
    "debug-mode",
    "config-persistence",
    "sanitizer",
    "rate-limiter",
    "devtools-panel/index",
    /* 'worker-manager' REMOVED 2026-04-29 */
    "console-commands",
    "telemetry-dashboard",
    "request-queue",
    "cache-manager",
    "event-recorder",
    "notification-manager",
    "form-validator",
    "storage-manager",
    "clipboard-manager",
    "drag-drop-manager",
    "modal-manager",
    "tooltip-manager",
    "context-menu-manager",
    "hotkey-manager",
    "scroll-manager",
    "focus-manager",
    "undo-manager",
    "theme-manager-v2",
    "animation-manager-v2",
    "media-query-manager",
    "intersection-manager",
    "resize-manager",
    "mutation-manager",
    "permission-manager",
    "network-manager",
    "geolocation-manager",
    "device-manager",
    "battery-manager",
    "fullscreen-manager",
    "visibility-manager",
    "wake-lock-manager",
    "share-manager"
  ];
  for (const name of modules) {
    try {
      const mod = await import(`./${name}.js`);
      results[name] = mod.healthCheck?.() || { status: "NO_HEALTHCHECK" };
    } catch (e) {
      results[name] = { status: "IMPORT_ERROR", error: e.message };
    }
  }
  const healthy = Object.values(results).filter((r) => r.status === "HEALTHY" || r.status === "NOT_INITIALIZED").length;
  return {
    summary: { healthy, total: Object.keys(results).length, percentage: Math.round(healthy / Object.keys(results).length * 100) },
    modules: results
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    availableModules: AVAILABLE_MODULES,
    totalModules: AVAILABLE_MODULES.length
  };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, totalModules: AVAILABLE_MODULES.length };
}
var utils_default = { VERSION, MODULE_ID, AVAILABLE_MODULES, info, healthCheck, healthCheckAll };
export {
  AVAILABLE_MODULES,
  default30 as AnimationManagerV2,
  default4 as AsyncHelpers,
  default39 as BatteryManager,
  default15 as CacheManager,
  default20 as ClipboardManager,
  default8 as ConfigPersistence,
  default12 as ConsoleCommands,
  default24 as ContextMenuManager,
  default7 as DebugMode,
  default11 as DevToolsPanel,
  default38 as DeviceManager,
  default21 as DragDropManager,
  default3 as ErrorHandler,
  default16 as EventRecorder,
  default27 as FocusManager,
  default18 as FormValidator,
  default40 as FullscreenManager,
  default37 as GeolocationManager,
  default25 as HotkeyManager,
  default32 as IntersectionManager,
  default2 as Logger,
  MODULE_ID,
  default31 as MediaQueryManager,
  default22 as ModalManager,
  default34 as MutationManager,
  default36 as NetworkManager,
  default17 as NotificationManager,
  default35 as PermissionManager,
  default10 as RateLimiter,
  default14 as RequestQueue,
  default33 as ResizeManager,
  default5 as ResponsiveManager,
  default9 as Sanitizer,
  default26 as ScrollManager,
  default43 as ShareManager,
  default19 as StorageManager,
  default13 as TelemetryDashboard,
  default29 as ThemeManagerV2,
  default23 as TooltipManager,
  default28 as UndoManager,
  VERSION,
  default6 as Validator,
  default41 as VisibilityManager,
  default42 as WakeLockManager,
  animationManager,
  configCache,
  customElements,
  debounce,
  utils_default as default,
  domBatch,
  fpsMonitor,
  healthCheck,
  healthCheckAll,
  idleScheduler,
  indexedDB,
  info,
  lazyLoader,
  memoryMonitor,
  mutationBatch,
  objectPool,
  performanceTracker,
  reactiveProxy,
  serviceWorker,
  shortcutsManager,
  stateCompression,
  telemetry,
  themeManager,
  virtualScroller,
  visibilityObserver,
  weakRefs
};
