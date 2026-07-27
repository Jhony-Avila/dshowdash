import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { ICONS } from "../utils/icons.js";
const VERSION = "8.3.0-ENTERPRISE";
const MODULE_ID = "container-toast";
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _getEventBus() {
  return _injectedEventBus;
}
function _emitToEventBus(toastData) {
  try {
    const eb = _getEventBus();
    if (eb?.emit) eb.emit(UI_EVENTS.TOAST_SHOW, { toast: toastData, source: MODULE_ID, timestamp: Date.now() });
  } catch (e) {
  }
}
const TOAST_POSITION = { TOP_LEFT: "top-left", TOP_CENTER: "top-center", TOP_RIGHT: "top-right", BOTTOM_LEFT: "bottom-left", BOTTOM_CENTER: "bottom-center", BOTTOM_RIGHT: "bottom-right" };
const TOAST_TYPE = { INFO: "info", SUCCESS: "success", WARNING: "warning", ERROR: "error" };
function createToast(container, options = {}) {
  const { position = TOAST_POSITION.BOTTOM_RIGHT, maxToasts = 5, defaultDuration = 5e3, pauseOnHover = true, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _containerEl = null;
  let _toasts = [];
  let _idCounter = 0;
  function _createContainerElement() {
    let existing = container.querySelector(".dsd-toast-container");
    if (existing) return existing;
    const toastContainer = document.createElement("div");
    toastContainer.className = `dsd-toast-container dsd-toast-container--${position}`;
    toastContainer.setAttribute("role", "region");
    toastContainer.setAttribute("aria-live", "polite");
    toastContainer.setAttribute("aria-label", "Notifica\xE7\xF5es");
    container.appendChild(toastContainer);
    return toastContainer;
  }
  function _createToastElement(toastData) {
    const toast = document.createElement("div");
    toast.className = `dsd-toast dsd-toast--${toastData.type}`;
    toast.dataset.toastId = toastData.id;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-atomic", "true");
    toast.innerHTML = `<span class="dsd-toast__icon">${ICONS[toastData.type] || ICONS.info}</span><div class="dsd-toast__content">${toastData.title ? `<div class="dsd-toast__title">${toastData.title}</div>` : ""}<div class="dsd-toast__message">${toastData.message}</div></div>${toastData.action ? `<button type="button" class="dsd-toast__action" data-action="${toastData.action.id}">${toastData.action.label}</button>` : ""}${toastData.dismissible !== false ? `<button type="button" class="dsd-toast__close" aria-label="Fechar">${ICONS.closeSmall}</button>` : ""}${toastData.duration > 0 ? '<div class="dsd-toast__progress" role="progressbar" aria-hidden="true"></div>' : ""}`;
    toastData._listeners = [];
    const closeBtn = toast.querySelector(".dsd-toast__close");
    if (closeBtn) {
      const closeHandler = () => toastApi.dismiss(toastData.id);
      closeBtn.addEventListener("click", closeHandler);
      toastData._listeners.push({ el: closeBtn, type: "click", handler: closeHandler });
    }
    const actionBtn = toast.querySelector(".dsd-toast__action");
    if (actionBtn) {
      const actionHandler = () => {
        toastData.action?.onClick?.();
        toastApi.dismiss(toastData.id);
      };
      actionBtn.addEventListener("click", actionHandler);
      toastData._listeners.push({ el: actionBtn, type: "click", handler: actionHandler });
    }
    if (pauseOnHover && toastData.duration > 0) {
      const enterHandler = () => {
        toast.classList.add("dsd-toast--paused");
        if (toastData._timeout) clearTimeout(toastData._timeout);
      };
      const leaveHandler = () => {
        toast.classList.remove("dsd-toast--paused");
        toastData._timeout = setTimeout(() => {
          toastApi.dismiss(toastData.id);
        }, toastData._remainingTime || toastData.duration);
      };
      toast.addEventListener("mouseenter", enterHandler);
      toast.addEventListener("mouseleave", leaveHandler);
      toastData._listeners.push({ el: toast, type: "mouseenter", handler: enterHandler });
      toastData._listeners.push({ el: toast, type: "mouseleave", handler: leaveHandler });
    }
    return toast;
  }
  function _cleanupToastListeners(toastData) {
    if (toastData._listeners) {
      toastData._listeners.forEach(({ el, type, handler }) => {
        el.removeEventListener(type, handler);
      });
      toastData._listeners = [];
    }
  }
  const toastApi = {
    init() {
      if (_initialized) return this;
      _containerEl = _createContainerElement();
      _initialized = true;
      return this;
    },
    show(messageOrOptions, type = TOAST_TYPE.INFO) {
      if (!_initialized) this.init();
      const toastData = Object.assign({ id: "", type, duration: 0 }, typeof messageOrOptions === "string" ? { message: messageOrOptions } : messageOrOptions);
      toastData.id = `toast-${++_idCounter}`;
      toastData.duration = toastData.duration ?? defaultDuration;
      while (_toasts.length >= Number(maxToasts)) {
        const oldest = _toasts.shift();
        this.dismiss(oldest.id);
      }
      _toasts.push(toastData);
      const toastEl = _createToastElement(toastData);
      _containerEl.appendChild(toastEl);
      requestAnimationFrame(() => {
        toastEl.classList.add("dsd-toast--visible");
      });
      if (toastData.duration > 0) {
        const progress = toastEl.querySelector(".dsd-toast__progress");
        if (progress) progress.style.animationDuration = `${toastData.duration}ms`;
        toastData._timeout = setTimeout(() => {
          this.dismiss(toastData.id);
        }, toastData.duration);
      }
      _emitToEventBus(toastData);
      return toastData.id;
    },
    info(message, options2 = {}) {
      return this.show({ message, ...options2 }, TOAST_TYPE.INFO);
    },
    success(message, options2 = {}) {
      return this.show({ message, ...options2 }, TOAST_TYPE.SUCCESS);
    },
    warning(message, options2 = {}) {
      return this.show({ message, ...options2 }, TOAST_TYPE.WARNING);
    },
    error(message, options2 = {}) {
      return this.show({ message, ...options2 }, TOAST_TYPE.ERROR);
    },
    dismiss(id) {
      const index = _toasts.findIndex((t) => t.id === id);
      if (index === -1) return false;
      const toastData = _toasts[index];
      if (toastData._timeout) clearTimeout(toastData._timeout);
      _cleanupToastListeners(toastData);
      const toastEl = _containerEl?.querySelector(`[data-toast-id="${id}"]`);
      if (toastEl) {
        toastEl.classList.remove("dsd-toast--visible");
        toastEl.classList.add("dsd-toast--dismissing");
        toastEl.addEventListener("animationend", () => {
          toastEl.remove();
        }, { once: true });
        setTimeout(() => toastEl.remove(), 300);
      }
      _toasts.splice(index, 1);
      return true;
    },
    dismissAll() {
      [..._toasts].forEach((t) => this.dismiss(t.id));
      return this;
    },
    getAll() {
      return [..._toasts];
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      _toasts.forEach((t) => {
        if (t._timeout) clearTimeout(t._timeout);
        _cleanupToastListeners(t);
      });
      _toasts = [];
      _containerEl?.remove();
      _containerEl = null;
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, position, activeToasts: _toasts.length, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true };
    }
  };
  return toastApi;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true };
}
var toast_default = { createToast, injectEventBus, info, healthCheck, VERSION, MODULE_ID, TOAST_POSITION, TOAST_TYPE };
export {
  MODULE_ID,
  TOAST_POSITION,
  TOAST_TYPE,
  VERSION,
  createToast,
  toast_default as default,
  healthCheck,
  info,
  injectEventBus
};
