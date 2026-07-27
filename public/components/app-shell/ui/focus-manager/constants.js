const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell-focus-manager";
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]'
].join(", ");
const FOCUS_STRATEGIES = Object.freeze({
  FIRST: "first",
  LAST: "last",
  PREVIOUS: "previous",
  SPECIFIC: "specific",
  RESTORE: "restore"
});
export {
  FOCUSABLE_SELECTOR,
  FOCUS_STRATEGIES,
  MODULE_ID,
  VERSION
};
