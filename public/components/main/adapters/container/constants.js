const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "container-constants";
const CONTAINER_STATES = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
  RECOVERING: "recovering"
});
const CONTAINER_EVENTS = Object.freeze({
  MOUNT: "container:mount",
  UNMOUNT: "container:unmount",
  READY: "container:ready",
  ERROR: "container:error",
  STATE_CHANGE: "container:state:change"
});
const CONTAINER_CONFIG = Object.freeze({
  MAX_RETRIES: 3,
  RETRY_DELAY: 1e3,
  LOAD_TIMEOUT: 1e4
});
const STATE = Object.freeze({
  IDLE: "idle",
  CREATING: "creating",
  READY: "ready",
  ACTIVE: "active",
  INACTIVE: "inactive",
  LOADING: "loading",
  COLLAPSED: "collapsed",
  ERROR: "error",
  DESTROYING: "destroying",
  DESTROYED: "destroyed",
  DEGRADED: "degraded"
});
const POLICY = Object.freeze({
  EPHEMERAL: "ephemeral",
  PERSISTENT: "persistent"
});
const DOCK_SLOTS = Object.freeze({
  PRIMARY: "primary",
  SECONDARY: "secondary",
  TERTIARY: "tertiary"
});
const LAYOUT_MODE = Object.freeze({
  INHERIT: "inherit",
  OVERRIDE: "override"
});
const BUDGET = Object.freeze({
  MAX_CONTAINERS: 10,
  MAX_OPS_PER_CYCLE: 50,
  ORPHAN_THRESHOLD: 3
});
const ENTERPRISE_DEFAULTS = Object.freeze({
  // Features habilitadas por padrão no enterprise
  showControls: true,
  collapsible: true,
  closable: false,
  fullscreenable: true,
  contextMenuEnabled: true,
  keyboardEnabled: true,
  statePersistenceEnabled: true,
  progressEnabled: true,
  toastEnabled: true,
  accessibilityEnabled: true,
  errorBoundaryEnabled: true,
  eventHooksEnabled: true,
  // Features opcionais (desabilitadas por padrão)
  breadcrumbEnabled: false,
  toolbarEnabled: false,
  searchEnabled: false,
  tabsEnabled: false,
  splitViewEnabled: false,
  zoomEnabled: false,
  debugEnabled: false,
  metricsEnabled: false,
  performanceEnabled: false,
  draggable: false,
  resizable: false,
  snapEnabled: false,
  multiWindowEnabled: false,
  notificationBadgeEnabled: false,
  pluginSystemEnabled: false
});
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      constantsAvailable: [
        "CONTAINER_STATES",
        "CONTAINER_EVENTS",
        "CONTAINER_CONFIG",
        "STATE",
        "POLICY",
        "DOCK_SLOTS",
        "LAYOUT_MODE",
        "BUDGET",
        "ENTERPRISE_DEFAULTS"
      ]
    }
  };
}
var constants_default = {
  CONTAINER_STATES,
  CONTAINER_EVENTS,
  CONTAINER_CONFIG,
  STATE,
  POLICY,
  DOCK_SLOTS,
  LAYOUT_MODE,
  BUDGET,
  ENTERPRISE_DEFAULTS,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  BUDGET,
  CONTAINER_CONFIG,
  CONTAINER_EVENTS,
  CONTAINER_STATES,
  DOCK_SLOTS,
  ENTERPRISE_DEFAULTS,
  LAYOUT_MODE,
  MODULE_ID,
  POLICY,
  STATE,
  VERSION,
  constants_default as default,
  healthCheck
};
