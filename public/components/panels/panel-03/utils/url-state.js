import RouteStateService from "/core/navigation/route-state-service.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-03/utils/url-state";
const PANEL_ID = "panel-03";
const ALLOWED_KEYS = ["type", "status", "rate", "search", "sort", "order", "page", "pageSize"];
function URLState(logger) {
  this.logger = logger;
}
URLState.prototype.read = function() {
  const result = RouteStateService.getState(PANEL_ID);
  if (result && result.ok && result.data && Object.keys(result.data).length > 0) {
    if (this.logger && this.logger.debug) this.logger.debug("url-state.read", { hasFilters: true, source: "RouteStateService" });
    return result.data;
  }
  return null;
};
URLState.prototype.write = function(filters, replace) {
  if (replace === void 0) replace = true;
  const clean = {};
  if (filters) {
    for (let i = 0; i < ALLOWED_KEYS.length; i++) {
      const k = ALLOWED_KEYS[i];
      if (filters[k] !== null && filters[k] !== "" && filters[k] !== void 0) clean[k] = filters[k];
    }
  }
  RouteStateService.setState(PANEL_ID, clean, { replace });
  if (this.logger && this.logger.debug) this.logger.debug("url-state.write", { filters: clean });
};
URLState.prototype.clear = function() {
  RouteStateService.clearState(PANEL_ID);
  if (this.logger && this.logger.debug) this.logger.debug("url-state.cleared");
};
URLState.prototype.sanitize = (value) => String(value).trim().slice(0, 100).replace(/[<>]/g, "");
URLState.prototype.getShareableURL = (filters) => RouteStateService.getShareableURL(PANEL_ID, filters, { allowedKeys: ALLOWED_KEYS });
URLState.prototype.subscribe = (callback) => RouteStateService.subscribe(PANEL_ID, callback);
URLState.prototype.info = function() {
  const current = this.read();
  return { moduleId: MODULE_ID, version: VERSION, hasState: !!current, activeFilters: current ? Object.keys(current).length : 0 };
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
function getVersion() {
  return VERSION;
}
var url_state_default = URLState;
export {
  MODULE_ID,
  URLState,
  VERSION,
  url_state_default as default,
  getVersion,
  healthCheck,
  info
};
