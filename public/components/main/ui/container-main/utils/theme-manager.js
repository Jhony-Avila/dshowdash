const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-theme-manager";
const THEMES = { LIGHT: "light", DARK: "dark", SYSTEM: "system" };
let _currentTheme = THEMES.SYSTEM;
let _resolvedTheme = THEMES.LIGHT;
let _mediaQuery = null;
let _listeners = /* @__PURE__ */ new Set();
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _emitEvent(eventType, payload) {
  if (_injectedEventBus?.emit) {
    _injectedEventBus.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
  }
}
function _getSystemTheme() {
  if (typeof window === "undefined") return THEMES.LIGHT;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? THEMES.DARK : THEMES.LIGHT;
}
function _resolveTheme(theme) {
  if (theme === THEMES.SYSTEM) return _getSystemTheme();
  return theme;
}
function _applyTheme(theme) {
  const resolved = _resolveTheme(theme);
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  root.classList.add(`theme-${resolved}`);
  root.setAttribute("data-theme", resolved);
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = resolved === THEMES.DARK ? "#1a1a2e" : "#ffffff";
  _resolvedTheme = resolved;
  _currentTheme = theme;
  try {
    localStorage.setItem("dsd-theme", theme);
  } catch {
  }
  _listeners.forEach((fn) => fn(resolved, theme));
  _emitEvent("theme:change", { theme, resolved });
}
function _onSystemThemeChange(_e) {
  if (_currentTheme === THEMES.SYSTEM) {
    _applyTheme(THEMES.SYSTEM);
  }
}
function init() {
  try {
    const saved = localStorage.getItem("dsd-theme");
    if (saved && Object.values(THEMES).includes(saved)) {
      _currentTheme = saved;
    }
  } catch {
  }
  if (typeof window !== "undefined") {
    _mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    _mediaQuery.addEventListener?.("change", _onSystemThemeChange);
  }
  _applyTheme(_currentTheme);
}
function setTheme(theme) {
  if (!Object.values(THEMES).includes(theme)) return false;
  _applyTheme(theme);
  return true;
}
function getTheme() {
  return _currentTheme;
}
function getResolvedTheme() {
  return _resolvedTheme;
}
function isDark() {
  return _resolvedTheme === THEMES.DARK;
}
function isLight() {
  return _resolvedTheme === THEMES.LIGHT;
}
function toggle() {
  const newTheme = _resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  return setTheme(newTheme);
}
function subscribe(callback) {
  _listeners.add(callback);
  return () => _listeners.delete(callback);
}
function getCSSVariables() {
  return {
    "--dsd-bg-primary": isDark() ? "#1a1a2e" : "#ffffff",
    "--dsd-bg-secondary": isDark() ? "#16213e" : "#f5f5f5",
    "--dsd-text-primary": isDark() ? "#eaeaea" : "#1a1a1a",
    "--dsd-text-secondary": isDark() ? "#a0a0a0" : "#666666",
    "--dsd-border": isDark() ? "#2d2d44" : "#e0e0e0",
    "--dsd-accent": isDark() ? "#4f9cf9" : "#2563eb",
    "--dsd-shadow": isDark() ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.1)"
  };
}
function destroy() {
  if (_mediaQuery) {
    _mediaQuery.removeEventListener?.("change", _onSystemThemeChange);
    _mediaQuery = null;
  }
  _listeners.clear();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, currentTheme: _currentTheme, resolvedTheme: _resolvedTheme, isDark: isDark() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, currentTheme: _currentTheme, resolvedTheme: _resolvedTheme };
}
var theme_manager_default = {
  init,
  setTheme,
  getTheme,
  getResolvedTheme,
  isDark,
  isLight,
  toggle,
  subscribe,
  getCSSVariables,
  destroy,
  injectEventBus,
  info,
  healthCheck,
  VERSION,
  MODULE_ID,
  THEMES
};
export {
  MODULE_ID,
  THEMES,
  VERSION,
  theme_manager_default as default,
  destroy,
  getCSSVariables,
  getResolvedTheme,
  getTheme,
  healthCheck,
  info,
  init,
  injectEventBus,
  isDark,
  isLight,
  setTheme,
  subscribe,
  toggle
};
