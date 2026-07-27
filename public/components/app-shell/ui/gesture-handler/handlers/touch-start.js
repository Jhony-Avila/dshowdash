import { GESTURES } from "../constants.js";
import { touchState, config, isEnabled, incrementMetric } from "../state.js";
import { getDistance, getAngle } from "../helpers/math.js";
import { triggerHandlers } from "../helpers/notify.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.gesture-handler.handlers.touch-start";
function handleTouchStart(event) {
  if (!isEnabled()) return;
  const touches = event.touches;
  touchState.startTime = Date.now();
  touchState.startX = touches[0].clientX;
  touchState.startY = touches[0].clientY;
  touchState.isPanning = false;
  if (touches.length === 2) {
    touchState.isMultiTouch = true;
    touchState.initialDistance = getDistance(touches[0], touches[1]);
    touchState.initialAngle = getAngle(touches[0], touches[1]);
  } else {
    touchState.isMultiTouch = false;
  }
  touchState.longPressTimer = setTimeout(() => {
    const dx = Math.abs(touches[0].clientX - touchState.startX);
    const dy = Math.abs(touches[0].clientY - touchState.startY);
    if (dx < config.tapThreshold && dy < config.tapThreshold) {
      triggerHandlers(GESTURES.LONG_PRESS, {
        x: touchState.startX,
        y: touchState.startY,
        target: event.target,
        originalEvent: event
      });
      incrementMetric("longPresses");
    }
  }, config.longPressDelay);
}
export {
  MODULE_ID,
  VERSION,
  handleTouchStart
};
