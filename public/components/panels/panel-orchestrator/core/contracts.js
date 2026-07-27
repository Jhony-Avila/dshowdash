const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-contracts";
function getVersion() {
  return VERSION;
}
const MODULE_CONTRACT = {
  required: ["id", "name", "type"],
  optional: ["version", "critical", "dependencies", "refreshInterval", "permissions", "featureFlags", "events"],
  lifecycle: ["bootstrap", "init", "hydrate", "render", "update", "destroy"],
  types: ["panel", "card", "widget", "service", "orchestrator"]
};
const PRESET_CONTRACT = {
  required: ["id", "name", "layoutMode", "panels"],
  optional: ["description", "icon", "permissions", "featureFlags", "maxPanels"]
};
const API_POLICY_CONTRACT = {
  defaults: { timeout: 1e4, maxRetries: 3, backoffBase: 1e3, backoffMultiplier: 2, circuitBreakerThreshold: 5, circuitBreakerWindowMs: 6e4, dedupe: true, cache: false, cacheTTL: 6e4 }
};
const HEALTH_CHECK_CONTRACT = {
  interval: 3e4,
  timeout: 5e3,
  thresholds: { degradeAfterErrors: 3, recoverAfterSuccess: 2 }
};
const EVENT_CONTRACT = {
  payload: { _source: "string", _moduleId: "string", _timestamp: "number" },
  required: ["_source", "_timestamp"]
};
const TELEMETRY_CONTRACT = {
  event: { name: "string", namespace: "string", sessionId: "string", data: "object", timestamp: "number" }
};
const SCHEDULER_CONTRACT = {
  modes: ["ACTIVE", "IDLE", "DEGRADED", "PAUSED"],
  task: { id: "string", fn: "function", interval: "number", critical: "boolean", maxRuns: "number|null" }
};
function getContractInfo() {
  return { version: VERSION, moduleId: MODULE_ID, contracts: { MODULE_CONTRACT, PRESET_CONTRACT, API_POLICY_CONTRACT, HEALTH_CHECK_CONTRACT, EVENT_CONTRACT, TELEMETRY_CONTRACT, SCHEDULER_CONTRACT } };
}
var contracts_default = { VERSION, MODULE_ID, getVersion, MODULE_CONTRACT, PRESET_CONTRACT, API_POLICY_CONTRACT, HEALTH_CHECK_CONTRACT, EVENT_CONTRACT, TELEMETRY_CONTRACT, SCHEDULER_CONTRACT, getContractInfo };
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { contractsReady: true } };
}
export {
  API_POLICY_CONTRACT,
  EVENT_CONTRACT,
  HEALTH_CHECK_CONTRACT,
  MODULE_CONTRACT,
  MODULE_ID,
  PRESET_CONTRACT,
  SCHEDULER_CONTRACT,
  TELEMETRY_CONTRACT,
  VERSION,
  contracts_default as default,
  getContractInfo,
  getVersion,
  healthCheck,
  info
};
