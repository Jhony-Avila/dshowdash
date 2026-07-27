import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { IconRegistry } from "/components/icon-registry/index.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05.utils.theme-manager";
const hasWindow = typeof window !== "undefined";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") logger?.error?.(prefix, ...args);
  else if (level === "warn") logger?.warn?.(prefix, ...args);
};
const icon = (name) => IconRegistry.get(name) || "";
const THEMES = { light: { id: "light", label: "Claro", iconKey: "system:sun" }, dark: { id: "dark", label: "Escuro", iconKey: "system:moon" }, system: { id: "system", label: "Sistema", iconKey: "system:monitor" } };
const DARK_TOKENS = { "--p05-bg-primary": "#0F172A", "--p05-bg-surface": "#1E293B", "--p05-bg-surface-alt": "#334155", "--p05-bg-elevated": "#1E293B", "--p05-bg-hover": "rgba(255,255,255,0.05)", "--p05-bg-active": "rgba(255,255,255,0.08)", "--p05-text-primary": "#F8FAFC", "--p05-text-secondary": "#94A3B8", "--p05-text-muted": "#64748B", "--p05-text-inverse": "#0F172A", "--p05-border-default": "#334155", "--p05-border-subtle": "#1E293B", "--p05-border-strong": "#475569", "--p05-shadow-sm": "0 1px 2px rgba(0,0,0,0.3)", "--p05-shadow-md": "0 4px 6px -1px rgba(0,0,0,0.4)", "--p05-shadow-lg": "0 10px 15px -3px rgba(0,0,0,0.5)", "--p05-shadow-xl": "0 20px 25px -5px rgba(0,0,0,0.6)", "--p05-skeleton-base": "#334155", "--p05-skeleton-shine": "#475569" };
const STORAGE_KEY = "panel-05-theme";
class ThemeManager {
  constructor() {
    this._currentTheme = "system";
    this._effectiveTheme = "light";
    this._mediaQuery = null;
    this._listeners = /* @__PURE__ */ new Set();
    this._initialized = false;
  }
  init() {
    if (this._initialized) return this;
    const saved = this._loadPreference();
    this._currentTheme = saved || "system";
    this._setupMediaQuery();
    this._applyTheme();
    this._initialized = true;
    return this;
  }
  destroy() {
    if (this._mediaQuery) this._mediaQuery.removeEventListener("change", this._handleSystemChange);
    this._listeners.clear();
    this._initialized = false;
  }
  getTheme() {
    return this._currentTheme;
  }
  getEffectiveTheme() {
    return this._effectiveTheme;
  }
  setTheme(theme) {
    if (!THEMES[theme]) {
      _log("warn", "Invalid theme:", theme);
      return false;
    }
    this._currentTheme = theme;
    this._savePreference(theme);
    this._applyTheme();
    this._notifyListeners();
    return true;
  }
  toggle() {
    const newTheme = this._effectiveTheme === "light" ? "dark" : "light";
    return this.setTheme(newTheme);
  }
  isDark() {
    return this._effectiveTheme === "dark";
  }
  isLight() {
    return this._effectiveTheme === "light";
  }
  subscribe(callback) {
    if (typeof callback === "function") this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }
  getThemes() {
    return Object.values(THEMES).map((t) => ({ ...t, icon: icon(t.iconKey), active: t.id === this._currentTheme }));
  }
  renderToggleButton(options = {}) {
    const { compact = false, showLabel = true } = options;
    const isDark = this.isDark();
    const iconSvg = isDark ? icon("system:sun") : icon("system:moon");
    const label = isDark ? "Modo claro" : "Modo escuro";
    return `<button class="p05-btn p05-btn-ghost p05-theme-toggle ${compact ? "p05-btn-icon-only" : ""}" data-action="theme-toggle" aria-label="${label}" title="${label}"><span class="p05-btn-icon p05-theme-icon">${iconSvg}</span>${showLabel && !compact ? `<span class="p05-btn-label">${label}</span>` : ""}</button>`;
  }
  renderThemeSelector(options = {}) {
    const { position = "bottom-end" } = options;
    const themes = this.getThemes();
    return `<div class="p05-theme-selector p05-dropdown-menu" data-position="${position}" role="menu"><div class="p05-dropdown-header">Apar\xEAncia</div>${themes.map((t) => `<button class="p05-dropdown-item ${t.active ? "p05-selected" : ""}" data-action="set-theme" data-theme="${t.id}" role="menuitem"><span class="p05-dropdown-icon">${t.icon}</span><span class="p05-dropdown-label">${t.label}</span>${t.active ? `<span class="p05-dropdown-check">${icon("ui:check")}</span>` : ""}</button>`).join("")}</div>`;
  }
  renderThemeSwitch() {
    const isDark = this.isDark();
    return `<div class="p05-theme-switch" role="switch" aria-checked="${isDark}" data-action="theme-toggle"><span class="p05-theme-switch-icon p05-theme-switch-light ${!isDark ? "p05-active" : ""}">${icon("system:sun")}</span><span class="p05-theme-switch-track"><span class="p05-theme-switch-thumb" style="transform: translateX(${isDark ? "20px" : "0"})"></span></span><span class="p05-theme-switch-icon p05-theme-switch-dark ${isDark ? "p05-active" : ""}">${icon("system:moon")}</span></div>`;
  }
  _setupMediaQuery() {
    if (!hasWindow) return;
    this._mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this._handleSystemChange = this._handleSystemChange.bind(this);
    this._mediaQuery.addEventListener("change", this._handleSystemChange);
  }
  _handleSystemChange(e) {
    if (this._currentTheme === "system") {
      this._effectiveTheme = e.matches ? "dark" : "light";
      this._applyThemeTokens();
      this._notifyListeners();
    }
  }
  _applyTheme() {
    if (this._currentTheme === "system") {
      this._effectiveTheme = this._mediaQuery?.matches ? "dark" : "light";
    } else {
      this._effectiveTheme = this._currentTheme;
    }
    this._applyThemeTokens();
  }
  _applyThemeTokens() {
    if (!hasWindow || typeof document === "undefined") return;
    const root = document.documentElement;
    const panelRoot = document.querySelector(".p05-panel");
    root.setAttribute("data-theme", this._effectiveTheme);
    if (panelRoot) panelRoot.setAttribute("data-theme", this._effectiveTheme);
    if (this._effectiveTheme === "dark") {
      for (const [prop, value] of Object.entries(DARK_TOKENS)) {
        root.style.setProperty(prop, value);
        if (panelRoot) panelRoot.style.setProperty(prop, value);
      }
    } else {
      for (const prop of Object.keys(DARK_TOKENS)) {
        root.style.removeProperty(prop);
        if (panelRoot) panelRoot.style.removeProperty(prop);
      }
    }
  }
  _savePreference(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
    }
  }
  _loadPreference() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }
  _notifyListeners() {
    const state = { theme: this._currentTheme, effective: this._effectiveTheme, isDark: this._effectiveTheme === "dark" };
    for (const listener of this._listeners) {
      try {
        listener(state);
      } catch (e) {
        _log("error", "Listener error:", e);
      }
    }
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, theme: this._currentTheme, effective: this._effectiveTheme, isDark: this.isDark(), initialized: this._initialized, portsInitialized: Ports.isInitialized() };
  }
  healthCheck() {
    return { status: this._initialized ? "HEALTHY" : "NOT_INITIALIZED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
  }
}
const themeManager = new ThemeManager();
var theme_manager_default = themeManager;
export {
  MODULE_ID,
  VERSION,
  theme_manager_default as default,
  getPorts,
  injectPorts,
  themeManager
};
