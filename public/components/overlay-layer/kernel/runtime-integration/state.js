const VERSION = "3.0.0-ELEVATION";
const MODULE_ID = "overlay-layer.kernel.runtime-integration.state";
const state = {
  initialized: false,
  runtimeContext: null,
  applicationKernel: null,
  eventBus: null,
  permissionsGuard: null,
  healthAggregator: null,
  currentMode: "INITIALIZING",
  lastModeChange: null,
  subscriptions: [],
  metrics: {
    modeChanges: 0,
    healthReports: 0,
    degradationEvents: 0
  }
};
function isInitialized() {
  return state.initialized;
}
function setInitialized(val) {
  state.initialized = !!val;
}
function getRuntimeContext() {
  return state.runtimeContext;
}
function setRuntimeContext(ctx) {
  state.runtimeContext = ctx;
}
function getApplicationKernel() {
  return state.applicationKernel;
}
function setApplicationKernel(kernel) {
  state.applicationKernel = kernel;
}
function getEventBus() {
  return state.eventBus;
}
function setEventBus(bus) {
  state.eventBus = bus;
}
function getPermissionsGuard() {
  return state.permissionsGuard;
}
function setPermissionsGuard(guard) {
  state.permissionsGuard = guard;
}
function getHealthAggregator() {
  return state.healthAggregator;
}
function setHealthAggregator(aggregator) {
  state.healthAggregator = aggregator;
}
function getCurrentMode() {
  return state.currentMode;
}
function setCurrentMode(mode) {
  state.currentMode = mode;
}
function getLastModeChange() {
  return state.lastModeChange;
}
function setLastModeChange(ts) {
  state.lastModeChange = ts;
}
function getSubscriptions() {
  return state.subscriptions;
}
function addSubscription(unsub) {
  state.subscriptions.push(unsub);
}
function clearSubscriptions() {
  state.subscriptions = [];
}
function getMetrics() {
  return Object.assign({}, state.metrics);
}
function incrementMetric(name) {
  if (state.metrics[name] !== void 0) {
    state.metrics[name]++;
  }
}
function resetState() {
  state.initialized = false;
  state.runtimeContext = null;
  state.applicationKernel = null;
  state.eventBus = null;
  state.permissionsGuard = null;
  state.healthAggregator = null;
  state.currentMode = "INITIALIZING";
  state.lastModeChange = null;
  state.subscriptions = [];
}
var state_default = state;
export {
  MODULE_ID,
  VERSION,
  addSubscription,
  clearSubscriptions,
  state_default as default,
  getApplicationKernel,
  getCurrentMode,
  getEventBus,
  getHealthAggregator,
  getLastModeChange,
  getMetrics,
  getPermissionsGuard,
  getRuntimeContext,
  getSubscriptions,
  incrementMetric,
  isInitialized,
  resetState,
  setApplicationKernel,
  setCurrentMode,
  setEventBus,
  setHealthAggregator,
  setInitialized,
  setLastModeChange,
  setPermissionsGuard,
  setRuntimeContext
};
