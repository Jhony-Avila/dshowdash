const VERSION = "2.2.0-P2-ENTERPRISE";
const MODULE_ID = "components.accessibility-manager.core.engine";
let _settings = {
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  screenReaderOptimized: false,
  keyboardNavigation: false,
  focusIndicators: false,
  fontScale: 1,
  colorBlindMode: "none"
};
function getSettings() {
  return { ..._settings };
}
function updateSettings(newSettings) {
  Object.assign(_settings, newSettings);
  return true;
}
function detectPreferences() {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const highContrast = window.matchMedia?.("(prefers-contrast: high)")?.matches ?? false;
  return { reducedMotion, highContrast };
}
function enable(flag) {
  if (flag in _settings && typeof _settings[flag] === "boolean") {
    _settings[flag] = true;
    return true;
  }
  return false;
}
function disable(flag) {
  if (flag in _settings && typeof _settings[flag] === "boolean") {
    _settings[flag] = false;
    return true;
  }
  return false;
}
function toggle(flag) {
  if (flag in _settings && typeof _settings[flag] === "boolean") {
    _settings[flag] = !_settings[flag];
    return _settings[flag];
  }
  return null;
}
function get(flag) {
  return _settings[flag];
}
function setFontScale(scale) {
  if (typeof scale === "number" && scale >= 0.5 && scale <= 3) {
    _settings.fontScale = scale;
    return true;
  }
  return false;
}
function setColorBlindMode(mode) {
  const validModes = ["none", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"];
  if (validModes.includes(mode)) {
    _settings.colorBlindMode = mode;
    return true;
  }
  return false;
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  const checks = {
    hasSettings: !!_settings,
    validFontScale: _settings.fontScale >= 0.5 && _settings.fontScale <= 3,
    validColorBlindMode: ["none", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"].includes(_settings.colorBlindMode)
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    settings: getSettings(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    settings: getSettings(),
    detectedPreferences: detectPreferences(),
    timestamp: Date.now()
  };
}
var engine_default = {
  getSettings,
  updateSettings,
  detectPreferences,
  enable,
  disable,
  toggle,
  get,
  setFontScale,
  setColorBlindMode,
  healthCheck,
  info,
  getVersion,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  engine_default as default,
  detectPreferences,
  disable,
  enable,
  get,
  getSettings,
  getVersion,
  healthCheck,
  info,
  setColorBlindMode,
  setFontScale,
  toggle,
  updateSettings
};
