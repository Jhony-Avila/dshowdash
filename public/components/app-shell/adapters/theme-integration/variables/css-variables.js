import { THEME_VARIABLES } from "../constants.js";
import { getResolvedTheme } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.adapters.theme-integration.variables.css-variables";
function getThemeVariable(variable) {
  if (typeof document === "undefined") return null;
  if (!variable.startsWith("--")) {
    variable = `--${variable}`;
  }
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || null;
}
function setThemeVariable(variable, value) {
  if (typeof document === "undefined") return;
  if (!variable.startsWith("--")) {
    variable = `--${variable}`;
  }
  document.documentElement.style.setProperty(variable, value);
}
function getThemeVariables() {
  const resolved = getResolvedTheme();
  return THEME_VARIABLES[resolved] || THEME_VARIABLES.dark;
}
function getAllVariableNames() {
  return Object.keys(THEME_VARIABLES.light);
}
var css_variables_default = {
  getThemeVariable,
  setThemeVariable,
  getThemeVariables,
  getAllVariableNames
};
export {
  MODULE_ID,
  VERSION,
  css_variables_default as default,
  getAllVariableNames,
  getThemeVariable,
  getThemeVariables,
  setThemeVariable
};
