import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import * as Store from "../state/store.js";
import * as BackendAPI from "../adapters/backend-api.js";
import * as Renderer from "../ui/renderer.js";
import * as Template from "../ui/template.js";
import * as Events from "../ui/events.js";
import { LOCAL_EVENTS } from "./contracts.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-session-admin.core.lifecycle";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = function(level, ...rest) {
  const args = rest;
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  switch (level) {
    case "error":
      if (logger.error) logger.error(...[prefix].concat(args));
      break;
    case "warn":
      if (logger.warn) logger.warn(...[prefix].concat(args));
      break;
    case "info":
      if (logger.info) logger.info(...[prefix].concat(args));
      break;
    default:
      if (logger.debug) logger.debug(...[prefix].concat(args));
  }
};
let _mounted = false;
let _cssLoaded = false;
let _mountedAt = null;
let _container = null;
let _config = {};
const CSS_PATH = "/components/panels/panel-session-admin/styles/index.css";
const CSS_ID = "psa-styles";
function _emit(event, data) {
  if (data === void 0) data = {};
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(event, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
  }
}
function _emitIntent(intent, data) {
  _initPorts();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(intent, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
}
function _loadCSS() {
  if (_cssLoaded) return Promise.resolve({ ok: true });
  const existing = document.getElementById(CSS_ID) || document.querySelector('link[href*="panel-session-admin/styles"]');
  if (existing) {
    _cssLoaded = true;
    _log("debug", "CSS already loaded");
    return Promise.resolve({ ok: true });
  }
  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CSS_PATH;
    link.id = CSS_ID;
    const timeout = setTimeout(() => {
      _log("warn", "CSS load timeout, continuing anyway");
      _cssLoaded = true;
      resolve({ ok: true, warning: "timeout" });
    }, 5e3);
    link.onload = () => {
      clearTimeout(timeout);
      _cssLoaded = true;
      _log("debug", "CSS loaded");
      resolve({ ok: true });
    };
    link.onerror = () => {
      clearTimeout(timeout);
      _log("error", "CSS load failed");
      resolve({ ok: false, error: "CSS load failed" });
    };
    document.head.appendChild(link);
  });
}
function _unloadCSS() {
  const link = document.getElementById(CSS_ID);
  if (link) {
    link.remove();
    _cssLoaded = false;
    _log("debug", "CSS unloaded");
  }
}
function _loadConfig(signal) {
  return fetch("/components/panels/panel-session-admin/config.json", { signal }).then((res) => {
    if (res.ok) {
      return res.json().then((data) => {
        _config = data;
        _log("debug", "Config loaded");
        return _config;
      });
    }
    return _config;
  }).catch(() => {
    _log("warn", "Config load failed, using defaults");
    return _config;
  });
}
function mount(container, config = {}) {
  _initPorts();
  if (_mounted) {
    _log("warn", "Already mounted, skipping");
    return Promise.resolve({ ok: true, warning: "already_mounted" });
  }
  if (!container) {
    _log("error", "Container required");
    return Promise.resolve({ ok: false, error: "Container required" });
  }
  _container = container;
  _container.setAttribute("data-panel", "panel-session-admin");
  return _loadConfig(void 0).then(() => {
    Object.assign(_config, config);
    return _loadCSS();
  }).then((cssResult) => {
    if (!cssResult.ok) {
      _log("warn", "CSS failed but continuing:", cssResult.error);
    }
    const authResult = Store.ensureAuth();
    if (!authResult.ok) {
      Renderer.renderAuthRequired(_container, _config);
      _emit(LOCAL_EVENTS.AUTH_REQUIRED, { reason: "mount-no-auth" });
      _mounted = true;
      _mountedAt = Date.now();
      return { ok: false, error: "AUTH_REQUIRED" };
    }
    BackendAPI.initAbortController();
    Renderer.renderSkeleton(_container);
    return refresh().then(() => {
      _mounted = true;
      _mountedAt = Date.now();
      _emit(LOCAL_EVENTS.MOUNTED, { moduleId: MODULE_ID });
      _log("debug", "Lifecycle mounted successfully");
      return { ok: true };
    });
  }).catch((err) => {
    _log("error", "Mount error:", err);
    Renderer.renderError(_container, err.message || "Erro ao carregar sess\xF5es", retry);
    return { ok: false, error: err.message };
  });
}
function refresh() {
  _initPorts();
  if (Store.isRefreshInProgress()) {
    _log("debug", "Refresh already in progress, skipping");
    return Promise.resolve({ ok: false, warning: "already_in_progress" });
  }
  const authResult = Store.ensureAuth();
  if (!authResult.ok) {
    Renderer.renderAuthRequired(_container, _config);
    return Promise.resolve({ ok: false, error: "AUTH_REQUIRED" });
  }
  _emit(LOCAL_EVENTS.REFRESH_START, void 0);
  Store.dispatch({ type: "SET_LOADING", payload: true });
  Store.dispatch({ type: "SET_REFRESH_IN_PROGRESS", payload: true });
  const startTime = Date.now();
  return BackendAPI.loadAllSessions().then((sessions) => {
    // scope=all: o BACKEND decide — admin (level>=80, gate server-side) recebe TODAS as sessões
    // (cross-user, read-only); não-admin recebe só as próprias. Não dependemos da detecção de admin no front.
    Store.dispatch({ type: "SET_SESSIONS", payload: sessions });
  }).then(() => {
    Store.dispatch({ type: "SET_ERROR", payload: null });
    Store.dispatch({ type: "SET_LOADING", payload: false });
    Store.dispatch({ type: "SET_REFRESH_IN_PROGRESS", payload: false });
    Store.dispatch({ type: "SET_LAST_REFRESH", payload: Date.now() });
    _renderUI();
    const duration = Date.now() - startTime;
    _emit(LOCAL_EVENTS.REFRESH_SUCCESS, { duration, count: Store.getSessions().length });
    _log("debug", `Refresh completed in ${duration}ms`);
    return { ok: true, duration };
  }).catch((error) => {
    Store.dispatch({ type: "SET_ERROR", payload: error.message });
    Store.dispatch({ type: "SET_LOADING", payload: false });
    Store.dispatch({ type: "SET_REFRESH_IN_PROGRESS", payload: false });
    _renderUI();
    _emit(LOCAL_EVENTS.REFRESH_ERROR, { error: error.message });
    _log("error", "Refresh failed:", error);
    return { ok: false, error: error.message };
  });
}
function retry() {
  Store.dispatch({ type: "SET_ERROR", payload: null });
  Renderer.renderSkeleton(_container);
  return refresh();
}
function _renderUI() {
  if (!_container) return;
  const ae = document.activeElement;
  let focusSel = null, caret = null;
  if (ae && _container.contains(ae)) {
    if (ae.dataset && ae.dataset.filter) focusSel = `[data-filter="${ae.dataset.filter}"]`;
    else if (ae.dataset && ae.dataset.inlineFilter) focusSel = `[data-inline-filter="${ae.dataset.inlineFilter}"]`;
    if (focusSel && typeof ae.selectionStart === "number") caret = ae.selectionStart;
  }
  const currentState = Store.getState();
  Template.render(_container, currentState, _config);
  Events.setup(_container, currentState, _getHandlers(), _config);
  if (focusSel) {
    const el = _container.querySelector(focusSel);
    if (el) {
      el.focus();
      if (caret != null && typeof el.setSelectionRange === "function") {
        try { el.setSelectionRange(caret, caret); } catch (e) {}
      }
    }
  }
}
function _getHandlers() {
  return {
    refresh,
    retry,
    setFilter(key, value) {
      const payload = {};
      payload[key] = value;
      Store.dispatch({ type: "SET_FILTER", payload });
      _renderUI();
    },
    setSort(field, additive) {
      Store.dispatch({ type: "SET_SORT", payload: { field, additive: !!additive } });
      _renderUI();
    },
    setInlineFilter(key, value) {
      const payload = {};
      payload[key] = value;
      Store.dispatch({ type: "SET_INLINE_FILTER", payload });
      _renderUI();
    },
    toggleInlineFilters() {
      Store.dispatch({ type: "TOGGLE_INLINE_FILTERS" });
      _renderUI();
    },
    clearFilters() {
      Store.dispatch({ type: "CLEAR_FILTERS" });
      _renderUI();
    },
    selectAll() {
      Store.dispatch({ type: "SELECT_ALL" });
      _renderUI();
    },
    deselectAll() {
      Store.dispatch({ type: "DESELECT_ALL" });
      _renderUI();
    },
    toggleRowSelection(id) {
      Store.dispatch({ type: "TOGGLE_SELECT", payload: id });
      _renderUI();
    },
    toggleRowExpansion(id) {
      Store.dispatch({ type: "TOGGLE_EXPAND", payload: id });
      _renderUI();
    },
    getSelectedCount() {
      return Store.getSelectedIds().length;
    },
    terminateSession(id) {
      return BackendAPI.terminateByIds([id]).then((res) => {
        const revoked = res && res.meta ? res.meta.revoked : void 0;
        if (revoked === 0) {
          _showToast(_config.i18n && _config.i18n.errorTerminate ? _config.i18n.errorTerminate : "N\xE3o foi poss\xEDvel encerrar a sess\xE3o", "error");
        } else {
          Store.dispatch({ type: "INCREMENT_TERMINATE" });
          _showToast(_config.i18n && _config.i18n.successTerminate ? _config.i18n.successTerminate : "Sess\xE3o encerrada com sucesso");
        }
        Store.dispatch({ type: "DESELECT_ALL" });
        _emit(LOCAL_EVENTS.SESSION_TERMINATED, { id });
        return refresh().then(() => ({ ok: revoked !== 0 }));
      }).catch((error) => {
        _showToast(_config.i18n && _config.i18n.errorTerminate ? _config.i18n.errorTerminate : "Erro ao encerrar sess\xE3o", "error");
        return { ok: false, error: error.message };
      });
    },
    terminateSelected() {
      const ids = Store.getSelectedIds();
      if (!ids.length) return Promise.resolve({ ok: false, warning: "empty" });
      return BackendAPI.terminateByIds(ids).then((res) => {
        const meta = (res && res.meta) || {};
        const revoked = meta.revoked != null ? meta.revoked : ids.length;
        Store.dispatch({ type: "INCREMENT_TERMINATE" });
        Store.dispatch({ type: "DESELECT_ALL" });
        _showToast(`${revoked} ${revoked === 1 ? "sess\xE3o encerrada" : "sess\xF5es encerradas"}${meta.skipped ? ` (${meta.skipped} ignorada(s))` : ""}`);
        _emit(LOCAL_EVENTS.SESSION_TERMINATE_ALL, { ids });
        return refresh().then(() => ({ ok: true, revoked }));
      }).catch((error) => {
        _showToast(_config.i18n && _config.i18n.errorTerminate ? _config.i18n.errorTerminate : "Erro ao encerrar sess\xF5es", "error");
        return { ok: false, error: error.message };
      });
    },
    terminateAllOthers() {
      return BackendAPI.terminateAllOthers().then(() => {
        Store.dispatch({ type: "INCREMENT_TERMINATE" });
        _showToast(_config.i18n && _config.i18n.successTerminateAll ? _config.i18n.successTerminateAll : "Outras sess\xF5es encerradas");
        _emit(LOCAL_EVENTS.SESSION_TERMINATE_ALL, void 0);
        return refresh().then(() => ({
          ok: true
        }));
      }).catch((error) => {
        _showToast(_config.i18n && _config.i18n.errorTerminate ? _config.i18n.errorTerminate : "Erro ao encerrar sess\xF5es", "error");
        return { ok: false, error: error.message };
      });
    }
  };
}
function _showToast(message, type) {
  if (type === void 0) type = "success";
  _emitIntent(UI_INTENTS.SHOW_TOAST, { message, type });
  const toast = _getPort("toast");
  if (toast && toast.show) {
    toast.show(message, type);
  }
}
function unmount() {
  if (!_mounted) return { ok: true };
  try {
    Events.destroy();
    BackendAPI.cleanupAbortController();
    Store.reset();
  } catch (err) {
    _log("error", "Unmount error:", err);
  }
  if (_container) {
    _container.innerHTML = "";
  }
  _mounted = false;
  _mountedAt = null;
  _container = null;
  _config = {};
  _emit(LOCAL_EVENTS.UNMOUNTED, void 0);
  _log("debug", "Lifecycle unmounted");
  return { ok: true };
}
function isMounted() {
  return _mounted;
}
function getConfig() {
  return Object.assign({}, _config);
}
function getContainer() {
  return _container;
}
function healthCheck() {
  const logger = _getPort("logger");
  const storeHealth = Store.healthCheck ? Store.healthCheck() : null;
  const apiHealth = BackendAPI.healthCheck ? BackendAPI.healthCheck() : null;
  return { status: _mounted ? "HEALTHY" : "DEGRADED", mounted: _mounted, mountedAt: _mountedAt, uptime: _mountedAt ? Date.now() - _mountedAt : 0, cssLoaded: _cssLoaded, hasContainer: !!_container, store: storeHealth, api: apiHealth, loggerReady: !!logger, portsInitialized: Ports.isInitialized(), usingP18Intents: true, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function getVersion() {
  return VERSION;
}
var lifecycle_default = { VERSION, MODULE_ID, mount, unmount, refresh, retry, isMounted, getConfig, getContainer, healthCheck, getVersion, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  lifecycle_default as default,
  getConfig,
  getContainer,
  getPorts,
  getVersion,
  healthCheck,
  injectPorts,
  isMounted,
  mount,
  refresh,
  retry,
  unmount
};
