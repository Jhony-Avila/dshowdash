const VERSION = "1.0.0-ADAPTIVE";
const MODULE_ID = "container-main:layout-integration";
const INTEGRATION_MODES = Object.freeze({
  FULL: "full",
  PARTIAL: "partial",
  LEGACY: "legacy",
  DISABLED: "disabled"
});
const LAYOUT_EVENTS = Object.freeze({
  RESIZE_START: "layout:resize-start",
  RESIZE_END: "layout:resize-end",
  MOVE_START: "layout:move-start",
  MOVE_END: "layout:move-end",
  DOCK: "layout:dock",
  UNDOCK: "layout:undock",
  FULLSCREEN_ENTER: "layout:fullscreen-enter",
  FULLSCREEN_EXIT: "layout:fullscreen-exit",
  SPLIT: "layout:split",
  UNSPLIT: "layout:unsplit",
  STATE_CHANGE: "layout:state-change"
});
var constants_default = {
  VERSION,
  MODULE_ID,
  INTEGRATION_MODES,
  LAYOUT_EVENTS
};
export {
  INTEGRATION_MODES,
  LAYOUT_EVENTS,
  MODULE_ID,
  VERSION,
  constants_default as default
};
