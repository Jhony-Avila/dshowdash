import {
  ModuleEntry,
  hasModule,
  getModule,
  setModule,
  deleteModule,
  deleteLoadPromise,
  getConfig,
  notifySubscribers
} from "../state.js";
import { load } from "./loader.js";
const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell.utils.lazy-loader.core.registry";
function register(name, loader, options) {
  if (hasModule(name)) {
    return false;
  }
  const entry = new ModuleEntry(name, loader, options);
  setModule(name, entry);
  notifySubscribers({
    type: "registered",
    module: name,
    timestamp: Date.now()
  });
  return true;
}
function unregister(name) {
  const entry = getModule(name);
  if (!entry) return false;
  deleteModule(name);
  deleteLoadPromise(name);
  return true;
}
function loadMany(names) {
  const promises = names.map((name) => load(name).then((module) => ({
    name,
    module,
    success: true
  })).catch((error) => ({
    name,
    error: error.message,
    success: false
  })));
  return Promise.all(promises).then((results) => {
    const modules = {};
    const errors = [];
    for (let i = 0; i < results.length; i++) {
      if (results[i].success) {
        modules[results[i].name] = results[i].module;
      } else {
        errors.push({ name: results[i].name, error: results[i].error });
      }
    }
    return { modules, errors, allLoaded: errors.length === 0 };
  });
}
function preload(names) {
  const config = getConfig();
  if (!config.preloadOnIdle) {
    return loadMany(names);
  }
  if (typeof requestIdleCallback === "function") {
    return new Promise((resolve) => {
      requestIdleCallback(() => {
        loadMany(names).then(resolve);
      }, { timeout: 5e3 });
    });
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      loadMany(names).then(resolve);
    }, 100);
  });
}
var registry_default = {
  register,
  unregister,
  loadMany,
  preload
};
export {
  MODULE_ID,
  VERSION,
  registry_default as default,
  loadMany,
  preload,
  register,
  unregister
};
