import { RECENT_KEY } from "../constants.js";
import { getRecentPanels as getRecentPanelsState } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-bookmarks-manager.storage.recent";
function saveRecentPanels() {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(getRecentPanelsState()));
  } catch (e) {
  }
}
function loadRecentPanels() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
export {
  MODULE_ID,
  VERSION,
  loadRecentPanels,
  saveRecentPanels
};
