const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-files/state/validators";
function isValidState(state) {
  return state !== null && typeof state === "object";
}
function hasRequiredFields(state, fields) {
  return fields.every((f) => Object.prototype.hasOwnProperty.call(state, f));
}
function isLoading(state) {
  return state?.loading === true;
}
function hasError(state) {
  return !!state?.error;
}
function hasData(state) {
  return state?.data !== null && state?.data !== void 0;
}
function validate(state, rules = {}) {
  const errors = [];
  if (rules.required && !hasRequiredFields(state, rules.required)) errors.push("Missing required fields");
  if (rules.custom) {
    const customError = rules.custom(state);
    if (customError) errors.push(customError);
  }
  return { valid: errors.length === 0, errors };
}
function healthCheck() {
  return { status: "healthy", version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() };
}
var validators_default = { isValidState, hasRequiredFields, isLoading, hasError, hasData, validate, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  validators_default as default,
  hasData,
  hasError,
  hasRequiredFields,
  healthCheck,
  info,
  isLoading,
  isValidState,
  validate
};
