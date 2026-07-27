import { FREQUENCY_KEY } from "../constants.js";
import { getConfig, getPanelFrequency } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-bookmarks-manager.storage.frequency";
function saveFrequency() {
  const config = getConfig();
  if (!config.trackFrequency) return;
  try {
    localStorage.setItem(FREQUENCY_KEY, JSON.stringify(getPanelFrequency()));
  } catch (e) {
  }
}
function loadFrequency() {
  const config = getConfig();
  if (!config.trackFrequency) return {};
  try {
    const raw = localStorage.getItem(FREQUENCY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
export {
  MODULE_ID,
  VERSION,
  loadFrequency,
  saveFrequency
};
