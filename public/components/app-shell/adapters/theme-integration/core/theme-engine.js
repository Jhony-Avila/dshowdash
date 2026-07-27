const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "app-shell.adapters.theme-integration.core.theme-engine";
import { _state, incrementMetric, notifySubscribers, getConfig } from "../state.js";
import { THEMES, CSS_VARS, STORAGE_KEY } from "../constants.js";
function getCurrentTheme() {
  return _state.currentTheme;
}
function getSystemPreference() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return THEMES.LIGHT;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? THEMES.DARK : THEMES.LIGHT;
}
function resolveTheme(theme) {
  if (theme === THEMES.SYSTEM || theme === "system") {
    return getSystemPreference();
  }
  if (theme === THEMES.LIGHT || theme === "light") {
    return "light";
  }
  if (theme === THEMES.DARK || theme === "dark") {
    return "dark";
  }
  return "light";
}
function setTheme(theme, options) {
  options = options || {};
  const config = getConfig();
  if (theme === THEMES.SYSTEM) {
    theme = getSystemPreference();
    _state.usingSystem = true;
  } else {
    _state.usingSystem = false;
  }
  if (!THEMES[theme.toUpperCase()] && theme !== "light" && theme !== "dark") {
    return { ok: false, error: `Invalid theme: ${theme}` };
  }
  const previousTheme = _state.currentTheme;
  _state.currentTheme = theme;
  applyTheme(theme);
  if (options.persist !== false && config.persistTheme) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        theme: _state.usingSystem ? THEMES.SYSTEM : theme,
        appliedAt: Date.now()
      }));
    } catch (e) {
    }
  }
  incrementMetric("themeChanges");
  notifySubscribers("theme-change", {
    previous: previousTheme,
    current: theme,
    usingSystem: _state.usingSystem
  });
  return { ok: true, theme };
}
function toggleTheme() {
  const current = _state.currentTheme;
  const next = current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  return setTheme(next);
}
function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  root.classList.remove("theme-light", "theme-dark");
  root.classList.add(`theme-${theme}`);
  if (body) {
    body.classList.remove("theme-light", "theme-dark");
    body.classList.add(`theme-${theme}`);
  }
  root.setAttribute("data-theme", theme);
  const vars = CSS_VARS[theme] || CSS_VARS.light;
  const varNames = Object.keys(vars);
  for (let i = 0; i < varNames.length; i++) {
    root.style.setProperty(varNames[i], vars[varNames[i]]);
  }
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", theme === THEMES.DARK ? "#1a1a1a" : "#ffffff");
  }
}
function watchSystemPreference() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {
    };
  }
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e) => {
    if (_state.usingSystem) {
      const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
      _state.currentTheme = newTheme;
      applyTheme(newTheme);
      notifySubscribers("system-theme-change", { theme: newTheme });
    }
  };
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handler);
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(handler);
  }
  _state.systemWatcherActive = true;
  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener("change", handler);
    } else if (mediaQuery.removeListener) {
      mediaQuery.removeListener(handler);
    }
    _state.systemWatcherActive = false;
  };
}
function loadPersistedTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    return data.theme;
  } catch (e) {
    return null;
  }
}
function initTheme(options) {
  options = options || {};
  const persisted = loadPersistedTheme();
  const initial = options.initial || persisted || THEMES.SYSTEM;
  setTheme(initial, { persist: false });
  if (options.watchSystem !== false) {
    watchSystemPreference();
  }
  return { ok: true, theme: _state.currentTheme };
}
function init(options) {
  return initTheme(options);
}
function destroy() {
  _state.currentTheme = null;
  _state.usingSystem = false;
  _state.systemWatcherActive = false;
  _state.initialized = false;
}
function applyThemeToElement(element, theme) {
  if (!element) return;
  element.classList.remove("theme-light", "theme-dark");
  element.classList.add(`theme-${theme}`);
  element.setAttribute("data-theme", theme);
  const vars = CSS_VARS[theme] || CSS_VARS.light;
  const varNames = Object.keys(vars);
  for (let i = 0; i < varNames.length; i++) {
    element.style.setProperty(varNames[i], vars[varNames[i]]);
  }
}
var theme_engine_default = {
  getCurrentTheme,
  getSystemPreference,
  resolveTheme,
  setTheme,
  toggleTheme,
  applyTheme,
  applyThemeToElement,
  watchSystemPreference,
  loadPersistedTheme,
  initTheme,
  init,
  destroy
};
export {
  MODULE_ID,
  VERSION,
  applyTheme,
  applyThemeToElement,
  theme_engine_default as default,
  destroy,
  getCurrentTheme,
  getSystemPreference,
  init,
  initTheme,
  loadPersistedTheme,
  resolveTheme,
  setTheme,
  toggleTheme,
  watchSystemPreference
};
