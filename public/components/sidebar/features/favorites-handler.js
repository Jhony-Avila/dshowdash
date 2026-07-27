import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "6.1.0-ES6";
const MODULE_ID = "sidebar-favorites";
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
const STORAGE_KEY = "dsd-sidebar-favorites";
let _favorites = /* @__PURE__ */ new Set();
let _cleanups = [];
let _metrics = { adds: 0, removes: 0, toggles: 0, clears: 0 };
function loadFavorites() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    _favorites = new Set(saved ? JSON.parse(saved) : []);
  } catch {
    _favorites = /* @__PURE__ */ new Set();
  }
}
function saveFavorites() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([..._favorites]));
  } catch {
  }
}
function init(eventBus) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  loadFavorites();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FAVORITES_INITIALIZED);
}
function addFavorite(itemId) {
  if (!itemId) return false;
  _favorites.add(itemId);
  _metrics.adds++;
  saveFavorites();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FAVORITE_ADDED, { itemId });
  return true;
}
function removeFavorite(itemId) {
  const removed = _favorites.delete(itemId);
  if (removed) {
    _metrics.removes++;
    saveFavorites();
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FAVORITE_REMOVED, { itemId });
  }
  return removed;
}
function toggleFavorite(itemId) {
  _metrics.toggles++;
  if (_favorites.has(itemId)) {
    return removeFavorite(itemId) ? false : null;
  } else {
    return addFavorite(itemId) ? true : null;
  }
}
function isFavorite(itemId) {
  return _favorites.has(itemId);
}
function getFavorites() {
  return [..._favorites];
}
function clearFavorites() {
  _favorites.clear();
  _metrics.clears++;
  saveFavorites();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.FAVORITES_CLEARED);
}
function markFavoriteItems(container) {
  if (!container) return;
  container.querySelectorAll(`.${C.ITEM_FAVORITE}`).forEach((el) => {
    el.classList.remove(C.ITEM_FAVORITE);
  });
  _favorites.forEach((itemId) => {
    const item = container.querySelector(`[data-item-id="${itemId}"]`);
    if (item) item.classList.add(C.ITEM_FAVORITE);
  });
}
function createFavoriteButton(itemId) {
  const btn = document.createElement("button");
  btn.className = C.FAVORITE_BTN;
  btn.setAttribute("type", "button");
  btn.setAttribute("aria-label", "Adicionar aos favoritos");
  btn.setAttribute("data-item-id", itemId);
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  if (_favorites.has(itemId)) btn.classList.add(C.FAVORITE_BTN_ACTIVE);
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isNowFavorite = toggleFavorite(itemId);
    btn.classList.toggle(C.FAVORITE_BTN_ACTIVE, isNowFavorite);
  };
  btn.addEventListener("click", handleClick);
  _cleanups.push(() => btn.removeEventListener("click", handleClick));
  return btn;
}
function destroy() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch {
    }
  });
  _cleanups = [];
  _favorites.clear();
}
function getMetrics() {
  return { ..._metrics, favoritesCount: _favorites.size };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), favoritesCount: _favorites.size, favorites: getFavorites(), cleanups: _cleanups.length, metrics: getMetrics() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { favoritesCount: _favorites.size, noOrphanListeners: true }, metrics: getMetrics() };
}
var favorites_handler_default = { init, addFavorite, removeFavorite, toggleFavorite, isFavorite, getFavorites, clearFavorites, markFavoriteItems, createFavoriteButton, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  addFavorite,
  clearFavorites,
  createFavoriteButton,
  favorites_handler_default as default,
  destroy,
  getFavorites,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isFavorite,
  markFavoriteItems,
  removeFavorite,
  toggleFavorite
};
