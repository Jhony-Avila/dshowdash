import { NAVIGATION_TYPES } from "../constants.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "navigation-history:browser-integration";
const VERSION = "1.4.0-P2-ENTERPRISE";
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getEventBus() {
  _initPorts();
  const portEventBus = Ports.get("eventBus");
  if (portEventBus) return portEventBus;
  if (typeof window !== "undefined" && window.Core?.windowAdapter?.get) {
    const waEventBus = window.Core.windowAdapter.get("EventBus");
    if (waEventBus) return waEventBus;
  }
  return null;
}
function _emitHistorySync(action, entry, type) {
  if (typeof window === "undefined") return;
  const eventBus = _getEventBus();
  if (eventBus && eventBus.emit) {
    eventBus.emit("PANEL_HISTORY_SYNC", {
      action,
      entry,
      type,
      source: MODULE_ID,
      timestamp: Date.now()
    });
  }
}
function setupBrowserHistory(state, config, notifyListeners, logger) {
  if (!config.useBrowserHistory || typeof window === "undefined") return false;
  window.addEventListener("popstate", (event) => {
    if (state.isNavigating) return;
    const historyState = event.state;
    if (historyState && historyState.navigationId) {
      const index = state.history.findIndex((h) => h.id === historyState.navigationId);
      if (index !== -1) {
        state.isNavigating = true;
        const direction = index < state.currentIndex ? "back" : "forward";
        state.currentIndex = index;
        const entry = state.history[index];
        notifyListeners("popstate", {
          entry,
          index: state.currentIndex,
          direction
        });
        config.onNavigate?.(entry, NAVIGATION_TYPES.POP);
        state.isNavigating = false;
      }
    }
  });
  logger.debug("Browser history integration enabled");
  return true;
}
function updateBrowserHistory(entry, type, browserHistoryEnabled, isNavigating) {
  if (!browserHistoryEnabled || isNavigating) return;
  const historyState = {
    navigationId: entry.id,
    panelId: entry.panelId,
    // @ts-expect-error TS migration - TS2698
    ...entry.state
  };
  if (type === NAVIGATION_TYPES.PUSH) {
    _emitHistorySync("pushState", entry, type);
    window.history.pushState(historyState, entry.title, entry.url);
  } else if (type === NAVIGATION_TYPES.REPLACE) {
    _emitHistorySync("replaceState", entry, type);
    window.history.replaceState(historyState, entry.title, entry.url);
  }
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    ownership: "PANEL_HISTORY_OWNER",
    scope: "panel-state-only",
    p0Enterprise: true,
    portsInitialized: _portsInitialized,
    strictMode: isStrict()
  };
}
var integration_default = { setupBrowserHistory, updateBrowserHistory, info, injectPorts, getPorts, MODULE_ID, VERSION };
export {
  MODULE_ID,
  VERSION,
  integration_default as default,
  getPorts,
  info,
  injectPorts,
  setupBrowserHistory,
  updateBrowserHistory
};
