import { activePresets, customSettings, config } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.accessibility-presets.storage.persistence";
function loadFromStorage() {
  if (!config.persistPresets) return;
  try {
    const data = localStorage.getItem(config.storageKey);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.presets) {
        parsed.presets.forEach((p) => {
          activePresets.add(p);
        });
      }
      if (parsed.customSettings) {
        Object.assign(customSettings, parsed.customSettings);
      }
    }
  } catch (e) {
  }
}
function saveToStorage() {
  if (!config.persistPresets) return;
  try {
    const data = {
      presets: Array.from(activePresets),
      customSettings,
      savedAt: Date.now()
    };
    localStorage.setItem(config.storageKey, JSON.stringify(data));
  } catch (e) {
  }
}
export {
  MODULE_ID,
  VERSION,
  loadFromStorage,
  saveToStorage
};
