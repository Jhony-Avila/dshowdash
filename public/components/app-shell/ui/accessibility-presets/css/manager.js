import { appliedCssVars } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.accessibility-presets.css.manager";
function applyCssVars(vars) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const keys = Object.keys(vars);
  for (let i = 0; i < keys.length; i++) {
    root.style.setProperty(keys[i], vars[keys[i]]);
    appliedCssVars[keys[i]] = vars[keys[i]];
  }
}
function removeCssVars(vars) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const keys = Object.keys(vars);
  for (let i = 0; i < keys.length; i++) {
    root.style.removeProperty(keys[i]);
    delete appliedCssVars[keys[i]];
  }
}
function applyBodyClasses(classes, add) {
  if (typeof document === "undefined") return;
  for (let i = 0; i < classes.length; i++) {
    if (add) {
      document.body.classList.add(classes[i]);
    } else {
      document.body.classList.remove(classes[i]);
    }
  }
}
export {
  MODULE_ID,
  VERSION,
  applyBodyClasses,
  applyCssVars,
  removeCssVars
};
