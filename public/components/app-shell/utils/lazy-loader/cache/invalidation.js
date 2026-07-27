import { LOAD_STATES } from "../constants.js";
import { getModules, getModule } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.lazy-loader.cache.invalidation";
function invalidate(name) {
  const entry = getModule(name);
  if (!entry) return false;
  entry.state = LOAD_STATES.PENDING;
  entry.module = null;
  entry.error = null;
  entry.loadTime = null;
  entry.loadedAt = null;
  return true;
}
function invalidateAll() {
  const modules = getModules();
  modules.forEach((entry) => {
    entry.state = LOAD_STATES.PENDING;
    entry.module = null;
    entry.error = null;
    entry.loadTime = null;
    entry.loadedAt = null;
  });
}
function invalidateErrors() {
  let count = 0;
  const modules = getModules();
  modules.forEach((entry) => {
    if (entry.state === LOAD_STATES.ERROR) {
      entry.state = LOAD_STATES.PENDING;
      entry.module = null;
      entry.error = null;
      entry.loadTime = null;
      entry.loadedAt = null;
      count++;
    }
  });
  return count;
}
var invalidation_default = {
  invalidate,
  invalidateAll,
  invalidateErrors
};
export {
  MODULE_ID,
  VERSION,
  invalidation_default as default,
  invalidate,
  invalidateAll,
  invalidateErrors
};
