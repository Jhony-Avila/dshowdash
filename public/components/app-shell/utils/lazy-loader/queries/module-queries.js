import { LOAD_STATES } from "../constants.js";
import { getModules, getModule as getModuleEntry } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.lazy-loader.queries.module-queries";
function isLoaded(name) {
  const entry = getModuleEntry(name);
  return entry ? entry.state === LOAD_STATES.LOADED : false;
}
function getState(name) {
  const entry = getModuleEntry(name);
  return entry ? entry.state : null;
}
function getModule(name) {
  const entry = getModuleEntry(name);
  return entry && entry.state === LOAD_STATES.LOADED ? entry.module : null;
}
function getModuleInfo(name) {
  const entry = getModuleEntry(name);
  if (!entry) return null;
  return {
    name: entry.name,
    state: entry.state,
    loadTime: entry.loadTime,
    loadedAt: entry.loadedAt,
    attempts: entry.attempts,
    error: entry.error,
    hasOptions: !!entry.options && Object.keys(entry.options).length > 0
  };
}
function listModules() {
  const result = [];
  const modules = getModules();
  modules.forEach((entry) => {
    result.push(getModuleInfo(entry.name));
  });
  return result;
}
function countByState() {
  const counts = {
    pending: 0,
    loading: 0,
    loaded: 0,
    error: 0
  };
  const modules = getModules();
  modules.forEach((entry) => {
    const state = entry.state.toLowerCase();
    if (counts[state] !== void 0) {
      counts[state]++;
    }
  });
  return counts;
}
var module_queries_default = {
  isLoaded,
  getState,
  getModule,
  getModuleInfo,
  listModules,
  countByState
};
export {
  MODULE_ID,
  VERSION,
  countByState,
  module_queries_default as default,
  getModule,
  getModuleInfo,
  getState,
  isLoaded,
  listModules
};
