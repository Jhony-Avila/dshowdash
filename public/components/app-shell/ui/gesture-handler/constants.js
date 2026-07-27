const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell-gesture-handler";
const GESTURES = Object.freeze({
  TAP: "tap",
  DOUBLE_TAP: "doubletap",
  LONG_PRESS: "longpress",
  SWIPE_LEFT: "swipeleft",
  SWIPE_RIGHT: "swiperight",
  SWIPE_UP: "swipeup",
  SWIPE_DOWN: "swipedown",
  PINCH_IN: "pinchin",
  PINCH_OUT: "pinchout",
  ROTATE: "rotate",
  PAN: "pan"
});
const DIRECTIONS = Object.freeze({
  LEFT: "left",
  RIGHT: "right",
  UP: "up",
  DOWN: "down"
});
export {
  DIRECTIONS,
  GESTURES,
  MODULE_ID,
  VERSION
};
