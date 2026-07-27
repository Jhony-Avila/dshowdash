const VERSION = "1.1.0-AAA";
const MODULE_ID = "app-shell-layout-persistence";
const STORAGE_KEY = "dsd:app-shell:layout-prefs";
const STORAGE_VERSION = 1;
const DEFAULT_PREFERENCES = Object.freeze({
  sidebar: {
    collapsed: false,
    width: 280
  },
  footer: {
    visible: true,
    height: 48
  },
  header: {
    visible: true
  },
  navRail: {
    expanded: false
  },
  theme: {
    mode: "system"
  },
  layout: {
    mode: "normal",
    lastRoute: null
  }
});
function getStorage() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("__test__", "1");
      localStorage.removeItem("__test__");
      return localStorage;
    }
  } catch (e) {
  }
  return null;
}
function deepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return obj;
  }
}
function deepMerge(target, source) {
  const result = deepClone(target);
  if (!source) return result;
  const keys = Object.keys(source);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (source[key] !== null && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
export {
  DEFAULT_PREFERENCES,
  MODULE_ID,
  STORAGE_KEY,
  STORAGE_VERSION,
  VERSION,
  deepClone,
  deepMerge,
  getStorage
};
