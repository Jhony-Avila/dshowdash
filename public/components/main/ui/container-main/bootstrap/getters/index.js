const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap.getters";
function createGetters(refs) {
  const r = refs;
  return {
    // Core
    getState() {
      return refs.state;
    },
    getKernel() {
      return r.kernel;
    },
    getEventBus() {
      return r.eventBus;
    },
    getEventBusAdapter() {
      return r.eventBusAdapter;
    },
    getManager(name) {
      return r.kernel?.getManager(name) || null;
    },
    getBootMetrics() {
      return r.bootMetrics;
    },
    getErrors() {
      return [...refs.errors];
    },
    getLogger() {
      return r.logger;
    },
    getGlobalState() {
      return r.GlobalStateAdapter;
    },
    getPerformanceMonitor() {
      return r.performanceMonitor;
    },
    getFallbackSystem() {
      return r.fallbackSystem;
    },
    getPluginSystem() {
      return r.pluginSystem;
    },
    getLifecycleHooks() {
      return r.lifecycleHooks;
    },
    getStateSnapshots() {
      return r.stateSnapshots;
    },
    getDebugMode() {
      return r.debugMode;
    },
    getConfigPersistence() {
      return r.configPersistence;
    },
    getSlotPresets() {
      return r.slotPresets;
    },
    getSanitizer() {
      return r.sanitizer;
    },
    getRateLimiter() {
      return r.rateLimiter;
    },
    getDevToolsPanel() {
      return r.devToolsPanel;
    },
    // REMOVED 2026-04-29 — worker-manager dormente (ver /backup/remove-workers-20260429-183149/).
    // getWorkerManager() { return r.workerManager; },
    getConsoleCommands() {
      return r.consoleCommands;
    },
    getTelemetryDashboard() {
      return r.telemetryDashboard;
    },
    getConfig() {
      return { ...refs.config };
    },
    // FASE 5 Extended
    getRequestQueue() {
      return r.requestQueue;
    },
    getCacheManager() {
      return r.cacheManager;
    },
    getEventRecorder() {
      return r.eventRecorder;
    },
    // FASE 6 Core
    getNotificationManager() {
      return r.notificationManager;
    },
    getFormValidator() {
      return r.formValidator;
    },
    getStorageManager() {
      return r.storageManager;
    },
    getClipboardManager() {
      return r.clipboardManager;
    },
    getDragDropManager() {
      return r.dragDropManager;
    },
    getModalManager() {
      return r.modalManager;
    },
    // FASE 6 Extended
    getTooltipManager() {
      return r.tooltipManager;
    },
    getContextMenuManager() {
      return r.contextMenuManager;
    },
    getHotkeyManager() {
      return r.hotkeyManager;
    },
    getScrollManager() {
      return r.scrollManager;
    },
    getFocusManager() {
      return r.focusManager;
    },
    getUndoManager() {
      return r.undoManager;
    },
    // FASE 6 Advanced
    getThemeManager() {
      return r.themeManager;
    },
    getAnimationManager() {
      return r.animationManager;
    },
    getMediaQueryManager() {
      return r.mediaQueryManager;
    },
    getIntersectionManager() {
      return r.intersectionManager;
    },
    getResizeManager() {
      return r.resizeManager;
    },
    getMutationManager() {
      return r.mutationManager;
    },
    // FASE 7 Device & Browser APIs
    getPermissionManager() {
      return r.permissionManager;
    },
    getNetworkManager() {
      return r.networkManager;
    },
    getGeolocationManager() {
      return r.geolocationManager;
    },
    getDeviceManager() {
      return r.deviceManager;
    },
    getBatteryManager() {
      return r.batteryManager;
    },
    getFullscreenManager() {
      return r.fullscreenManager;
    },
    getVisibilityManager() {
      return r.visibilityManager;
    },
    getWakeLockManager() {
      return r.wakeLockManager;
    },
    getShareManager() {
      return r.shareManager;
    }
  };
}
var getters_default = { createGetters };
export {
  MODULE_ID,
  VERSION,
  createGetters,
  getters_default as default
};
