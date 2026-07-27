import { ITEMS, getComponentPath } from "../../registry/items.js";
import { loadedModules } from "./constants.js";
const VERSION = "5.0.0-P4-ENTERPRISE";
const MODULE_ID = "nav-rail.core.component-mounter.dynamic-loader";
let _log = () => {
};
function setLogger(logFn) {
  _log = logFn;
}
function createDynamicLoader(componentPath) {
  return () => import(`../../components/${componentPath}/index.js`);
}
function getLoaderForComponent(id) {
  const componentPath = getComponentPath(id);
  if (!componentPath) {
    _log("warn", `No componentPath in registry for: ${id}`);
    return null;
  }
  return createDynamicLoader(componentPath);
}
function getAvailableComponentIds() {
  return ITEMS.map((item) => item.id);
}
function loadModule(id) {
  if (loadedModules.has(id)) return Promise.resolve(loadedModules.get(id));
  const loader = getLoaderForComponent(id);
  if (!loader) return Promise.reject(new Error(`No loader for: ${id} (missing componentPath in registry)`));
  return loader().then((module) => {
    loadedModules.set(id, module);
    return module;
  });
}
var dynamic_loader_default = {
  createDynamicLoader,
  getLoaderForComponent,
  getAvailableComponentIds,
  loadModule,
  setLogger
};
export {
  MODULE_ID,
  VERSION,
  createDynamicLoader,
  dynamic_loader_default as default,
  getAvailableComponentIds,
  getLoaderForComponent,
  loadModule,
  setLogger
};
