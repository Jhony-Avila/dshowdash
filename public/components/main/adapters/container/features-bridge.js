import { getContainerApis } from "./internal-state.js";
const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "container-features-bridge";
function createFeaturesBridge() {
  const _containerApis = getContainerApis();
  return {
    // Toast
    toast(id, message, type = "info") {
      return _containerApis.get(id)?.toast(message, type);
    },
    toastSuccess(id, message) {
      return _containerApis.get(id)?.toastSuccess(message);
    },
    toastError(id, message) {
      return _containerApis.get(id)?.toastError(message);
    },
    toastWarning(id, message) {
      return _containerApis.get(id)?.toastWarning(message);
    },
    toastInfo(id, message) {
      return _containerApis.get(id)?.toastInfo(message);
    },
    // Progress
    setProgress(id, value, variant) {
      _containerApis.get(id)?.setProgress(value, variant);
      return true;
    },
    // Tabs
    addTab(id, tab) {
      _containerApis.get(id)?.addTab(tab);
      return true;
    },
    removeTab(id, tabId) {
      _containerApis.get(id)?.removeTab(tabId);
      return true;
    },
    setActiveTab(id, tabId) {
      _containerApis.get(id)?.setActiveTab(tabId);
      return true;
    },
    // Badge
    setBadge(id, count) {
      _containerApis.get(id)?.setBadge(count);
      return true;
    },
    clearBadge(id) {
      _containerApis.get(id)?.clearBadge();
      return true;
    },
    // Toolbar
    setToolbarItems(id, items) {
      _containerApis.get(id)?.setToolbarItems(items);
      return true;
    },
    addToolbarItem(id, item, index) {
      _containerApis.get(id)?.addToolbarItem(item, index);
      return true;
    },
    // Zoom
    zoomIn(id) {
      _containerApis.get(id)?.zoomIn();
      return true;
    },
    zoomOut(id) {
      _containerApis.get(id)?.zoomOut();
      return true;
    },
    setZoom(id, value) {
      _containerApis.get(id)?.setZoom(value);
      return true;
    },
    resetZoom(id) {
      _containerApis.get(id)?.resetZoom();
      return true;
    },
    getZoom(id) {
      return _containerApis.get(id)?.getZoom() || 100;
    },
    // Accessibility
    announce(id, message, priority) {
      _containerApis.get(id)?.announce(message, priority);
      return true;
    },
    focusFirst(id) {
      _containerApis.get(id)?.focusFirst();
      return true;
    },
    // Debug
    debugLog(id, msg, data) {
      _containerApis.get(id)?.debug?.log(msg, data);
    },
    debugToggle(id) {
      _containerApis.get(id)?.debug?.toggle();
    },
    // Fullscreen
    fullscreen(id, enable = true) {
      _containerApis.get(id)?.fullscreen(enable);
      return true;
    }
  };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var features_bridge_default = { createFeaturesBridge, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createFeaturesBridge,
  features_bridge_default as default,
  healthCheck
};
