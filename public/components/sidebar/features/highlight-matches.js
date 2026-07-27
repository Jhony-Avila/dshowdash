import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "7.1.0-ES6";
const MODULE_ID = "sidebar-highlight-matches";
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
let _container = null;
let _currentQuery = "";
let _highlights = [];
let _metrics = { highlights: 0, clears: 0, navigations: 0 };
let _cleanups = [];
const CONFIG = { highlightClass: "dsd-highlight", highlightActiveClass: "dsd-highlight--active", minQueryLength: 2, caseSensitive: false };
function init(eventBus, container) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  const eb = _getPort("eventBus");
  if (eb && eb.on) {
    const cleanup1 = eb.on(SIDEBAR_EVENTS.SEARCH, handleSearch);
    if (typeof cleanup1 === "function") _cleanups.push(cleanup1);
    const cleanup2 = eb.on(SIDEBAR_EVENTS.SEARCH_CLEAR, clearHighlights);
    if (typeof cleanup2 === "function") _cleanups.push(cleanup2);
  }
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.HIGHLIGHT_INITIALIZED);
}
function handleSearch(data) {
  const query = data?.query || "";
  if (query.length < CONFIG.minQueryLength) {
    clearHighlights();
    return;
  }
  _currentQuery = query;
  highlightMatches(query);
}
function highlightMatches(query, container) {
  const searchContainer = container || _container;
  if (!searchContainer || !query) return;
  clearHighlights();
  _currentQuery = query;
  const regex = createSearchRegex(query);
  const textElements = searchContainer.querySelectorAll(`.${C.ITEM_TEXT}, .${C.ITEM_LABEL}, .${C.GROUP_TITLE}`);
  textElements.forEach((el) => {
    const originalText = el.textContent;
    const matches = originalText.match(regex);
    if (matches && matches.length > 0) {
      const highlightedHTML = originalText.replace(regex, (match) => `<mark class="${CONFIG.highlightClass}">${escapeHtml(match)}</mark>`);
      el.dataset.originalText = originalText;
      el.innerHTML = highlightedHTML;
      _highlights.push(el);
    }
  });
  _metrics.highlights++;
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.HIGHLIGHTS_APPLIED, { query, count: _highlights.length });
  return _highlights.length;
}
function createSearchRegex(query) {
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flags = CONFIG.caseSensitive ? "g" : "gi";
  return new RegExp(`(${escapedQuery})`, flags);
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function clearHighlights() {
  _highlights.forEach((el) => {
    if (el.dataset.originalText) {
      el.textContent = el.dataset.originalText;
      delete el.dataset.originalText;
    }
  });
  _highlights = [];
  _currentQuery = "";
  _metrics.clears++;
  _container?.querySelectorAll(`.${CONFIG.highlightClass}`).forEach((mark) => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}
function navigateToMatch(direction = "next") {
  const marks = _container?.querySelectorAll(`.${CONFIG.highlightClass}`);
  if (!marks || marks.length === 0) return null;
  _metrics.navigations++;
  let currentActive = _container?.querySelector(`.${CONFIG.highlightActiveClass}`);
  let currentIndex = currentActive ? Array.from(marks).indexOf(currentActive) : -1;
  currentActive?.classList.remove(CONFIG.highlightActiveClass);
  if (direction === "next") currentIndex = (currentIndex + 1) % marks.length;
  else currentIndex = currentIndex <= 0 ? marks.length - 1 : currentIndex - 1;
  const nextMark = marks[currentIndex];
  nextMark.classList.add(CONFIG.highlightActiveClass);
  nextMark.scrollIntoView({ behavior: "smooth", block: "center" });
  return { current: currentIndex + 1, total: marks.length };
}
function getMatchCount() {
  return _container?.querySelectorAll(`.${CONFIG.highlightClass}`).length || 0;
}
function getCurrentQuery() {
  return _currentQuery;
}
function destroy() {
  _cleanups.forEach((cleanup) => {
    try {
      if (typeof cleanup === "function") cleanup();
    } catch (e) {
    }
  });
  _cleanups = [];
  clearHighlights();
  _container = null;
}
function getMetrics() {
  return { ..._metrics, currentHighlights: _highlights.length, cleanups: _cleanups.length };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), currentQuery: _currentQuery, highlightCount: _highlights.length, cleanups: _cleanups.length, metrics: getMetrics(), p25Compliant: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), cleanups: _cleanups.length, checks: { highlightCount: _highlights.length, currentQuery: _currentQuery }, metrics: getMetrics(), p25Compliant: true };
}
var highlight_matches_default = { init, highlightMatches, clearHighlights, navigateToMatch, getMatchCount, getCurrentQuery, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearHighlights,
  highlight_matches_default as default,
  destroy,
  getCurrentQuery,
  getMatchCount,
  getMetrics,
  getPorts,
  healthCheck,
  highlightMatches,
  info,
  init,
  injectPorts,
  navigateToMatch
};
