const VERSION = "1.1.0-AAA";
const MODULE_ID = "app-shell-slot-persistence";
const STORAGE_KEY = "app-shell-slots-state";
const MAX_STORED_SLOTS = 100;
const MAX_CONTENT_SIZE = 1e4;
function getStorage(storageType) {
  if (typeof window === "undefined") return null;
  if (storageType === "sessionStorage") return window.sessionStorage;
  return window.localStorage;
}
function loadFromStorage(storageType, metrics) {
  try {
    const storage = getStorage(storageType);
    if (!storage) return null;
    const data = storage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    metrics.errors++;
    return null;
  }
}
function saveToStorage(data, storageType, metrics) {
  try {
    const storage = getStorage(storageType);
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    metrics.errors++;
    return false;
  }
}
export {
  MAX_CONTENT_SIZE,
  MAX_STORED_SLOTS,
  MODULE_ID,
  STORAGE_KEY,
  VERSION,
  getStorage,
  loadFromStorage,
  saveToStorage
};
