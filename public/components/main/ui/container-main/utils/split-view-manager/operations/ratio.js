import { getCurrentRatio } from "../state.js";
import { _log, _emit } from "../helpers/logger.js";
import { _saveState } from "../helpers/storage.js";
import { _applyRatio } from "../dom/ratio.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.split-view-manager.operations.ratio";
function setRatio(ratio) {
  if (ratio < 0 || ratio > 1) {
    _log("error", "Ratio must be between 0 and 1");
    return false;
  }
  _applyRatio(ratio);
  _saveState();
  _emit("ratioChanged", { ratio: getCurrentRatio() });
  return true;
}
export {
  MODULE_ID,
  VERSION,
  setRatio
};
