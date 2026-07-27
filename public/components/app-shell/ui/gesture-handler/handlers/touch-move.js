import { GESTURES } from "../constants.js";
import { touchState, config, isEnabled, incrementMetric } from "../state.js";
import { getDistance, getAngle } from "../helpers/math.js";
import { triggerHandlers } from "../helpers/notify.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.gesture-handler.handlers.touch-move";
function handleTouchMove(event) {
  if (!isEnabled()) return;
  const touches = event.touches;
  if (touchState.longPressTimer) {
    const dx = Math.abs(touches[0].clientX - touchState.startX);
    const dy = Math.abs(touches[0].clientY - touchState.startY);
    if (dx > config.tapThreshold || dy > config.tapThreshold) {
      clearTimeout(touchState.longPressTimer);
      touchState.longPressTimer = null;
    }
  }
  if (touchState.isMultiTouch && touches.length === 2) {
    const currentDistance = getDistance(touches[0], touches[1]);
    const currentAngle = getAngle(touches[0], touches[1]);
    const scale = currentDistance / touchState.initialDistance;
    if (Math.abs(scale - 1) > config.pinchThreshold) {
      const gesture = scale > 1 ? GESTURES.PINCH_OUT : GESTURES.PINCH_IN;
      triggerHandlers(gesture, {
        scale,
        center: {
          x: (touches[0].clientX + touches[1].clientX) / 2,
          y: (touches[0].clientY + touches[1].clientY) / 2
        },
        originalEvent: event
      });
      incrementMetric("pinches");
    }
    const angleDiff = currentAngle - touchState.initialAngle;
    if (Math.abs(angleDiff) > config.rotateThreshold) {
      triggerHandlers(GESTURES.ROTATE, {
        angle: angleDiff,
        center: {
          x: (touches[0].clientX + touches[1].clientX) / 2,
          y: (touches[0].clientY + touches[1].clientY) / 2
        },
        originalEvent: event
      });
    }
    if (config.preventDefaultSwipe) {
      event.preventDefault();
    }
  }
  if (touches.length === 1 && !touchState.isMultiTouch) {
    const panDx = touches[0].clientX - touchState.startX;
    const panDy = touches[0].clientY - touchState.startY;
    if (Math.abs(panDx) > config.tapThreshold || Math.abs(panDy) > config.tapThreshold) {
      touchState.isPanning = true;
      triggerHandlers(GESTURES.PAN, {
        deltaX: panDx,
        deltaY: panDy,
        x: touches[0].clientX,
        y: touches[0].clientY,
        originalEvent: event
      });
    }
  }
}
export {
  MODULE_ID,
  VERSION,
  handleTouchMove
};
