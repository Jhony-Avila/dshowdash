const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-normalization";
function getVersion() {
  return VERSION;
}
function normalizeModuleConfig(config) {
  return {
    id: config.id || "unknown",
    name: config.name || config.id || "Unknown Module",
    version: config.version || "0.0.0",
    type: config.type || "panel",
    critical: config.critical === true,
    dependencies: Array.isArray(config.dependencies) ? config.dependencies : [],
    refreshInterval: typeof config.refreshInterval === "number" ? config.refreshInterval : 6e4,
    permissions: Array.isArray(config.permissions) ? config.permissions : [],
    featureFlags: Array.isArray(config.featureFlags) ? config.featureFlags : [],
    events: Array.isArray(config.events) ? config.events : [],
    metadata: config.metadata || {}
  };
}
function normalizePanelList(panels) {
  if (!Array.isArray(panels)) return [];
  return panels.map((panel, index) => {
    if (typeof panel === "string") {
      return { panelId: panel, title: panel, order: (index + 1) * 10, visible: true, container: "grid-1" };
    }
    const p = panel;
    return {
      panelId: p.panelId || p.id || "unknown",
      title: p.title || p.name || p.panelId,
      order: p.order || (index + 1) * 10,
      visible: p.visible !== false,
      container: p.container || "grid-1",
      config: p.config || {}
    };
  });
}
function normalizeHealthState(state) {
  const validStates = ["OK", "WARN", "ERROR", "DEGRADED", "UNKNOWN"];
  const upperState = String(state).toUpperCase();
  if (validStates.indexOf(upperState) !== -1) return upperState;
  return "UNKNOWN";
}
function normalizeApiResponse(response) {
  return {
    success: response.success === true || response.ok === true,
    data: response.data || response.result || response.body || null,
    error: response.error || response.message || null,
    status: response.status || (response.success ? 200 : 500),
    timestamp: response.timestamp || Date.now(),
    meta: response.meta || {}
  };
}
function normalizeEventPayload(payload, source = "orchestrator") {
  return Object.assign({}, payload, { _source: source, _moduleId: MODULE_ID, _timestamp: Date.now(), _version: VERSION });
}
function normalizeError(error) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack, timestamp: Date.now() };
  }
  return { name: "Error", message: String(error), stack: null, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { normalizationReady: true } };
}
var normalization_default = { VERSION, MODULE_ID, getVersion, normalizeModuleConfig, normalizePanelList, normalizeHealthState, normalizeApiResponse, normalizeEventPayload, normalizeError, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  normalization_default as default,
  getVersion,
  healthCheck,
  info,
  normalizeApiResponse,
  normalizeError,
  normalizeEventPayload,
  normalizeHealthState,
  normalizeModuleConfig,
  normalizePanelList
};
