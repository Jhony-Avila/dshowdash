const MODULE_ID = "navrail-contracts";
const VERSION = "5.0.0-FACTORY";
const LOCAL_EVENTS = {
  READY: "navrail:ready",
  DESTROYED: "navrail:destroyed",
  ERROR: "navrail:error",
  ITEM_CLICK: "navrail:item:click",
  GROUP_RENDER: "navrail:group:render",
  TOGGLE_SIDEBAR: "navrail:toggle-sidebar",
  OPEN_PANEL: "navrail:open-panel",
  MODE_DESKTOP: "navrail:mode:desktop",
  MODE_MOBILE: "navrail:mode:mobile"
};
const NAVRAIL_EVENTS = LOCAL_EVENTS;
const ACTION_TYPES = {
  OPEN_PANEL: "openPanel",
  TOGGLE_SIDEBAR: "toggleSidebar",
  NAVIGATE: "navigate",
  EXTERNAL: "external"
};
const DEFAULT_CONFIG = {
  mobileBreakpoint: 500,
  tabletBreakpoint: 1024,
  railWidth: 72,
  itemSize: 48,
  bottomNavHeight: 64
};
function mergeConfig(userConfig = {}) {
  return { ...DEFAULT_CONFIG, ...userConfig };
}
function createEventPayload(type, data = {}) {
  return { type, timestamp: Date.now(), source: "navrail", ...data };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, localEvents: Object.keys(LOCAL_EVENTS).length, actionTypes: Object.keys(ACTION_TYPES).length };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { contractsReady: true } };
}
var contracts_default = { MODULE_ID, VERSION, LOCAL_EVENTS, NAVRAIL_EVENTS, ACTION_TYPES, DEFAULT_CONFIG, mergeConfig, createEventPayload, info, healthCheck };
export {
  ACTION_TYPES,
  DEFAULT_CONFIG,
  LOCAL_EVENTS,
  MODULE_ID,
  NAVRAIL_EVENTS,
  VERSION,
  createEventPayload,
  contracts_default as default,
  healthCheck,
  info,
  mergeConfig
};
