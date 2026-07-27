import { TOKENS } from "../core/constants.js";
import { track } from "../telemetry/tracker.js";
const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.integration.navigation-model-loader.cache.cache-manager";
const isStorageAvailable = (type) => {
  try {
    const storage = window[type];
    const testKey = "__storage_test__";
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};
const hasLocalStorage = isStorageAvailable("localStorage");
const hasSessionStorage = isStorageAvailable("sessionStorage");
const getFromSession = () => {
  if (!hasSessionStorage) return null;
  try {
    const raw = sessionStorage.getItem(TOKENS.SESSION_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.data || !cached?.timestamp) return null;
    const age = Date.now() - cached.timestamp;
    if (age > TOKENS.SESSION_TTL) {
      sessionStorage.removeItem(TOKENS.SESSION_KEY);
      return null;
    }
    return cached.data;
  } catch (e) {
    track("cache:session:error", { error: e.message });
    return null;
  }
};
const saveToSession = (data) => {
  if (!hasSessionStorage || !data) return false;
  try {
    const payload = {
      data,
      timestamp: Date.now(),
      version: TOKENS.SESSION_KEY
    };
    sessionStorage.setItem(TOKENS.SESSION_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    track("cache:session:save-error", { error: e.message });
    return false;
  }
};
const getFromLocal = () => {
  if (!hasLocalStorage) return null;
  try {
    const raw = localStorage.getItem(TOKENS.CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.data || !cached?.timestamp) return null;
    const age = Date.now() - cached.timestamp;
    if (age > TOKENS.CACHE_TTL) {
      localStorage.removeItem(TOKENS.CACHE_KEY);
      return null;
    }
    return cached.data;
  } catch (e) {
    track("cache:local:error", { error: e.message });
    return null;
  }
};
const saveToLocal = (data) => {
  if (!hasLocalStorage || !data) return false;
  try {
    const payload = {
      data,
      timestamp: Date.now(),
      version: TOKENS.CACHE_KEY
    };
    localStorage.setItem(TOKENS.CACHE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    track("cache:local:save-error", { error: e.message });
    return false;
  }
};
const invalidateAll = () => {
  try {
    if (hasSessionStorage) sessionStorage.removeItem(TOKENS.SESSION_KEY);
    if (hasLocalStorage) localStorage.removeItem(TOKENS.CACHE_KEY);
    track("cache:invalidate:all");
    return true;
  } catch (e) {
    return false;
  }
};
const getCached = () => {
  const session = getFromSession();
  if (session) return { data: session, source: "session" };
  const local = getFromLocal();
  if (local) return { data: local, source: "local" };
  return null;
};
const saveToCache = (data) => {
  saveToSession(data);
  saveToLocal(data);
};
export {
  MODULE_ID,
  VERSION,
  getCached,
  getFromLocal,
  getFromSession,
  invalidateAll,
  saveToCache,
  saveToLocal,
  saveToSession
};
