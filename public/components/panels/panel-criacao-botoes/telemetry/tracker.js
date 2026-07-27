import { MODULE_ID } from "../core/constants.js";
function _telemetry() {
  const w = globalThis;
  return w.__telemetry;
}
function _emit(event, data = {}) {
  try {
    _telemetry()?.track?.(event, { source: MODULE_ID, ...data });
  } catch {
  }
}
function trackMount() {
  _emit("panel.mount");
}
function trackUnmount() {
  _emit("panel.unmount");
}
function trackAction(action, data = {}) {
  _emit("panel.action", { action, ...data });
}
export {
  trackAction,
  trackMount,
  trackUnmount
};
