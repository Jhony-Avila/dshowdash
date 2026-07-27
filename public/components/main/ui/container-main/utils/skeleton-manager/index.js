import { VERSION, MODULE_ID, SKELETON_TYPES, DELAY_VARIANTS } from "./constants.js";
import { createSkeletonManager } from "./core/manager.js";
import { info as _info, healthCheck as _healthCheck } from "./diagnostics/health.js";
let _instance = null;
function getSkeletonManager(options) {
  if (!_instance) {
    _instance = createSkeletonManager(options);
  }
  return _instance;
}
function resetSkeletonManager() {
  if (_instance) {
    _instance.reset();
    _instance = null;
  }
}
function showSkeleton(container, options) {
  return getSkeletonManager().show(container, options);
}
function hideSkeleton(skeletonIdOrContainer, options) {
  return getSkeletonManager().hide(skeletonIdOrContainer, options);
}
function showSkeletonForPanel(container, panelId, options) {
  return getSkeletonManager().showForPanel(container, panelId, options);
}
function info() {
  return _info();
}
function healthCheck() {
  return _healthCheck(_instance);
}
var skeleton_manager_default = {
  VERSION,
  MODULE_ID,
  SKELETON_TYPES,
  DELAY_VARIANTS,
  createSkeletonManager,
  getSkeletonManager,
  resetSkeletonManager,
  showSkeleton,
  hideSkeleton,
  showSkeletonForPanel,
  info,
  healthCheck
};
export {
  DELAY_VARIANTS,
  MODULE_ID,
  SKELETON_TYPES,
  VERSION,
  createSkeletonManager,
  skeleton_manager_default as default,
  getSkeletonManager,
  healthCheck,
  hideSkeleton,
  info,
  resetSkeletonManager,
  showSkeleton,
  showSkeletonForPanel
};
