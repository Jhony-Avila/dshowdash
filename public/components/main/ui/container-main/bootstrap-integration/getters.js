import GlobalStateAdapter from "../adapters/global-state-adapter.js";
const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap-integration.getters";
function createGetters(context) {
  const managers = context.managers;
  const getState = context.getState;
  const kernel = context.kernel;
  const eventBus = context.eventBus;
  const bootMetrics = context.bootMetrics;
  const errors = context.errors;
  const config = context.config;
  return {
    getState,
    getKernel: () => kernel,
    getEventBus: () => eventBus,
    getEventBusAdapter: () => managers.get("eventBusAdapter"),
    getManager: (name) => kernel?.getManager(name) || null,
    getBootMetrics: () => bootMetrics,
    getErrors: () => [...errors],
    getLogger: () => managers.get("logger"),
    getGlobalState: () => GlobalStateAdapter,
    getConfig: () => ({ ...config }),
    // Phase 2
    getPerformanceMonitor: () => managers.get("performanceMonitor"),
    getFallbackSystem: () => managers.get("fallbackSystem"),
    // Phase 4
    getPluginSystem: () => managers.get("pluginSystem"),
    getLifecycleHooks: () => managers.get("lifecycleHooks"),
    getStateSnapshots: () => managers.get("stateSnapshots"),
    getDebugMode: () => managers.get("debugMode"),
    getConfigPersistence: () => managers.get("configPersistence"),
    getSlotPresets: () => managers.get("slotPresets"),
    // Phase 5
    getSanitizer: () => managers.get("sanitizer"),
    getRateLimiter: () => managers.get("rateLimiter"),
    getDevToolsPanel: () => managers.get("devToolsPanel"),
    getWorkerManager: () => managers.get("workerManager"),
    getConsoleCommands: () => managers.get("consoleCommands"),
    getTelemetryDashboard: () => managers.get("telemetryDashboard"),
    getRequestQueue: () => managers.get("requestQueue"),
    getCacheManager: () => managers.get("cacheManager"),
    getEventRecorder: () => managers.get("eventRecorder"),
    // Phase 6
    getNotificationManager: () => managers.get("notificationManager"),
    getFormValidator: () => managers.get("formValidator"),
    getStorageManager: () => managers.get("storageManager"),
    getClipboardManager: () => managers.get("clipboardManager"),
    getDragDropManager: () => managers.get("dragDropManager"),
    getModalManager: () => managers.get("modalManager"),
    getTooltipManager: () => managers.get("tooltipManager"),
    getContextMenuManager: () => managers.get("contextMenuManager"),
    getHotkeyManager: () => managers.get("hotkeyManager"),
    getScrollManager: () => managers.get("scrollManager"),
    getFocusManager: () => managers.get("focusManager"),
    getUndoManager: () => managers.get("undoManager"),
    getThemeManager: () => managers.get("themeManager"),
    getAnimationManager: () => managers.get("animationManager"),
    getMediaQueryManager: () => managers.get("mediaQueryManager"),
    getIntersectionManager: () => managers.get("intersectionManager"),
    getResizeManager: () => managers.get("resizeManager"),
    getMutationManager: () => managers.get("mutationManager"),
    // Phase 7
    getPermissionManager: () => managers.get("permissionManager"),
    getNetworkManager: () => managers.get("networkManager"),
    getGeolocationManager: () => managers.get("geolocationManager"),
    getDeviceManager: () => managers.get("deviceManager"),
    getBatteryManager: () => managers.get("batteryManager"),
    getFullscreenManager: () => managers.get("fullscreenManager"),
    getVisibilityManager: () => managers.get("visibilityManager"),
    getWakeLockManager: () => managers.get("wakeLockManager"),
    getShareManager: () => managers.get("shareManager")
  };
}
var getters_default = { createGetters };
export {
  MODULE_ID,
  VERSION,
  createGetters,
  getters_default as default
};
