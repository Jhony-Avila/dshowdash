const VERSION = "2.0.1-ENTERPRISE";
const MODULE_ID = "main-diagnostics";
const _metrics = {
  infoCalls: 0,
  healthChecks: 0,
  metricsCalls: 0,
  errors: 0
};
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1e3);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
function buildInfo(state, circuitBreaker) {
  _metrics.infoCalls++;
  const uptime = state.initTimestamp ? Date.now() - state.initTimestamp : 0;
  return {
    version: state.version,
    moduleId: "main",
    initialized: state.initialized,
    uptime,
    uptimeFormatted: formatUptime(uptime),
    engine: state.engine && typeof state.engine.info === "function" ? state.engine.info() : null,
    container: state.containerAdapter && typeof state.containerAdapter.info === "function" ? state.containerAdapter.info() : null,
    actionHub: state.actionHub && typeof state.actionHub.info === "function" ? state.actionHub.info() : null,
    primaryContainer: state.primaryContainer ? { id: state.primaryContainer.id, state: state.primaryContainer.state } : null,
    circuitBreaker: circuitBreaker.getStatus(),
    globalMetrics: Object.assign({}, state.globalMetrics),
    portsCount: Object.keys(state.ports || {}).length,
    adaptersCount: Object.keys(state.adapters || {}).length
  };
}
function buildHealthCheck(state, circuitBreaker) {
  _metrics.healthChecks++;
  if (!state.engine) return { status: "UNHEALTHY", initialized: false, version: state.version };
  const checks = {};
  let unhealthyCount = 0;
  let degradedCount = 0;
  try {
    checks.engine = state.engine.healthCheck();
    if (checks.engine.status === "UNHEALTHY") unhealthyCount++;
    else if (checks.engine.status === "DEGRADED") degradedCount++;
  } catch (e) {
    checks.engine = { status: "ERROR", error: e.message };
    unhealthyCount++;
    _metrics.errors++;
  }
  try {
    checks.containerAdapter = state.containerAdapter && typeof state.containerAdapter.healthCheck === "function" ? state.containerAdapter.healthCheck() : { status: "UNAVAILABLE" };
    if (checks.containerAdapter.status === "UNHEALTHY") unhealthyCount++;
    else if (checks.containerAdapter.status === "DEGRADED") degradedCount++;
  } catch (e) {
    checks.containerAdapter = { status: "ERROR", error: e.message };
    unhealthyCount++;
    _metrics.errors++;
  }
  try {
    checks.actionHub = state.actionHub && typeof state.actionHub.healthCheck === "function" ? state.actionHub.healthCheck() : { status: "UNAVAILABLE" };
    if (checks.actionHub.status === "unhealthy") unhealthyCount++;
    else if (checks.actionHub.status === "degraded") degradedCount++;
  } catch (e) {
    checks.actionHub = { status: "ERROR", error: e.message };
    unhealthyCount++;
    _metrics.errors++;
  }
  try {
    const mco = state.engine && typeof state.engine.getMultiContainerOrchestrator === "function" ? state.engine.getMultiContainerOrchestrator() : null;
    checks.multiContainer = mco && typeof mco.healthCheck === "function" ? mco.healthCheck() : { status: "UNAVAILABLE" };
    if (checks.multiContainer.status === "UNHEALTHY") unhealthyCount++;
    else if (checks.multiContainer.status === "DEGRADED") degradedCount++;
  } catch (e) {
    checks.multiContainer = { status: "ERROR", error: e.message };
  }
  try {
    const mc = state.engine && typeof state.engine.getManifestController === "function" ? state.engine.getManifestController() : null;
    checks.manifest = mc && typeof mc.healthCheck === "function" ? mc.healthCheck() : { status: "UNAVAILABLE" };
  } catch (e) {
    checks.manifest = { status: "ERROR", error: e.message };
  }
  try {
    const lc = state.engine && typeof state.engine.getLayoutController === "function" ? state.engine.getLayoutController() : null;
    checks.layout = lc && typeof lc.healthCheck === "function" ? lc.healthCheck() : { status: "UNAVAILABLE" };
  } catch (e) {
    checks.layout = { status: "ERROR", error: e.message };
  }
  const cbStatus = circuitBreaker.getStatus();
  const cbKeys = Object.keys(cbStatus);
  let openCircuits = 0;
  for (let i = 0; i < cbKeys.length; i++) {
    if (cbStatus[cbKeys[i]].isOpen) openCircuits++;
  }
  checks.circuitBreaker = {
    status: openCircuits === 0 ? "HEALTHY" : "DEGRADED",
    openCircuits,
    details: cbStatus
  };
  if (openCircuits > 0) degradedCount++;
  const adapterChecks = {};
  const adapterNames = ["router", "auth", "telemetry", "container"];
  for (let j = 0; j < adapterNames.length; j++) {
    const name = adapterNames[j];
    try {
      const adapter = state.adapters ? state.adapters[name] : null;
      adapterChecks[name] = adapter && typeof adapter.healthCheck === "function" && adapter.healthCheck().status ? adapter.healthCheck().status : adapter ? "OK" : "MISSING";
    } catch (e) {
      adapterChecks[name] = "ERROR";
    }
  }
  checks.adapters = adapterChecks;
  let overallStatus = "HEALTHY";
  if (unhealthyCount > 0) overallStatus = "UNHEALTHY";
  else if (degradedCount > 0) overallStatus = "DEGRADED";
  const totalChecks = Object.keys(checks).length;
  const healthyChecks = totalChecks - unhealthyCount - degradedCount;
  return {
    status: overallStatus,
    score: `${healthyChecks}/${totalChecks}`,
    initialized: state.initialized,
    version: state.version,
    uptime: state.initTimestamp ? Date.now() - state.initTimestamp : 0,
    checks,
    summary: { healthy: healthyChecks, degraded: degradedCount, unhealthy: unhealthyCount }
  };
}
function buildMetrics(state, circuitBreaker) {
  _metrics.metricsCalls++;
  const metrics = {
    timestamp: Date.now(),
    uptime: state.initTimestamp ? Date.now() - state.initTimestamp : 0,
    global: Object.assign({}, state.globalMetrics),
    circuitBreaker: {
      totalFailures: circuitBreaker.getTotalFailures(),
      openCircuits: circuitBreaker.getOpenCount(),
      trips: state.globalMetrics.circuitBreakerTrips
    },
    subsystems: {},
    adapters: {}
  };
  try {
    const engineState = state.engine && typeof state.engine.getState === "function" ? state.engine.getState() : null;
    metrics.subsystems.engine = {
      currentPanel: engineState ? engineState.currentPanel : null,
      navigating: engineState ? engineState.navigating : false,
      manifestLoaded: engineState ? engineState.manifestLoaded : false
    };
  } catch (e) {
    metrics.subsystems.engine = { error: e.message };
  }
  try {
    metrics.subsystems.container = state.containerAdapter && typeof state.containerAdapter.getMetrics === "function" ? state.containerAdapter.getMetrics() : {};
  } catch (e) {
    metrics.subsystems.container = { error: e.message };
  }
  try {
    metrics.subsystems.actionHub = state.actionHub && typeof state.actionHub.getMetrics === "function" ? state.actionHub.getMetrics() : {};
  } catch (e) {
    metrics.subsystems.actionHub = { error: e.message };
  }
  try {
    const mco = state.engine && typeof state.engine.getMultiContainerOrchestrator === "function" ? state.engine.getMultiContainerOrchestrator() : null;
    metrics.subsystems.multiContainer = mco && typeof mco.getMetrics === "function" ? mco.getMetrics() : {};
  } catch (e) {
    metrics.subsystems.multiContainer = { error: e.message };
  }
  const adapterList = ["router", "auth", "telemetry", "panelLoader"];
  for (let i = 0; i < adapterList.length; i++) {
    const name = adapterList[i];
    try {
      const adapter = state.adapters ? state.adapters[name] : null;
      metrics.adapters[name] = adapter && typeof adapter.getMetrics === "function" ? adapter.getMetrics() : {};
    } catch (e) {
      metrics.adapters[name] = { error: e.message };
    }
  }
  return metrics;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    metrics: getMetrics()
  };
}
function healthCheck() {
  return {
    status: _metrics.errors === 0 ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      infoCalls: _metrics.infoCalls,
      healthChecks: _metrics.healthChecks,
      metricsCalls: _metrics.metricsCalls,
      errors: _metrics.errors
    },
    metrics: getMetrics()
  };
}
var diagnostics_default = {
  formatUptime,
  buildInfo,
  buildHealthCheck,
  buildMetrics,
  getMetrics,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  buildHealthCheck,
  buildInfo,
  buildMetrics,
  diagnostics_default as default,
  formatUptime,
  getMetrics,
  healthCheck,
  info
};
