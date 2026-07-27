const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "overlay-layer-contracts";
const VALID_TYPES = ["modal", "drawer", "dialog", "loading", "toast", "sheet"];
const VALID_SCOPES = ["global", "page", "component"];
function validateOverlayDescriptor(descriptor) {
  const errors = [];
  if (!descriptor) {
    errors.push("descriptor is required");
    return { valid: false, errors };
  }
  if (!descriptor.id) errors.push("id is required");
  if (!descriptor.type) errors.push("type is required");
  else if (!VALID_TYPES.includes(descriptor.type)) errors.push(`invalid type: ${descriptor.type}`);
  if (descriptor.scope && !VALID_SCOPES.includes(descriptor.scope)) errors.push(`invalid scope: ${descriptor.scope}`);
  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, normalized: { id: descriptor.id, type: descriptor.type, scope: descriptor.scope || "global", content: descriptor.content || null, config: descriptor.config || {}, meta: descriptor.meta || {} } };
}
function healthCheck() {
  const checks = { typesValid: VALID_TYPES.length > 0, scopesValid: VALID_SCOPES.length > 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, validTypes: VALID_TYPES, validScopes: VALID_SCOPES, timestamp: Date.now() };
}
var contracts_default = { VALID_TYPES, VALID_SCOPES, validateOverlayDescriptor, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VALID_SCOPES,
  VALID_TYPES,
  VERSION,
  contracts_default as default,
  healthCheck,
  info,
  validateOverlayDescriptor
};
