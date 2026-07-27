import { DIRECTIONS } from "../constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.gesture-handler.helpers.math";
function getDistance(touch1, touch2) {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}
function getAngle(touch1, touch2) {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.atan2(dy, dx) * 180 / Math.PI;
}
function getSwipeDirection(dx, dy) {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx > absDy) {
    return dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
  } else {
    return dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
  }
}
export {
  MODULE_ID,
  VERSION,
  getAngle,
  getDistance,
  getSwipeDirection
};
