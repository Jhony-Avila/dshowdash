const VERSION = "1.3.0-FIX-MISSING-EXPORTS";
const MODULE_ID = "app-shell-theme-integration";
const THEMES = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system"
});
const THEME_ATTRIBUTE = "data-theme";
const THEME_CLASS_PREFIX = "dsd-theme--";
const STORAGE_KEY = "app-shell-theme";
const THEME_VARIABLES = {
  light: {
    "--dsd-bg-primary": "#ffffff",
    "--dsd-bg-secondary": "#f8fafc",
    "--dsd-bg-tertiary": "#f1f5f9",
    "--dsd-text-primary": "#1e293b",
    "--dsd-text-secondary": "#64748b",
    "--dsd-text-muted": "#94a3b8",
    "--dsd-border-color": "#e2e8f0",
    "--dsd-shadow-color": "rgba(0, 0, 0, 0.1)",
    "--dsd-primary": "#3b82f6",
    "--dsd-primary-hover": "#2563eb",
    "--dsd-success": "#22c55e",
    "--dsd-warning": "#f59e0b",
    "--dsd-error": "#ef4444"
  },
  dark: {
    "--dsd-bg-primary": "#000000",
    "--dsd-bg-secondary": "#0a0a0a",
    "--dsd-bg-tertiary": "#141414",
    "--dsd-text-primary": "#f8fafc",
    "--dsd-text-secondary": "#cbd5e1",
    "--dsd-text-muted": "#64748b",
    "--dsd-border-color": "#1f1f1f",
    "--dsd-shadow-color": "rgba(0, 0, 0, 0.5)",
    "--dsd-primary": "#60a5fa",
    "--dsd-primary-hover": "#3b82f6",
    "--dsd-success": "#4ade80",
    "--dsd-warning": "#fbbf24",
    "--dsd-error": "#f87171"
  }
};
const CSS_VARS = THEME_VARIABLES;
var constants_default = {
  VERSION,
  MODULE_ID,
  THEMES,
  THEME_ATTRIBUTE,
  THEME_CLASS_PREFIX,
  THEME_VARIABLES,
  CSS_VARS,
  STORAGE_KEY
};
export {
  CSS_VARS,
  MODULE_ID,
  STORAGE_KEY,
  THEMES,
  THEME_ATTRIBUTE,
  THEME_CLASS_PREFIX,
  THEME_VARIABLES,
  VERSION,
  constants_default as default
};
