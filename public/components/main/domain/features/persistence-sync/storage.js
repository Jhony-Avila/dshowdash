import { metrics } from "./state.js";
const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "main.domain.features.persistence-sync.storage";
function getStorage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch (e) {
  }
  return null;
}
function saveRaw(key, data) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(data));
    metrics.saves++;
    return true;
  } catch (e) {
    metrics.errors++;
    return false;
  }
}
function loadRaw(key) {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const json = storage.getItem(key);
    if (json) {
      metrics.loads++;
      return JSON.parse(json);
    }
  } catch (e) {
    metrics.errors++;
  }
  return null;
}
export {
  MODULE_ID,
  VERSION,
  getStorage,
  loadRaw,
  saveRaw
};
