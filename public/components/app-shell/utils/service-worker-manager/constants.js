const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell-sw-manager";
const SW_STATES = Object.freeze({
  INSTALLING: "installing",
  INSTALLED: "installed",
  ACTIVATING: "activating",
  ACTIVATED: "activated",
  REDUNDANT: "redundant",
  ERROR: "error",
  NOT_SUPPORTED: "not-supported",
  NOT_REGISTERED: "not-registered"
});
const UPDATE_STRATEGIES = Object.freeze({
  IMMEDIATE: "immediate",
  PROMPT: "prompt",
  SILENT: "silent"
});
export {
  MODULE_ID,
  SW_STATES,
  UPDATE_STRATEGIES,
  VERSION
};
