import { createLogger } from "/assets/js/core/logger-global/index.js";
import { KERNEL_RUNTIME_EVENTS } from "/core/runtime/events/catalog/kernel.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "footer/runtime-context-handler";
const VERSION = "1.5.0-P2-ENTERPRISE";
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
let _lastSnapshot = null;
const _metrics = {
  updatesReceived: 0,
  readyReceived: 0,
  modeChanges: 0,
  errorsCount: 0
};
function _log(level, msg, data) {
  const context = data ? { data } : {};
  if (level === "error") _logger.error(msg, context);
  else if (level === "warn") _logger.warn(msg, context);
  else _logger.debug(msg, context);
}
const FOOTER_SELECTORS = [
  ".dsd-footer",
  "footer",
  '[data-component="footer"]',
  "#footer-root"
];
function _getFooterElement() {
  for (let i = 0; i < FOOTER_SELECTORS.length; i++) {
    const el = document.querySelector(FOOTER_SELECTORS[i]);
    if (el) return el;
  }
  return null;
}
function _updateFooterAttributes(snapshot) {
  const footer = _getFooterElement();
  if (!footer) return false;
  footer.setAttribute("data-kernel-mode", snapshot.mode || "UNKNOWN");
  footer.setAttribute("data-kernel-ready", snapshot.ready ? "true" : "false");
  footer.setAttribute("data-kernel-authenticated", snapshot.authenticated ? "true" : "false");
  const classList = footer.className.split(" ");
  for (let i = classList.length - 1; i >= 0; i--) {
    if (classList[i].indexOf("kernel-mode-") === 0) {
      footer.classList.remove(classList[i]);
    }
  }
  footer.classList.add(`kernel-mode-${snapshot.mode || "UNKNOWN"}`);
  return true;
}
function _handleMaintenanceMode(snapshot) {
  _log("warn", "Sistema em MAINTENANCE");
  const footer = _getFooterElement();
  if (!footer) return;
  footer.classList.add("footer-maintenance");
  const statusEl = footer.querySelector(".footer-status-indicator, .dsd-footer__status");
  if (statusEl) {
    statusEl.setAttribute("data-status", "maintenance");
    statusEl.textContent = "Sistema em manutencao";
  }
}
function _handleFailedMode(snapshot) {
  _log("error", "Sistema em FAILED");
  const footer = _getFooterElement();
  if (!footer) return;
  footer.classList.add("footer-failed");
  const statusEl = footer.querySelector(".footer-status-indicator, .dsd-footer__status");
  if (statusEl) {
    statusEl.setAttribute("data-status", "failed");
    statusEl.textContent = "Erro no sistema";
  }
}
function _handleDegradedMode(snapshot) {
  _log("warn", "Sistema em DEGRADED");
  const footer = _getFooterElement();
  if (!footer) return;
  footer.classList.add("footer-degraded");
  const statusEl = footer.querySelector(".footer-status-indicator, .dsd-footer__status");
  if (statusEl) {
    statusEl.setAttribute("data-status", "degraded");
  }
}
function _handleNormalMode(snapshot) {
  const footer = _getFooterElement();
  if (!footer) return;
  footer.classList.remove("footer-maintenance", "footer-failed", "footer-degraded");
  const statusEl = footer.querySelector(".footer-status-indicator, .dsd-footer__status");
  if (statusEl) {
    statusEl.setAttribute("data-status", "normal");
    statusEl.textContent = "";
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
      // @ts-expect-error TS migration - TS2339
      mode: snapshot.mode
    });
    _updateFooterAttributes(snapshot);
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
      // @ts-expect-error TS migration - TS2339
      mode: snapshot ? snapshot.mode : "N/A"
    });
    if (snapshot) {
      _updateFooterAttributes(snapshot);
      if (snapshot.mode === "MAINTENANCE") {
        _handleMaintenanceMode(snapshot);
      } else if (snapshot.mode === "FAILED") {
        _handleFailedMode(snapshot);
      } else if (snapshot.mode === "DEGRADED") {
        _handleDegradedMode(snapshot);
      }
    }
  } catch (e) {
    _metrics.errorsCount++;
    _log("error", "handleRuntimeContextReady error", e.message);
  }
}
function setup() {
  const eb = _getEventBus();
  if (!eb || !eb.on) {
    _log("warn", "EventBus nao disponivel via Ports - tentando RuntimeContext.subscribeWithReplay");
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
  _lastSnapshot = null;
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
      // @ts-expect-error TS migration - TS2339
      mode: _lastSnapshot.mode,
      // @ts-expect-error TS migration - TS2339
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
  info,
  injectPorts,
  getPorts
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
