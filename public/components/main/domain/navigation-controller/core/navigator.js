import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
import { extractPanelId } from "../../context-builder.js";
import { cleanup, updateTimingMetrics } from "../state/store.js";
import { processQueue } from "../queue/manager.js";
const MODULE_ID = "navigation-controller-navigator";
const VERSION = "9.0.0-P1-HEX";
const LOCAL_NAV_EVENTS = {
  START: "navigation:start",
  END: "navigation:end",
  BLOCKED: "navigation:blocked",
  INVALID_ROUTE: "navigation:invalid-route",
  CANCELLED: "navigation:cancelled",
  ERROR: "navigation:error",
  TIMEOUT: "navigation:timeout"
};
function _setTimeout(state, fn, ms) {
  const tp = state.timerPort;
  if (tp && tp.setTimeout) return tp.setTimeout(fn, ms);
  return setTimeout(fn, ms);
}
function _clearTimeout(state, id) {
  if (id === null || id === void 0) return;
  const tp = state.timerPort;
  if (tp && tp.clearTimeout) return tp.clearTimeout(id);
  return clearTimeout(id);
}
function validateNavigation(manifestController, route, options) {
  if (!manifestController) return Promise.resolve({ valid: true, reason: "no-manifest-controller" });
  const routePath = typeof route === "string" ? route : route && route.path ? route.path : "/";
  const mc = manifestController;
  if (mc.validateRoute) {
    return mc.validateRoute(routePath);
  }
  if (mc.resolveRoute) {
    return mc.resolveRoute(routePath).then((resolved) => ({
      valid: resolved !== null,
      panelId: resolved ? resolved.panelId : null,
      reason: resolved === null ? "route-not-found" : "valid"
    }));
  }
  return Promise.resolve({ valid: true, reason: "no-validation-available" });
}
function emitNavigationBlocked(state, telemetry, getPort, route, reason, validation, moduleId) {
  const metrics = state.metrics;
  metrics.navigationsBlocked++;
  metrics.invalidRoutes++;
  const lastNav = state.lastValidNavigation;
  const payload = {
    route,
    reason,
    validation: validation || {},
    lastValidPanel: lastNav ? lastNav.panelId : null,
    timestamp: Date.now()
  };
  if (telemetry && telemetry.track) {
    telemetry.track(LOCAL_NAV_EVENTS.BLOCKED, payload);
  }
  const eb = getPort("eventBus");
  if (eb && eb.emit) {
    eb.emit(LOCAL_NAV_EVENTS.BLOCKED, payload);
    eb.emit(LOCAL_NAV_EVENTS.INVALID_ROUTE, payload);
    eb.emit(UI_INTENTS.SHOW_TOAST, {
      type: "warning",
      title: "Navega\xE7\xE3o Indispon\xEDvel",
      message: "Esta funcionalidade ainda n\xE3o est\xE1 dispon\xEDvel.",
      duration: 4e3,
      source: moduleId,
      timestamp: Date.now()
    });
  }
  return payload;
}
function executeNavigation(state, panelLifecycle, stateMachine, telemetry, getPort, route, options) {
  state.navigating = true;
  state.abortController = new AbortController();
  const startTime = performance.now();
  const sm = stateMachine;
  const pl = panelLifecycle;
  const stateMetrics = state.metrics;
  const ac = state.abortController;
  let panelId;
  if (typeof route === "string" && route.match(/^panel-/i)) {
    panelId = route;
  } else if (typeof route === "string") {
    panelId = extractPanelId(route);
  } else {
    panelId = extractPanelId(route ? route.path : null);
  }
  const containerId = options.containerId || null;
  const timeout = options.timeout || state.timeoutMs;
  state.currentNavigation = { panelId, route, startTime, containerId };
  const tel = telemetry;
  const timeoutPromise = new Promise((_, reject) => {
    state.timeoutId = _setTimeout(state, () => {
      if (state.navigating && ac) {
        stateMetrics.navigationsTimedOut++;
        ac.abort();
        if (tel && tel.track) {
          tel.track(LOCAL_NAV_EVENTS.TIMEOUT, { panelId, timeout });
        }
        reject(new Error(`Navigation timeout after ${timeout}ms`));
      }
    }, timeout);
  });
  const abortPromise = new Promise((_, reject) => {
    ac.signal.addEventListener("abort", () => {
      reject(new Error("Navigation cancelled"));
    }, { once: true });
  });
  if (tel && tel.track) {
    tel.track(LOCAL_NAV_EVENTS.START, { panelId, route, containerId });
  }
  sm.transition("navigating");
  const navigationPromise = doNavigate(state, panelLifecycle, stateMachine, panelId, containerId, options, ac.signal);
  return Promise.race([navigationPromise, timeoutPromise, abortPromise]).then(() => {
    _clearTimeout(state, state.timeoutId);
    state.timeoutId = null;
    const navigationTime = Math.round(performance.now() - startTime);
    updateTimingMetrics(state, navigationTime);
    sm.transition("ready");
    stateMetrics.navigationsCompleted++;
    state.lastValidNavigation = { panelId, route, timestamp: Date.now() };
    if (tel && tel.track) {
      tel.track(LOCAL_NAV_EVENTS.END, { panelId, success: true, navigationTime });
    }
    cleanup(state);
    processQueue(state, (r, o) => executeNavigation(state, panelLifecycle, stateMachine, telemetry, getPort, r, o));
    return true;
  }).catch((error) => {
    _clearTimeout(state, state.timeoutId);
    state.timeoutId = null;
    const navigationTime = Math.round(performance.now() - startTime);
    if (error.message === "Navigation cancelled" || error.name === "NavigationCancelledError") {
      stateMetrics.navigationsCancelled++;
      if (tel && tel.track) {
        tel.track(LOCAL_NAV_EVENTS.CANCELLED, { panelId, navigationTime });
      }
    } else if (error.message.includes("timeout")) {
      sm.transition("error");
    } else {
      stateMetrics.navigationsFailed++;
      sm.transition("error");
      if (tel && tel.error) {
        tel.error(error, { panelId, phase: "navigation", navigationTime });
      }
    }
    cleanup(state);
    processQueue(state, (r, o) => executeNavigation(state, panelLifecycle, stateMachine, telemetry, getPort, r, o));
    throw error;
  });
}
function doNavigate(state, panelLifecycle, stateMachine, panelId, containerId, options, signal) {
  let promise = Promise.resolve();
  const plc = panelLifecycle;
  const smc = stateMachine;
  if (plc.hasPanel()) {
    smc.transition("unmounting");
    promise = promise.then(() => plc.unmount());
  }
  return promise.then(() => {
    smc.transition("loading-panel");
    return plc.load(panelId, { signal });
  }).then((panelModule) => {
    smc.transition("mounting");
    return plc.mount(panelModule, panelId, Object.assign({ containerId, signal }, options));
  });
}
function cancel(state) {
  if (state.abortController && state.navigating) {
    state.abortController.abort();
    return true;
  }
  return false;
}
var navigator_default = {
  LOCAL_NAV_EVENTS,
  validateNavigation,
  emitNavigationBlocked,
  executeNavigation,
  doNavigate,
  cancel,
  VERSION,
  MODULE_ID
};
export {
  LOCAL_NAV_EVENTS,
  MODULE_ID,
  VERSION,
  cancel,
  navigator_default as default,
  doNavigate,
  emitNavigationBlocked,
  executeNavigation,
  validateNavigation
};
