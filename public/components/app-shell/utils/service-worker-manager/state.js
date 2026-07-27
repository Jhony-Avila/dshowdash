import { SW_STATES, UPDATE_STRATEGIES } from "./constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.service-worker-manager.state";
const _state = {
  supported: false,
  registration: null,
  state: SW_STATES.NOT_REGISTERED,
  updateAvailable: false,
  waitingWorker: null,
  error: null
};
const _config = {
  swPath: "/sw.js",
  scope: "/",
  updateStrategy: UPDATE_STRATEGIES.PROMPT,
  checkInterval: 36e5,
  autoRegister: false
};
function getConfig() {
  return _config;
}
function setConfigValue(key, value) {
  _config[key] = value;
}
const _subscribers = [];
let _checkIntervalId = null;
function getCheckIntervalId() {
  return _checkIntervalId;
}
function setCheckIntervalId(id) {
  _checkIntervalId = id;
}
const _metrics = {
  registrations: 0,
  updates: 0,
  errors: 0,
  messagesSent: 0,
  messagesReceived: 0
};
function incrementMetric(key) {
  if (_metrics.hasOwnProperty(key)) _metrics[key]++;
}
function getMetrics() {
  return {
    registrations: _metrics.registrations,
    updates: _metrics.updates,
    errors: _metrics.errors,
    messagesSent: _metrics.messagesSent,
    messagesReceived: _metrics.messagesReceived
  };
}
export {
  MODULE_ID,
  VERSION,
  _checkIntervalId,
  _config,
  _metrics,
  _state,
  _subscribers,
  getCheckIntervalId,
  getConfig,
  getMetrics,
  incrementMetric,
  setCheckIntervalId,
  setConfigValue
};
