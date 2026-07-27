const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell-lazy-loader";
const LOAD_STATES = Object.freeze({
  PENDING: "PENDING",
  LOADING: "LOADING",
  LOADED: "LOADED",
  ERROR: "ERROR"
});
const DEFAULT_CONFIG = Object.freeze({
  timeout: 3e4,
  retryAttempts: 2,
  retryDelay: 1e3,
  preloadOnIdle: true,
  cacheModules: true
});
var constants_default = {
  VERSION,
  MODULE_ID,
  LOAD_STATES,
  DEFAULT_CONFIG
};
export {
  DEFAULT_CONFIG,
  LOAD_STATES,
  MODULE_ID,
  VERSION,
  constants_default as default
};
