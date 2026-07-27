import { getConfig, setContainer, isActive, setIsActive, getCurrentRatio, incrementMetric } from "../state.js";
import { _log, _emit } from "../helpers/logger.js";
import { _saveState } from "../helpers/storage.js";
import { _createDOM, _destroyDOM } from "../dom/builder.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.split-view-manager.operations.lifecycle";
function activate(container) {
  if (isActive()) {
    _log("warn", "Split view already active");
    return false;
  }
  const resolvedContainer = typeof container === "string" ? document.querySelector(container) : container;
  if (!resolvedContainer) {
    _log("error", "Container not found");
    incrementMetric("errors");
    return false;
  }
  setContainer(resolvedContainer);
  _createDOM();
  setIsActive(true);
  incrementMetric("activations");
  _saveState();
  const config = getConfig();
  _emit("activated", { orientation: config.orientation, ratio: getCurrentRatio() });
  _log("debug", "Split view activated");
  return true;
}
function deactivate() {
  if (!isActive()) return false;
  _destroyDOM();
  setIsActive(false);
  _saveState();
  _emit("deactivated", {});
  _log("debug", "Split view deactivated");
  return true;
}
function toggle(container) {
  return isActive() ? deactivate() : activate(container);
}
export {
  MODULE_ID,
  VERSION,
  activate,
  deactivate,
  toggle
};
