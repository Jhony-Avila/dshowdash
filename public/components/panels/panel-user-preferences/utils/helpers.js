const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences/utils/helpers";
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function deepClone(obj) {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
}
function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function isEmpty(obj) {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === "object") return Object.keys(obj).length === 0;
  return false;
}
function pick(obj, keys) {
  if (!obj) return {};
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {});
}
function omit(obj, keys) {
  if (!obj) return {};
  return Object.keys(obj).reduce((acc, key) => {
    if (!keys.includes(key)) acc[key] = obj[key];
    return acc;
  }, {});
}
function merge(target, source) {
  return Object.assign({}, target, source);
}
function deepMerge(target, source) {
  const result = deepClone(target);
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function getSystemReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function applyThemeToDocument(theme) {
  if (typeof document === "undefined") return;
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.classList.remove("theme-light", "theme-dark");
  document.documentElement.classList.add(`theme-${resolved}`);
}
function applyDensityToDocument(density) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-density", density);
  document.documentElement.classList.remove("density-compact", "density-comfortable", "density-spacious");
  document.documentElement.classList.add(`density-${density}`);
}
function applyFontSizeToDocument(size) {
  if (typeof document === "undefined") return;
  const sizes = { small: "14px", medium: "16px", large: "18px", "x-large": "20px" };
  document.documentElement.style.setProperty("--base-font-size", sizes[size] || "16px");
}
function getDiff(original, current) {
  const diff = {};
  for (const key in current) {
    if (!deepEqual(original[key], current[key])) diff[key] = current[key];
  }
  return diff;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var helpers_default = { generateId, sleep, deepClone, deepEqual, isEmpty, pick, omit, merge, deepMerge, getSystemTheme, getSystemReducedMotion, applyThemeToDocument, applyDensityToDocument, applyFontSizeToDocument, getDiff };
export {
  MODULE_ID,
  VERSION,
  applyDensityToDocument,
  applyFontSizeToDocument,
  applyThemeToDocument,
  deepClone,
  deepEqual,
  deepMerge,
  helpers_default as default,
  generateId,
  getDiff,
  getSystemReducedMotion,
  getSystemTheme,
  healthCheck,
  info,
  isEmpty,
  merge,
  omit,
  pick,
  sleep
};
