import { log, _metrics, resetIntegrations } from "./logger.js";
import { cleanupGlobalStateIntegration } from "./global-state-integration.js";
const VERSION = "6.4.0-ES6";
const MODULE_ID = "header/core/unmount-handler";
const _localMetrics = { unmountAttempts: 0, unmountSuccesses: 0, unmountFailures: 0, avgUnmountTimeMs: 0, lastUnmountAt: null, lastErrorAt: null };
function executeUnmount(header) {
  const unmountStart = Date.now();
  _localMetrics.unmountAttempts++;
  log("info", "Desmontando header");
  _metrics.unmountCount++;
  _metrics.lastUnmountAt = Date.now();
  if (header.events && header.events.cleanup) header.events.cleanup();
  cleanupGlobalStateIntegration(header.globalStateCleanups);
  header.globalStateCleanups = [];
  const lifecyclePromise = header.lifecycle ? header.lifecycle.unmount() : Promise.resolve();
  return lifecyclePromise.then(() => {
    if (header.fallbackManager && header.fallbackManager.destroy) header.fallbackManager.destroy();
    return header.componentsLoader ? header.componentsLoader.unmountAll() : Promise.resolve();
  }).then(() => {
    if (header.routerIntegration && header.routerIntegration.destroy) header.routerIntegration.destroy();
    if (header.performanceObserver) {
      header.performanceObserver.disconnect();
      header.performanceObserver = null;
    }
    Object.keys(header.abortControllers).forEach((key) => {
      if (header.abortControllers[key] && header.abortControllers[key].abort) {
        header.abortControllers[key].abort();
      }
      header.abortControllers[key] = null;
    });
    if (header.polling && header.polling.stop) header.polling.stop();
    if (header.shortcuts && header.shortcuts.unmount) header.shortcuts.unmount();
    if (header.announceManager && header.announceManager.unmount) header.announceManager.unmount();
    if (header.rovingTabindex && header.rovingTabindex.unmount) header.rovingTabindex.unmount();
    if (header.refreshCoordinator && header.refreshCoordinator.unmount) header.refreshCoordinator.unmount();
    if (header.fullscreenManager && header.fullscreenManager.unmount) header.fullscreenManager.unmount();
    if (header.scrollDetector && header.scrollDetector.unmount) header.scrollDetector.unmount();
    if (header.networkMonitor && header.networkMonitor.unmount) header.networkMonitor.unmount();
    if (header.rippleManager && header.rippleManager.unmount) header.rippleManager.unmount();
    if (header.currencyPanel && header.currencyPanel.unmount) header.currencyPanel.unmount();
    if (header.weatherPanel && header.weatherPanel.unmount) header.weatherPanel.unmount();
    if (header.connectivityModal && header.connectivityModal.unmount) header.connectivityModal.unmount();
    if (header.alertsPanel && header.alertsPanel.unmount) header.alertsPanel.unmount();
    if (header.healthPanel && header.healthPanel.unmount) header.healthPanel.unmount();
    if (header.notifications && header.notifications.unmount) header.notifications.unmount();
    if (header.timers && header.timers.destroy) header.timers.destroy();
    if (header.store && header.store.reset) header.store.reset();
    return header.lifecycle ? header.lifecycle.destroy() : Promise.resolve();
  }).then(() => {
    if (header.eventBus && header.eventBus.destroy) header.eventBus.destroy();
    const apiName = header.options && header.options.globalApiName || "headerAPI";
    if (typeof window !== "undefined") {
      delete window[apiName];
      delete window[`__${apiName}Instance`];
    }
    nullifyReferences(header);
    header.isMounted = false;
    header.isDestroyed = true;
    resetIntegrations();
    const unmountTimeMs = Date.now() - unmountStart;
    _localMetrics.unmountSuccesses++;
    _localMetrics.lastUnmountAt = Date.now();
    _localMetrics.avgUnmountTimeMs = (_localMetrics.avgUnmountTimeMs * (_localMetrics.unmountSuccesses - 1) + unmountTimeMs) / _localMetrics.unmountSuccesses;
    log("info", `Header desmontado e destruido (${unmountTimeMs}ms)`);
  }).catch((error) => {
    _localMetrics.unmountFailures++;
    _localMetrics.lastErrorAt = Date.now();
    log("error", "Erro no unmount:", error.message);
    throw error;
  });
}
function nullifyReferences(header) {
  header.config = null;
  header.logger = null;
  header.telemetry = null;
  header.timers = null;
  header.eventBus = null;
  header.store = null;
  header.lifecycle = null;
  header.fetchClient = null;
  header.healthAPI = null;
  header.alertsAPI = null;
  header.networkMonitor = null;
  header.polling = null;
  header.statusTray = null;
  header.tooltips = null;
  header.envChip = null;
  header.infoIcons = null;
  header.scrollDetector = null;
  header.fullscreenManager = null;
  header.refreshCoordinator = null;
  header.rovingTabindex = null;
  header.announceManager = null;
  header.shortcuts = null;
  header.rippleManager = null;
  header.notifications = null;
  header.currencyPanel = null;
  header.weatherPanel = null;
  header.connectivityModal = null;
  header.alertsPanel = null;
  header.healthPanel = null;
  header.elements = {};
  header.features = null;
  header.abortControllers = {};
  header.fallbackManager = null;
  header.routerIntegration = null;
  header.componentsLoader = null;
  header.integrations = null;
}
function getMetrics() {
  return Object.assign({}, _localMetrics);
}
function resetMetrics() {
  _localMetrics.unmountAttempts = 0;
  _localMetrics.unmountSuccesses = 0;
  _localMetrics.unmountFailures = 0;
  _localMetrics.avgUnmountTimeMs = 0;
  _localMetrics.lastUnmountAt = null;
  _localMetrics.lastErrorAt = null;
}
function healthCheck() {
  const successRate = _localMetrics.unmountAttempts > 0 ? _localMetrics.unmountSuccesses / _localMetrics.unmountAttempts : 1;
  const checks = { executeUnmountAvailable: typeof executeUnmount === "function", nullifyReferencesAvailable: typeof nullifyReferences === "function", goodSuccessRate: successRate >= 0.9 || _localMetrics.unmountAttempts === 0, noRecentErrors: !_localMetrics.lastErrorAt || Date.now() - _localMetrics.lastErrorAt > 6e4 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, successRate, avgUnmountTimeMs: Math.round(_localMetrics.avgUnmountTimeMs), version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics(), healthCheck: healthCheck() };
}
var unmount_handler_default = { VERSION, MODULE_ID, executeUnmount, getMetrics, resetMetrics, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  unmount_handler_default as default,
  executeUnmount,
  getMetrics,
  healthCheck,
  info,
  resetMetrics
};
