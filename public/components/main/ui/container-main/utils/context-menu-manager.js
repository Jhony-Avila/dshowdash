import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:context-menu-manager";
const ITEM_TYPES = Object.freeze({ ITEM: "item", SEPARATOR: "separator", SUBMENU: "submenu", HEADER: "header" });
function createContextMenuManager(options = {}) {
  const { zIndex = 1e4, animation = true, theme = "dark", closeOnClick = true, closeOnScroll = true, closeOnResize = true } = options;
  const _logger = createLogger(MODULE_ID);
  const _menus = /* @__PURE__ */ new Map();
  const _activeMenus = [];
  let _counter = 0;
  let _metrics = { opened: 0, closed: 0, itemsClicked: 0 };
  const STYLES = `
    .cm-context-menu { position: fixed; min-width: 180px; background: #1a1a2e; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); padding: 6px 0; z-index: ${zIndex}; opacity: 0; transform: scale(0.95); transition: opacity 0.12s ease, transform 0.12s ease; }
    .cm-context-menu.visible { opacity: 1; transform: scale(1); }
    .cm-context-menu.theme-light { background: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
    .cm-context-menu-item { display: flex; align-items: center; padding: 8px 12px; cursor: pointer; color: #e0e0e0; font-size: 13px; transition: background 0.1s; }
    .cm-context-menu.theme-light .cm-context-menu-item { color: #333; }
    .cm-context-menu-item:hover { background: rgba(255,255,255,0.1); }
    .cm-context-menu.theme-light .cm-context-menu-item:hover { background: rgba(0,0,0,0.05); }
    .cm-context-menu-item.disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
    .cm-context-menu-item-icon { width: 20px; margin-right: 10px; text-align: center; font-size: 14px; }
    .cm-context-menu-item-label { flex: 1; }
    .cm-context-menu-item-shortcut { margin-left: 20px; opacity: 0.6; font-size: 11px; }
    .cm-context-menu-item-arrow { margin-left: 10px; opacity: 0.6; }
    .cm-context-menu-separator { height: 1px; background: rgba(255,255,255,0.1); margin: 6px 0; }
    .cm-context-menu.theme-light .cm-context-menu-separator { background: rgba(0,0,0,0.1); }
    .cm-context-menu-header { padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.5); font-weight: 600; }
    .cm-context-menu.theme-light .cm-context-menu-header { color: rgba(0,0,0,0.5); }
    .cm-context-menu-submenu { position: absolute; left: 100%; top: -6px; }
  `;
  function _injectStyles() {
    if (document.getElementById("cm-context-menu-styles")) return;
    const style = document.createElement("style");
    style.id = "cm-context-menu-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }
  function _createMenuItem(item, menuId) {
    if (item.type === ITEM_TYPES.SEPARATOR) {
      const sep = document.createElement("div");
      sep.className = "cm-context-menu-separator";
      return sep;
    }
    if (item.type === ITEM_TYPES.HEADER) {
      const header = document.createElement("div");
      header.className = "cm-context-menu-header";
      header.textContent = item.label;
      return header;
    }
    const el = document.createElement("div");
    el.className = `cm-context-menu-item${item.disabled ? " disabled" : ""}`;
    let html = "";
    if (item.icon) html += `<span class="cm-context-menu-item-icon">${item.icon}</span>`;
    html += `<span class="cm-context-menu-item-label">${item.label}</span>`;
    if (item.shortcut) html += `<span class="cm-context-menu-item-shortcut">${item.shortcut}</span>`;
    if (item.items) html += `<span class="cm-context-menu-item-arrow">\u25B6</span>`;
    el.innerHTML = html;
    if (item.items) {
      let submenu = null;
      el.addEventListener("mouseenter", () => {
        if (submenu) return;
        submenu = _createMenu(item.items, menuId);
        submenu.classList.add("cm-context-menu-submenu");
        el.appendChild(submenu);
        requestAnimationFrame(() => submenu.classList.add("visible"));
      });
      el.addEventListener("mouseleave", (e) => {
        if (submenu && !el.contains(e.relatedTarget)) {
          submenu.remove();
          submenu = null;
        }
      });
    } else if (item.onClick && !item.disabled) {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        item.onClick(item, e);
        _metrics.itemsClicked++;
        if (closeOnClick) manager.closeAll();
      });
    }
    return el;
  }
  function _createMenu(items, menuId) {
    const menu = document.createElement("div");
    menu.className = `cm-context-menu theme-${theme}`;
    items.forEach((item) => menu.appendChild(_createMenuItem(item, menuId)));
    return menu;
  }
  function _positionMenu(menu, x, y) {
    const rect = menu.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    if (x + rect.width > viewport.width) x = viewport.width - rect.width - 8;
    if (y + rect.height > viewport.height) y = viewport.height - rect.height - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }
  function _handleClickOutside(e) {
    if (!_activeMenus.some((m) => m.element.contains(e.target))) {
      manager.closeAll();
    }
  }
  function _handleScroll() {
    if (closeOnScroll) manager.closeAll();
  }
  function _handleResize() {
    if (closeOnResize) manager.closeAll();
  }
  const manager = {
    register(element, items, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      _injectStyles();
      const id = `ctx-${++_counter}`;
      const handler = (e) => {
        e.preventDefault();
        this.show(id, e.clientX, e.clientY, options2.dynamicItems ? options2.dynamicItems(e) : items);
      };
      element.addEventListener("contextmenu", handler);
      _menus.set(id, { element, items, handler, options: options2 });
      return id;
    },
    unregister(id) {
      const menu = _menus.get(id);
      if (!menu) return;
      menu.element.removeEventListener("contextmenu", menu.handler);
      _menus.delete(id);
    },
    show(id, x, y, items) {
      this.closeAll();
      const config = _menus.get(id);
      const menuItems = items || config?.items || [];
      if (menuItems.length === 0) return;
      const menu = _createMenu(menuItems, id);
      document.body.appendChild(menu);
      _positionMenu(menu, x, y);
      requestAnimationFrame(() => menu.classList.add("visible"));
      _activeMenus.push({ id, element: menu });
      _metrics.opened++;
      document.addEventListener("click", _handleClickOutside);
      document.addEventListener("scroll", _handleScroll, true);
      window.addEventListener("resize", _handleResize);
    },
    close(id) {
      const index = _activeMenus.findIndex((m) => m.id === id);
      if (index === -1) return;
      const menu = _activeMenus[index];
      menu.element.classList.remove("visible");
      setTimeout(() => menu.element.remove(), 120);
      _activeMenus.splice(index, 1);
      _metrics.closed++;
      if (_activeMenus.length === 0) {
        document.removeEventListener("click", _handleClickOutside);
        document.removeEventListener("scroll", _handleScroll, true);
        window.removeEventListener("resize", _handleResize);
      }
    },
    closeAll() {
      [..._activeMenus].forEach((m) => this.close(m.id));
    },
    getMetrics() {
      return { ..._metrics, registered: _menus.size, active: _activeMenus.length };
    },
    resetMetrics() {
      _metrics = { opened: 0, closed: 0, itemsClicked: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, registered: _menus.size, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, registered: _menus.size, itemTypes: Object.keys(ITEM_TYPES) };
    },
    destroy() {
      this.closeAll();
      _menus.forEach((_, id) => this.unregister(id));
      const styles = document.getElementById("cm-context-menu-styles");
      if (styles) styles.remove();
    }
  };
  return manager;
}
let _instance = null;
function getContextMenuManager(options = {}) {
  if (!_instance) _instance = createContextMenuManager(options);
  return _instance;
}
function resetContextMenuManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, itemTypes: Object.keys(ITEM_TYPES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var context_menu_manager_default = { VERSION, MODULE_ID, ITEM_TYPES, createContextMenuManager, getContextMenuManager, resetContextMenuManager, info, healthCheck };
export {
  ITEM_TYPES,
  MODULE_ID,
  VERSION,
  createContextMenuManager,
  context_menu_manager_default as default,
  getContextMenuManager,
  healthCheck,
  info,
  resetContextMenuManager
};
