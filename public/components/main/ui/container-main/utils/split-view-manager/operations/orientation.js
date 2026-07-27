import { SPLIT_ORIENTATIONS } from "../constants.js";
import { getConfig, updateConfig, getContainer, isActive, getCurrentRatio } from "../state.js";
import { _log, _emit } from "../helpers/logger.js";
import { _saveState } from "../helpers/storage.js";
import { _applyRatio } from "../dom/ratio.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.split-view-manager.operations.orientation";
function setOrientation(orientation) {
  if (orientation !== SPLIT_ORIENTATIONS.HORIZONTAL && orientation !== SPLIT_ORIENTATIONS.VERTICAL) {
    _log("error", "Invalid orientation:", orientation);
    return false;
  }
  const config = getConfig();
  if (config.orientation === orientation) return true;
  updateConfig({ orientation });
  if (isActive()) {
    const container = getContainer();
    const wrapper = container.querySelector(".dsd-split-view");
    wrapper.classList.remove("dsd-split-view--horizontal", "dsd-split-view--vertical");
    wrapper.classList.add(`dsd-split-view--${orientation}`);
    _applyRatio(getCurrentRatio());
  }
  _saveState();
  _emit("orientationChanged", { orientation });
  return true;
}
export {
  MODULE_ID,
  VERSION,
  setOrientation
};
