import { customSettings, appliedCssVars, subscribers, incrementMetric } from "../state.js";
import { saveToStorage } from "../storage/persistence.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.accessibility-presets.settings.manager";
function notifySubscribers(event) {
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](event);
    } catch (e) {
    }
  }
}
function setSetting(key, value) {
  customSettings[key] = value;
  incrementMetric("customizations");
  if (key.startsWith("--")) {
    document.documentElement.style.setProperty(key, value);
    appliedCssVars[key] = value;
  }
  saveToStorage();
  notifySubscribers({
    type: "setting-changed",
    key,
    value,
    timestamp: Date.now()
  });
  return { ok: true };
}
function getSetting(key) {
  return customSettings[key];
}
function getAllSettings() {
  return Object.assign({}, customSettings);
}
function removeSetting(key) {
  if (key in customSettings) {
    delete customSettings[key];
    if (key.startsWith("--")) {
      document.documentElement.style.removeProperty(key);
      delete appliedCssVars[key];
    }
    saveToStorage();
    return true;
  }
  return false;
}
export {
  MODULE_ID,
  VERSION,
  getAllSettings,
  getSetting,
  removeSetting,
  setSetting
};
