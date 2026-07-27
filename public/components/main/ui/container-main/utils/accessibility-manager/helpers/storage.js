import { STORAGE_KEY } from "../constants.js";
import { getConfig, getUserPreferences } from "../state.js";
import { _log } from "./logger.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.accessibility-manager.helpers.storage";
function _savePreferences() {
  const config = getConfig();
  if (!config.persistPreferences) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getUserPreferences()));
  } catch (e) {
    _log("warn", "Failed to save preferences:", e.message);
  }
}
function _loadPreferences() {
  const config = getConfig();
  if (!config.persistPreferences) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
export {
  MODULE_ID,
  VERSION,
  _loadPreferences,
  _savePreferences
};
