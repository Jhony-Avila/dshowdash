import { contractsHealthCheck } from "../../contracts/index.js";
import { healthCheck as errorHealthCheck } from "../../utils/error-handler.js";
import { VERSION, MODULE_ID, BOOTSTRAP_STATES } from "../config/states.js";
async function performHealthCheck(refs) {
  const state = refs.state;
  const kernel = refs.kernel;
  const errors = refs.errors;
  const bootMetrics = refs.bootMetrics;
  const config = refs.config;
  const r = refs;
  const kernelHealth = kernel ? await kernel.healthCheck() : { status: "NOT_INITIALIZED" };
  const contractsHealth = contractsHealthCheck();
  const errorHandlerHealth = errorHealthCheck();
  const globalStateHealth = r.GlobalStateAdapter?.healthCheck() || { status: "DISABLED" };
  const perfHealth = r.performanceMonitor?.healthCheck() || { status: "DISABLED" };
  const fallbackHealth = r.fallbackSystem?.healthCheck() || { status: "DISABLED" };
  const pluginHealth = r.pluginSystem?.healthCheck() || { status: "DISABLED" };
  const lifecycleHealth = r.lifecycleHooks?.healthCheck() || { status: "DISABLED" };
  const bootMetricsHealth = bootMetrics?.healthCheck() || { status: "DISABLED" };
  const snapshotsHealth = r.stateSnapshots?.healthCheck() || { status: "DISABLED" };
  const debugHealth = r.debugMode?.healthCheck() || { status: "DISABLED" };
  const persistenceHealth = r.configPersistence?.healthCheck() || { status: "DISABLED" };
  const presetsHealth = r.slotPresets?.healthCheck() || { status: "DISABLED" };
  const sanitizerHealth = r.sanitizer?.healthCheck() || { status: "DISABLED" };
  const rateLimiterHealth = r.rateLimiter?.healthCheck() || { status: "DISABLED" };
  const devToolsHealth = r.devToolsPanel?.healthCheck() || { status: "DISABLED" };
  const workerHealth = r.workerManager?.healthCheck() || { status: "DISABLED" };
  const consoleHealth = r.consoleCommands?.healthCheck() || { status: "DISABLED" };
  const telemetryHealth = r.telemetryDashboard?.healthCheck() || { status: "DISABLED" };
  const requestQueueHealth = r.requestQueue?.healthCheck() || { status: "DISABLED" };
  const cacheHealth = r.cacheManager?.healthCheck() || { status: "DISABLED" };
  const recorderHealth = r.eventRecorder?.healthCheck() || { status: "DISABLED" };
  const notificationHealth = r.notificationManager?.healthCheck() || { status: "DISABLED" };
  const formValidatorHealth = r.formValidator?.healthCheck() || { status: "DISABLED" };
  const storageHealth = r.storageManager?.healthCheck() || { status: "DISABLED" };
  const clipboardHealth = r.clipboardManager?.healthCheck() || { status: "DISABLED" };
  const dragDropHealth = r.dragDropManager?.healthCheck() || { status: "DISABLED" };
  const modalHealth = r.modalManager?.healthCheck() || { status: "DISABLED" };
  const tooltipHealth = r.tooltipManager?.healthCheck() || { status: "DISABLED" };
  const contextMenuHealth = r.contextMenuManager?.healthCheck() || { status: "DISABLED" };
  const hotkeyHealth = r.hotkeyManager?.healthCheck() || { status: "DISABLED" };
  const scrollHealth = r.scrollManager?.healthCheck() || { status: "DISABLED" };
  const focusHealth = r.focusManager?.healthCheck() || { status: "DISABLED" };
  const undoHealth = r.undoManager?.healthCheck() || { status: "DISABLED" };
  const themeHealth = r.themeManager?.healthCheck() || { status: "DISABLED" };
  const animationHealth = r.animationManager?.healthCheck() || { status: "DISABLED" };
  const mediaQueryHealth = r.mediaQueryManager?.healthCheck() || { status: "DISABLED" };
  const intersectionHealth = r.intersectionManager?.healthCheck() || { status: "DISABLED" };
  const resizeHealth = r.resizeManager?.healthCheck() || { status: "DISABLED" };
  const mutationHealth = r.mutationManager?.healthCheck() || { status: "DISABLED" };
  const permissionHealth = r.permissionManager?.healthCheck() || { status: "DISABLED" };
  const networkHealth = r.networkManager?.healthCheck() || { status: "DISABLED" };
  const geolocationHealth = r.geolocationManager?.healthCheck() || { status: "DISABLED" };
  const deviceHealth = r.deviceManager?.healthCheck() || { status: "DISABLED" };
  const batteryHealth = r.batteryManager?.healthCheck() || { status: "DISABLED" };
  const fullscreenHealth = r.fullscreenManager?.healthCheck() || { status: "DISABLED" };
  const visibilityHealth = r.visibilityManager?.healthCheck() || { status: "DISABLED" };
  const wakeLockHealth = r.wakeLockManager?.healthCheck() || { status: "DISABLED" };
  const shareHealth = r.shareManager?.healthCheck() || { status: "DISABLED" };
  const isRunning = state === BOOTSTRAP_STATES.RUNNING;
  let status = "HEALTHY";
  if (state === BOOTSTRAP_STATES.ERROR) status = "ERROR";
  else if (!isRunning) status = "NOT_RUNNING";
  else if (errors.length > 0) status = "WARNING";
  else if (kernelHealth.status !== "HEALTHY") status = kernelHealth.status;
  else if (perfHealth.status === "CRITICAL") status = "DEGRADED";
  return {
    status,
    version: VERSION,
    moduleId: MODULE_ID,
    bootstrapState: state,
    errorCount: errors.length,
    bootMetrics: bootMetrics?.getReport()?.summary || null,
    phase1: { logger: { status: "HEALTHY" }, errorHandler: errorHandlerHealth, globalState: globalStateHealth },
    phase2: { performanceMonitor: perfHealth, fallbackSystem: fallbackHealth },
    phase3: { config: { status: "HEALTHY" }, dependencyMap: { status: "HEALTHY" }, validator: { status: "HEALTHY" } },
    phase4: { pluginSystem: pluginHealth, lifecycleHooks: lifecycleHealth, bootMetrics: bootMetricsHealth, stateSnapshots: snapshotsHealth, debugMode: debugHealth, configPersistence: persistenceHealth, slotPresets: presetsHealth, eventBusAdapter: { status: r.eventBusAdapter ? "HEALTHY" : "DISABLED" } },
    phase5Core: { sanitizer: sanitizerHealth, rateLimiter: rateLimiterHealth, devToolsPanel: devToolsHealth, workerManager: workerHealth, consoleCommands: consoleHealth, telemetryDashboard: telemetryHealth },
    phase5Extended: { requestQueue: requestQueueHealth, cacheManager: cacheHealth, eventRecorder: recorderHealth },
    phase6Core: { notificationManager: notificationHealth, formValidator: formValidatorHealth, storageManager: storageHealth, clipboardManager: clipboardHealth, dragDropManager: dragDropHealth, modalManager: modalHealth },
    phase6Extended: { tooltipManager: tooltipHealth, contextMenuManager: contextMenuHealth, hotkeyManager: hotkeyHealth, scrollManager: scrollHealth, focusManager: focusHealth, undoManager: undoHealth },
    phase6Advanced: { themeManager: themeHealth, animationManager: animationHealth, mediaQueryManager: mediaQueryHealth, intersectionManager: intersectionHealth, resizeManager: resizeHealth, mutationManager: mutationHealth },
    phase7: { permissionManager: permissionHealth, networkManager: networkHealth, geolocationManager: geolocationHealth, deviceManager: deviceHealth, batteryManager: batteryHealth, fullscreenManager: fullscreenHealth, visibilityManager: visibilityHealth, wakeLockManager: wakeLockHealth, shareManager: shareHealth },
    kernel: kernelHealth,
    contracts: contractsHealth
  };
}
var health_check_default = { performHealthCheck };
export {
  health_check_default as default,
  performHealthCheck
};
