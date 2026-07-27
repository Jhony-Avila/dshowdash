import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
const MODULE_ID = "main.feature.ux-feedback";
const VERSION = "1.0.0-ENTERPRISE";
const FEEDBACK_TYPES = Object.freeze({
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info"
});
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
let _enabled = false;
let _cleanups = [];
const _activeToasts = /* @__PURE__ */ new Map();
let _toastContainer = null;
let _toastIdCounter = 0;
let _config = {
  position: "bottom-right",
  duration: 3e3,
  maxToasts: 5,
  animationDuration: 300
};
const _metrics = {
  inits: 0,
  toastsShown: 0,
  toastsByType: { loading: 0, success: 0, error: 0, warning: 0, info: 0 }
};
function _createContainer() {
  if (_toastContainer) return _toastContainer;
  _toastContainer = document.createElement("div");
  _toastContainer.id = "ux-feedback-container";
  _toastContainer.style.cssText = `position:fixed;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;${_getPositionStyles()}`;
  document.body.appendChild(_toastContainer);
  return _toastContainer;
}
function _getPositionStyles() {
  const pos = _config.position;
  if (pos === "top-right") return "top:20px;right:20px;";
  if (pos === "top-left") return "top:20px;left:20px;";
  if (pos === "bottom-left") return "bottom:20px;left:20px;";
  return "bottom:20px;right:20px;";
}
function _getTypeStyles(type) {
  const styles = {
    loading: "background:#3b82f6;color:white;",
    success: "background:#10b981;color:white;",
    error: "background:#ef4444;color:white;",
    warning: "background:#f59e0b;color:white;",
    info: "background:#6366f1;color:white;"
  };
  return styles[type] || styles.info;
}
function _getTypeIcon(type) {
  const icons = {
    loading: "\u23F3",
    success: "\u2713",
    error: "\u2715",
    warning: "\u26A0",
    info: "\u2139"
  };
  return icons[type] || icons.info;
}
function _createToast(id, type, message, options) {
  const toast = document.createElement("div");
  toast.id = `toast-${id}`;
  toast.style.cssText = `padding:12px 16px;border-radius:8px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;display:flex;align-items:center;gap:8px;pointer-events:auto;opacity:0;transform:translateX(100%);transition:all ${_config.animationDuration}ms ease;box-shadow:0 4px 12px rgba(0,0,0,0.15);max-width:350px;${_getTypeStyles(type)}`;
  const icon = document.createElement("span");
  icon.textContent = _getTypeIcon(type);
  icon.style.cssText = "font-size:16px;";
  const text = document.createElement("span");
  text.textContent = message;
  text.style.cssText = "flex:1;";
  toast.appendChild(icon);
  toast.appendChild(text);
  if (type !== "loading" && options && options.dismissible !== false) {
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "\xD7";
    closeBtn.style.cssText = "background:none;border:none;color:inherit;font-size:18px;cursor:pointer;padding:0;margin-left:8px;opacity:0.7;";
    closeBtn.onclick = () => {
      hideToast(id);
    };
    toast.appendChild(closeBtn);
  }
  return toast;
}
function init(options) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  try {
    _initPorts();
    _metrics.inits++;
    if (options && options.config) {
      _config = Object.assign({}, _config, options.config);
    }
    if (typeof document !== "undefined") {
      _createContainer();
    }
    const eb = _getPort("eventBus");
    if (eb && eb.on) {
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_START) {
        const navStartHandler = (data) => {
          showLoading("Carregando...", { id: "nav-loading" });
        };
        eb.on(MAIN_EVENTS.NAVIGATION_START, navStartHandler);
        _cleanups.push(() => {
          if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_START, navStartHandler);
        });
      }
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_COMPLETE) {
        const navCompleteHandler = (data) => {
          hideToast("nav-loading");
        };
        eb.on(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler);
        _cleanups.push(() => {
          if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler);
        });
      }
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_ERROR) {
        const navErrorHandler = (data) => {
          hideToast("nav-loading");
          showError("Erro na navega\xE7\xE3o");
        };
        eb.on(MAIN_EVENTS.NAVIGATION_ERROR, navErrorHandler);
        _cleanups.push(() => {
          if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_ERROR, navErrorHandler);
        });
      }
    }
    _enabled = true;
    return { ok: true, version: VERSION };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
