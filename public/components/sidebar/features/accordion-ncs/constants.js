import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "3.4.0-ES6";
const MODULE_ID = "sidebar-feature-accordion-ncs";
const FEATURE_FLAG_KEY = "sidebar.accordion.ncs.enabled";
const CONTAINER_ID = "sidebar-accordion-root";
const UARPS_REGION = "region:app:accordion-ncs";
const _ports = createUiPorts({ moduleId: MODULE_ID });
function initPorts() {
  _ports.init();
}
function getPort(name) {
  return _ports.get(name);
}
function injectPorts(p) {
  return _ports.inject(p);
}
function getPorts() {
  return _ports.snapshot();
}
function isPortsInitialized() {
  return _ports.isInitialized();
}
function log(level, msg, data) {
  const logger = getPort("logger");
  if (logger && logger[level]) {
    logger[level](`[${MODULE_ID}] ${msg}`, data || "");
  }
}
const state = {
  initialized: false,
  enabled: false,
  accordion: null,
  container: null,
  eventBus: null,
  modelLoaderReady: false,
  cleanups: []
};
function resetState() {
  state.initialized = false;
  state.enabled = false;
  state.accordion = null;
  state.container = null;
  state.eventBus = null;
  state.modelLoaderReady = false;
  state.cleanups = [];
}
var constants_default = {
  VERSION,
  MODULE_ID,
  FEATURE_FLAG_KEY,
  CONTAINER_ID,
  UARPS_REGION,
  state,
  resetState,
  initPorts,
  getPort,
  injectPorts,
  getPorts,
  isPortsInitialized,
  log
};
export {
  CONTAINER_ID,
  FEATURE_FLAG_KEY,
  MODULE_ID,
  UARPS_REGION,
  VERSION,
  constants_default as default,
  getPort,
  getPorts,
  initPorts,
  injectPorts,
  isPortsInitialized,
  log,
  resetState,
  state
};
