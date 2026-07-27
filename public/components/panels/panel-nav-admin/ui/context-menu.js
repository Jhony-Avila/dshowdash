import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE3";
const MODULE_ID = "panel-nav-admin.ui.context-menu";
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
const DEFAULT_ACTIONS = [
  { id: "edit", label: "Editar", icon: "\u270F\uFE0F" },
  { id: "duplicate", label: "Duplicar", icon: "\u29C9" },
  { id: "divider-1", divider: true },
  { id: "move-section", label: "Mover para se\xE7\xE3o...", icon: "\u2197" },
  { id: "toggle-active", label: "Ativar/Desativar", icon: "\u2298" },
  { id: "toggle-visible", label: "Mostrar/Ocultar", icon: "\u{1F441}" },
  { id: "divider-2", divider: true },
  { id: "copy-config", label: "Copiar configura\xE7\xE3o", icon: "\u{1F4CB}" },
  { id: "copy-id", label: "Copiar ID", icon: "#" },
  { id: "divider-3", divider: true },
  { id: "delete", label: "Excluir", icon: "\u{1F5D1}", danger: true }
];
class ContextMenu {
  /**
   * @param {Object} [options]
   * @param {Function} [options.onAction] — (action: string, item: Object) => void
   * @param {Array} [options.actions] — Custom actions array
   */
  constructor(options = {}) {
    this.onAction = options.onAction || (() => {
    });
    this.actions = options.actions || DEFAULT_ACTIONS;
    this._el = null;
    this._currentItem = null;
    this._abortController = null;
  }
  /** @private Create the menu DOM element */
  _createEl() {
    if (this._el) return;
    if (typeof document === "undefined") return;
    this._el = document.createElement("div");
    this._el.className = "pna-context-menu";
    this._el.setAttribute("role", "menu");
    this._el.style.display = "none";
    document.body.appendChild(this._el);
  }
  /**
   * Show the context menu at a position.
   * @param {number} x — Pixel x coordinate
   * @param {number} y — Pixel y coordinate
   * @param {Object} item — Nav item data
   */
  show(x, y, item) {
    this._createEl();
    if (!this._el) return;
    this._currentItem = item;
    let html = "";
    for (const action of this.actions) {
      if (action.divider) {
        html += '<div class="pna-context-menu__divider"></div>';
        continue;
      }
      let label = action.label;
      if (action.id === "toggle-active" && item) {
        label = item.isActive === false ? "Ativar" : "Desativar";
      }
      if (action.id === "toggle-visible" && item) {
        label = item.isVisible === false ? "Mostrar" : "Ocultar";
      }
      const dangerClass = action.danger ? " pna-context-menu__item--danger" : "";
      html += '<button class="pna-context-menu__item' + dangerClass + '" data-action="' + action.id + '" role="menuitem"><span class="pna-context-menu__icon">' + (action.icon || "") + '</span><span class="pna-context-menu__label">' + label + "</span></button>";
    }
    this._el.innerHTML = html;
    this._el.style.display = "block";
    const menuRect = this._el.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    let posX = x;
    let posY = y;
    if (x + menuRect.width > winW) posX = winW - menuRect.width - 8;
    if (y + menuRect.height > winH) posY = winH - menuRect.height - 8;
    if (posX < 0) posX = 8;
    if (posY < 0) posY = 8;
    this._el.style.left = posX + "px";
    this._el.style.top = posY + "px";
    this._abortController = new AbortController();
    const signal = this._abortController.signal;
    this._el.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (btn) {
        this.onAction(btn.dataset.action, this._currentItem);
        this.close();
      }
    }, { signal });
    document.addEventListener("click", (e) => {
      if (!this._el.contains(e.target)) this.close();
    }, { signal, capture: true });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    }, { signal });
    document.addEventListener("contextmenu", (e) => {
      if (!this._el.contains(e.target)) this.close();
    }, { signal });
  }
  /** Close and hide the menu. */
  close() {
    if (this._el) {
      this._el.style.display = "none";
      this._el.innerHTML = "";
    }
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._currentItem = null;
  }
  /** @returns {boolean} Whether menu is currently visible */
  isOpen() {
    return this._el ? this._el.style.display !== "none" : false;
  }
  /** Cleanup — remove from DOM */
  destroy() {
    this.close();
    if (this._el && this._el.parentNode) {
      this._el.remove();
    }
    this._el = null;
  }
}
function createContextMenu(options = {}) {
  return new ContextMenu(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, defaultActions: DEFAULT_ACTIONS.filter((a) => !a.divider).length };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var context_menu_default = { ContextMenu, createContextMenu, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  ContextMenu,
  MODULE_ID,
  VERSION,
  createContextMenu,
  context_menu_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
