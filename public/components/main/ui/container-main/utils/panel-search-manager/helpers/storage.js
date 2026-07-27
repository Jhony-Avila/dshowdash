import { STORAGE_KEY } from "../constants.js";
import { getConfig, getCurrentQuery } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-search-manager.helpers.storage";
function _saveState() {
  const config = getConfig();
  if (!config.persistLastSearch) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastQuery: getCurrentQuery() }));
  } catch (e) {
  }
}
function _loadState() {
  const config = getConfig();
  if (!config.persistLastSearch) return "";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return data.lastQuery || "";
    }
  } catch (e) {
  }
  return "";
}
export {
  MODULE_ID,
  VERSION,
  _loadState,
  _saveState
};
