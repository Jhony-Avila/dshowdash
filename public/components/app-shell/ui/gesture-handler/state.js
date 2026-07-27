const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.gesture-handler.state";
const handlers = /* @__PURE__ */ new Map();
const elementHandlers = /* @__PURE__ */ new Map();
let enabled = true;
const subscribers = [];
function setEnabled(val) {
  enabled = val;
}
function isEnabled() {
  return enabled;
}
const touchState = {
  startX: 0,
  startY: 0,
  startTime: 0,
  lastTapTime: 0,
  lastTapX: 0,
  lastTapY: 0,
  isMultiTouch: false,
  initialDistance: 0,
  initialAngle: 0,
  longPressTimer: null,
  isPanning: false
};
const config = {
  swipeThreshold: 50,
  swipeVelocity: 0.3,
  tapThreshold: 10,
  doubleTapDelay: 300,
  longPressDelay: 500,
  pinchThreshold: 0.1,
  rotateThreshold: 15,
  preventDefaultSwipe: true,
  passive: false
};
const metrics = {
  gesturesDetected: 0,
  swipes: 0,
  taps: 0,
  longPresses: 0,
  pinches: 0
};
function incrementMetric(key) {
  if (metrics.hasOwnProperty(key)) metrics[key]++;
}
function getMetrics() {
  return {
    gesturesDetected: metrics.gesturesDetected,
    swipes: metrics.swipes,
    taps: metrics.taps,
    longPresses: metrics.longPresses,
    pinches: metrics.pinches,
    activeHandlers: handlers.size,
    elementHandlers: elementHandlers.size
  };
}
export {
  MODULE_ID,
  VERSION,
  config,
  elementHandlers,
  enabled,
  getMetrics,
  handlers,
  incrementMetric,
  isEnabled,
  metrics,
  setEnabled,
  subscribers,
  touchState
};
