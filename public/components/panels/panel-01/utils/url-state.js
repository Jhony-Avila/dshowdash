import RouteStateService from "/core/navigation/route-state-service.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/url-state";
const PANEL_ID = "panel-01";
const ALLOWED_KEYS = ["situacao", "centro", "q", "dataInicio", "dataFim", "page", "sort", "order"];
function getState() {
  const result = RouteStateService.getState(PANEL_ID);
  if (result && result.ok && result.data) {
    const state = {};
    for (let i = 0; i < ALLOWED_KEYS.length; i++) {
      const k = ALLOWED_KEYS[i];
      if (result.data[k] !== void 0) state[k] = result.data[k];
    }
    if (state.page) state.page = parseInt(String(state.page)) || 1;
    if (state.sort) {
      state.sortField = state.sort;
      delete state.sort;
    }
    return Object.keys(state).length > 0 ? state : {};
  }
  return {};
}
function setState(state, replace) {
  if (replace === void 0) replace = true;
  const patch = {};
  if (state) {
    for (const k in state) {
      if (state.hasOwnProperty(k) && state[k] !== null && state[k] !== void 0 && state[k] !== "") {
        patch[k] = state[k];
      }
    }
    if (state.sortField) {
      patch.sort = state.sortField;
      delete patch.sortField;
    }
  }
  RouteStateService.setState(PANEL_ID, patch, { replace });
}
function clearState() {
  RouteStateService.clearState(PANEL_ID);
}
function onPopState(callback) {
  return RouteStateService.subscribe(PANEL_ID, callback);
}
function getShareableURL(filters) {
  return RouteStateService.getShareableURL(PANEL_ID, filters, { allowedKeys: ALLOWED_KEYS });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
function getVersion() {
  return VERSION;
}
var url_state_default = { getState, setState, clearState, onPopState, getShareableURL, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearState,
  url_state_default as default,
  getShareableURL,
  getState,
  getVersion,
  healthCheck,
  info,
  onPopState,
  setState
};
