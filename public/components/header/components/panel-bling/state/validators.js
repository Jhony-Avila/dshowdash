import { VERSION } from "/core/version.js";
const MODULE_ID = "header/components/panel-bling/state/validators";
const _metrics = { validations: 0, passes: 0, failures: 0 };
function isRequired(value) {
  _metrics.validations++;
  const pass = value != null && value !== "";
  pass ? _metrics.passes++ : _metrics.failures++;
  return pass;
}
function isString(value) {
  _metrics.validations++;
  const pass = typeof value === "string";
  pass ? _metrics.passes++ : _metrics.failures++;
  return pass;
}
function isNumber(value) {
  _metrics.validations++;
  const pass = typeof value === "number" && !isNaN(value);
  pass ? _metrics.passes++ : _metrics.failures++;
  return pass;
}
function isBoolean(value) {
  _metrics.validations++;
  const pass = typeof value === "boolean";
  pass ? _metrics.passes++ : _metrics.failures++;
  return pass;
}
function isArray(value) {
  _metrics.validations++;
  const pass = Array.isArray(value);
  pass ? _metrics.passes++ : _metrics.failures++;
  return pass;
}
function isObject(value) {
  _metrics.validations++;
  const pass = value !== null && typeof value === "object" && !Array.isArray(value);
  pass ? _metrics.passes++ : _metrics.failures++;
  return pass;
}
function minLength(value, min) {
  _metrics.validations++;
  const pass = value && value.length >= min;
  pass ? _metrics.passes++ : _metrics.failures++;
  return pass;
}
function maxLength(value, max) {
  _metrics.validations++;
  const pass = value && value.length <= max;
  pass ? _metrics.passes++ : _metrics.failures++;
  return pass;
}
function inRange(value, min, max) {
  _metrics.validations++;
  const pass = value >= min && value <= max;
  pass ? _metrics.passes++ : _metrics.failures++;
  return pass;
}
function matches(value, regex) {
  _metrics.validations++;
  const pass = regex.test(value);
  pass ? _metrics.passes++ : _metrics.failures++;
  return pass;
}
function isEmail(value) {
  return matches(value, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
}
function isUrl(value) {
  try {
    new URL(value);
    _metrics.validations++;
    _metrics.passes++;
    return true;
  } catch {
    _metrics.validations++;
    _metrics.failures++;
    return false;
  }
}
function validate(value, rules = []) {
  const errors = [];
  rules.forEach((rule) => {
    if (!rule.validator(value)) errors.push(rule.message || "Validation failed");
  });
  return { valid: errors.length === 0, errors };
}
function getMetrics() {
  return { ..._metrics };
}
function resetMetrics() {
  _metrics.validations = 0;
  _metrics.passes = 0;
  _metrics.failures = 0;
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { ready: true }, metrics: getMetrics() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics() };
}
var validators_default = { isRequired, isString, isNumber, isBoolean, isArray, isObject, minLength, maxLength, inRange, matches, isEmail, isUrl, validate };
export {
  MODULE_ID,
  VERSION,
  validators_default as default,
  getMetrics,
  healthCheck,
  inRange,
  info,
  isArray,
  isBoolean,
  isEmail,
  isNumber,
  isObject,
  isRequired,
  isString,
  isUrl,
  matches,
  maxLength,
  minLength,
  resetMetrics,
  validate
};
