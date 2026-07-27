import { NAV_EVENTS, NAV_INTENTS } from "/core/runtime/events/catalog/nav.events.js";
import { extractPanelId } from "../../context-builder.js";
import { addToIntentHistory } from "../state/store.js";
const MODULE_ID = "navigation-controller-events";
const VERSION = "8.2.0-FIX";
function setupBrokerListeners(state, getPort) {
  const eb = getPort("eventBus");
  if (!eb || !eb.on) return;
  const metrics = state.metrics;
  const cleanups = state.cleanups;
  const onIntentResolved = (data) => {
    metrics.intentsReceived++;
    metrics.intentsFromBroker++;
    addToIntentHistory(state, { type: "resolved", data, timestamp: Date.now() });
  };
  eb.on(NAV_EVENTS.INTENT_RESOLVED, onIntentResolved);
  cleanups.push(() => {
    if (eb.off) eb.off(NAV_EVENTS.INTENT_RESOLVED, onIntentResolved);
  });
  const onNavigateStart = (data) => {
    addToIntentHistory(state, { type: "start", data, timestamp: Date.now() });
  };
  eb.on(NAV_EVENTS.NAVIGATE_START, onNavigateStart);
  cleanups.push(() => {
    if (eb.off) eb.off(NAV_EVENTS.NAVIGATE_START, onNavigateStart);
  });
  const onNavigateSuccess = (data) => {
    addToIntentHistory(state, { type: "success", data, timestamp: Date.now() });
    if (data && data.target) {
      const target = data.target;
      state.lastValidNavigation = {
        panelId: target.panelId || extractPanelId(target.value),
        route: target.value,
        timestamp: Date.now(),
        intentId: data.intentId
      };
    }
  };
  eb.on(NAV_EVENTS.NAVIGATE_SUCCESS, onNavigateSuccess);
  cleanups.push(() => {
    if (eb.off) eb.off(NAV_EVENTS.NAVIGATE_SUCCESS, onNavigateSuccess);
  });
  const onNavigateBlocked = (data) => {
    metrics.navigationsBlocked++;
    addToIntentHistory(state, { type: "blocked", data, timestamp: Date.now() });
  };
  eb.on(NAV_EVENTS.NAVIGATE_BLOCKED, onNavigateBlocked);
  cleanups.push(() => {
    if (eb.off) eb.off(NAV_EVENTS.NAVIGATE_BLOCKED, onNavigateBlocked);
  });
  const onNavigateError = (data) => {
    addToIntentHistory(state, { type: "error", data, timestamp: Date.now() });
  };
  eb.on(NAV_EVENTS.NAVIGATE_ERROR, onNavigateError);
  cleanups.push(() => {
    if (eb.off) eb.off(NAV_EVENTS.NAVIGATE_ERROR, onNavigateError);
  });
  const onUIIntent = (data) => {
    metrics.intentsReceived++;
    addToIntentHistory(state, { type: "ui-intent", data, timestamp: Date.now() });
    const broker = getPort("navigationBroker");
    if (broker && broker.processIntent && data) broker.processIntent(data);
  };
  eb.on(NAV_INTENTS.NAVIGATE, onUIIntent);
  cleanups.push(() => {
    if (eb.off) eb.off(NAV_INTENTS.NAVIGATE, onUIIntent);
  });
}
function cleanupListeners(state) {
  const cleanups = state.cleanups;
  for (let i = 0; i < cleanups.length; i++) {
    try {
      cleanups[i]();
    } catch (e) {
    }
  }
  state.cleanups = [];
}
var listeners_default = {
  setupBrokerListeners,
  cleanupListeners
};
export {
  MODULE_ID,
  VERSION,
  cleanupListeners,
  listeners_default as default,
  setupBrokerListeners
};
