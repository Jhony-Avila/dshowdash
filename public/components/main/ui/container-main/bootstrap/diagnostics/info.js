import { VERSION, MODULE_ID } from "../config/states.js";
function getInfo(refs) {
  const state = refs.state;
  const kernel = refs.kernel;
  const bootMetrics = refs.bootMetrics;
  const logger = refs.logger;
  const config = refs.config;
  const r = refs;
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    state,
    kernelState: kernel?.getState() || null,
    bootMetrics: bootMetrics?.getReport()?.summary || null,
    phase1: {
      loggerActive: !!logger,
      globalStateAvailable: r.GlobalStateAdapter?.isAvailable() || false,
      errorHandlerInstalled: config.captureGlobalErrors
    },
    phase2: {
      performanceMonitorActive: !!r.performanceMonitor,
      fallbackSystemActive: !!r.fallbackSystem
    },
    phase3: {
      configIntegrated: true,
      dependencyMapActive: true,
      validatorActive: true
    },
    phase4: {
      pluginSystemActive: !!r.pluginSystem,
      lifecycleHooksActive: !!r.lifecycleHooks,
      bootMetricsActive: !!bootMetrics,
      eventBusAdapterActive: !!r.eventBusAdapter,
      stateSnapshotsActive: !!r.stateSnapshots,
      debugModeActive: !!r.debugMode,
      configPersistenceActive: !!r.configPersistence,
      slotPresetsActive: !!r.slotPresets
    },
    phase5Core: {
      sanitizerActive: !!r.sanitizer,
      rateLimiterActive: !!r.rateLimiter,
      devToolsPanelActive: !!r.devToolsPanel,
      workerManagerActive: !!r.workerManager,
      consoleCommandsActive: !!r.consoleCommands,
      telemetryDashboardActive: !!r.telemetryDashboard
    },
    phase5Extended: {
      requestQueueActive: !!r.requestQueue,
      cacheManagerActive: !!r.cacheManager,
      eventRecorderActive: !!r.eventRecorder
    },
    phase6Core: {
      notificationManagerActive: !!r.notificationManager,
      formValidatorActive: !!r.formValidator,
      storageManagerActive: !!r.storageManager,
      clipboardManagerActive: !!r.clipboardManager,
      dragDropManagerActive: !!r.dragDropManager,
      modalManagerActive: !!r.modalManager
    },
    phase6Extended: {
      tooltipManagerActive: !!r.tooltipManager,
      contextMenuManagerActive: !!r.contextMenuManager,
      hotkeyManagerActive: !!r.hotkeyManager,
      scrollManagerActive: !!r.scrollManager,
      focusManagerActive: !!r.focusManager,
      undoManagerActive: !!r.undoManager
    },
    phase6Advanced: {
      themeManagerActive: !!r.themeManager,
      animationManagerActive: !!r.animationManager,
      mediaQueryManagerActive: !!r.mediaQueryManager,
      intersectionManagerActive: !!r.intersectionManager,
      resizeManagerActive: !!r.resizeManager,
      mutationManagerActive: !!r.mutationManager
    },
    phase7: {
      permissionManagerActive: !!r.permissionManager,
      networkManagerActive: !!r.networkManager,
      geolocationManagerActive: !!r.geolocationManager,
      deviceManagerActive: !!r.deviceManager,
      batteryManagerActive: !!r.batteryManager,
      fullscreenManagerActive: !!r.fullscreenManager,
      visibilityManagerActive: !!r.visibilityManager,
      wakeLockManagerActive: !!r.wakeLockManager,
      shareManagerActive: !!r.shareManager
    },
    managersActive: kernel?.listManagers()?.length || 0,
    pluginsActive: r.pluginSystem?.listActive()?.length || 0,
    snapshotsCount: r.stateSnapshots?.count() || 0
  };
}
var info_default = { getInfo };
export {
  info_default as default,
  getInfo
};
