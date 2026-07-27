import { ICONS } from "../utils/icons.js";
const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-modal";
import { createLogger } from "../utils/logger.js";
const logger = createLogger(MODULE_ID);
let _injectedEventBus = null;
let _activeModals = [];
let _modalCounter = 0;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _emitEvent(eventType, payload) {
  if (_injectedEventBus?.emit) {
    _injectedEventBus.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
  }
}
const MODAL_SIZE = { SM: "sm", MD: "md", LG: "lg", XL: "xl", FULL: "full" };
const MODAL_POSITION = { CENTER: "center", TOP: "top", RIGHT: "right", BOTTOM: "bottom", LEFT: "left" };
function _validateOptions(options) {
  const errors = [];
  if (options.size && !Object.values(MODAL_SIZE).includes(options.size)) {
    errors.push(`size must be one of: ${Object.values(MODAL_SIZE).join(", ")}`);
  }
  if (options.position && !Object.values(MODAL_POSITION).includes(options.position)) {
    errors.push(`position must be one of: ${Object.values(MODAL_POSITION).join(", ")}`);
  }
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
function createModal(options = {}) {
  _validateOptions(options);
  const {
    title = "",
    content = "",
    size = MODAL_SIZE.MD,
    position = MODAL_POSITION.CENTER,
    closable = true,
    closeOnEscape = true,
    closeOnBackdrop = true,
    showHeader = true,
    showFooter = false,
    footerButtons = [],
    className = "",
    onOpen,
    onClose,
    onConfirm,
    eventBus
  } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  const modalId = `modal-${++_modalCounter}`;
  let _isOpen = false;
  let _modalEl = null;
  let _backdropEl = null;
  let _previousActiveElement = null;
  let _focusableElements = [];
  let _keydownHandler = null;
  function _createModalElement() {
    const modal2 = document.createElement("div");
    modal2.id = modalId;
    modal2.className = `dsd-modal dsd-modal--${size} dsd-modal--${position} ${className}`.trim();
    modal2.setAttribute("role", "dialog");
    modal2.setAttribute("aria-modal", "true");
    modal2.setAttribute("aria-labelledby", `${modalId}-title`);
    modal2.setAttribute("aria-hidden", "true");
    modal2.tabIndex = -1;
    let headerHtml = "";
    if (showHeader) {
      headerHtml = `
        <header class="dsd-modal__header">
          <h2 id="${modalId}-title" class="dsd-modal__title">${title}</h2>
          ${closable ? `<button type="button" class="dsd-modal__close" aria-label="Fechar" data-action="close">${ICONS.close}</button>` : ""}
        </header>
      `;
    }
    let footerHtml = "";
    if (showFooter || footerButtons.length > 0) {
      const buttonsHtml = footerButtons.map((btn, i) => `
        <button type="button" class="dsd-modal__btn dsd-modal__btn--${btn.variant || "secondary"}" data-action="${btn.action || "button"}" data-index="${i}">
          ${btn.label || "Button"}
        </button>
      `).join("");
      footerHtml = `<footer class="dsd-modal__footer">${buttonsHtml}</footer>`;
    }
    modal2.innerHTML = `
      <div class="dsd-modal__container">
        ${headerHtml}
        <div class="dsd-modal__body">${typeof content === "string" ? content : ""}</div>
        ${footerHtml}
      </div>
    `;
    if (content instanceof HTMLElement) {
      modal2.querySelector(".dsd-modal__body").appendChild(content);
    }
    return modal2;
  }
  function _createBackdrop() {
    const backdrop = document.createElement("div");
    backdrop.className = "dsd-modal__backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    return backdrop;
  }
  function _getFocusableElements() {
    if (!_modalEl) return [];
    return Array.from(_modalEl.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter((el) => !el.disabled && el.offsetParent !== null);
  }
  function _trapFocus(e) {
    if (e.key !== "Tab") return;
    _focusableElements = _getFocusableElements();
    if (_focusableElements.length === 0) return;
    const firstEl = _focusableElements[0];
    const lastEl = _focusableElements[_focusableElements.length - 1];
    if (e.shiftKey && document.activeElement === firstEl) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  }
  function _handleKeydown(e) {
    if (e.key === "Escape" && closeOnEscape && closable) {
      e.preventDefault();
      modal.close();
    }
    _trapFocus(e);
  }
  function _handleClick(e) {
    const action = e.target.closest("[data-action]")?.getAttribute("data-action");
    if (action === "close") {
      modal.close();
    } else if (action === "confirm") {
      onConfirm?.();
      modal.close();
    } else if (action === "button") {
      const index = parseInt(e.target.getAttribute("data-index") || "", 10);
      footerButtons[index]?.onClick?.();
    }
  }
  function _handleBackdropClick(e) {
    if (closeOnBackdrop && closable && e.target === _backdropEl) {
      modal.close();
    }
  }
  const modal = {
    open() {
      if (_isOpen) return this;
      _previousActiveElement = document.activeElement;
      _backdropEl = _createBackdrop();
      _modalEl = _createModalElement();
      document.body.appendChild(_backdropEl);
      document.body.appendChild(_modalEl);
      document.body.classList.add("dsd-modal-open");
      _modalEl.offsetHeight;
      _backdropEl.offsetHeight;
      _backdropEl.classList.add("dsd-modal__backdrop--visible");
      _modalEl.classList.add("dsd-modal--visible");
      _modalEl.setAttribute("aria-hidden", "false");
      _keydownHandler = _handleKeydown;
      document.addEventListener("keydown", _keydownHandler);
      _modalEl.addEventListener("click", _handleClick);
      _backdropEl.addEventListener("click", _handleBackdropClick);
      _focusableElements = _getFocusableElements();
      if (_focusableElements.length > 0) {
        _focusableElements[0].focus();
      } else {
        _modalEl.focus();
      }
      _isOpen = true;
      _activeModals.push(this);
      _emitEvent("modal:open", { modalId });
      onOpen?.();
      return this;
    },
    close() {
      if (!_isOpen) return this;
      _modalEl?.classList.remove("dsd-modal--visible");
      _backdropEl?.classList.remove("dsd-modal__backdrop--visible");
      _modalEl?.setAttribute("aria-hidden", "true");
      setTimeout(() => {
        if (_keydownHandler) document.removeEventListener("keydown", _keydownHandler);
        _modalEl?.remove();
        _backdropEl?.remove();
        _activeModals = _activeModals.filter((m) => m !== this);
        if (_activeModals.length === 0) {
          document.body.classList.remove("dsd-modal-open");
        }
        _previousActiveElement?.focus();
      }, 300);
      _isOpen = false;
      _emitEvent("modal:close", { modalId });
      onClose?.();
      return this;
    },
    setTitle(newTitle) {
      const titleEl = _modalEl?.querySelector(".dsd-modal__title");
      if (titleEl) titleEl.textContent = newTitle;
      return this;
    },
    setContent(newContent) {
      const bodyEl = _modalEl?.querySelector(".dsd-modal__body");
      if (!bodyEl) return this;
      if (typeof newContent === "string") bodyEl.innerHTML = newContent;
      else if (newContent instanceof HTMLElement) {
        bodyEl.innerHTML = "";
        bodyEl.appendChild(newContent);
      }
      return this;
    },
    isOpen() {
      return _isOpen;
    },
    getId() {
      return modalId;
    },
    getElement() {
      return _modalEl;
    },
    destroy() {
      if (_isOpen) this.close();
      _modalEl = null;
      _backdropEl = null;
    },
    healthCheck() {
      return {
        status: "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        modalId,
        isOpen: _isOpen,
        hasEventBus: !!_injectedEventBus
      };
    }
  };
  return modal;
}
function closeAll() {
  [..._activeModals].forEach((m) => m.close());
}
function getActiveCount() {
  return _activeModals.length;
}
function confirm(message, options = {}) {
  return new Promise((resolve) => {
    const modal = createModal({
      title: options.title || "Confirmar",
      content: `<p class="dsd-modal__message">${message}</p>`,
      size: MODAL_SIZE.SM,
      showFooter: true,
      footerButtons: [
        { label: options.cancelLabel || "Cancelar", variant: "secondary", action: "close", onClick: () => resolve(false) },
        { label: options.confirmLabel || "Confirmar", variant: "primary", action: "confirm" }
      ],
      onConfirm: () => resolve(true),
      onClose: () => resolve(false),
      ...options
    });
    modal.open();
  });
}
function alert(message, options = {}) {
  return new Promise((resolve) => {
    const modal = createModal({
      title: options.title || "Aviso",
      content: `<p class="dsd-modal__message">${message}</p>`,
      size: MODAL_SIZE.SM,
      showFooter: true,
      footerButtons: [
        { label: options.buttonLabel || "OK", variant: "primary", action: "close" }
      ],
      onClose: () => resolve(),
      ...options
    });
    modal.open();
  });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, activeModals: _activeModals.length, hasEventBus: !!_injectedEventBus };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, activeModals: _activeModals.length, hasEventBus: !!_injectedEventBus };
}
var modal_default = {
  createModal,
  closeAll,
  getActiveCount,
  confirm,
  alert,
  injectEventBus,
  info,
  healthCheck,
  VERSION,
  MODULE_ID,
  MODAL_SIZE,
  MODAL_POSITION
};
export {
  MODAL_POSITION,
  MODAL_SIZE,
  MODULE_ID,
  VERSION,
  alert,
  closeAll,
  confirm,
  createModal,
  modal_default as default,
  getActiveCount,
  healthCheck,
  info,
  injectEventBus
};
