const MODULE_ID = "components-saved-views-manager-state";
const VERSION = "1.1.0-ENTERPRISE";
let _views = [];
let _viewTypes = [];
let _isInitialized = false;
function getViews() {
  return _views.slice();
}
function setViews(views) {
  _views = views;
}
function getViewTypes() {
  return _viewTypes.slice();
}
function setViewTypes(types) {
  _viewTypes = types;
}
function isInitialized() {
  return _isInitialized;
}
function setInitialized(val) {
  _isInitialized = val;
}
function reset() {
  _views = [];
  _viewTypes = [];
  _isInitialized = false;
}
function getByType(type) {
  return _views.filter((v) => v.view_type === type);
}
function getDefault(type) {
  if (type) return _views.find((v) => v.view_type === type && v.is_default);
  return _views.find((v) => v.is_default);
}
function getShared() {
  return _views.filter((v) => v.is_shared && !v.is_owner);
}
function getOwned() {
  return _views.filter((v) => v.is_owner);
}
function getViewById(viewId) {
  return _views.find((v) => v.id == viewId) || null;
}
function getViewByKey(viewKey) {
  return _views.find((v) => v.view_key === viewKey) || null;
}
function updateViewDefault(viewId) {
  _views.forEach((v) => {
    v.is_default = v.id == viewId;
  });
}
function removeView(viewId) {
  _views = _views.filter((v) => v.id != viewId);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  MODULE_ID,
  VERSION,
  getByType,
  getDefault,
  getOwned,
  getShared,
  getViewById,
  getViewByKey,
  getViewTypes,
  getViews,
  healthCheck,
  info,
  isInitialized,
  removeView,
  reset,
  setInitialized,
  setViewTypes,
  setViews,
  updateViewDefault
};
