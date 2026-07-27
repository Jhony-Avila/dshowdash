import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "11.3.0-UNDO-ACTION";
const MODULE_ID = "panel-nav-admin.ui.toast-manager";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const ICONS = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};
class ToastManager {
  /**
   * @param {Object} [options]
   * @param {HTMLElement} [options.container] — Parent element for toasts
   * @param {number} [options.maxVisible=5] — Maximum simultaneous toasts
   * @param {number} [options.defaultDuration=4000] — Default auto-dismiss in ms
   * @param {string} [options.position='top-right'] — Position class
   */
  constructor(options = {}) {
    this.maxVisible = options.maxVisible || 5;
    this.defaultDuration = options.defaultDuration || 4e3;
    this.position = options.position || "top-right";
    this._container = options.container || null;
    this._toasts = [];
    this._count = 0;
  }
  /** @private Ensure container exists */
  _ensureContainer() {
    if (this._container) return this._container;
    if (typeof document === "undefined") return null;
    let el = document.querySelector(".pna-toast-container");
    if (!el) {
      el = document.createElement("div");
      el.className = "pna-toast-container pna-toast-container--" + this.position;
      document.body.appendChild(el);
    }
    this._container = el;
    return el;
  }
  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} [type='info']
   * @param {number} [duration] — 0 for permanent
   * @returns {string} Toast ID
   */
  show(message, type, duration) {
    if (!type) type = "info";
    if (duration === void 0) duration = this.defaultDuration;
    const container = this._ensureContainer();
    if (!container) return "";
    while (this._toasts.length >= this.maxVisible) {
      this._removeOldest();
    }
    const id = "pna-toast-" + ++this._count;
    const icon = ICONS[type] || ICONS.info;
    const el = document.createElement("div");
    el.id = id;
    el.className = "pna-toast pna-toast--" + type;
    el.setAttribute("role", "alert");
    el.innerHTML = '<div class="pna-toast__icon">' + icon + '</div><div class="pna-toast__message">' + message + '</div><button class="pna-toast__close" aria-label="Fechar">&times;</button>';
    container.appendChild(el);
    requestAnimationFrame(() => {
      el.classList.add("pna-toast--show");
    });
    const closeBtn = el.querySelector(".pna-toast__close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.dismiss(id), { once: true });
    }
    let timer = null;
    if (duration > 0) {
      timer = setTimeout(() => this.dismiss(id), duration);
    }
    this._toasts.push({ id, el, timer });
    return id;
  }
  /**
   * Show a toast with an action button (e.g., Undo).
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {string} actionLabel — Button text (e.g., "Desfazer")
   * @param {Function} onAction — Callback when action button is clicked
   * @param {number} [duration=5000] — Auto-dismiss time
   * @returns {string} Toast ID
   */
  showWithAction(message, type, actionLabel, onAction, duration) {
    if (!type) type = "info";
    if (duration === void 0) duration = 5e3;
    const container = this._ensureContainer();
    if (!container) return "";
    while (this._toasts.length >= this.maxVisible) {
      this._removeOldest();
    }
    const id = "pna-toast-" + ++this._count;
    const icon = ICONS[type] || ICONS.info;
    const el = document.createElement("div");
    el.id = id;
    el.className = "pna-toast pna-toast--" + type + " pna-toast--with-action";
    el.setAttribute("role", "alert");
    el.innerHTML = '<div class="pna-toast__icon">' + icon + '</div><div class="pna-toast__message">' + message + '</div><button class="pna-toast__action">' + actionLabel + '</button><button class="pna-toast__close" aria-label="Fechar">&times;</button>';
    container.appendChild(el);
    requestAnimationFrame(() => {
      el.classList.add("pna-toast--show");
    });
    const closeBtn = el.querySelector(".pna-toast__close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.dismiss(id), { once: true });
    }
    const actionBtn = el.querySelector(".pna-toast__action");
    if (actionBtn) {
      actionBtn.addEventListener("click", () => {
        onAction();
        this.dismiss(id);
      }, { once: true });
    }
    let timer = null;
    if (duration > 0) {
      timer = setTimeout(() => this.dismiss(id), duration);
    }
    this._toasts.push({ id, el, timer });
    return id;
  }
  /**
   * Dismiss a toast by ID.
   * @param {string} id
   */
  dismiss(id) {
    const idx = this._toasts.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const toast = this._toasts[idx];
    if (toast.timer) clearTimeout(toast.timer);
    toast.el.classList.remove("pna-toast--show");
    toast.el.classList.add("pna-toast--hide");
    const onEnd = () => {
      toast.el.removeEventListener("transitionend", onEnd);
      toast.el.remove();
    };
    toast.el.addEventListener("transitionend", onEnd);
    setTimeout(() => {
      if (toast.el.parentNode) toast.el.remove();
    }, 500);
    this._toasts.splice(idx, 1);
  }
  /** Dismiss all visible toasts. */
  dismissAll() {
    const ids = this._toasts.map((t) => t.id);
    ids.forEach((id) => this.dismiss(id));
  }
  /** @private Remove the oldest toast */
  _removeOldest() {
    if (this._toasts.length > 0) {
      this.dismiss(this._toasts[0].id);
    }
  }
  /** Shorthand methods */
  success(msg, dur) {
    return this.show(msg, "success", dur);
  }
  error(msg, dur) {
    return this.show(msg, "error", dur);
  }
  warning(msg, dur) {
    return this.show(msg, "warning", dur);
  }
  info(msg, dur) {
    return this.show(msg, "info", dur);
  }
  /** Cleanup — remove container and all toasts. */
  destroy() {
    this.dismissAll();
    if (this._container && this._container.parentNode) {
      this._container.remove();
    }
    this._container = null;
    this._toasts = [];
  }
}
function createToastManager(options = {}) {
  return new ToastManager(options);
}
let _sharedInstance = null;
function _shared() {
  if (!_sharedInstance) _sharedInstance = new ToastManager();
  return _sharedInstance;
}
function show(msg, type, dur) {
  return _shared().show(msg, type, dur);
}
function toastSuccess(msg, dur) {
  return _shared().success(msg, dur);
}
function toastError(msg, dur) {
  return _shared().error(msg, dur);
}
function toastWarning(msg, dur) {
  return _shared().warning(msg, dur);
}
function toastInfo(msg, dur) {
  return _shared().info(msg, dur);
}
function toastWithAction(msg, type, actionLabel, onAction, dur) {
  return _shared().showWithAction(msg, type, actionLabel, onAction, dur);
}
function moduleInfo() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var toast_manager_default = {
  ToastManager,
  createToastManager,
  show,
  toastSuccess,
  toastError,
  toastWarning,
  toastInfo,
  toastWithAction,
  moduleInfo,
  healthCheck,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  ToastManager,
  VERSION,
  createToastManager,
  toast_manager_default as default,
  getPorts,
  healthCheck,
  injectPorts,
  moduleInfo,
  show,
  toastError,
  toastInfo,
  toastSuccess,
  toastWarning,
  toastWithAction
};
