import { _getState, _setState, notify } from "./core.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-cache";
const CACHE_KEY = "uarps-admin-cache";
const CACHE_TTL = 5 * 60 * 1e3;
function saveToCache() {
  try {
    const state = _getState();
    const permsArray = [];
    state.userPermissions.forEach((v, k) => permsArray.push([k, v]));
    const cacheData = { timestamp: Date.now(), users: state.users, triggers: state.triggers, regions: state.regions, permissions: permsArray };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    return true;
  } catch (e) {
    return false;
  }
}
function loadFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}
function applyCacheToState() {
  const cached = loadFromCache();
  if (!cached) return false;
  const state = _getState();
  state.users = cached.users || [];
  state.triggers = cached.triggers || [];
  state.regions = cached.regions || [];
  state.userPermissions = new Map(cached.permissions || []);
  state.lastSync = cached.timestamp;
  _setState(state);
  return true;
}
function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}
function getCacheAge() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const data = JSON.parse(cached);
    return Date.now() - data.timestamp;
  } catch (e) {
    return null;
  }
}
function isCacheValid() {
  const age = getCacheAge();
  return age !== null && age < CACHE_TTL;
}
function getCacheTTL() {
  return CACHE_TTL;
}
const FILTERS_CACHE_KEY = "uarps-saved-filters";
function getSavedFilters() {
  try {
    const saved = localStorage.getItem(FILTERS_CACHE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}
function saveFilter(name, filter) {
  try {
    const filters = getSavedFilters();
    filters.push({ id: Date.now(), name, filter, createdAt: Date.now() });
    if (filters.length > 10) filters.shift();
    localStorage.setItem(FILTERS_CACHE_KEY, JSON.stringify(filters));
    notify("savedFilters");
    return true;
  } catch (e) {
    return false;
  }
}
function removeSavedFilter(id) {
  try {
    const filters = getSavedFilters().filter((f) => f.id !== id);
    localStorage.setItem(FILTERS_CACHE_KEY, JSON.stringify(filters));
    notify("savedFilters");
    return true;
  } catch (e) {
    return false;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, cacheTTL: CACHE_TTL };
}
function healthCheck() {
  const valid = isCacheValid();
  return { status: valid ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { cacheValid: valid, cacheAge: getCacheAge() } };
}
export {
  MODULE_ID,
  VERSION,
  applyCacheToState,
  clearCache,
  getCacheAge,
  getCacheTTL,
  getSavedFilters,
  healthCheck,
  info,
  isCacheValid,
  loadFromCache,
  removeSavedFilter,
  saveFilter,
  saveToCache
};
