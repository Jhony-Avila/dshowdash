const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.gesture-handler.handlers";
import { handleTouchStart } from "./touch-start.js";
import { handleTouchMove } from "./touch-move.js";
import { handleTouchEnd } from "./touch-end.js";
export {
  MODULE_ID,
  VERSION,
  handleTouchEnd,
  handleTouchMove,
  handleTouchStart
};
