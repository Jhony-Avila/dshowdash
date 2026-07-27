const MODULE_ID = "navigation-controller-telemetry";
const VERSION = "8.1.0-ABORT-FIX";
function getMetrics(state) {
  const metrics = state.metrics;
  const navQueue = state.navigationQueue;
  const intentHistory = state.intentHistory;
  return Object.assign({}, metrics, {
    queueSize: navQueue.length,
    isNavigating: state.navigating,
    intentHistorySize: intentHistory.length
  });
}
function getNavigationDiagnostics(state, getPort) {
  const broker = getPort("navigationBroker");
  const brokerDiag = broker && broker.getNavigationDiagnostics ? broker.getNavigationDiagnostics() : null;
  return {
    localHistory: state.intentHistory.slice(0, 20),
    brokerHistory: brokerDiag ? brokerDiag.history : [],
    lastValidNavigation: state.lastValidNavigation,
    currentNavigation: state.currentNavigation,
    metrics: getMetrics(state),
    brokerMetrics: brokerDiag ? brokerDiag.metrics : null,
    timestamp: Date.now()
  };
}
function info(state, panelLifecycle, manifestController, getPort, portsInitialized) {
  const pl = panelLifecycle;
  return {
    version: VERSION,
    moduleId: "main-navigation-controller",
    navigating: state.navigating,
    currentPanel: pl && pl.getCurrentPanelId ? pl.getCurrentPanelId() : null,
    currentNavigation: state.currentNavigation,
    lastValidNavigation: state.lastValidNavigation,
    queueSize: state.navigationQueue.length,
    timeoutMs: state.timeoutMs,
    hasManifestController: !!manifestController,
    hasNavigationBroker: !!getPort("navigationBroker"),
    portsStatus: { initialized: portsInitialized },
    usingP18Intents: true,
    abortSignalSupport: true,
    metrics: getMetrics(state)
  };
}
function healthCheck(state, panelLifecycle, stateMachine, telemetry, manifestController, getPort, portsInitialized) {
  const hasPanelLifecycle = !!panelLifecycle;
  const hasStateMachine = !!stateMachine;
  const hasManifestController = !!manifestController;
  const hasBroker = !!getPort("navigationBroker");
  const m = state.metrics;
  const total = m.navigationsCompleted + m.navigationsFailed;
  const failureRate = total > 0 ? m.navigationsFailed / total * 100 : 0;
  const timeoutRate = total > 0 ? m.navigationsTimedOut / total * 100 : 0;
  const blockRate = total > 0 ? m.navigationsBlocked / (total + m.navigationsBlocked) * 100 : 0;
  const cancelRate = total > 0 ? m.navigationsCancelled / total * 100 : 0;
  let status = "HEALTHY";
  if (!hasPanelLifecycle || !hasStateMachine) status = "UNHEALTHY";
  else if (failureRate > 30 || timeoutRate > 10 || state.navigating) status = "DEGRADED";
  return {
    status,
    version: VERSION,
    moduleId: "main-navigation-controller",
    checks: {
      hasPanelLifecycle,
      hasStateMachine,
      hasTelemetry: !!telemetry,
      hasManifestController,
      hasNavigationBroker: hasBroker,
      isNavigating: state.navigating,
      queueSize: state.navigationQueue.length,
      failureRate: `${Math.round(failureRate)}%`,
      timeoutRate: `${Math.round(timeoutRate)}%`,
      blockRate: `${Math.round(blockRate)}%`,
      cancelRate: `${Math.round(cancelRate)}%`,
      avgNavigationTime: `${m.avgNavigationTime}ms`,
      portsInitialized,
      p18IntentsAvailable: true,
      abortSignalSupport: true
    },
    metrics: getMetrics(state)
  };
}
var telemetry_default = {
  getMetrics,
  getNavigationDiagnostics,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  telemetry_default as default,
  getMetrics,
  getNavigationDiagnostics,
  healthCheck,
  info
};
