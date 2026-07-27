const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/constants";
const TIMEOUTS = Object.freeze({
  MOUNT_DEFAULT: 5e3,
  MOUNT_CRITICAL: 3e3,
  MOUNT_OPTIONAL: 8e3,
  API_DEFAULT: 6e3,
  API_HEALTH: 5e3,
  API_ALERTS: 1e4,
  FALLBACK_AUTO_HIDE: 8e3,
  FALLBACK_TRANSITION: 300,
  TOOLTIP_SHOW: 250,
  TOOLTIP_HIDE: 150,
  DEBOUNCE_DEFAULT: 300,
  DEBOUNCE_SYNC: 1e3,
  THROTTLE_REFRESH: 5e3,
  CIRCUIT_BREAKER_RESET: 6e4,
  SELF_HEALING_CHECK: 3e4,
  SELF_HEALING_RETRY: 15e3
});
const INTERVALS = Object.freeze({
  HEALTH_POLLING: 18e5,
  ALERTS_POLLING: 2e6,
  NETWORK_QUALITY: 2e6,
  UPTIME_TRACKING: 5e3,
  CACHE_TTL_DEFAULT: 3e5,
  CACHE_TTL_REGISTRY: 3e5,
  CACHE_TTL_PERMISSIONS: 6e5
});
const BACKOFF = Object.freeze({
  DEFAULT: [5e3, 1e4, 2e4, 3e4, 6e4],
  AGGRESSIVE: [1e3, 2e3, 5e3, 1e4, 3e4],
  CONSERVATIVE: [1e4, 3e4, 6e4, 12e4, 3e5],
  JITTER_FACTOR: 0.3
});
const SELECTORS = Object.freeze({
  CONTAINER: "#header-container",
  HEADER: ".header",
  HEADER_LEFT: ".header-left",
  HEADER_CENTER: ".header-center",
  HEADER_RIGHT: ".header-right",
  STATUS_TRAY: ".header-status-tray",
  COMPONENT_WRAPPER: ".header-component-wrapper",
  COMPONENT_FALLBACK: ".header-component-fallback",
  COMPONENT_LOADING: ".header-component-loading",
  FALLBACK: ".header-fallback",
  PANEL_TRIGGER: ".header-panel-trigger",
  USER_MENU: ".header-user-menu",
  LOGO: ".header-logo",
  ENV_CHIP: ".header-env-chip"
});
const DATA_ATTRS = Object.freeze({
  COMPONENT_KEY: "data-component-key",
  COMPONENT_TYPE: "data-component-type",
  COMPONENT_LABEL: "data-component-label",
  COMPONENT_STATUS: "data-status",
  PANEL_TRIGGER: "data-panel-trigger",
  UARPS_TRIGGER: "data-uarps-trigger",
  DRAGGABLE: "data-draggable",
  FALLBACK_TYPE: "data-fallback-type",
  EDIT_INDEX: "data-edit-index"
});
const CRITICALITY = Object.freeze({
  CRITICAL: "critical",
  IMPORTANT: "important",
  OPTIONAL: "optional"
});
const COMPONENT_STATUS = Object.freeze({
  PENDING: "pending",
  LOADING: "loading",
  MOUNTED: "mounted",
  DEGRADED: "degraded",
  FAILED: "failed",
  UNMOUNTED: "unmounted",
  TIMEOUT: "timeout",
  RECOVERING: "recovering"
});
const HEALTH_STATUS = Object.freeze({
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  UNHEALTHY: "UNHEALTHY",
  UNKNOWN: "UNKNOWN"
});
const CIRCUIT_STATE = Object.freeze({
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN"
});
const NETWORK_STATUS = Object.freeze({
  ONLINE: "online",
  OFFLINE: "offline",
  DEGRADED: "degraded",
  POOR: "poor"
});
const NETWORK_QUALITY = Object.freeze({
  EXCELLENT: "excellent",
  GOOD: "good",
  REGULAR: "regular",
  POOR: "poor",
  OFFLINE: "offline"
});
const FALLBACK_TYPE = Object.freeze({
  NETWORK: "network",
  API: "api",
  TIMEOUT: "timeout",
  GENERIC: "generic"
});
const FALLBACK_PRIORITY = Object.freeze({
  api: 1,
  generic: 1,
  network: 2,
  timeout: 3
});
const REGIONS = Object.freeze({
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right"
});
const REGION_MAP = Object.freeze({
  left: "left",
  center: "right",
  right: "right"
});
const COMPONENT_TYPE = Object.freeze({
  BRAND: "brand",
  MENU: "menu",
  ACTION: "action",
  INDICATOR: "indicator",
  INFO: "info",
  PANEL: "panel",
  INTEGRATION: "integration"
});
const CRITICALITY_MAP = Object.freeze({
  brand: CRITICALITY.CRITICAL,
  menu: CRITICALITY.CRITICAL,
  action: CRITICALITY.IMPORTANT,
  indicator: CRITICALITY.IMPORTANT,
  info: CRITICALITY.OPTIONAL,
  panel: CRITICALITY.OPTIONAL,
  integration: CRITICALITY.OPTIONAL
});
const DEFAULT_CAPABILITIES = Object.freeze({
  reorderable: true,
  hideable: true,
  critical: false,
  refreshable: false,
  configurable: false
});
const CONTRACT = Object.freeze({
  REQUIRED_METHODS: ["mount", "unmount"],
  RECOMMENDED_METHODS: ["healthCheck", "info", "destroy"],
  REQUIRED_PROPERTIES: ["VERSION", "id"],
  RECOMMENDED_PROPERTIES: ["MODULE_ID", "capabilities"]
});
const LIMITS = Object.freeze({
  MAX_MOUNT_FAILURES: 3,
  MAX_RETRY_ATTEMPTS: 5,
  MAX_COMPONENTS: 50,
  MAX_HISTORY_SIZE: 50,
  MAX_UNDO_STACK: 20,
  MAX_ERROR_COUNT: 10,
  RTT_SAMPLES: 10
});
const THRESHOLDS = Object.freeze({
  RTT_ONLINE: 120,
  RTT_DEGRADED: 350,
  SUCCESS_RATE_GOOD: 0.7,
  SUCCESS_RATE_DEGRADED: 0.5,
  GOVERNANCE_RATE_GOOD: 0.8,
  DOWNLINK_EXCELLENT: 10,
  DOWNLINK_GOOD: 5,
  DOWNLINK_REGULAR: 1,
  JITTER_EXCELLENT: 10,
  JITTER_GOOD: 30,
  JITTER_REGULAR: 60
});
const ENDPOINTS = Object.freeze({
  HEALTH: "/api/health/status.php",
  ALERTS: "/api/alerts/header-alerts.php",
  COMPONENTS: "/api/ui/header/components",
  PERMISSIONS: "/api/permissions/me",
  ORDER_SAVE: "/api/ui/header/order"
});
const CSS_CLASSES = Object.freeze({
  FALLBACK_VISIBLE: "header-fallback-visible",
  FALLBACK_HIDING: "header-fallback-hiding",
  COMPONENT_WRAPPER: "header-component-wrapper",
  COMPONENT_FALLBACK: "header-component-fallback",
  KEYBOARD_SELECTED: "hie-keyboard-selected",
  ANIMATE_IN: "hie-animate-in",
  POSITION_BADGE: "hie-position-badge"
});
const STORAGE_KEYS = Object.freeze({
  COMPONENT_ORDER: "header:component-order",
  USER_PREFERENCES: "header:user-preferences",
  DEBUG_MODE: "header:debug",
  FEATURE_FLAGS: "header:feature-flags"
});
var constants_default = {
  VERSION,
  MODULE_ID,
  TIMEOUTS,
  INTERVALS,
  BACKOFF,
  SELECTORS,
  DATA_ATTRS,
  CRITICALITY,
  COMPONENT_STATUS,
  HEALTH_STATUS,
  CIRCUIT_STATE,
  NETWORK_STATUS,
  NETWORK_QUALITY,
  FALLBACK_TYPE,
  FALLBACK_PRIORITY,
  REGIONS,
  REGION_MAP,
  COMPONENT_TYPE,
  CRITICALITY_MAP,
  DEFAULT_CAPABILITIES,
  CONTRACT,
  LIMITS,
  THRESHOLDS,
  ENDPOINTS,
  CSS_CLASSES,
  STORAGE_KEYS
};
export {
  BACKOFF,
  CIRCUIT_STATE,
  COMPONENT_STATUS,
  COMPONENT_TYPE,
  CONTRACT,
  CRITICALITY,
  CRITICALITY_MAP,
  CSS_CLASSES,
  DATA_ATTRS,
  DEFAULT_CAPABILITIES,
  ENDPOINTS,
  FALLBACK_PRIORITY,
  FALLBACK_TYPE,
  HEALTH_STATUS,
  INTERVALS,
  LIMITS,
  MODULE_ID,
  NETWORK_QUALITY,
  NETWORK_STATUS,
  REGIONS,
  REGION_MAP,
  SELECTORS,
  STORAGE_KEYS,
  THRESHOLDS,
  TIMEOUTS,
  VERSION,
  constants_default as default
};
