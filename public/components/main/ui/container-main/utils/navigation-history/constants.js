const VERSION = "1.0.0";
const MODULE_ID = "container-main:navigation-history";
const NAVIGATION_TYPES = Object.freeze({
  PUSH: "push",
  REPLACE: "replace",
  POP: "pop",
  GO: "go"
});
const DEFAULT_CONFIG = Object.freeze({
  maxHistorySize: 50,
  persistHistory: true,
  useBrowserHistory: false,
  baseUrl: "/app",
  onNavigate: null,
  debug: false
});
export {
  DEFAULT_CONFIG,
  MODULE_ID,
  NAVIGATION_TYPES,
  VERSION
};
