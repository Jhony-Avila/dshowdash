import { GESTURES } from "./constants.js";
import { on } from "./registration/core.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.gesture-handler.convenience";
function onSwipe(handler) {
  const unsubs = [
    on(GESTURES.SWIPE_LEFT, handler),
    on(GESTURES.SWIPE_RIGHT, handler),
    on(GESTURES.SWIPE_UP, handler),
    on(GESTURES.SWIPE_DOWN, handler)
  ];
  return function unsubscribeSwipe() {
    unsubs.forEach((u) => {
      u();
    });
  };
}
function onSwipeLeft(handler) {
  return on(GESTURES.SWIPE_LEFT, handler);
}
function onSwipeRight(handler) {
  return on(GESTURES.SWIPE_RIGHT, handler);
}
function onSwipeUp(handler) {
  return on(GESTURES.SWIPE_UP, handler);
}
function onSwipeDown(handler) {
  return on(GESTURES.SWIPE_DOWN, handler);
}
function onTap(handler) {
  return on(GESTURES.TAP, handler);
}
function onDoubleTap(handler) {
  return on(GESTURES.DOUBLE_TAP, handler);
}
function onLongPress(handler) {
  return on(GESTURES.LONG_PRESS, handler);
}
function onPinch(handler) {
  const unsubs = [
    on(GESTURES.PINCH_IN, handler),
    on(GESTURES.PINCH_OUT, handler)
  ];
  return function unsubscribePinch() {
    unsubs.forEach((u) => {
      u();
    });
  };
}
function onPan(handler) {
  return on(GESTURES.PAN, handler);
}
export {
  MODULE_ID,
  VERSION,
  onDoubleTap,
  onLongPress,
  onPan,
  onPinch,
  onSwipe,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onTap
};
