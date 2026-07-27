import ThemePort from "./ports/theme-port.js";
import DensityPort from "./ports/density-port.js";
import { THEME_INTENTS } from "/core/runtime/events/catalog/theme.events.js";
import { PREFERENCES_INTENTS } from "/core/runtime/events/catalog/preferences.events.js";
import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences:theme-applier";
const STORAGE_KEY = "dshowdash_theme_prefs";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
const DENSITY_VARS = {
  compact: { "--spacing-xs": "2px", "--spacing-sm": "4px", "--spacing-md": "8px", "--spacing-lg": "12px", "--spacing-xl": "16px", "--font-size-sm": "11px", "--font-size-md": "12px", "--font-size-lg": "13px", "--line-height": "1.3", "--card-padding": "10px", "--button-padding": "6px 10px" },
  comfortable: { "--spacing-xs": "4px", "--spacing-sm": "8px", "--spacing-md": "12px", "--spacing-lg": "16px", "--spacing-xl": "24px", "--font-size-sm": "12px", "--font-size-md": "13px", "--font-size-lg": "14px", "--line-height": "1.5", "--card-padding": "14px", "--button-padding": "8px 14px" },
  spacious: { "--spacing-xs": "6px", "--spacing-sm": "12px", "--spacing-md": "16px", "--spacing-lg": "24px", "--spacing-xl": "32px", "--font-size-sm": "13px", "--font-size-md": "14px", "--font-size-lg": "15px", "--line-height": "1.6", "--card-padding": "18px", "--button-padding": "10px 18px" }
};
function _emitIntent(intent, data) {
  _initPorts();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(intent, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
}
function applyTheme(theme) {
  _emitIntent(THEME_INTENTS.SET_THEME, { theme, persist: true });
  const result = ThemePort.setTheme(theme, { source: MODULE_ID, persist: true });
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    stored.theme = theme;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
  }
  return result;
}
function applyDensity(density) {
  _emitIntent(PREFERENCES_INTENTS.SET_DENSITY, { density, persist: true });
  const result = DensityPort.setDensity(density, { source: MODULE_ID, persist: true });
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    stored.density = density;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
  }
  return result;
}
function previewTheme(theme) {
  _emitIntent(THEME_INTENTS.PREVIEW_THEME, { theme, isPreview: true });
  return ThemePort.previewTheme(theme);
}
function previewDensity(density) {
  _emitIntent(PREFERENCES_INTENTS.PREVIEW_DENSITY, { density, isPreview: true });
  return DensityPort.previewDensity(density);
}
function cancelPreviews() {
  _emitIntent(THEME_INTENTS.CANCEL_PREVIEW, {});
  _emitIntent(PREFERENCES_INTENTS.CANCEL_DENSITY_PREVIEW, {});
  ThemePort.cancelPreview();
  DensityPort.cancelPreview();
}
function confirmPreviews() {
  ThemePort.confirmPreview();
  DensityPort.confirmPreview();
}
function setAccentColor(color) {
  _emitIntent(THEME_INTENTS.SET_ACCENT, { color, persist: true });
  return ThemePort.setAccentColor(color, { source: MODULE_ID, persist: true });
}
function getTheme() {
  return ThemePort.getCurrentTheme();
}
function getDensity() {
  return DensityPort.getCurrentDensity();
}
function initFromStorage() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (stored.theme) applyTheme(stored.theme);
    if (stored.density) applyDensity(stored.density);
    return { ok: true, theme: stored.theme, density: stored.density };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
function getDensityVars(density) {
  return DENSITY_VARS[density] || DENSITY_VARS.comfortable;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, currentTheme: getTheme(), currentDensity: getDensity(), themePort: ThemePort.info(), densityPort: DensityPort.info(), usingP18Intents: true };
}
function healthCheck() {
  const themeHealth = ThemePort.healthCheck();
  const densityHealth = DensityPort.healthCheck();
  const checks = { themePortHealthy: themeHealth.status !== "UNHEALTHY", densityPortHealthy: densityHealth.status !== "UNHEALTHY", storageAvailable: typeof localStorage !== "undefined", p18IntentsAvailable: true };
  let passed = 0;
  for (const k in checks) {
    if (checks.hasOwnProperty(k) && checks[k]) passed++;
  }
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, submodules: { themePort: themeHealth, densityPort: densityHealth }, version: VERSION, moduleId: MODULE_ID };
}
var theme_applier_default = { applyTheme, applyDensity, previewTheme, previewDensity, cancelPreviews, confirmPreviews, setAccentColor, getTheme, getDensity, initFromStorage, getDensityVars, info, healthCheck, DENSITY_VARS, VERSION, MODULE_ID };
export {
  DENSITY_VARS,
  MODULE_ID,
  VERSION,
  applyDensity,
  applyTheme,
  cancelPreviews,
  confirmPreviews,
  theme_applier_default as default,
  getDensity,
  getDensityVars,
  getTheme,
  healthCheck,
  info,
  initFromStorage,
  previewDensity,
  previewTheme,
  setAccentColor
};
