import { createLogger } from "/assets/js/core/logger-global/index.js";
import { KERNEL_RUNTIME_EVENTS } from "/core/runtime/events/catalog/kernel.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "sidebar/runtime-context-handler";
const VERSION = "1.6.0-P0-ENTERPRISE";
const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}
function _getEventBus() {
  _initPorts();
  return Ports.get("eventBus");
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _logger = createLogger(MODULE_ID);
function _resolveRuntimeContext() {
  if (typeof window === "undefined") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const rc = window.Core.windowAdapter.get("RuntimeContext");
    if (rc) return rc;
  }
  return window.RuntimeContext || null;
}
let _cleanups = [];
let _metrics = {
  updatesReceived: 0,
  readyReceived: 0,
  modeChanges: 0,
  authChanges: 0,
  errorsCount: 0
};
let _lastSnapshot = null;
function _log(level, msg, data) {
  const context = data ? { data } : {};
  if (level === "error") _logger.error(msg, context);
  else if (level === "warn") _logger.warn(msg, context);
  else _logger.debug(msg, context);
}
const SIDEBAR_SELECTORS = [
  ".sidebar",
  ".nav-rail",
  '[data-component="sidebar"]',
  "#sidebar"
];
function _getSidebarElement() {
  for (let i = 0; i < SIDEBAR_SELECTORS.length; i++) {
    const el = document.querySelector(SIDEBAR_SELECTORS[i]);
    if (el) return el;
  }
  return null;
}
function _updateSidebarAttributes(snapshot) {
  const sidebar = _getSidebarElement();
  if (!sidebar) {
    _log("warn", "Sidebar element not found");
    return false;
  }
  sidebar.setAttribute("data-kernel-mode", snapshot.mode || "UNKNOWN");
  sidebar.setAttribute("data-kernel-ready", snapshot.ready ? "true" : "false");
  sidebar.setAttribute("data-kernel-authenticated", snapshot.authenticated ? "true" : "false");
  const classList = sidebar.className.split(" ");
  for (let i = classList.length - 1; i >= 0; i--) {
    if (classList[i].indexOf("kernel-mode-") === 0) {
      sidebar.classList.remove(classList[i]);
    }
  }
  sidebar.classList.add(`kernel-mode-${snapshot.mode || "UNKNOWN"}`);
  if (snapshot.authenticated) {
    sidebar.classList.add("sidebar-authenticated");
    sidebar.classList.remove("sidebar-anonymous");
  } else {
    sidebar.classList.remove("sidebar-authenticated");
    sidebar.classList.add("sidebar-anonymous");
  }
  return true;
}
function _handleMaintenanceMode(snapshot) {
  _log("warn", "Sistema em MAINTENANCE - desabilitando navegacao");
  const sidebar = _getSidebarElement();
  if (!sidebar) return;
  sidebar.classList.add("sidebar-maintenance");
  const navItems = sidebar.querySelectorAll("a, button, [data-nav-item]");
  for (let i = 0; i < navItems.length; i++) {
    navItems[i].setAttribute("data-disabled-by", "maintenance");
    navItems[i].style.pointerEvents = "none";
    navItems[i].style.opacity = "0.5";
  }
}
function _handleFailedMode(snapshot) {
  _log("error", "Sistema em FAILED - sidebar em modo minimo");
  const sidebar = _getSidebarElement();
  if (!sidebar) return;
  sidebar.classList.add("sidebar-failed");
  const nonEssential = sidebar.querySelectorAll('[data-essential="false"], .nav-item:not([data-essential="true"])');
  for (let i = 0; i < nonEssential.length; i++) {
    nonEssential[i].style.display = "none";
  }
}
function _handleNormalMode(snapshot) {
  const sidebar = _getSidebarElement();
  if (!sidebar) return;
  sidebar.classList.remove("sidebar-maintenance", "sidebar-failed", "sidebar-degraded");
  const disabledItems = sidebar.querySelectorAll('[data-disabled-by="maintenance"]');
  for (let i = 0; i < disabledItems.length; i++) {
    disabledItems[i].removeAttribute("data-disabled-by");
    disabledItems[i].style.pointerEvents = "";
    disabledItems[i].style.opacity = "";
  }
  const hiddenItems = sidebar.querySelectorAll('[data-essential="false"], .nav-item:not([data-essential="true"])');
  for (let i = 0; i < hiddenItems.length; i++) {
    hiddenItems[i].style.display = "";
  }
}
function _handleDegradedMode(snapshot) {
  _log("warn", "Sistema em DEGRADED - funcionalidades reduzidas");
  const sidebar = _getSidebarElement();
  if (!sidebar) return;
  sidebar.classList.add("sidebar-degraded");
}
function _handleAuthChange(snapshot, wasAuthenticated) {
  _metrics.authChanges++;
  const sidebar = _getSidebarElement();
  if (!sidebar) return;
  if (!snapshot.authenticated && wasAuthenticated) {
    _log("info", "Usuario deslogou - atualizando sidebar");
    const authItems = sidebar.querySelectorAll('[data-requires-auth="true"]');
    for (let i = 0; i < authItems.length; i++) {
      authItems[i].style.display = "none";
    }
    const loginItems = sidebar.querySelectorAll('[data-show-anonymous="true"]');
    for (let i = 0; i < loginItems.length; i++) {
      loginItems[i].style.display = "";
    }
  } else if (snapshot.authenticated && !wasAuthenticated) {
    _log("info", "Usuario logou - atualizando sidebar");
    const authItems = sidebar.querySelectorAll('[data-requires-auth="true"]');
    for (let i = 0; i < authItems.length; i++) {
      authItems[i].style.display = "";
    }
    const loginItems = sidebar.querySelectorAll('[data-show-anonymous="true"]');
    for (let i = 0; i < loginItems.length; i++) {
      loginItems[i].style.display = "none";
    }
  }
}
function handleRuntimeContextUpdated(data) {
  try {
    const snapshot = data && data.snapshot ? data.snapshot : null;
    const trigger = data && data.trigger ? data.trigger : "unknown";
    if (!snapshot) {
      _log("warn", "RuntimeContext update sem snapshot");
      return;
    }
    _metrics.updatesReceived++;
    const previousSnapshot = _lastSnapshot;
    _lastSnapshot = snapshot;
    _log("info", "RuntimeContext updated", {
      trigger,
      mode: snapshot.mode,
      authenticated: snapshot.authenticated
    });
    _updateSidebarAttributes(snapshot);
    const previousMode = previousSnapshot ? previousSnapshot.mode : null;
    if (snapshot.mode !== previousMode) {
      _metrics.modeChanges++;
      switch (snapshot.mode) {
        case "MAINTENANCE":
          _handleMaintenanceMode(snapshot);
          break;
        case "FAILED":
          _handleFailedMode(snapshot);
          break;
        case "DEGRADED":
          _handleDegradedMode(snapshot);
          break;
        case "NORMAL":
          _handleNormalMode(snapshot);
          break;
      }
    }
    const wasAuthenticated = previousSnapshot ? previousSnapshot.authenticated : null;
    if (trigger === "auth-change" || snapshot.authenticated !== wasAuthenticated) {
      _handleAuthChange(snapshot, wasAuthenticated);
    }
  } catch (e) {
    _metrics.errorsCount++;
    _log("error", "handleRuntimeContextUpdated error", e.message);
  }
}
function handleRuntimeContextReady(data) {
  try {
    const snapshot = data && data.snapshot ? data.snapshot : null;
    _metrics.readyReceived++;
    _lastSnapshot = snapshot;
    _log("info", "RuntimeContext ready", {
      mode: snapshot ? snapshot.mode : "N/A",
      authenticated: snapshot ? snapshot.authenticated : "N/A"
    });
    if (snapshot) {
      _updateSidebarAttributes(snapshot);
      if (snapshot.mode === "MAINTENANCE") {
        _handleMaintenanceMode(snapshot);
      } else if (snapshot.mode === "FAILED") {
        _handleFailedMode(snapshot);
      } else if (snapshot.mode === "DEGRADED") {
        _handleDegradedMode(snapshot);
      }
      _handleAuthChange(snapshot, null);
    }
  } catch (e) {
    _metrics.errorsCount++;
    _log("error", "handleRuntimeContextReady error", e.message);
  }
}
function setup() {
  const eb = _getEventBus();
  if (!eb || !eb.on) {
    _log("warn", "EventBus nao disponivel - tentando com RuntimeContext.subscribeWithReplay");
    const rc2 = _resolveRuntimeContext();
    if (rc2 && rc2.subscribeWithReplay) {
      const unsub = rc2.subscribeWithReplay((snapshot, data) => {
        handleRuntimeContextUpdated({ snapshot, trigger: data ? data.trigger : "subscription" });
      }, { replayReady: true });
      if (unsub) _cleanups.push(unsub);
      _log("info", "Usando RuntimeContext.subscribeWithReplay");
      return { ok: true, method: "subscribeWithReplay" };
    }
    return { ok: false, error: "EventBus not available" };
  }
  const unsub1 = eb.on(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_UPDATED, handleRuntimeContextUpdated);
  const unsub2 = eb.on(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_READY, handleRuntimeContextReady);
  if (unsub1) _cleanups.push(unsub1);
  if (unsub2) _cleanups.push(unsub2);
  _log("info", `RuntimeContext handlers configurados (${_cleanups.length} listeners)`);
  const rc = _resolveRuntimeContext();
  if (rc && rc.hasEmittedReady && rc.hasEmittedReady()) {
    const snapshot = rc.getSnapshot();
    handleRuntimeContextReady({ snapshot });
    _log("info", "Replay do estado inicial executado");
  }
  return { ok: true, listeners: _cleanups.length };
}
function cleanup() {
  for (let i = 0; i < _cleanups.length; i++) {
    try {
      if (typeof _cleanups[i] === "function") {
        _cleanups[i]();
      }
    } catch (e) {
      _log("error", "Cleanup error", e.message);
    }
  }
  _cleanups = [];
  _log("info", "RuntimeContext handlers removidos");
}
function healthCheck() {
  return {
    status: _cleanups.length > 0 ? "HEALTHY" : "NOT_CONFIGURED",
    moduleId: MODULE_ID,
    version: VERSION,
    p0Enterprise: true,
    portsInitialized: _portsInitialized,
    listenersCount: _cleanups.length,
    lastSnapshot: _lastSnapshot,
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    configured: _cleanups.length > 0,
    listenersCount: _cleanups.length,
    metrics: Object.assign({}, _metrics),
    lastSnapshot: _lastSnapshot ? {
      mode: _lastSnapshot.mode,
      authenticated: _lastSnapshot.authenticated
    } : null
  };
}
var runtime_context_handler_default = {
  MODULE_ID,
  VERSION,
  setup,
  cleanup,
  handleRuntimeContextUpdated,
  handleRuntimeContextReady,
  healthCheck,
  getMetrics,
  info
};
export {
  MODULE_ID,
  VERSION,
  cleanup,
  runtime_context_handler_default as default,
  getMetrics,
  getPorts,
  handleRuntimeContextReady,
  handleRuntimeContextUpdated,
  healthCheck,
  info,
  injectPorts,
  setup
};
