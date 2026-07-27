import { CONTAINER_EVENTS } from "/core/runtime/events/catalog/container.events.js";
import { ICONS } from "../utils/icons.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-context-menu";
import { createLogger } from "../utils/logger.js";
const logger = createLogger(MODULE_ID);
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _getEventBus() {
  return _injectedEventBus;
}
function _emitEvent(eventType, payload) {
  const eb = _getEventBus();
  if (eb?.emit) {
    eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
    return true;
  }
  return false;
}
function _validateOptions(options) {
  const errors = [];
  if (options.items !== void 0 && !Array.isArray(options.items)) errors.push("items must be an array");
  if (options.onAction !== void 0 && typeof options.onAction !== "function") errors.push("onAction must be a function");
  if (options.customClass !== void 0 && typeof options.customClass !== "string") errors.push("customClass must be a string");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
const DEFAULT_ITEMS = [
  { id: "refresh", label: "Atualizar", icon: ICONS.refresh, shortcut: "F5" },
  { id: "divider-1", type: "divider" },
  { id: "minimize", label: "Minimizar", icon: ICONS.minimize, shortcut: "Ctrl+M" },
  { id: "maximize", label: "Maximizar", icon: ICONS.maximize, shortcut: "Ctrl+Shift+M" },
  { id: "fullscreen", label: "Tela Cheia", icon: ICONS.fullscreen, shortcut: "F11" },
  { id: "divider-2", type: "divider" },
  { id: "close", label: "Fechar", icon: ICONS.close, shortcut: "Ctrl+W", danger: true }
];
function createContextMenu(container, options = {}) {
  _validateOptions(options);
  const { items = DEFAULT_ITEMS, onAction, customClass = "", eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _menuEl = null;
  let _isVisible = false;
  let _focusedIndex = -1;
  let _boundContextHandler = null;
  let _boundClickOutside = null;
  let _boundKeydown = null;
  let _menuItems = [];
  function _createMenuElement() {
    const menu = document.createElement("div");
    menu.className = `dsd-context-menu ${customClass}`.trim();
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-hidden", "true");
    menu.setAttribute("aria-label", "Menu de contexto");
    menu.tabIndex = -1;
    const ul = document.createElement("ul");
    ul.className = "dsd-context-menu__list";
    ul.setAttribute("role", "none");
    items.forEach((item, idx) => {
      if (item.type === "divider") {
        const divider = document.createElement("li");
        divider.className = "dsd-context-menu__divider";
        divider.setAttribute("role", "separator");
        ul.appendChild(divider);
        return;
      }
      const li = document.createElement("li");
      li.className = "dsd-context-menu__item";
      if (item.danger) li.classList.add("dsd-context-menu__item--danger");
      if (item.disabled) li.classList.add("dsd-context-menu__item--disabled");
      li.setAttribute("role", "menuitem");
      li.setAttribute("data-action", String(item.id));
      li.setAttribute("aria-disabled", String(!!item.disabled));
      li.tabIndex = -1;
      li.innerHTML = `${item.icon ? `<span class="dsd-context-menu__icon" aria-hidden="true">${item.icon}</span>` : ""}<span class="dsd-context-menu__label">${item.label}</span>${item.shortcut ? `<span class="dsd-context-menu__shortcut" aria-hidden="true">${item.shortcut}</span>` : ""}`;
      li.addEventListener("click", (e) => {
        if (item.disabled) return;
        e.stopPropagation();
        _handleAction(String(item.id));
      });
      ul.appendChild(li);
      _menuItems.push(li);
    });
    menu.appendChild(ul);
    return menu;
  }
  function _positionMenu(x, y) {
    if (!_menuEl) return;
    _menuEl.style.visibility = "hidden";
    _menuEl.style.display = "block";
    const menuRect = _menuEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let posX = x + menuRect.width > vw ? x - menuRect.width : x;
    let posY = y + menuRect.height > vh ? y - menuRect.height : y;
    posX = Math.max(8, posX);
    posY = Math.max(8, posY);
    _menuEl.style.left = `${posX}px`;
    _menuEl.style.top = `${posY}px`;
    _menuEl.style.visibility = "visible";
  }
  function _handleAction(actionId) {
    contextMenu.hide();
    onAction?.(actionId, container);
    _emitEvent(CONTAINER_EVENTS.CONTEXTMENU_ACTION, { action: actionId, containerId: container.id });
  }
  function _handleKeydown(e) {
    if (!_isVisible) return;
    const enabledItems = _menuItems.filter((li) => !li.classList.contains("dsd-context-menu__item--disabled"));
    const count = enabledItems.length;
    if (count === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      _focusedIndex = (_focusedIndex + 1) % count;
      enabledItems[_focusedIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      _focusedIndex = (_focusedIndex - 1 + count) % count;
      enabledItems[_focusedIndex]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      _focusedIndex = 0;
      enabledItems[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      _focusedIndex = count - 1;
      enabledItems[count - 1]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (_focusedIndex >= 0 && enabledItems[_focusedIndex]) {
        const action = enabledItems[_focusedIndex].dataset.action;
        if (action) _handleAction(action);
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      contextMenu.hide();
    }
  }
  function _handleClickOutside(e) {
    if (_menuEl && !_menuEl.contains(e.target)) contextMenu.hide();
  }
  const contextMenu = {
    init() {
      if (_initialized) return this;
      _boundContextHandler = (e) => {
        e.preventDefault();
        contextMenu.show(e.clientX, e.clientY);
      };
      container.addEventListener("contextmenu", _boundContextHandler);
      _initialized = true;
      return this;
    },
    show(x, y) {
      if (!_menuEl) {
        _menuEl = _createMenuElement();
        document.body.appendChild(_menuEl);
      }
      _positionMenu(x, y);
      _menuEl.classList.add("dsd-context-menu--visible");
      _menuEl.setAttribute("aria-hidden", "false");
      _isVisible = true;
      _focusedIndex = -1;
      _boundClickOutside = _handleClickOutside;
      _boundKeydown = _handleKeydown;
      document.addEventListener("click", _boundClickOutside, true);
      document.addEventListener("keydown", _boundKeydown);
      _menuEl.focus();
      return this;
    },
    hide() {
      if (!_menuEl) return this;
      _menuEl.classList.remove("dsd-context-menu--visible");
      _menuEl.setAttribute("aria-hidden", "true");
      _isVisible = false;
      _focusedIndex = -1;
      if (_boundClickOutside) document.removeEventListener("click", _boundClickOutside, true);
      if (_boundKeydown) document.removeEventListener("keydown", _boundKeydown);
      _boundClickOutside = null;
      _boundKeydown = null;
      return this;
    },
    isVisible() {
      return _isVisible;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      this.hide();
      if (_boundContextHandler) container.removeEventListener("contextmenu", _boundContextHandler);
      _boundContextHandler = null;
      _menuEl?.remove();
      _menuEl = null;
      _menuItems = [];
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, isVisible: _isVisible, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
    }
  };
  return contextMenu;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
}
var context_menu_default = { createContextMenu, injectEventBus, info, healthCheck, VERSION, MODULE_ID, DEFAULT_ITEMS };
export {
  DEFAULT_ITEMS,
  MODULE_ID,
  VERSION,
  createContextMenu,
  context_menu_default as default,
  healthCheck,
  info,
  injectEventBus
};
