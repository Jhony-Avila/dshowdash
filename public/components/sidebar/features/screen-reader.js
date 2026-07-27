import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "6.1.0-ES6";
const MODULE_ID = "sidebar-screen-reader";
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
let _liveRegion = null;
let _skipLink = null;
let _announceTimer = null;
let _cleanups = [];
let _metrics = { announcements: 0, enhancements: 0 };
function createLiveRegion() {
  if (_liveRegion) return _liveRegion;
  _liveRegion = document.createElement("div");
  _liveRegion.setAttribute("role", "status");
  _liveRegion.setAttribute("aria-live", "polite");
  _liveRegion.setAttribute("aria-atomic", "true");
  _liveRegion.className = "sr-only";
  _liveRegion.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;";
  document.body.appendChild(_liveRegion);
  return _liveRegion;
}
function init(eventBus) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.SCREEN_READER_INITIALIZED);
}
function announce(message, priority = "polite") {
  const region = createLiveRegion();
  region.setAttribute("aria-live", priority);
  region.textContent = "";
  _metrics.announcements++;
  if (_announceTimer) clearTimeout(_announceTimer);
  _announceTimer = setTimeout(() => {
    region.textContent = message;
    _announceTimer = null;
  }, 100);
}
function enhance(container) {
  if (!container) return;
  _metrics.enhancements++;
  container.setAttribute("role", "navigation");
  container.setAttribute("aria-label", "Menu principal");
  container.querySelectorAll(`.${C.SECTION}`).forEach((section, index) => {
    section.setAttribute("role", "region");
    const titleEl = section.querySelector(`.${C.GROUP_TITLE}`);
    const title = titleEl?.textContent || `Se\xE7\xE3o ${index + 1}`;
    section.setAttribute("aria-label", title);
  });
  container.querySelectorAll(`.${C.ITEM}`).forEach((item) => {
    const link = item.querySelector(`.${C.LINK}`);
    if (link) {
      const labelEl = item.querySelector(`.${C.ITEM_TEXT}`);
      const label = labelEl?.textContent || "";
      const badgeEl = item.querySelector(`.${C.BADGE}`);
      const badge = badgeEl?.textContent || "";
      if (badge) link.setAttribute("aria-label", `${label} (${badge} notifica\xE7\xF5es)`);
    }
  });
  container.querySelectorAll(`.${C.GROUP_BUTTON}`).forEach((btn) => {
    const isExpanded = btn.closest(`.${C.SECTION}`)?.classList.contains(C.SECTION_EXPANDED);
    btn.setAttribute("aria-expanded", String(isExpanded));
  });
  addSkipLink(container);
}
function addSkipLink(container) {
  if (_skipLink) return;
  _skipLink = document.createElement("a");
  _skipLink.className = `${C.SKIP_LINK} sr-only-focusable`;
  _skipLink.href = "#main-content";
  _skipLink.textContent = "Pular para conte\xFAdo principal";
  _skipLink.style.cssText = "position:absolute;top:-40px;left:0;padding:8px 16px;background:var(--sidebar-accent-primary,#7B6EF6);color:white;z-index:10000;transition:top 0.2s;";
  const focusHandler = () => {
    _skipLink.style.top = "0";
  };
  const blurHandler = () => {
    _skipLink.style.top = "-40px";
  };
  _skipLink.addEventListener("focus", focusHandler);
  _skipLink.addEventListener("blur", blurHandler);
  _cleanups.push(() => {
    _skipLink.removeEventListener("focus", focusHandler);
  });
  _cleanups.push(() => {
    _skipLink.removeEventListener("blur", blurHandler);
  });
  container.insertBefore(_skipLink, container.firstChild);
}
function announceNavigation(itemLabel) {
  announce(`Navegando para ${itemLabel}`);
}
function announceExpansion(sectionLabel, isExpanded) {
  announce(`${sectionLabel} ${isExpanded ? "expandido" : "colapsado"}`);
}
function announceSearchResults(count) {
  if (count === 0) announce("Nenhum resultado encontrado");
  else if (count === 1) announce("1 resultado encontrado");
  else announce(`${count} resultados encontrados`);
}
function enableHighContrast(container) {
  container?.classList.add(C.MOD_HIGH_CONTRAST);
  announce("Modo de alto contraste ativado");
}
function disableHighContrast(container) {
  container?.classList.remove(C.MOD_HIGH_CONTRAST);
  announce("Modo de alto contraste desativado");
}
function enableLargeText(container) {
  container?.classList.add(C.MOD_LARGE_TEXT);
  announce("Texto grande ativado");
}
function disableLargeText(container) {
  container?.classList.remove(C.MOD_LARGE_TEXT);
  announce("Texto grande desativado");
}
function destroy() {
  if (_announceTimer) {
    clearTimeout(_announceTimer);
    _announceTimer = null;
  }
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  _liveRegion?.remove();
  _liveRegion = null;
  _skipLink?.remove();
  _skipLink = null;
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), hasLiveRegion: !!_liveRegion, hasSkipLink: !!_skipLink, cleanups: _cleanups.length, metrics: getMetrics() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { liveRegionReady: !!_liveRegion || true, noOrphanTimers: !_announceTimer }, metrics: getMetrics() };
}
var screen_reader_default = { init, announce, enhance, announceNavigation, announceExpansion, announceSearchResults, enableHighContrast, disableHighContrast, enableLargeText, disableLargeText, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  announce,
  announceExpansion,
  announceNavigation,
  announceSearchResults,
  screen_reader_default as default,
  destroy,
  disableHighContrast,
  disableLargeText,
  enableHighContrast,
  enableLargeText,
  enhance,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts
};
