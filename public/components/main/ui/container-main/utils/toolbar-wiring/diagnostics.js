import { VERSION, MODULE_ID, state } from "./state.js";
import { getEventBus } from "./helpers.js";
import { TOOLBAR_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
function emitWiringEvent(eventName, data) {
  const eventBus = getEventBus();
  if (!eventBus || !eventBus.emit) return;
  try {
    eventBus.emit(eventName, Object.assign({
      source: MODULE_ID,
      version: VERSION,
      timestamp: Date.now()
    }, data || {}));
  } catch (_e) {
  }
}
function setupRewireListener(toolbar, wireToolbarFn) {
  if (state.rewireListenerActive) return;
  const eventBus = getEventBus();
  if (!eventBus || !eventBus.subscribe) return;
  state.toolbarRef = toolbar;
  eventBus.subscribe(TOOLBAR_EVENT_NAMES.INITIALIZED, (detail) => {
    if (detail && detail.source === MODULE_ID) return;
    if (state.toolbarRef && state.toolbarRef.registerAction) {
      wireToolbarFn(state.toolbarRef).then(() => {
      }).catch(() => {
      });
    }
  });
  state.rewireListenerActive = true;
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID };
}
function healthCheck() {
  if (!state.lastWiringResult) {
    return {
      status: "NOT_WIRED",
      version: VERSION,
      moduleId: MODULE_ID,
      message: "wireToolbar() n\xE3o foi executado ainda"
    };
  }
  const failedCount = state.lastWiringResult.failed ? state.lastWiringResult.failed.length : 0;
  const wiredCount = state.lastWiringResult.wired ? state.lastWiringResult.wired.length : 0;
  const status = failedCount === 0 ? "HEALTHY" : wiredCount > 0 ? "DEGRADED" : "UNHEALTHY";
  return {
    status,
    version: VERSION,
    moduleId: MODULE_ID,
    wiredCount,
    failedCount,
    wired: state.lastWiringResult.wired || [],
    failed: state.lastWiringResult.failed || [],
    lastWiringAt: state.lastWiringTimestamp,
    rewireListenerActive: state.rewireListenerActive
  };
}
export {
  emitWiringEvent,
  healthCheck,
  info,
  setupRewireListener
};
