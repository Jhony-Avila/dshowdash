const VERSION = "2.1.0-AAA-P4";
const MODULE_ID = "action-contracts";
const ACTION_KINDS = Object.freeze({
  NAVIGATION: "navigation",
  SYSTEM: "system",
  UI: "ui",
  EXTERNAL: "external",
  DATA: "data",
  AUTH: "auth"
});
const ACTION_SOURCES = Object.freeze({
  HEADER: "header",
  SIDEBAR: "sidebar",
  FOOTER: "footer",
  NAVRAIL: "navrail",
  PANEL: "panel",
  KEYBOARD: "keyboard",
  API: "api",
  SYSTEM: "system"
});
const CONTRACTS = {
  "navigate": { required: ["target"], optional: ["params", "origin"] },
  "panel:load": { required: ["panelId"], optional: ["options"] },
  "panel:unload": { required: ["panelId"], optional: [] },
  "layout:change": { required: ["layout"], optional: ["animate"] },
  "state:update": { required: ["key", "value"], optional: [] }
};
let _metrics = { validations: 0, failures: 0, normalized: 0 };
function getContract(actionType) {
  return CONTRACTS[actionType] || null;
}
function validate(actionType, payload) {
  _metrics.validations++;
  const contract = CONTRACTS[actionType];
  if (!contract) return { valid: true, warnings: ["no_contract"] };
  const missing = contract.required.filter((key) => !(key in payload));
  if (missing.length > 0) {
    _metrics.failures++;
    return { valid: false, missing };
  }
  return { valid: true };
}
function validateAction(action) {
  _metrics.validations++;
  if (!action) return { valid: false, error: "no_action" };
  if (!action.actionId && !action.type) return { valid: false, error: "no_action_id" };
  return { valid: true, action };
}
function normalizeUIAction(rawAction) {
  _metrics.normalized++;
  const normalized = {
    actionId: rawAction.actionId || rawAction.action || rawAction.type || "unknown",
    kind: rawAction.kind || ACTION_KINDS.UI,
    source: rawAction.source || ACTION_SOURCES.SYSTEM,
    payload: rawAction.payload || rawAction.data || {},
    timestamp: rawAction.timestamp || Date.now(),
    meta: rawAction.meta || {}
  };
  return normalized;
}
function registerContract(actionType, contract) {
  CONTRACTS[actionType] = contract;
}
function getAllContracts() {
  return { ...CONTRACTS };
}
function getMetrics() {
  return { ..._metrics, contractCount: Object.keys(CONTRACTS).length };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { contractCount: Object.keys(CONTRACTS).length, validationFailures: _metrics.failures }, metrics: getMetrics() };
}
var action_contracts_default = { ACTION_KINDS, ACTION_SOURCES, getContract, validate, validateAction, normalizeUIAction, registerContract, getAllContracts, getMetrics, healthCheck, VERSION, MODULE_ID };
export {
  ACTION_KINDS,
  ACTION_SOURCES,
  MODULE_ID,
  VERSION,
  action_contracts_default as default,
  getAllContracts,
  getContract,
  getMetrics,
  healthCheck,
  normalizeUIAction,
  registerContract,
  validate,
  validateAction
};
