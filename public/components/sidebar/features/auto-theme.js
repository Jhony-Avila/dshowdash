import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "6.1.0-ES6";
const MODULE_ID = "sidebar-auto-theme";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const STORAGE_KEY = "dsd-sidebar-auto-theme";
const THEME_CLASSES = { "dark": C.MOD_DARK, "light": C.MOD_LIGHT, "high-contrast": C.MOD_HIGH_CONTRAST };
let _container = null;
let _autoEnabled = true;
let _mediaQuery = null;
let _mediaHandler = null;
let _cleanups = [];
let _currentTheme = "dark";
let _metrics = { themeChanges: 0, toggles: 0, errors: 0 };
function getSystemTheme() {
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) return "light";
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "dark";
}
function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    _autoEnabled = saved !== "false";
  } catch (e) {
    _autoEnabled = true;
  }
}
function saveConfig() {
  try {
    localStorage.setItem(STORAGE_KEY, String(_autoEnabled));
  } catch (e) {
  }
}
function applyTheme(container, theme) {
  if (!container) return;
  Object.values(THEME_CLASSES).forEach((cls) => {
    if (cls) container.classList.remove(cls);
  });
  if (theme !== "dark") {
    const cls = THEME_CLASSES[theme];
    if (cls) container.classList.add(cls);
  }
  _currentTheme = theme;
  _metrics.themeChanges++;
}
function init(eventBus, container) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  loadConfig();
  if (!_autoEnabled) return;
  const systemTheme = getSystemTheme();
  applyTheme(container, systemTheme);
  _mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  _mediaHandler = (e) => {
    if (_autoEnabled) {
      const newTheme = e.matches ? "dark" : "light";
      applyTheme(_container, newTheme);
      const eb2 = _getPort("eventBus");
      if (eb2 && eb2.emit) eb2.emit(SIDEBAR_EVENTS.THEME_CHANGED, { theme: newTheme, auto: true });
    }
  };
  _mediaQuery.addEventListener("change", _mediaHandler);
  _cleanups.push(() => {
    _mediaQuery.removeEventListener("change", _mediaHandler);
  });
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.AUTO_THEME_INITIALIZED);
}
function setupAutoTheme(container, eventBus) {
  init(eventBus, container);
  return () => {
    destroy();
  };
}
function enable(container) {
  _autoEnabled = true;
  _metrics.toggles++;
  saveConfig();
  const theme = getSystemTheme();
  applyTheme(container || _container, theme);
  return theme;
}
function disable() {
  _autoEnabled = false;
  _metrics.toggles++;
  saveConfig();
}
function isEnabled() {
  return _autoEnabled;
}
function getCurrentTheme() {
  return _currentTheme;
}
function getSystemPreference() {
  return getSystemTheme();
}
function destroy() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  _mediaHandler = null;
  _container = null;
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), autoEnabled: _autoEnabled, currentTheme: _currentTheme, systemTheme: getSystemTheme(), cleanups: _cleanups.length, metrics: getMetrics() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { autoEnabled: _autoEnabled, currentTheme: _currentTheme }, metrics: getMetrics() };
}
var auto_theme_default = { init, setupAutoTheme, enable, disable, isEnabled, getCurrentTheme, getSystemPreference, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  auto_theme_default as default,
  destroy,
  disable,
  enable,
  getCurrentTheme,
  getMetrics,
  getPorts,
  getSystemPreference,
  healthCheck,
  info,
  init,
  injectPorts,
  isEnabled,
  setupAutoTheme
};
