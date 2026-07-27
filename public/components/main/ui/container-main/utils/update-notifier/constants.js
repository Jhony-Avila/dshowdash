const VERSION = "1.0.0";
const MODULE_ID = "container-main:update-notifier";
const NOTIFIER_STATES = Object.freeze({
  IDLE: "idle",
  CHECKING: "checking",
  UPDATE_AVAILABLE: "update_available",
  UP_TO_DATE: "up_to_date",
  ERROR: "error"
});
const UPDATE_TYPES = Object.freeze({
  MAJOR: "major",
  MINOR: "minor",
  PATCH: "patch",
  HOTFIX: "hotfix"
});
const DEFAULT_CONFIG = Object.freeze({
  checkInterval: 5 * 60 * 1e3,
  versionEndpoint: "/api/version.json",
  autoCheck: true,
  showNotification: true,
  position: "bottom-right",
  dismissable: true,
  autoReload: false,
  debug: false
});
export {
  DEFAULT_CONFIG,
  MODULE_ID,
  NOTIFIER_STATES,
  UPDATE_TYPES,
  VERSION
};
