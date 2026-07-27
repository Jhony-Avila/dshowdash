import { VERSION, MODULE_ID, GESTURES, DIRECTIONS } from "./constants.js";
import { on, off, once, offAll } from "./registration/core.js";
import { addToElement, removeFromElement } from "./registration/element.js";
import { onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, onLongPress, onPinch, onPan } from "./convenience.js";
import { enable, disable, isEnabled, configure, getConfig, subscribe, healthCheck, info, destroy, getMetrics } from "./api.js";
import { config } from "./state.js";
import { handleTouchStart, handleTouchMove, handleTouchEnd } from "./handlers/index.js";
if (typeof document !== "undefined") {
  document.addEventListener("touchstart", handleTouchStart, { passive: !config.preventDefaultSwipe });
  document.addEventListener("touchmove", handleTouchMove, { passive: !config.preventDefaultSwipe });
  document.addEventListener("touchend", handleTouchEnd, { passive: true });
}
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, GESTURES as GESTURES2, DIRECTIONS as DIRECTIONS2 } from "./constants.js";
import { on as on2, off as off2, once as once2, offAll as offAll2 } from "./registration/core.js";
import { addToElement as addToElement2, removeFromElement as removeFromElement2 } from "./registration/element.js";
import { onSwipe as onSwipe2, onSwipeLeft as onSwipeLeft2, onSwipeRight as onSwipeRight2, onSwipeUp as onSwipeUp2, onSwipeDown as onSwipeDown2, onTap as onTap2, onDoubleTap as onDoubleTap2, onLongPress as onLongPress2, onPinch as onPinch2, onPan as onPan2 } from "./convenience.js";
import { enable as enable2, disable as disable2, isEnabled as isEnabled2, configure as configure2, getConfig as getConfig2, subscribe as subscribe2, healthCheck as healthCheck2, info as info2, destroy as destroy2, getMetrics as getMetrics2 } from "./api.js";
var gesture_handler_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  GESTURES: GESTURES2,
  DIRECTIONS: DIRECTIONS2,
  on: on2,
  off: off2,
  once: once2,
  offAll: offAll2,
  addToElement: addToElement2,
  removeFromElement: removeFromElement2,
  onSwipe: onSwipe2,
  onSwipeLeft: onSwipeLeft2,
  onSwipeRight: onSwipeRight2,
  onSwipeUp: onSwipeUp2,
  onSwipeDown: onSwipeDown2,
  onTap: onTap2,
  onDoubleTap: onDoubleTap2,
  onLongPress: onLongPress2,
  onPinch: onPinch2,
  onPan: onPan2,
  enable: enable2,
  disable: disable2,
  isEnabled: isEnabled2,
  configure: configure2,
  getConfig: getConfig2,
  subscribe: subscribe2,
  destroy: destroy2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  DIRECTIONS,
  GESTURES,
  MODULE_ID,
  VERSION,
  addToElement,
  configure,
  gesture_handler_default as default,
  destroy,
  disable,
  enable,
  getConfig,
  getMetrics,
  healthCheck,
  info,
  isEnabled,
  off,
  offAll,
  on,
  onDoubleTap,
  onLongPress,
  onPan,
  onPinch,
  onSwipe,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onTap,
  once,
  removeFromElement,
  subscribe
};
