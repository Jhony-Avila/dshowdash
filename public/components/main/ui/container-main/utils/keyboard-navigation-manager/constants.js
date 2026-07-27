const VERSION = "1.0.0";
const MODULE_ID = "container-main:keyboard-navigation";
const KEY_CODES = Object.freeze({
  TAB: "Tab",
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown"
});
const NAVIGATION_MODES = Object.freeze({
  LINEAR: "linear",
  ROVING: "roving",
  GRID: "grid",
  MENU: "menu"
});
const FOCUS_WRAP = Object.freeze({
  NONE: "none",
  WRAP: "wrap",
  STOP: "stop"
});
const DEFAULT_CONFIG = Object.freeze({
  mode: NAVIGATION_MODES.LINEAR,
  wrapBehavior: FOCUS_WRAP.WRAP,
  enableArrowNavigation: true,
  enableHomeEnd: true,
  enableTypeahead: true,
  typeaheadTimeout: 500,
  orientation: "horizontal",
  announceNavigation: true,
  persistFocusPosition: true
});
const STORAGE_KEY = "dsd:container-main:keyboard-nav";
export {
  DEFAULT_CONFIG,
  FOCUS_WRAP,
  KEY_CODES,
  MODULE_ID,
  NAVIGATION_MODES,
  STORAGE_KEY,
  VERSION
};
