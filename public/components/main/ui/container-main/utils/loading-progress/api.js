import { VERSION, MODULE_ID } from "./constants.js";
import { getInstance, setInstance, hasInstance } from "./state.js";
import { createLoadingProgress } from "./manager.js";
function getLoadingProgress(options = {}) {
  if (!hasInstance()) {
    setInstance(createLoadingProgress(options));
  }
  return getInstance();
}
function resetLoadingProgress() {
  const instance = getInstance();
  if (instance) {
    instance.destroy();
    setInstance(null);
  }
}
function startLoading() {
  return getLoadingProgress().start();
}
function doneLoading() {
  return getLoadingProgress().done();
}
function setLoadingProgress(progress) {
  return getLoadingProgress().set(progress);
}
function isLoading() {
  return getLoadingProgress().isLoading();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  if (hasInstance()) return getInstance().healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
export {
  doneLoading,
  getLoadingProgress,
  healthCheck,
  info,
  isLoading,
  resetLoadingProgress,
  setLoadingProgress,
  startLoading
};
