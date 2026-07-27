import { TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "1.2.0-P24";
const MODULE_ID = "table-engine:context-menu";
const _emitMetrics = { total: 0, byEvent: {}, lastEmitAt: null };
function _trackEmit(eventName) {
  _emitMetrics.total++;
  _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1;
  _emitMetrics.lastEmitAt = Date.now();
}
const ContextMenuMixin = {
  // @ts-expect-error strict migration — TS2339, TS2551
  _initContextMenu() {
    this._contextMenuTarget = null;
    this._contextMenuOpen = false;
  },
  _onContextMenu(e) {
    const row = e.target.closest("tr[data-row-id]");
    if (!row) return;
    e.preventDefault();
    this._contextMenuTarget = row.dataset.rowId;
    if (this._selectRow) this._selectRow(this._contextMenuTarget);
    this._showContextMenu(e.clientX, e.clientY);
  },
  _showContextMenu(x, y) {
    this._closeContextMenu();
    this._contextMenuOpen = true;
    const p = this._cssPrefix;
    const menuItems = this._options.contextMenuItems || [
      { action: "ctx-view", label: "Ver detalhes", icon: "\u{1F441}", key: "V" },
      { action: "ctx-edit", label: "Editar", icon: "\u270F\uFE0F", key: "E" },
      { action: "ctx-expand", label: "Expandir", icon: "\u2B07", key: "X" },
      { divider: true },
      { action: "ctx-copy", label: "Copiar ID", icon: "\u{1F4CB}" },
      { divider: true },
      { action: "ctx-delete", label: "Excluir", icon: "\u{1F5D1}", key: "D", danger: true }
    ];
    const menu = document.createElement("div");
    menu.className = `${p}context-menu`;
    menu.innerHTML = menuItems.map((item) => {
      if (item.divider) return `<div class="${p}ctx-divider"></div>`;
      const dangerClass = item.danger ? ` ${p}ctx-danger` : "";
      return `<button class="${p}ctx-item${dangerClass}" data-action="${item.action}"><span class="${p}ctx-icon">${item.icon || ""}</span><span>${item.label}</span>${item.key ? `<kbd>${item.key}</kbd>` : ""}</button>`;
    }).join("");
    const rect = this._container.getBoundingClientRect();
    let posX = x - rect.left;
    let posY = y - rect.top;
    const menuWidth = 200, menuHeight = 250;
    if (posX + menuWidth > rect.width) posX = rect.width - menuWidth - 10;
    if (posY + menuHeight > rect.height) posY = rect.height - menuHeight - 10;
    if (posX < 0) posX = 10;
    if (posY < 0) posY = 10;
    menu.style.left = `${posX}px`;
    menu.style.top = `${posY}px`;
    this._container.appendChild(menu);
    requestAnimationFrame(() => {
      menu.classList.add(`${p}visible`);
    });
  },
  _closeContextMenu() {
    const p = this._cssPrefix;
    const menu = this._container.querySelector(`.${p}context-menu`);
    if (menu) {
      menu.classList.remove(`${p}visible`);
      setTimeout(() => {
        menu.remove();
      }, 150);
    }
    this._contextMenuOpen = false;
    this._contextMenuTarget = null;
  },
  _handleContextMenuAction(action) {
    const id = this._contextMenuTarget;
    switch (action) {
      case "ctx-view":
        _trackEmit("VIEW");
        this.emit(TABLE_EVENTS.VIEW, { id, source: MODULE_ID, timestamp: Date.now() });
        break;
      case "ctx-edit":
        _trackEmit("EDIT");
        this.emit(TABLE_EVENTS.EDIT, { id, source: MODULE_ID, timestamp: Date.now() });
        break;
      case "ctx-expand":
        if (this._toggleRowExpand) this._toggleRowExpand(id);
        break;
      case "ctx-copy":
        const data = this._state.getFilteredData();
        const item = data.find((c) => String(c.id) === id);
        if (item && item.id && this._copyToClipboard) this._copyToClipboard(String(item.id));
        break;
      case "ctx-delete":
        _trackEmit("DELETE");
        this.emit(TABLE_EVENTS.DELETE, { id, source: MODULE_ID, timestamp: Date.now() });
        break;
      default:
        _trackEmit("CONTEXT_ACTION");
        this.emit(TABLE_EVENTS.CONTEXT_ACTION, { action, id, source: MODULE_ID, timestamp: Date.now() });
        break;
    }
    this._closeContextMenu();
  },
  _copyToClipboard(text) {
    const self = this;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        _trackEmit("TOAST");
        self.emit(TABLE_EVENTS.TOAST, { type: "success", message: "Copiado!", source: MODULE_ID, timestamp: Date.now() });
      });
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      _trackEmit("TOAST");
      self.emit(TABLE_EVENTS.TOAST, { type: "success", message: "Copiado!", source: MODULE_ID, timestamp: Date.now() });
    }
  }
};
function getEmitMetrics() {
  return Object.assign({}, _emitMetrics);
}
var context_menu_default = ContextMenuMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION, emitMetrics: getEmitMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, emitMetrics: getEmitMetrics(), p24Instrumented: true, timestamp: Date.now() };
}
export {
  ContextMenuMixin,
  MODULE_ID,
  VERSION,
  context_menu_default as default,
  getEmitMetrics,
  healthCheck,
  info
};
