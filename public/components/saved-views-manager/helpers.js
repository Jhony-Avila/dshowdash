import { SAVED_VIEWS_EVENTS } from "/core/runtime/events/catalog/saved-views.events.js";
const MODULE_ID = "components-saved-views-manager-helpers";
const VERSION = "2.1.0-P18EC";
function saveCurrentView(key, label, type, config, options, createFn) {
  return createFn({ view_key: key, view_label: label, view_type: type, config, is_default: options.isDefault || false, is_shared: options.isShared || false });
}
function apply(viewId, getFn, metrics, trackTelemetry, emit) {
  return getFn(viewId).then((view) => {
    if (view) {
      metrics.applyCount++;
      trackTelemetry("apply", { viewId, viewType: view.view_type });
      emit(SAVED_VIEWS_EVENTS.APPLY, { view });
      return view;
    }
    return null;
  }).catch((error) => {
    metrics.errorCount++;
    emit(SAVED_VIEWS_EVENTS.ERROR, { action: "apply", error: error.message });
    throw error;
  });
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
  apply,
  healthCheck,
  info,
  saveCurrentView
};
