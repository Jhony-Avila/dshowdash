const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "main-engine-constants";
const DEFAULT_PANEL = "panel-home";
const MAX_CONTAINERS = 3;
const CRITICAL_PANELS = Object.freeze(["panel-01", "panel-cards", "panel-10"]);
const ENGINE_STATES = Object.freeze({
  IDLE: "idle",
  INITIALIZING: "initializing",
  READY: "ready",
  NAVIGATING: "navigating",
  LOADING_PANEL: "loading-panel",
  MOUNTING: "mounting",
  UNMOUNTING: "unmounting",
  ERROR: "error",
  RECOVERING: "recovering",
  DESTROYED: "destroyed"
});
const ENGINE_EVENTS = Object.freeze({
  READY: "main:ready",
  DESTROYED: "main:destroyed",
  ERROR: "main:error",
  AUTH_REQUIRED: "main:auth-required",
  NAV_START: "main:navigation:start",
  NAV_END: "main:navigation:end",
  PANEL_LOADED: "main:panel:loaded",
  PANEL_UNMOUNTED: "main:panel:unmounted",
  SECONDARY_OPENING: "main:secondary:opening",
  SECONDARY_OPENED: "main:secondary:opened",
  SECONDARY_CLOSED: "main:secondary:closed",
  LAYOUT_CHANGED: "main:layout:changed"
});
function info() {
  return { moduleId: MODULE_ID, version: VERSION, statesCount: Object.keys(ENGINE_STATES).length, eventsCount: Object.keys(ENGINE_EVENTS).length };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { constantsLoaded: true } };
}
var constants_default = { VERSION, MODULE_ID, DEFAULT_PANEL, MAX_CONTAINERS, CRITICAL_PANELS, ENGINE_STATES, ENGINE_EVENTS, info, healthCheck };
export {
  CRITICAL_PANELS,
  DEFAULT_PANEL,
  ENGINE_EVENTS,
  ENGINE_STATES,
  MAX_CONTAINERS,
  MODULE_ID,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
