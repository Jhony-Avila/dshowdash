const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer-focus-manager";
const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  "audio[controls]",
  "video[controls]",
  "details > summary"
].join(", ");
const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  autoFocusFirst: true,
  trapFocus: true,
  restoreFocus: true,
  focusDelay: 50,
  scrollIntoView: true,
  historyLimit: 10
});
var constants_default = {
  VERSION,
  MODULE_ID,
  FOCUSABLE_SELECTORS,
  DEFAULT_CONFIG
};
export {
  DEFAULT_CONFIG,
  FOCUSABLE_SELECTORS,
  MODULE_ID,
  VERSION,
  constants_default as default
};
