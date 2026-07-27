const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-validators";
function getVersion() {
  return VERSION;
}
function validateModuleContract(config) {
  const errors = [];
  const required = ["id", "name", "type"];
  required.forEach((field) => {
    if (!config[field]) errors.push(`Campo obrigat\xF3rio ausente: ${field}`);
  });
  if (config.id && typeof config.id !== "string") errors.push("id deve ser string");
  if (config.version && !/^\d+\.\d+\.\d+/.test(config.version)) errors.push("version deve seguir semver (x.y.z)");
  if (config.dependencies && !Array.isArray(config.dependencies)) errors.push("dependencies deve ser array");
  if (config.refreshInterval && typeof config.refreshInterval !== "number") errors.push("refreshInterval deve ser n\xFAmero");
  if (config.critical !== void 0 && typeof config.critical !== "boolean") errors.push("critical deve ser boolean");
  const validTypes = ["panel", "card", "widget", "service", "orchestrator"];
  if (config.type && validTypes.indexOf(config.type) === -1) errors.push(`type deve ser um de: ${validTypes.join(", ")}`);
  return { valid: errors.length === 0, errors };
}
function validatePreset(preset) {
  const errors = [];
  if (!preset.id) errors.push("Preset deve ter id");
  if (!preset.name) errors.push("Preset deve ter name");
  if (!preset.layoutMode) errors.push("Preset deve ter layoutMode");
  if (!Array.isArray(preset.panels)) errors.push("Preset deve ter array de panels");
  if (preset.panels && preset.panels.length === 0) errors.push("Preset deve ter pelo menos um painel");
  if (preset.maxPanels && typeof preset.maxPanels !== "number") errors.push("maxPanels deve ser n\xFAmero");
  return { valid: errors.length === 0, errors };
}
function validateApiPolicy(policy) {
  const errors = [];
  if (policy.timeout && typeof policy.timeout !== "number") errors.push("timeout deve ser n\xFAmero");
  if (policy.maxRetries && typeof policy.maxRetries !== "number") errors.push("maxRetries deve ser n\xFAmero");
  if (policy.timeout && policy.timeout < 1e3) errors.push("timeout deve ser >= 1000ms");
  if (policy.maxRetries && (policy.maxRetries < 0 || policy.maxRetries > 10)) errors.push("maxRetries deve estar entre 0 e 10");
  return { valid: errors.length === 0, errors };
}
function validateHealthCheckConfig(config) {
  const errors = [];
  if (config.interval && typeof config.interval !== "number") errors.push("interval deve ser n\xFAmero");
  if (config.timeout && typeof config.timeout !== "number") errors.push("timeout deve ser n\xFAmero");
  if (config.interval && config.interval < 5e3) errors.push("interval m\xEDnimo \xE9 5000ms");
  return { valid: errors.length === 0, errors };
}
function validateEventPayload(payload) {
  const errors = [];
  if (!payload._source) errors.push("Payload deve ter _source");
  if (!payload._timestamp) errors.push("Payload deve ter _timestamp");
  return { valid: errors.length === 0, errors };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { validatorsReady: true } };
}
var validators_default = { VERSION, MODULE_ID, getVersion, validateModuleContract, validatePreset, validateApiPolicy, validateHealthCheckConfig, validateEventPayload, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  validators_default as default,
  getVersion,
  healthCheck,
  info,
  validateApiPolicy,
  validateEventPayload,
  validateHealthCheckConfig,
  validateModuleContract,
  validatePreset
};
