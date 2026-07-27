import { VERSION, MODULE_ID } from "./constants.js";
import { getInstance, setInstance, hasInstance } from "./state.js";
import { createNavigationHistory } from "./manager.js";
function getNavigationHistory(options = {}) {
  if (!hasInstance()) {
    setInstance(createNavigationHistory(options));
  }
  return getInstance();
}
function resetNavigationHistory() {
  const instance = getInstance();
  if (instance) {
    instance.reset();
    setInstance(null);
  }
}
function pushNavigation(panelId, state, title) {
  return getNavigationHistory().push(panelId, state, title);
}
function goBack() {
  return getNavigationHistory().back();
}
function goForward() {
  return getNavigationHistory().forward();
}
function canGoBack() {
  return getNavigationHistory().canGoBack();
}
function canGoForward() {
  return getNavigationHistory().canGoForward();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  if (hasInstance()) return getInstance().healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
export {
  canGoBack,
  canGoForward,
  getNavigationHistory,
  goBack,
  goForward,
  healthCheck,
  info,
  pushNavigation,
  resetNavigationHistory
};
