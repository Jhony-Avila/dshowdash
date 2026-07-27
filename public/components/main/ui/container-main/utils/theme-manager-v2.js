import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:theme-manager-v2";
const THEMES = Object.freeze({ LIGHT: "light", DARK: "dark", SYSTEM: "system", CUSTOM: "custom" });
const DEFAULT_LIGHT = {
  "--cm-bg-primary": "#ffffff",
  "--cm-bg-secondary": "#f5f5f5",
  "--cm-bg-tertiary": "#e8e8e8",
  "--cm-text-primary": "#1a1a2e",
  "--cm-text-secondary": "#4a4a6a",
  "--cm-text-muted": "#8a8aa0",
  "--cm-accent": "#3b82f6",
  "--cm-accent-hover": "#2563eb",
  "--cm-accent-text": "#ffffff",
  "--cm-border": "#e0e0e0",
  "--cm-shadow": "rgba(0, 0, 0, 0.1)",
  "--cm-success": "#22c55e",
  "--cm-warning": "#f59e0b",
  "--cm-error": "#ef4444",
  "--cm-info": "#3b82f6"
};
const DEFAULT_DARK = {
  "--cm-bg-primary": "#1a1a2e",
  "--cm-bg-secondary": "#16213e",
  "--cm-bg-tertiary": "#0f3460",
  "--cm-text-primary": "#e8e8e8",
  "--cm-text-secondary": "#b8b8c8",
  "--cm-text-muted": "#6a6a8a",
  "--cm-accent": "#60a5fa",
  "--cm-accent-hover": "#93c5fd",
  "--cm-accent-text": "#1a1a2e",
  "--cm-border": "#2a2a4e",
  "--cm-shadow": "rgba(0, 0, 0, 0.4)",
  "--cm-success": "#4ade80",
  "--cm-warning": "#fbbf24",
  "--cm-error": "#f87171",
  "--cm-info": "#60a5fa"
};
function createThemeManager(options = {}) {
  const { defaultTheme = THEMES.SYSTEM, storageKey = "cm_theme", transitionDuration = 200, onThemeChange = null } = options;
  const _logger = createLogger(MODULE_ID);
  let _currentTheme = defaultTheme;
  let _resolvedTheme = THEMES.LIGHT;
  let _customThemes = /* @__PURE__ */ new Map();
  let _mediaQuery = null;
  let _metrics = { changes: 0 };
  function _getSystemTheme() {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? THEMES.DARK : THEMES.LIGHT;
  }
  function _applyVariables(variables) {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(variables)) {
      root.style.setProperty(key, value);
    }
  }
  function _applyTheme(theme, withTransition = true) {
    let variables;
    let resolved = theme;
    if (theme === THEMES.SYSTEM) {
      resolved = _getSystemTheme();
    }
    if (resolved === THEMES.LIGHT) {
      variables = DEFAULT_LIGHT;
    } else if (resolved === THEMES.DARK) {
      variables = DEFAULT_DARK;
    } else if (_customThemes.has(theme)) {
      variables = _customThemes.get(theme);
      resolved = theme;
    } else {
      _logger.warn(`Unknown theme: ${theme}, falling back to light`);
      variables = DEFAULT_LIGHT;
      resolved = THEMES.LIGHT;
    }
    if (withTransition) {
      document.documentElement.style.setProperty("--cm-transition", `all ${transitionDuration}ms ease`);
      document.body.style.transition = `background-color ${transitionDuration}ms ease, color ${transitionDuration}ms ease`;
    }
    _applyVariables(variables);
    document.documentElement.setAttribute("data-theme", resolved);
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(`theme-${resolved}`);
    _resolvedTheme = resolved;
    _metrics.changes++;
    if (withTransition) {
      setTimeout(() => {
        document.body.style.transition = "";
      }, transitionDuration);
    }
  }
  function _persist(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {
      _logger.warn("Failed to persist theme:", e);
    }
  }
  function _restore() {
    try {
      return localStorage.getItem(storageKey);
    } catch (e) {
      return null;
    }
  }
  function _setupSystemListener() {
    if (_mediaQuery) return;
    _mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    _mediaQuery.addEventListener("change", () => {
      if (_currentTheme === THEMES.SYSTEM) {
        _applyTheme(THEMES.SYSTEM);
        if (typeof onThemeChange === "function") onThemeChange(THEMES.SYSTEM, _resolvedTheme);
      }
    });
  }
  const savedTheme = _restore();
  if (savedTheme && (savedTheme === THEMES.LIGHT || savedTheme === THEMES.DARK || savedTheme === THEMES.SYSTEM)) {
    _currentTheme = savedTheme;
  }
  _applyTheme(_currentTheme, false);
  _setupSystemListener();
  const manager = {
    setTheme(theme) {
      if (theme !== THEMES.LIGHT && theme !== THEMES.DARK && theme !== THEMES.SYSTEM && !_customThemes.has(theme)) {
        _logger.warn(`Invalid theme: ${theme}`);
        return false;
      }
      _currentTheme = theme;
      _applyTheme(theme);
      _persist(theme);
      if (typeof onThemeChange === "function") onThemeChange(theme, _resolvedTheme);
      return true;
    },
    getTheme() {
      return _currentTheme;
    },
    getResolvedTheme() {
      return _resolvedTheme;
    },
    isDark() {
      return _resolvedTheme === THEMES.DARK;
    },
    isLight() {
      return _resolvedTheme === THEMES.LIGHT;
    },
    toggle() {
      const newTheme = _resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      manager.setTheme(newTheme);
      return newTheme;
    },
    registerCustomTheme(name, variables) {
      const merged = { ...DEFAULT_LIGHT, ...variables };
      _customThemes.set(name, merged);
      return name;
    },
    unregisterCustomTheme(name) {
      return _customThemes.delete(name);
    },
    getVariable(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    },
    setVariable(name, value) {
      document.documentElement.style.setProperty(name, value);
    },
    getThemeVariables(theme) {
      if (theme === THEMES.LIGHT) return { ...DEFAULT_LIGHT };
      if (theme === THEMES.DARK) return { ...DEFAULT_DARK };
      if (_customThemes.has(theme)) return { ..._customThemes.get(theme) };
      return null;
    },
    listThemes() {
      return [THEMES.LIGHT, THEMES.DARK, THEMES.SYSTEM, ...Array.from(_customThemes.keys())];
    },
    getMetrics() {
      return { ..._metrics, currentTheme: _currentTheme, resolvedTheme: _resolvedTheme };
    },
    resetMetrics() {
      _metrics = { changes: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, currentTheme: _currentTheme, resolvedTheme: _resolvedTheme, customThemes: _customThemes.size };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, currentTheme: _currentTheme, resolvedTheme: _resolvedTheme, themes: manager.listThemes() };
    },
    destroy() {
      if (_mediaQuery) {
        _mediaQuery.removeEventListener("change", () => {
        });
        _mediaQuery = null;
      }
    }
  };
  return manager;
}
let _instance = null;
function getThemeManager(options = {}) {
  if (!_instance) _instance = createThemeManager(options);
  return _instance;
}
function resetThemeManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function setTheme(theme) {
  return getThemeManager().setTheme(theme);
}
function toggleTheme() {
  return getThemeManager().toggle();
}
function isDarkMode() {
  return getThemeManager().isDark();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, themes: Object.keys(THEMES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var theme_manager_v2_default = { VERSION, MODULE_ID, THEMES, createThemeManager, getThemeManager, resetThemeManager, setTheme, toggleTheme, isDarkMode, info, healthCheck };
export {
  MODULE_ID,
  THEMES,
  VERSION,
  createThemeManager,
  theme_manager_v2_default as default,
  getThemeManager,
  healthCheck,
  info,
  isDarkMode,
  resetThemeManager,
  setTheme,
  toggleTheme
};
