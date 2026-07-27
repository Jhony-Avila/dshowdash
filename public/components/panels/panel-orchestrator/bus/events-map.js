import { AUTH_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-events-map";
const ORCHESTRATOR_EVENTS = {
  INIT: "orchestrator:init",
  READY: "orchestrator:ready",
  DESTROYED: "orchestrator:destroyed",
  PRESET_APPLIED: "orchestrator:preset:applied",
  PRESET_FAILED: "orchestrator:preset:failed",
  LAYOUT_CHANGED: "orchestrator:layout:changed",
  LAYOUT_RESET: "orchestrator:layout:reset",
  MODULE_REGISTERED: "orchestrator:module:registered",
  MODULE_UNREGISTERED: "orchestrator:module:unregistered",
  MODULE_MOUNTED: "orchestrator:module:mounted",
  MODULE_UNMOUNTED: "orchestrator:module:unmounted",
  MODULE_FAILED: "orchestrator:module:failed",
  MODULE_RECOVERED: "orchestrator:module:recovered",
  MODULE_DEGRADED: "orchestrator:module:degraded",
  SCHEDULER_MODE_CHANGED: "orchestrator:scheduler:mode",
  SCHEDULER_TICK: "orchestrator:scheduler:tick",
  HEALTH_CHECK: "orchestrator:health:check",
  HEALTH_DEGRADED: "orchestrator:health:degraded",
  HEALTH_RECOVERED: "orchestrator:health:recovered",
  API_REQUEST: "orchestrator:api:request",
  API_SUCCESS: "orchestrator:api:success",
  API_FAILED: "orchestrator:api:failed",
  API_CIRCUIT_OPEN: "orchestrator:api:circuit:open",
  API_CIRCUIT_CLOSED: "orchestrator:api:circuit:closed",
  STATE_CHANGED: "orchestrator:state:changed",
  ERROR: "orchestrator:error",
  WARNING: "orchestrator:warning"
};
const EXTERNAL_EVENTS = {
  ROUTER_ROUTE_CHANGED: "router:route-changed",
  AUTH_LOGIN_SUCCESS: AUTH_EVENTS.LOGIN_SUCCESS,
  AUTH_LOGIN_REQUIRED: AUTH_EVENTS.LOGIN_REQUIRED,
  AUTH_LOGOUT: AUTH_EVENTS.LOGOUT,
  AUTH_LOGOUT_SUCCESS: AUTH_EVENTS.LOGOUT_SUCCESS,
  AUTH_SESSION_CHECKED: AUTH_EVENTS.SESSION_CHECKED,
  AUTH_READY: AUTH_EVENTS.READY,
  COMPONENTS_READY: "components:ready",
  PANEL_FILTERS_UPDATED: "panel:filters:updated",
  MAIN_NAVIGATE: "main:navigate",
  MAIN_CANVAS_SET: "main:canvas:set"
};
const MODULE_LIFECYCLE = { BOOTSTRAP: "bootstrap", INIT: "init", HYDRATE: "hydrate", RENDER: "render", UPDATE: "update", DESTROY: "destroy" };
const SCHEDULER_MODES = { ACTIVE: "ACTIVE", IDLE: "IDLE", DEGRADED: "DEGRADED", PAUSED: "PAUSED" };
const HEALTH_STATES = { OK: "OK", WARN: "WARN", ERROR: "ERROR", DEGRADED: "DEGRADED", UNKNOWN: "UNKNOWN" };
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { eventsMapReady: true } };
}
export {
  AUTH_EVENTS,
  EXTERNAL_EVENTS,
  HEALTH_STATES,
  MODULE_ID,
  MODULE_LIFECYCLE,
  ORCHESTRATOR_EVENTS,
  SCHEDULER_MODES,
  VERSION,
  healthCheck,
  info
};
