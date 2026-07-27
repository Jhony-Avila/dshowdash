import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
import * as Store from "../state/store.js";
import tracker from "../telemetry/tracker.js";
import { localState } from "./state.js";
function setFilter(key, value) {
  Store.dispatch({ type: "SET_FILTER", payload: { [key]: value } });
  tracker.filterChanged({ [key]: value });
}
function clearFilters() {
  Store.dispatch({ type: "CLEAR_FILTERS" });
  localState.inlineFilters = {};
  tracker.filterCleared();
}
function toggleInlineFilters(onStateChange) {
  localState.showInlineFilters = !localState.showInlineFilters;
  if (!localState.showInlineFilters) localState.inlineFilters = {};
  onStateChange?.(Store.getState());
  tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: "inline-filters:toggle", visible: localState.showInlineFilters });
}
function setInlineFilter(key, value, onStateChange) {
  if (value) {
    localState.inlineFilters[key] = value;
  } else {
    delete localState.inlineFilters[key];
  }
  onStateChange?.(Store.getState());
  tracker.track(LIFECYCLE_EVENTS.INTERACTION, { action: "inline-filter:set", key, value });
}
function getFilteredWithInline() {
  let sessions = Store.getFilteredSessions();
  if (Object.keys(localState.inlineFilters).length > 0) {
    sessions = sessions.filter((s) => {
      for (const [key, value] of Object.entries(localState.inlineFilters)) {
        if (!value) continue;
        const v = value.toLowerCase();
        if (key === "user" && !String(s.username || "").toLowerCase().includes(v)) return false;
        if (key === "device" && String(s.device_type || "").toLowerCase() !== v) return false;
        if (key === "browser" && !String(s.browser || "").toLowerCase().includes(v)) return false;
        if (key === "os" && !String(s.os || "").toLowerCase().includes(v)) return false;
        if (key === "ip" && !String(s.origin_ip || s.last_ip || "").includes(v)) return false;
        if (key === "status") {
          if (v === "active" && !s.is_active) return false;
          if (v === "inactive" && s.is_active) return false;
        }
      }
      return true;
    });
  }
  return sessions;
}
var filters_default = { setFilter, clearFilters, toggleInlineFilters, setInlineFilter, getFilteredWithInline };
const MODULE_ID = "panels-panel-session-admin-core-filters";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { filtersReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  clearFilters,
  filters_default as default,
  getFilteredWithInline,
  healthCheck,
  info,
  setFilter,
  setInlineFilter,
  toggleInlineFilters
};
