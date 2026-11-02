import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { PERMISSIONS_EVENTS, AUTH_EVENTS } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
const VERSION = "1.7.0-P2-ENTERPRISE";
const MODULE_ID = "components._shared.permissions.ui-feedback";
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, msg, data) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const fullMsg = `[${MODULE_ID}] ${msg}`;
  {
    if (logger.debug) logger.debug(fullMsg, data || "");
  }
};
const _config = {
  mode: "hide",
  permissionsMode: "allow-all",
  hiddenClass: "uarps-hidden",
  disabledClass: "uarps-disabled",
  processedAttr: "data-uarps-processed",
  triggerAttr: "data-uarps-trigger",
  regionAttr: "data-uarps-region",
  tooltipText: "Você não tem permissão para esta ação",
  observerEnabled: true,
  debug: false
};
const _state = {
  initialized: false,
  observer: null,
  processedCount: 0,
  hiddenCount: 0,
  disabledCount: 0,
  lastScan: null,
  modeSubscription: null
};
let _cleanups = [];
function _injectCSS() {
  if (!hasDocument) return;
  if (document.getElementById("uarps-ui-feedback-styles")) return;
  const css = ".uarps-hidden { display: none !important; visibility: hidden !important; pointer-events: none !important; } .uarps-disabled { opacity: 0.4 !important; pointer-events: none !important; cursor: not-allowed !important; filter: grayscale(50%) !important; user-select: none !important; } .uarps-disabled::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: transparent; cursor: not-allowed; } [data-uarps-blocked] { position: relative; } [data-uarps-blocked]:hover::before { content: attr(data-uarps-tooltip); position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); padding: 6px 12px; background: rgba(220, 53, 69, 0.95); color: white; font-size: 12px; font-weight: 500; border-radius: 4px; white-space: nowrap; z-index: 10000; pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,0.3); } [data-uarps-blocked]:hover::after { content: ''; position: absolute; bottom: calc(100% - 4px); left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: rgba(220, 53, 69, 0.95); z-index: 10001; pointer-events: none; } .uarps-transition { transition: opacity 0.2s ease, filter 0.2s ease; }";
  const style = document.createElement("style");
  style.id = "uarps-ui-feedback-styles";
  style.textContent = css;
  document.head.appendChild(style);
  _log("debug", "CSS injected");
}
function _getPermissionsMode() {
  const gs = _getPort("globalState");
  if (gs && gs.get) {
    const gsMode = gs.get("permissions.mode");
    if (gsMode) return gsMode;
  }
  if (hasWindow && window.Permissions && window.Permissions.getMode) {
    return window.Permissions.getMode();
  }
  return "allow-all";
}
function _subscribeToModeChanges() {
  const eb = _getPort("eventBus");
  if (eb && eb.on) {
    const cleanup = eb.on(PERMISSIONS_EVENTS.MODE_CHANGED, (data) => {
      const newMode = data && data.mode || "allow-all";
      if (newMode !== _config.permissionsMode) {
        _log("debug", "Permissions mode changed", { from: _config.permissionsMode, to: newMode });
        _config.permissionsMode = newMode;
        _reprocessAll();
      }
    });
    if (typeof cleanup === "function") _cleanups.push(cleanup);
  }
  const gs = _getPort("globalState");
  if (gs && gs.onChange) {
    _state.modeSubscription = gs.onChange("permissions.mode", (newMode, oldMode) => {
      if (newMode !== _config.permissionsMode) {
        _log("debug", "GlobalState permissions.mode changed", { from: oldMode, to: newMode });
        _config.permissionsMode = newMode;
        _reprocessAll();
      }
    });
  }
}
function _getPermissions() {
  return hasWindow ? window.Permissions : null;
}
function _checkPermission(triggerId, regionId) {
  if (_config.permissionsMode === "allow-all") {
    return true;
  }
  const perms = _getPermissions();
  if (!perms) return true;
  if (triggerId) {
    const canTrigger = perms.canTrigger(triggerId);
    if (canTrigger === false) return false;
  }
  if (regionId) {
    const canAccess = perms.canAccessRegion(regionId);
    if (canAccess === false) return false;
  }
  return true;
}
function _processElement(element) {
  if (!element || element.hasAttribute(_config.processedAttr)) return;
  const triggerId = element.getAttribute(_config.triggerAttr);
  const regionId = element.getAttribute(_config.regionAttr);
  if (!triggerId && !regionId) return;
  const allowed = _checkPermission(triggerId, regionId);
  element.setAttribute(_config.processedAttr, "true");
  _state.processedCount++;
  if (allowed) {
    element.classList.remove(_config.hiddenClass, _config.disabledClass);
    element.removeAttribute("data-uarps-blocked");
    element.removeAttribute("data-uarps-tooltip");
    return;
  }
  element.classList.add("uarps-transition");
  if (_config.mode === "hide" || _config.mode === "both") {
    element.classList.add(_config.hiddenClass);
    _state.hiddenCount++;
  }
  if (_config.mode === "disable" || _config.mode === "both") {
    element.classList.add(_config.disabledClass);
    element.setAttribute("data-uarps-blocked", "true");
    element.setAttribute("data-uarps-tooltip", _config.tooltipText);
    element.setAttribute("aria-disabled", "true");
    element.setAttribute("tabindex", "-1");
    _state.disabledCount++;
  }
  if (_config.debug) {
    _log("debug", "Element blocked", { triggerId, regionId, mode: _config.mode, permissionsMode: _config.permissionsMode });
  }
}
function _scanContainer(container) {
  if (!container) container = hasDocument ? document.body : null;
  if (!container) return 0;
  const triggerElements = container.querySelectorAll(`[${_config.triggerAttr}]`);
  const regionElements = container.querySelectorAll(`[${_config.regionAttr}]`);
  let count = 0;
  triggerElements.forEach((el) => {
    _processElement(el);
    count++;
  });
  regionElements.forEach((el) => {
    if (!el.hasAttribute(_config.triggerAttr)) {
      _processElement(el);
      count++;
    }
  });
  _state.lastScan = Date.now();
  if (_config.debug) {
    _log("debug", "Scan complete", { count, hidden: _state.hiddenCount, disabled: _state.disabledCount, permissionsMode: _config.permissionsMode });
  }
  return count;
}
function _reprocessAll() {
  if (!hasDocument) return 0;
  document.querySelectorAll(`[${_config.processedAttr}]`).forEach((el) => {
    el.removeAttribute(_config.processedAttr);
    el.classList.remove(_config.hiddenClass, _config.disabledClass);
    el.removeAttribute("data-uarps-blocked");
    el.removeAttribute("data-uarps-tooltip");
  });
  _state.processedCount = 0;
  _state.hiddenCount = 0;
  _state.disabledCount = 0;
  return _scanContainer();
}
function _setupObserver() {
  if (_state.observer) return;
  if (!_config.observerEnabled) return;
  if (!hasDocument) return;
  _state.observer = new MutationObserver((mutations) => {
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.hasAttribute && (node.hasAttribute(_config.triggerAttr) || node.hasAttribute(_config.regionAttr))) {
            _processElement(node);
          }
          if (node.querySelectorAll) {
            node.querySelectorAll(`[${_config.triggerAttr}], [${_config.regionAttr}]`).forEach(_processElement);
          }
        }
      });
    }
  });
  _state.observer.observe(document.body, { childList: true, subtree: true });
  _log("debug", "MutationObserver started");
}
function _stopObserver() {
  if (_state.observer) {
    _state.observer.disconnect();
    _state.observer = null;
    _log("debug", "MutationObserver stopped");
  }
}
function init(options) {
  if (!options) options = {};
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  Object.assign(_config, options);
  _config.permissionsMode = _getPermissionsMode();
  _log("debug", "Starting with permissions mode", { permissionsMode: _config.permissionsMode });
  _injectCSS();
  _subscribeToModeChanges();
  _scanContainer();
  _setupObserver();
  const eb = _getPort("eventBus");
  if (eb && eb.on) {
    const cleanup1 = eb.on(PERMISSIONS_EVENTS.CHANGED, () => {
      _reprocessAll();
    });
    if (typeof cleanup1 === "function") _cleanups.push(cleanup1);
    const cleanup2 = eb.on(AUTH_EVENTS.LOGIN_SUCCESS, () => {
      setTimeout(_reprocessAll, 500);
    });
    if (typeof cleanup2 === "function") _cleanups.push(cleanup2);
    const cleanup3 = eb.on(AUTH_EVENTS.LOGOUT, () => {
      _reprocessAll();
    });
    if (typeof cleanup3 === "function") _cleanups.push(cleanup3);
  }
  _state.initialized = true;
  _log("debug", "UI Feedback initialized (P25 compliant)", { mode: _config.mode, permissionsMode: _config.permissionsMode, cleanups: _cleanups.length });
  return { ok: true, alreadyInitialized: false };
}
function scan(container) {
  return _scanContainer(container);
}
function reprocess() {
  return _reprocessAll();
}
function setMode(mode) {
  if (["hide", "disable", "both"].indexOf(mode) >= 0) {
    _config.mode = mode;
    _reprocessAll();
    _log("debug", "UI mode changed", { mode });
  }
}
function getMode() {
  return _config.mode;
}
function getPermissionsMode() {
  return _config.permissionsMode;
}
function setDebug(enabled) {
  _config.debug = enabled;
}
function destroy() {
  _stopObserver();
  _cleanups.forEach((cleanup) => {
    try {
      if (typeof cleanup === "function") cleanup();
    } catch (e) {
    }
  });
  _cleanups = [];
  if (_state.modeSubscription && typeof _state.modeSubscription === "function") {
    _state.modeSubscription();
    _state.modeSubscription = null;
  }
  if (hasDocument) {
    document.querySelectorAll(`[${_config.processedAttr}]`).forEach((el) => {
      el.removeAttribute(_config.processedAttr);
      el.classList.remove(_config.hiddenClass, _config.disabledClass, "uarps-transition");
      el.removeAttribute("data-uarps-blocked");
      el.removeAttribute("data-uarps-tooltip");
      el.removeAttribute("aria-disabled");
    });
    const style = document.getElementById("uarps-ui-feedback-styles");
    if (style) style.remove();
  }
  _state.initialized = false;
  _state.processedCount = 0;
  _state.hiddenCount = 0;
  _state.disabledCount = 0;
  _log("debug", "UI Feedback destroyed (P25 compliant)");
}
function markTrigger(element, triggerId) {
  if (!element) return;
  element.setAttribute(_config.triggerAttr, triggerId);
  _processElement(element);
}
function markRegion(element, regionId) {
  if (!element) return;
  element.setAttribute(_config.regionAttr, regionId);
  _processElement(element);
}
function unmark(element) {
  if (!element) return;
  element.removeAttribute(_config.triggerAttr);
  element.removeAttribute(_config.regionAttr);
  element.removeAttribute(_config.processedAttr);
  element.classList.remove(_config.hiddenClass, _config.disabledClass);
  element.removeAttribute("data-uarps-blocked");
  element.removeAttribute("data-uarps-tooltip");
}
function healthCheck() {
  const ps = Ports.snapshot();
  const gs = _getPort("globalState");
  const eb = _getPort("eventBus");
  const logger = _getPort("logger");
  return {
    status: _state.initialized ? "HEALTHY" : "IDLE",
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _state.initialized,
    uiMode: _config.mode,
    permissionsMode: _config.permissionsMode,
    observerActive: !!_state.observer,
    cleanups: _cleanups.length,
    stats: {
      processed: _state.processedCount,
      hidden: _state.hiddenCount,
      disabled: _state.disabledCount
    },
    lastScan: _state.lastScan,
    globalStateConnected: !!(gs && gs.get),
    eventBusConnected: !!(eb && eb.on),
    loggerAvailable: !!logger,
    portsInitialized: ps._initialized,
    p25Compliant: true,
    timestamp: Date.now()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _state.initialized,
    cleanups: _cleanups.length,
    config: Object.assign({}, _config),
    stats: {
      processed: _state.processedCount,
      hidden: _state.hiddenCount,
      disabled: _state.disabledCount
    },
    p25Compliant: true,
    timestamp: Date.now()
  };
}
const UIFeedback = {
  VERSION,
  MODULE_ID,
  init,
  scan,
  reprocess,
  setMode,
  getMode,
  getPermissionsMode,
  setDebug,
  destroy,
  markTrigger,
  markRegion,
  unmark,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
if (hasWindow) {
  window.PermissionsUIFeedback = UIFeedback;
}
export {
  MODULE_ID,
  VERSION,
  UIFeedback as default,
  destroy,
  getMode,
  getPermissionsMode,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  markRegion,
  markTrigger,
  reprocess,
  scan,
  setDebug,
  setMode,
  unmark
};
