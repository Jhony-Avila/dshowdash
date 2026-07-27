import { STORAGE_KEY } from "./constants.js";
import { state, config } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.maintenance-mode.storage";
function loadState() {
  if (!config.persistState) return;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.endTime && Date.now() > parsed.endTime) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      Object.assign(state, parsed);
    }
  } catch (e) {
  }
}
function saveState() {
  if (!config.persistState) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
  }
}
function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
  }
}
export {
  MODULE_ID,
  VERSION,
  clearState,
  loadState,
  saveState
};
