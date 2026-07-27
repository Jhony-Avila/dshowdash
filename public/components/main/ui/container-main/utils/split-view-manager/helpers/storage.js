import { STORAGE_KEY } from "../constants.js";
import { getConfig, isActive, getCurrentRatio, getCollapsedPanel } from "../state.js";
import { _log } from "./logger.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.split-view-manager.helpers.storage";
function _saveState() {
  const config = getConfig();
  if (!config.persistState) return;
  try {
    const state = {
      isActive: isActive(),
      orientation: config.orientation,
      ratio: getCurrentRatio(),
      collapsedPanel: getCollapsedPanel()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    _log("warn", "Failed to save state:", e.message);
  }
}
function _loadState() {
  const config = getConfig();
  if (!config.persistState) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
export {
  MODULE_ID,
  VERSION,
  _loadState,
  _saveState
};
