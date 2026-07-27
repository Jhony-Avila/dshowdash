const MODULE_ID = "panel-17.utils.storage";
const VERSION = "9.3.0-P2-ENTERPRISE";
const STORAGE_PREFIX = "panel-17_";
function save(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn("[panel-17] Storage save failed:", e);
    return false;
  }
}
function load(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn("[panel-17] Storage load failed:", e);
    return defaultValue;
  }
}
function remove(key) {
  localStorage.removeItem(STORAGE_PREFIX + key);
}
function clear() {
  Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_PREFIX)).forEach((k) => localStorage.removeItem(k));
}
var storage_default = { save, load, remove, clear };
export {
  MODULE_ID,
  VERSION,
  clear,
  storage_default as default,
  load,
  remove,
  save
};
