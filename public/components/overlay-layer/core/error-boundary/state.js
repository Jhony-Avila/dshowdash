import { DEFAULT_CONFIG } from "./constants.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.error-boundary.state";
let config = { ...DEFAULT_CONFIG };
let errors = [];
let errorHandlers = [];
let recoveryStrategies = {};
const state = {
  totalErrors: 0,
  recoveredErrors: 0,
  fatalErrors: 0,
  lastError: null
};
let logger = null;
let metricsCollector = null;
function setLogger(l) {
  logger = l;
}
function setMetricsCollector(m) {
  metricsCollector = m;
}
function getConfig() {
  return config;
}
function setConfig(c) {
  config = c;
}
function getErrors() {
  return errors;
}
function setErrors(e) {
  errors = e;
}
function getErrorHandlers() {
  return errorHandlers;
}
function setErrorHandlers(h) {
  errorHandlers = h;
}
function getRecoveryStrategies() {
  return recoveryStrategies;
}
export {
  MODULE_ID,
  VERSION,
  config,
  errorHandlers,
  errors,
  getConfig,
  getErrorHandlers,
  getErrors,
  getRecoveryStrategies,
  logger,
  metricsCollector,
  recoveryStrategies,
  setConfig,
  setErrorHandlers,
  setErrors,
  setLogger,
  setMetricsCollector,
  state
};
