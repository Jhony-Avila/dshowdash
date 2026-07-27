import { ICONS } from "./constants.js";
import { getRelativePosition, adjustMenuPosition } from "./utils.js";
import { TABLE_INTENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:table:context-menu";
const ContextMenuMixin = {
  _onContextMenu(e) {
    const row = e.target.closest("tr[data-cliente-id]");
    if (!row) return;
    e.preventDefault();
    this._state.contextMenuTarget = row.dataset.clienteId;
    this._selectRow(this._state.contextMenuTarget);
    this._showContextMenu(e.clientX, e.clientY);
  },
  _showContextMenu(x, y) {
    this._closeContextMenu();
    this._state.contextMenuOpen = true;
    const isFav = this._state.isFavorito(this._state.contextMenuTarget);
    const isExpanded = this._state.isExpanded(this._state.contextMenuTarget);
    const menu = document.createElement("div");
    menu.className = "p05-context-menu";
    menu.innerHTML = `
            <button class="p05-ctx-item" data-action="ctx-view">
                ${ICONS.eye}<span>Ver detalhes</span><kbd>V</kbd>
            </button>
            <button class="p05-ctx-item" data-action="ctx-edit">
                ${ICONS.edit}<span>Editar</span><kbd>E</kbd>
            </button>
            <button class="p05-ctx-item" data-action="ctx-expand">
                ${ICONS.chevronDown}<span>${isExpanded ? "Colapsar" : "Expandir"}</span><kbd>E</kbd>
            </button>
            <div class="p05-ctx-divider"></div>
            <button class="p05-ctx-item" data-action="ctx-fav">
                ${ICONS.star}<span>${isFav ? "Desfavoritar" : "Favoritar"}</span><kbd>F</kbd>
            </button>
            <button class="p05-ctx-item" data-action="ctx-copy">
                ${ICONS.copy}<span>Copiar CNPJ</span>
            </button>
            <div class="p05-ctx-divider"></div>
            <button class="p05-ctx-item p05-ctx-danger" data-action="ctx-delete">
                ${ICONS.trash}<span>Excluir</span><kbd>D</kbd>
            </button>
        `;
    const { containerWidth, containerHeight } = getRelativePosition({ clientX: x, clientY: y }, this._container);
    const rect = this._container.getBoundingClientRect();
    let posX = x - rect.left;
    let posY = y - rect.top;
    const menuWidth = 200;
    const menuHeight = 250;
    const adjusted = adjustMenuPosition(posX, posY, menuWidth, menuHeight, containerWidth, containerHeight);
    menu.style.left = `${adjusted.x}px`;
    menu.style.top = `${adjusted.y}px`;
    this._container.appendChild(menu);
    requestAnimationFrame(() => menu.classList.add("p05-visible"));
  },
  _closeContextMenu() {
    const menu = this._container.querySelector(".p05-context-menu");
    if (menu) {
      menu.classList.remove("p05-visible");
      setTimeout(() => menu.remove(), 150);
    }
    this._state.contextMenuOpen = false;
    this._state.contextMenuTarget = null;
  },
  _handleContextMenuAction(action) {
    const id = this._state.contextMenuTarget;
    switch (action) {
      case "ctx-view":
        this.emit(TABLE_INTENTS.VIEW_ROW, { id });
        break;
      case "ctx-edit":
        this.emit(TABLE_INTENTS.EDIT_ROW, { id });
        break;
      case "ctx-expand":
        this._toggleRowExpand(id);
        break;
      case "ctx-fav":
        this.emit(TABLE_INTENTS.TOGGLE_FAVORITE, { id });
        break;
      case "ctx-copy":
        const cliente = this._state.getDisplayData().find((c) => String(c.id) === id);
        if (cliente?.cnpj) {
          this._copyToClipboard(cliente.cnpj);
        }
        break;
      case "ctx-delete":
        this.emit(TABLE_INTENTS.DELETE_ROW, { id });
        break;
    }
    this._closeContextMenu();
  }
};
var context_menu_default = ContextMenuMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { contextMenuReady: true } };
}
export {
  ContextMenuMixin,
  MODULE_ID,
  VERSION,
  context_menu_default as default,
  healthCheck,
  info
};
