import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.2.0-MIGRATION-PHASE5";
const MODULE_ID = "panel-nav-admin.state.url-sync";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[URLStateSync]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const ALLOWED_KEYS = [
  "tab",
  // Active tab: items, sections, diagnostic
  "context",
  // Display context: sidebar, navrail, header, footer
  "section",
  // Section filter
  "q",
  // Search query
  "sort",
  // Sort field
  "order",
  // Sort order: asc, desc
  "page",
  // Current page
  "view",
  // View mode: table, card, split
  "level",
  // Permission level filter
  "status"
  // Active/inactive filter
];
function URLStateSync(options = {}) {
  const { useHash = true, onPopState } = options;
  let _popStateHandler = null;
  function getState() {
    try {
      const params = _getParams();
      const state = {};
      for (const key of ALLOWED_KEYS) {
        const val = params.get(key);
        if (val !== null && val !== "") {
          state[key] = val;
        }
      }
      return state;
    } catch (e) {
      _log("error", "Failed to read URL state:", e.message);
      return {};
    }
  }
  function setState(state, replace = true) {
    try {
      const params = _getParams();
      for (const key of ALLOWED_KEYS) {
        if (state[key] !== void 0 && state[key] !== null && state[key] !== "") {
          params.set(key, String(state[key]));
        } else if (key in state) {
          params.delete(key);
        }
      }
      _setParams(params, replace);
      _log("debug", "URL state updated");
    } catch (e) {
      _log("error", "Failed to set URL state:", e.message);
    }
  }
  function clearState() {
    try {
      const params = _getParams();
      for (const key of ALLOWED_KEYS) {
        params.delete(key);
      }
      _setParams(params, true);
    } catch (e) {
      _log("error", "Failed to clear URL state:", e.message);
    }
  }
  function getShareableURL(state) {
    const url = new URL(window.location.href);
    if (useHash) {
      const params = new URLSearchParams();
      for (const key of ALLOWED_KEYS) {
        if (state[key] !== void 0 && state[key] !== null && state[key] !== "") {
          params.set(key, String(state[key]));
        }
      }
      url.hash = "?" + params.toString();
    } else {
      for (const key of ALLOWED_KEYS) {
        if (state[key] !== void 0 && state[key] !== null && state[key] !== "") {
          url.searchParams.set(key, String(state[key]));
        } else {
          url.searchParams.delete(key);
        }
      }
    }
    return url.toString();
  }
  function startListening() {
    if (_popStateHandler) return;
    _popStateHandler = () => {
      const state = getState();
      if (typeof onPopState === "function") {
        onPopState(state);
      }
    };
    window.addEventListener("popstate", _popStateHandler);
    _log("debug", "PopState listener started");
  }
  function stopListening() {
    if (_popStateHandler) {
      window.removeEventListener("popstate", _popStateHandler);
      _popStateHandler = null;
    }
  }
  function _getParams() {
    if (useHash) {
      const hash = window.location.hash;
      const qIndex = hash.indexOf("?");
      return qIndex >= 0 ? new URLSearchParams(hash.substring(qIndex + 1)) : new URLSearchParams();
    }
    return new URLSearchParams(window.location.search);
  }
  function _setParams(params, replace) {
    const str = params.toString();
    if (useHash) {
      const newHash = str ? "#?" + str : "";
      if (replace) {
        history.replaceState(null, "", window.location.pathname + window.location.search + newHash);
      } else {
        history.pushState(null, "", window.location.pathname + window.location.search + newHash);
      }
    } else {
      const newSearch = str ? "?" + str : "";
      if (replace) {
        history.replaceState(null, "", window.location.pathname + newSearch + window.location.hash);
      } else {
        history.pushState(null, "", window.location.pathname + newSearch + window.location.hash);
      }
    }
  }
  function destroy() {
    stopListening();
  }
  return { getState, setState, clearState, getShareableURL, startListening, stopListening, destroy };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, allowedKeys: ALLOWED_KEYS };
}
function healthCheck() {
  const historyAvailable = typeof history.pushState === "function";
  return { status: historyAvailable ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, historyAvailable };
}
var url_sync_default = { URLStateSync, ALLOWED_KEYS, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  ALLOWED_KEYS,
  MODULE_ID,
  URLStateSync,
  VERSION,
  url_sync_default as default,
  healthCheck,
  info,
  injectPorts
};
