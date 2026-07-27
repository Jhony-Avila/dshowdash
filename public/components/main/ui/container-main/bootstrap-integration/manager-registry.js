const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.bootstrap-integration.manager-registry";
function createManagerRegistry() {
  const _managers = {
    // Phase 1
    logger: null,
    // Phase 2
    performanceMonitor: null,
    fallbackSystem: null,
    // Phase 4
    pluginSystem: null,
    lifecycleHooks: null,
    bootMetrics: null,
    eventBusAdapter: null,
    stateSnapshots: null,
    debugMode: null,
    configPersistence: null,
    slotPresets: null,
    // Phase 5 Core
    sanitizer: null,
    rateLimiter: null,
    devToolsPanel: null,
    workerManager: null,
    consoleCommands: null,
    telemetryDashboard: null,
    // Phase 5 Extended
    requestQueue: null,
    cacheManager: null,
    eventRecorder: null,
    // Phase 6 Core
    notificationManager: null,
    formValidator: null,
    storageManager: null,
    clipboardManager: null,
    dragDropManager: null,
    modalManager: null,
    // Phase 6 Extended
    tooltipManager: null,
    contextMenuManager: null,
    hotkeyManager: null,
    scrollManager: null,
    focusManager: null,
    undoManager: null,
    // Phase 6 Advanced
    themeManager: null,
    animationManager: null,
    mediaQueryManager: null,
    intersectionManager: null,
    resizeManager: null,
    mutationManager: null,
    // Phase 7
    permissionManager: null,
    networkManager: null,
    geolocationManager: null,
    deviceManager: null,
    batteryManager: null,
    fullscreenManager: null,
    visibilityManager: null,
    wakeLockManager: null,
    shareManager: null
  };
  return {
    set(name, instance) {
      if (name in _managers) {
        _managers[name] = instance;
      }
    },
    get(name) {
      return _managers[name] || null;
    },
    has(name) {
      return _managers[name] !== null;
    },
    getAll() {
      return { ..._managers };
    },
    clear() {
      for (const key in _managers) {
        _managers[key] = null;
      }
    },
    list() {
      return Object.keys(_managers).filter((k) => _managers[k] !== null);
    },
    count() {
      return this.list().length;
    },
    destroyAll() {
      for (const key in _managers) {
        const mgr = _managers[key];
        if (mgr?.destroy) {
          try {
            mgr.destroy();
          } catch (e) {
          }
        }
        _managers[key] = null;
      }
    }
  };
}
var manager_registry_default = { createManagerRegistry };
export {
  MODULE_ID,
  VERSION,
  createManagerRegistry,
  manager_registry_default as default
};
