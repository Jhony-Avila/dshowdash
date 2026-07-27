import { updateConfig, updateUserPreferences, incrementMetric } from "../state.js";
import { _emit } from "../helpers/logger.js";
import { _savePreferences } from "../helpers/storage.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.accessibility-manager.features.text-scale";
function setTextScale(scale) {
  if (scale < 0.8 || scale > 2) return false;
  const root = document.documentElement;
  root.style.setProperty("--dsd-text-scale", String(scale));
  root.style.fontSize = `${scale * 100}%`;
  if (scale > 1.1) {
    root.classList.add("dsd-large-text");
  } else {
    root.classList.remove("dsd-large-text");
  }
  updateConfig({ textScale: scale });
  updateUserPreferences({ textScale: scale });
  incrementMetric("preferencesChanged");
  _savePreferences();
  _emit("textScaleChanged", { scale });
  return true;
}
export {
  MODULE_ID,
  VERSION,
  setTextScale
};
