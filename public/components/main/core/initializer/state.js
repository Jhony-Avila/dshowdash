const VERSION = "5.8.0-P2-ENTERPRISE";
const MODULE_ID = "main.core.initializer.state";
const _metrics = {
  initializations: 0,
  bootstraps: 0,
  errors: 0,
  lastInitTime: 0,
  avgInitTime: 0,
  totalInitTime: 0,
  panelHomeLoads: 0,
  panelHomeErrors: 0
};
let _panelHomeInstance = null;
function getMetrics() {
  return {
    initializations: _metrics.initializations,
    bootstraps: _metrics.bootstraps,
    errors: _metrics.errors,
    lastInitTime: _metrics.lastInitTime,
    avgInitTime: _metrics.avgInitTime,
    totalInitTime: _metrics.totalInitTime,
    panelHomeLoads: _metrics.panelHomeLoads,
    panelHomeErrors: _metrics.panelHomeErrors
  };
}
function incrementInitializations() {
  _metrics.initializations++;
}
function incrementBootstraps() {
  _metrics.bootstraps++;
}
function incrementErrors() {
  _metrics.errors++;
}
function incrementPanelHomeLoads() {
  _metrics.panelHomeLoads++;
}
function incrementPanelHomeErrors() {
  _metrics.panelHomeErrors++;
}
function updateInitTime(initTime) {
  _metrics.lastInitTime = initTime;
  _metrics.totalInitTime += initTime;
  _metrics.avgInitTime = Math.round(_metrics.totalInitTime / _metrics.initializations);
}
function getInitializationsCount() {
  return _metrics.initializations;
}
function getErrorsCount() {
  return _metrics.errors;
}
function getPanelHomeInstance() {
  return _panelHomeInstance;
}
function setPanelHomeInstance(instance) {
  _panelHomeInstance = instance;
}
function clearPanelHomeInstance() {
  _panelHomeInstance = null;
}
function isPanelHomeMounted() {
  return _panelHomeInstance !== null;
}
var state_default = {
  getMetrics,
  incrementInitializations,
  incrementBootstraps,
  incrementErrors,
  incrementPanelHomeLoads,
  incrementPanelHomeErrors,
  updateInitTime,
  getInitializationsCount,
  getErrorsCount,
  getPanelHomeInstance,
  setPanelHomeInstance,
  clearPanelHomeInstance,
  isPanelHomeMounted
};
export {
  MODULE_ID,
  VERSION,
  clearPanelHomeInstance,
  state_default as default,
  getErrorsCount,
  getInitializationsCount,
  getMetrics,
  getPanelHomeInstance,
  incrementBootstraps,
  incrementErrors,
  incrementInitializations,
  incrementPanelHomeErrors,
  incrementPanelHomeLoads,
  isPanelHomeMounted,
  setPanelHomeInstance,
  updateInitTime
};
