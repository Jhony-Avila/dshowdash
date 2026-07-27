import { STORAGE_KEY } from "../constants.js";
import { getConfig, getRecentCommands, setRecentCommands } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.command-palette-manager.helpers.storage";
function _saveState() {
  try {
    const config = getConfig();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      recentCommands: getRecentCommands().slice(0, config.maxRecentCommands)
    }));
  } catch (e) {
  }
}
function _loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      setRecentCommands(data.recentCommands || []);
    }
  } catch (e) {
  }
}
export {
  MODULE_ID,
  VERSION,
  _loadState,
  _saveState
};
