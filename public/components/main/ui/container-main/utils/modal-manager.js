import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:modal-manager";
const MODAL_SIZES = Object.freeze({ SM: "sm", MD: "md", LG: "lg", XL: "xl", FULL: "full" });
function createModalManager(options = {}) {
  const { zIndexBase = 1e4, closeOnEscape = true, closeOnBackdrop = true, stackable = true, animation = "fade", animationDuration = 200, onOpen = null, onClose = null } = options;
  const _logger = createLogger(MODULE_ID);
  const _modals = /* @__PURE__ */ new Map();
  const _stack = [];
  let _counter = 0;
  let _metrics = { opened: 0, closed: 0 };
  const STYLES = `
    .cm-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity ${animationDuration}ms ease; z-index: var(--z-index); }
    .cm-modal-backdrop.visible { opacity: 1; }
    .cm-modal { background: #1a1a2e; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); max-height: 90vh; display: flex; flex-direction: column; transform: scale(0.9) translateY(-20px); opacity: 0; transition: all ${animationDuration}ms ease; }
    .cm-modal-backdrop.visible .cm-modal { transform: scale(1) translateY(0); opacity: 1; }
    .cm-modal.sm { width: 360px; }
    .cm-modal.md { width: 500px; }
    .cm-modal.lg { width: 700px; }
    .cm-modal.xl { width: 900px; }
    .cm-modal.full { width: 95vw; height: 95vh; }
    .cm-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .cm-modal-title { font-size: 18px; font-weight: 600; color: #fff; margin: 0; }
    .cm-modal-close { background: none; border: none; color: #fff; opacity: 0.6; cursor: pointer; font-size: 24px; line-height: 1; padding: 0; }
    .cm-modal-close:hover { opacity: 1; }
    .cm-modal-body { padding: 20px; overflow-y: auto; flex: 1; color: #e0e0e0; }
    .cm-modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.1); }
    .cm-modal-btn { padding: 8px 20px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; }
    .cm-modal-btn-primary { background: #3b82f6; color: #fff; }
    .cm-modal-btn-primary:hover { background: #2563eb; }
    .cm-modal-btn-secondary { background: rgba(255,255,255,0.1); color: #fff; }
    .cm-modal-btn-secondary:hover { background: rgba(255,255,255,0.2); }
    .cm-modal-btn-danger { background: #ef4444; color: #fff; }
    .cm-modal-btn-danger:hover { background: #dc2626; }
    body.cm-modal-open { overflow: hidden; }
  `;
  function _injectStyles() {
    if (document.getElementById("cm-modal-styles")) return;
    const style = document.createElement("style");
    style.id = "cm-modal-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }
  function _createBackdrop(id, zIndex) {
    const backdrop = document.createElement("div");
    backdrop.className = "cm-modal-backdrop";
    backdrop.style.setProperty("--z-index", zIndex);
    backdrop.dataset.modalId = id;
    if (closeOnBackdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) manager.close(id);
      });
    }
    return backdrop;
  }
  function _createModal(config) {
    const modal = document.createElement("div");
    modal.className = `cm-modal ${config.size || MODAL_SIZES.MD}`;
    if (config.className) modal.classList.add(config.className);
    let headerHtml = "";
    if (config.title || config.closable !== false) {
      headerHtml = `<div class="cm-modal-header">
        <h3 class="cm-modal-title">${config.title || ""}</h3>
        ${config.closable !== false ? '<button class="cm-modal-close" data-action="close">\xD7</button>' : ""}
      </div>`;
    }
    let footerHtml = "";
    if (config.buttons?.length > 0) {
      const btns = config.buttons.map(
        (btn, i) => (
          // @ts-expect-error TS migration - TS2551
          `<button class="cm-modal-btn cm-modal-btn-${btn.type || "secondary"}" data-action="button" data-index="${i}">${btn.label}</button>`
        )
      ).join("");
      footerHtml = `<div class="cm-modal-footer">${btns}</div>`;
    }
    modal.innerHTML = `${headerHtml}<div class="cm-modal-body"></div>${footerHtml}`;
    const body = modal.querySelector(".cm-modal-body");
    if (typeof config.content === "string") {
      body.innerHTML = config.content;
    } else if (config.content instanceof HTMLElement) {
      body.appendChild(config.content);
    }
    modal.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (action === "close") {
        manager.close(config.id);
      } else if (action === "button") {
        const index = parseInt(e.target.dataset.index);
        const btn = config.buttons[index];
        const result = btn.onClick?.(config.id);
        if (result !== false && btn.closeOnClick !== false) {
          manager.close(config.id, btn.value);
        }
      }
    });
    return modal;
  }
  function _handleEscape(e) {
    if (e.key === "Escape" && closeOnEscape && _stack.length > 0) {
      const topModal = _stack[_stack.length - 1];
      const config = _modals.get(topModal);
      if (config?.closable !== false) {
        manager.close(topModal);
      }
    }
  }
  const manager = {
    open(config) {
      _injectStyles();
      const id = config.id || `modal-${++_counter}`;
      config.id = id;
      if (!stackable && _stack.length > 0) {
        this.close(_stack[_stack.length - 1]);
      }
      const zIndex = zIndexBase + _stack.length * 2;
      const backdrop = _createBackdrop(id, zIndex);
      const modal = _createModal(config);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);
      document.body.classList.add("cm-modal-open");
      _modals.set(id, { ...config, backdrop, modal });
      _stack.push(id);
      _metrics.opened++;
      requestAnimationFrame(() => {
        backdrop.classList.add("visible");
      });
      const focusable = modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) focusable[0].focus();
      if (_stack.length === 1) {
        document.addEventListener("keydown", _handleEscape);
      }
      onOpen?.(id, config);
      config.onOpen?.(id);
      return id;
    },
    // @ts-expect-error strict migration — TS2322
    close(id, result = void 0) {
      const config = _modals.get(id);
      if (!config) return;
      config.backdrop.classList.remove("visible");
      setTimeout(() => {
        config.backdrop.remove();
        _modals.delete(id);
        const stackIndex = _stack.indexOf(id);
        if (stackIndex > -1) _stack.splice(stackIndex, 1);
        if (_stack.length === 0) {
          document.body.classList.remove("cm-modal-open");
          document.removeEventListener("keydown", _handleEscape);
        }
        _metrics.closed++;
        onClose?.(id, result);
        config.onClose?.(result);
        config._resolve?.(result);
      }, animationDuration);
    },
    closeAll() {
      [..._stack].forEach((id) => this.close(id));
    },
    // Promise-based
    async openAsync(config) {
      return new Promise((resolve) => {
        config._resolve = resolve;
        this.open(config);
      });
    },
    // Presets
    alert(message, options2 = {}) {
      return this.openAsync({
        title: options2.title || "Aviso",
        content: `<p>${message}</p>`,
        size: MODAL_SIZES.SM,
        buttons: [{ label: options2.okText || "OK", type: "primary", value: true }],
        ...options2
      });
    },
    confirm(message, options2 = {}) {
      return this.openAsync({
        title: options2.title || "Confirmar",
        content: `<p>${message}</p>`,
        size: MODAL_SIZES.SM,
        buttons: [
          { label: options2.cancelText || "Cancelar", type: "secondary", value: false },
          { label: options2.okText || "Confirmar", type: "primary", value: true }
        ],
        ...options2
      });
    },
    prompt(message, options2 = {}) {
      const inputId = `prompt-${Date.now()}`;
      return this.openAsync({
        title: options2.title || "Digite",
        content: `<p>${message}</p><input type="${options2.type || "text"}" id="${inputId}" class="cm-modal-input" value="${options2.defaultValue || ""}" placeholder="${options2.placeholder || ""}" style="width:100%;padding:10px;margin-top:10px;border:1px solid rgba(255,255,255,0.2);border-radius:6px;background:rgba(255,255,255,0.1);color:#fff;">`,
        size: MODAL_SIZES.SM,
        buttons: [
          { label: options2.cancelText || "Cancelar", type: "secondary", value: null },
          { label: options2.okText || "OK", type: "primary", closeOnClick: false, onClick: (id) => {
            const input = document.getElementById(inputId);
            this.close(id, input?.value || "");
            return false;
          } }
        ],
        onOpen: () => {
          setTimeout(() => document.getElementById(inputId)?.focus(), 100);
        },
        ...options2
      });
    },
    isOpen(id) {
      return _modals.has(id);
    },
    getStack() {
      return [..._stack];
    },
    getTopModal() {
      return _stack[_stack.length - 1] || null;
    },
    getMetrics() {
      return { ..._metrics, currentlyOpen: _stack.length };
    },
    resetMetrics() {
      _metrics = { opened: 0, closed: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, openModals: _stack.length, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, openModals: _stack.length, sizes: Object.keys(MODAL_SIZES) };
    },
    destroy() {
      this.closeAll();
      const styles = document.getElementById("cm-modal-styles");
      if (styles) styles.remove();
    }
  };
  return manager;
}
let _instance = null;
function getModalManager(options = {}) {
  if (!_instance) _instance = createModalManager(options);
  return _instance;
}
function resetModalManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function openModal(config) {
  return getModalManager().open(config);
}
function closeModal(id, result) {
  return getModalManager().close(id, result);
}
function alert(message, options) {
  return getModalManager().alert(message, options);
}
function confirm(message, options) {
  return getModalManager().confirm(message, options);
}
function prompt(message, options) {
  return getModalManager().prompt(message, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, sizes: Object.keys(MODAL_SIZES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var modal_manager_default = { VERSION, MODULE_ID, MODAL_SIZES, createModalManager, getModalManager, resetModalManager, openModal, closeModal, alert, confirm, prompt, info, healthCheck };
export {
  MODAL_SIZES,
  MODULE_ID,
  VERSION,
  alert,
  closeModal,
  confirm,
  createModalManager,
  modal_manager_default as default,
  getModalManager,
  healthCheck,
  info,
  openModal,
  prompt,
  resetModalManager
};
