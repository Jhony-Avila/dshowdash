import { GESTURES, DIRECTIONS } from "../constants.js";
import { touchState, config, isEnabled, incrementMetric } from "../state.js";
import { getSwipeDirection } from "../helpers/math.js";
import { triggerHandlers } from "../helpers/notify.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.gesture-handler.handlers.touch-end";
function handleTouchEnd(event) {
  if (!isEnabled()) return;
  if (touchState.longPressTimer) {
    clearTimeout(touchState.longPressTimer);
    touchState.longPressTimer = null;
  }
  const changedTouches = event.changedTouches;
  const endX = changedTouches[0].clientX;
  const endY = changedTouches[0].clientY;
  const endTime = Date.now();
  const dx = endX - touchState.startX;
  const dy = endY - touchState.startY;
  const dt = endTime - touchState.startTime;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const velocity = Math.max(absDx, absDy) / dt;
  if ((absDx > config.swipeThreshold || absDy > config.swipeThreshold) && velocity > config.swipeVelocity) {
    const direction = getSwipeDirection(dx, dy);
    let gesture;
    switch (direction) {
      case DIRECTIONS.LEFT:
        gesture = GESTURES.SWIPE_LEFT;
        break;
      case DIRECTIONS.RIGHT:
        gesture = GESTURES.SWIPE_RIGHT;
        break;
      case DIRECTIONS.UP:
        gesture = GESTURES.SWIPE_UP;
        break;
      case DIRECTIONS.DOWN:
        gesture = GESTURES.SWIPE_DOWN;
        break;
    }
    if (gesture) {
      triggerHandlers(gesture, {
        direction,
        distance: Math.max(absDx, absDy),
        velocity,
        startX: touchState.startX,
        startY: touchState.startY,
        endX,
        endY,
        duration: dt,
        originalEvent: event
      });
      incrementMetric("swipes");
    }
  } else if (absDx < config.tapThreshold && absDy < config.tapThreshold && !touchState.isPanning) {
    const now = Date.now();
    const tapDx = Math.abs(endX - touchState.lastTapX);
    const tapDy = Math.abs(endY - touchState.lastTapY);
    if (now - touchState.lastTapTime < config.doubleTapDelay && tapDx < config.tapThreshold * 2 && tapDy < config.tapThreshold * 2) {
      triggerHandlers(GESTURES.DOUBLE_TAP, {
        x: endX,
        y: endY,
        target: event.target,
        originalEvent: event
      });
      touchState.lastTapTime = 0;
    } else {
      touchState.lastTapTime = now;
      touchState.lastTapX = endX;
      touchState.lastTapY = endY;
      setTimeout(() => {
        if (touchState.lastTapTime === now) {
          triggerHandlers(GESTURES.TAP, {
            x: endX,
            y: endY,
            target: event.target,
            originalEvent: event
          });
          incrementMetric("taps");
        }
      }, config.doubleTapDelay);
    }
  }
  touchState.isMultiTouch = false;
  touchState.isPanning = false;
}
export {
  MODULE_ID,
  VERSION,
  handleTouchEnd
};
