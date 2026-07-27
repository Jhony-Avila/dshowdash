import { MODULE_ID } from "../constants.js";
import { createLogger } from "/assets/js/core/logger-global/index.js";
import {
  getCurrentMode,
  setCurrentMode,
  setLastModeChange,
  incrementMetric,
  getEventBus
} from "../state.js";
import * as DegradationPolicy from "../../degradation-policy.js";
const VERSION = "1.0.0-ELEVATION";
const _logger = createLogger(MODULE_ID);
function _emit(eventName, data) {
  const eventBus = getEventBus();
  if (eventBus && eventBus.emit) {
    eventBus.emit(eventName, Object.assign({
      source: MODULE_ID,
      timestamp: Date.now()
    }, data || {}));
  }
}
function _log(level, message, data) {
  const context = data ? { data } : {};
  if (level === "error") _logger.error(message, context);
  else if (level === "warn") _logger.warn(message, context);
  else _logger.debug(message, context);
}
function handleModeChange(newMode, previousMode) {
  previousMode = previousMode || getCurrentMode();
  setCurrentMode(newMode);
  setLastModeChange(Date.now());
  incrementMetric("modeChanges");
  _log("info", `Runtime mode changed: ${previousMode} -> ${newMode}`);
  _emit("overlay-kernel.mode-change", {
    newMode,
    previousMode,
    policy: DegradationPolicy.getPolicyForMode(newMode)
  });
  _closeOverlaysForMode(newMode);
  if (newMode === "DEGRADED" || newMode === "MAINTENANCE" || newMode === "FAILED") {
    _emit("overlay-kernel.degradation-active", {
      mode: newMode,
      message: DegradationPolicy.getModeMessage(newMode),
      allowedTypes: DegradationPolicy.getAllowedTypesForMode(newMode)
    });
  }
}
function _closeOverlaysForMode(mode) {
  if (typeof window === "undefined" || !window.OverlayKernel) return;
  const stackResult = window.OverlayKernel.listStack();
  if (!stackResult.ok || stackResult.data.stack.length === 0) return;
  const toClose = DegradationPolicy.getOverlaysToForceClose(mode, stackResult.data.stack);
  for (let i = 0; i < toClose.length; i++) {
    const item = toClose[i];
    _log("info", `Force closing overlay due to mode change: ${item.id}`);
    window.OverlayKernel.close(item.id);
    incrementMetric("degradationEvents");
  }
}
var mode_handler_default = {
  handleModeChange
};
export {
  VERSION,
  mode_handler_default as default,
  handleModeChange
};
