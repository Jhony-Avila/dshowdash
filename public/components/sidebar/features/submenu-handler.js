import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "6.1.0-ES6";
const MODULE_ID = "sidebar-submenu";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _cleanups = [];
let _metrics = { creates: 0, toggles: 0, opens: 0, closes: 0 };
function init(eventBus) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.SUBMENU_INITIALIZED);
}
function createSubmenu(items) {
  _metrics.creates++;
  const submenu = document.createElement("ul");
  submenu.className = C.SUBMENU;
  submenu.setAttribute("role", "menu");
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = C.SUBMENU_ITEM;
    li.setAttribute("role", "none");
    const link = document.createElement("a");
    link.className = C.SUBMENU_LINK;
    link.href = item.route || `#${item.id}`;
    link.setAttribute("role", "menuitem");
    link.setAttribute("data-submenu-item", item.id);
    link.textContent = item.label || item.title || item.id;
    li.appendChild(link);
    submenu.appendChild(li);
  });
  return submenu;
}
function addSubmenuToItem(itemElement, submenuItems) {
  if (!itemElement || !submenuItems?.length) return null;
  itemElement.classList.add(C.ITEM_HAS_SUBMENU);
  const submenu = createSubmenu(submenuItems);
  itemElement.appendChild(submenu);
  return submenu;
}
function toggleSubmenu(itemElement) {
  if (!itemElement?.classList.contains(C.ITEM_HAS_SUBMENU)) return false;
  _metrics.toggles++;
  const isOpen = itemElement.classList.toggle(C.ITEM_SUBMENU_OPEN);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.SUBMENU_TOGGLED, { itemId: itemElement.dataset.itemId, isOpen });
  return isOpen;
}
function openSubmenu(itemElement) {
  if (!itemElement?.classList.contains(C.ITEM_HAS_SUBMENU)) return false;
  _metrics.opens++;
  itemElement.classList.add(C.ITEM_SUBMENU_OPEN);
  return true;
}
function closeSubmenu(itemElement) {
  if (!itemElement?.classList.contains(C.ITEM_HAS_SUBMENU)) return false;
  _metrics.closes++;
  itemElement.classList.remove(C.ITEM_SUBMENU_OPEN);
  return true;
}
function closeAllSubmenus(container) {
  if (!container) return;
  container.querySelectorAll(`.${C.ITEM_SUBMENU_OPEN}`).forEach((item) => {
    item.classList.remove(C.ITEM_SUBMENU_OPEN);
  });
}
function setupSubmenuHandlers(container) {
  if (!container) return () => {
  };
  const handler = (e) => {
    const item = e.target.closest(`.${C.ITEM_HAS_SUBMENU}`);
    if (!item) return;
    const link = e.target.closest(`.${C.LINK}`);
    if (link) {
      e.preventDefault();
      toggleSubmenu(item);
    }
  };
  container.addEventListener("click", handler);
  const cleanup = () => {
    container.removeEventListener("click", handler);
  };
  _cleanups.push(cleanup);
  return cleanup;
}
function destroy() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: getMetrics() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: {}, metrics: getMetrics() };
}
var submenu_handler_default = { init, createSubmenu, addSubmenuToItem, toggleSubmenu, openSubmenu, closeSubmenu, closeAllSubmenus, setupSubmenuHandlers, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  addSubmenuToItem,
  closeAllSubmenus,
  closeSubmenu,
  createSubmenu,
  submenu_handler_default as default,
  destroy,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  openSubmenu,
  setupSubmenuHandlers,
  toggleSubmenu
};
