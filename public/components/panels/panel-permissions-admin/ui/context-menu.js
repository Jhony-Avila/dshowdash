import { Icons } from "./icons.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-context-menu";
let _menu = null;
let _currentTarget = null;
let _onAction = () => {
};
let _abortController = null;
const MENUS = {
  user: [{ id: "select", label: "Selecionar usu\xE1rio", icon: "user" }, { id: "clone", label: "Clonar permiss\xF5es", icon: "copy", shortcut: "Ctrl+D" }, { id: "compare", label: "Comparar com...", icon: "gitCompare" }, { divider: true }, { id: "favorite", label: "Adicionar aos favoritos", icon: "star" }, { id: "notes", label: "Adicionar nota", icon: "edit" }, { divider: true }, { id: "grant-all", label: "Liberar todos", icon: "checkCircle" }, { id: "revoke-all", label: "Revogar todos", icon: "xCircle", danger: true }],
  trigger: [{ id: "toggle", label: "Alternar permiss\xE3o", icon: "toggleLeft", shortcut: "Enter" }, { id: "preview", label: "Ver detalhes", icon: "eye" }, { divider: true }, { id: "bulk-add", label: "Adicionar \xE0 sele\xE7\xE3o", icon: "plus" }, { id: "alias", label: "Definir apelido", icon: "tag" }, { divider: true }, { id: "grant-area", label: "Liberar toda a \xE1rea", icon: "checkCircle" }, { id: "revoke-area", label: "Revogar toda a \xE1rea", icon: "xCircle", danger: true }],
  matrix: [{ id: "expand-all", label: "Expandir todos", icon: "chevronDown" }, { id: "collapse-all", label: "Recolher todos", icon: "chevronUp" }, { divider: true }, { id: "select-all", label: "Selecionar todos", icon: "checkbox", shortcut: "Ctrl+A" }, { id: "clear-selection", label: "Limpar sele\xE7\xE3o", icon: "x" }]
};
const _createMenu = () => {
  if (_menu) return _menu;
  _menu = document.createElement("div");
  _menu.className = "uarps-context-menu";
  document.body.appendChild(_menu);
  if (_abortController) {
    _abortController.abort();
  }
  _abortController = new AbortController();
  document.addEventListener("click", () => {
    hide();
  }, { signal: _abortController.signal });
  document.addEventListener("contextmenu", (e) => {
    if (!_menu.contains(e.target)) hide();
  }, { signal: _abortController.signal });
  document.addEventListener("scroll", () => {
    hide();
  }, { capture: true, signal: _abortController.signal });
  return _menu;
};
const _render = (items) => {
  _createMenu();
  let html = "";
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.divider) {
      html += '<div class="uarps-context-menu__divider"></div>';
      continue;
    }
    html += `<div class="uarps-context-menu__item ${item.danger ? "uarps-context-menu__item--danger" : ""}" data-action="${item.id}">${Icons[item.icon] || ""}<span>${item.label}</span>${item.shortcut ? `<span class="uarps-context-menu__shortcut">${item.shortcut}</span>` : ""}</div>`;
  }
  _menu.innerHTML = html;
  const actionEls = _menu.querySelectorAll("[data-action]");
  actionEls.forEach((el) => {
    el.addEventListener("click", () => {
      const action = el.dataset.action || "";
      _onAction(action, _currentTarget);
      hide();
    });
  });
};
const show = (e, type, target, onAction) => {
  e.preventDefault();
  const items = MENUS[type];
  if (!items) return;
  _currentTarget = target;
  _onAction = onAction || (() => {
  });
  _render(items);
  const x = Math.min(e.clientX, window.innerWidth - 200);
  const y = Math.min(e.clientY, window.innerHeight - 300);
  _menu.style.left = `${x}px`;
  _menu.style.top = `${y}px`;
  _menu.classList.add("uarps-context-menu--open");
};
const hide = () => {
  if (_menu) _menu.classList.remove("uarps-context-menu--open");
  _currentTarget = null;
};
const destroy = () => {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
  if (_menu) _menu.remove();
  _menu = null;
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { menuTypes: Object.keys(MENUS).length } });
const ContextMenu = { show, hide, destroy, VERSION, MODULE_ID, info, healthCheck };
var context_menu_default = ContextMenu;
export {
  ContextMenu,
  MODULE_ID,
  VERSION,
  context_menu_default as default,
  destroy,
  healthCheck,
  hide,
  info,
  show
};
