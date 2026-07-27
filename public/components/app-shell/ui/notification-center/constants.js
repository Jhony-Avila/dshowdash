const VERSION = "1.1.0-FIX-MISSING-EXPORTS";
const MODULE_ID = "app-shell-notification-center";
const NOTIFICATION_TYPES = Object.freeze({
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  LOADING: "loading"
});
const NOTIFICATION_POSITIONS = Object.freeze({
  TOP_RIGHT: "top-right",
  TOP_LEFT: "top-left",
  TOP_CENTER: "top-center",
  BOTTOM_RIGHT: "bottom-right",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_CENTER: "bottom-center"
});
const NOTIFICATION_PRIORITIES = Object.freeze({
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4
});
const DEFAULT_DURATION = 5e3;
const MAX_VISIBLE = 5;
export {
  DEFAULT_DURATION,
  MAX_VISIBLE,
  MODULE_ID,
  NOTIFICATION_POSITIONS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
  VERSION
};
