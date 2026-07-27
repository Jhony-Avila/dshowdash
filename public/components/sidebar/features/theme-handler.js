import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "6.1.0-ES6";
const MODULE_ID = "sidebar-theme-handler";
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
const STORAGE_KEY = "dsd-sidebar-theme";
const THEMES = ["dark", "light", "high-contrast"];
const THEME_CLASSES = { "dark": C.MOD_DARK, "light": C.MOD_LIGHT, "high-contrast": C.MOD_HIGH_CONTRAST };
let _currentTheme = "dark";
let _container = null;
let _metrics = { sets: 0, toggles: 0 };
function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(saved) ? saved : "dark";
  } catch (e) {
    return "dark";
  }
}
function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
  }
}
function init(eventBus, container) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  const saved = getSavedTheme();
  setTheme(container, saved);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.THEME_HANDLER_INITIALIZED);
}
function setTheme(container, theme) {
  if (!container || !THEMES.includes(theme)) return false;
  _container = container;
  _metrics.sets++;
  THEMES.forEach((t) => {
    const cls = THEME_CLASSES[t];
    if (cls) container.classList.remove(cls);
  });
  if (theme !== "dark") {
    const cls = THEME_CLASSES[theme];
    if (cls) container.classList.add(cls);
  }
  _currentTheme = theme;
  saveTheme(theme);
  return true;
}
function getTheme() {
  return _currentTheme;
}
function toggleTheme(container) {
  _metrics.toggles++;
  const currentIndex = THEMES.indexOf(_currentTheme);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  return setTheme(container, THEMES[nextIndex]);
}
function initTheme(container) {
  _container = container;
  const saved = getSavedTheme();
  return setTheme(container, saved);
}
function getAvailableThemes() {
  return [].concat(THEMES);
}
function destroy() {
  if (_container) THEMES.forEach((t) => {
    const cls = THEME_CLASSES[t];
    if (cls) _container.classList.remove(cls);
  });
  _container = null;
  _currentTheme = "dark";
}
function getMetrics() {
  return { ..._metrics, currentTheme: _currentTheme };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), currentTheme: _currentTheme, availableThemes: THEMES, metrics: getMetrics() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { currentTheme: _currentTheme, availableThemes: THEMES.length }, metrics: getMetrics() };
}
var theme_handler_default = { init, setTheme, getTheme, toggleTheme, initTheme, getAvailableThemes, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID, THEMES };
export {
  MODULE_ID,
  VERSION,
  theme_handler_default as default,
  destroy,
  getAvailableThemes,
  getMetrics,
  getPorts,
  getTheme,
  healthCheck,
  info,
  init,
  initTheme,
  injectPorts,
  setTheme,
  toggleTheme
};
