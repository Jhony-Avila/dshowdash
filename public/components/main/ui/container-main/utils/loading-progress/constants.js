const VERSION = "1.0.0";
const MODULE_ID = "container-main:loading-progress";
const LOADING_STATES = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  COMPLETING: "completing",
  COMPLETE: "complete",
  ERROR: "error"
});
const DEFAULT_CONFIG = Object.freeze({
  minDuration: 200,
  trickleSpeed: 200,
  trickleAmount: 2,
  autoComplete: true,
  autoCompleteDelay: 500,
  showSpinner: true,
  parent: null,
  position: "top",
  color: "var(--cm-color-primary, #8b5cf6)",
  height: 3,
  zIndex: 1e4
});
export {
  DEFAULT_CONFIG,
  LOADING_STATES,
  MODULE_ID,
  VERSION
};