function destroy() {
  for (let i = 0; i < _cleanups.length; i++) {
    try {
      _cleanups[i]();
    } catch (e) {
    }
  }
  _cleanups = [];
  _activeToasts.forEach((data, id) => {
    hideToast(id);
  });
  if (_toastContainer && _toastContainer.parentNode) {
    _toastContainer.parentNode.removeChild(_toastContainer);
    _toastContainer = null;
  }
  _enabled = false;
  return { ok: true };
}
const cleanup = destroy;
function show(type, message, options) {
  if (!_enabled || typeof document === "undefined") return { ok: false, error: "Not initialized" };
  const opts = options || {};
  const id = opts.id || `toast-${++_toastIdCounter}`;
  if (_activeToasts.size >= _config.maxToasts) {
    const oldest = _activeToasts.keys().next().value;
    hideToast(oldest);
  }
  if (_activeToasts.has(id)) {
    hideToast(id);
  }
  const toast = _createToast(id, type, message, opts);
  _toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  }, 10);
  let timeoutId = null;
  const duration = opts.duration !== void 0 ? opts.duration : _config.duration;
  if (type !== "loading" && duration > 0) {
    timeoutId = setTimeout(() => {
      hideToast(id);
    }, duration);
  }
  _activeToasts.set(id, { toast, timeoutId, type });
  _metrics.toastsShown++;
  _metrics.toastsByType[type] = (_metrics.toastsByType[type] || 0) + 1;
  return { ok: true, id };
}
function hideToast(id) {
  const data = _activeToasts.get(id);
  if (!data) return { ok: false };
  if (data.timeoutId) {
    clearTimeout(data.timeoutId);
  }
  data.toast.style.opacity = "0";
  data.toast.style.transform = "translateX(100%)";
  setTimeout(() => {
    if (data.toast.parentNode) {
      data.toast.parentNode.removeChild(data.toast);
    }
  }, _config.animationDuration);
  _activeToasts.delete(id);
  return { ok: true };
}
function showLoading(message, options) {
  return show(FEEDBACK_TYPES.LOADING, message || "Carregando...", options);
}
function showSuccess(message, options) {
  return show(FEEDBACK_TYPES.SUCCESS, message || "Sucesso!", options);
}
function showError(message, options) {
  return show(FEEDBACK_TYPES.ERROR, message || "Erro!", Object.assign({ duration: 5e3 }, options || {}));
}
function showWarning(message, options) {
  return show(FEEDBACK_TYPES.WARNING, message || "Aten\xE7\xE3o!", options);
}
function showInfo(message, options) {
  return show(FEEDBACK_TYPES.INFO, message || "Informa\xE7\xE3o", options);
}
function hideAll() {
  _activeToasts.forEach((data, id) => {
    hideToast(id);
  });
  return { ok: true };
}
function updateConfig(newConfig) {
  _config = Object.assign({}, _config, newConfig);
  return { ok: true, config: Object.assign({}, _config) };
}
function getMetrics() {
  return Object.assign({}, _metrics, { activeToasts: _activeToasts.size });
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    feedbackTypes: FEEDBACK_TYPES,
    config: Object.assign({}, _config),
    metrics: getMetrics()
  };
}
function healthCheck() {
  const checks = {
    enabled: _enabled,
    containerExists: !!_toastContainer
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!_enabled) status = "NOT_INITIALIZED";
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}
var ux_feedback_default = {
  MODULE_ID,
  VERSION,
  FEEDBACK_TYPES,
  init,
  destroy,
  cleanup,
  show,
  hideToast,
  showLoading,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  hideAll,
  updateConfig,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  cleanup,
  ux_feedback_default as default,
  destroy,
  getMetrics,
  getPorts,
  healthCheck,
  hideAll,
  hideToast,
  info,
  init,
  injectPorts,
  show,
  showError,
  showInfo,
  showLoading,
  showSuccess,
  showWarning,
  updateConfig
};
