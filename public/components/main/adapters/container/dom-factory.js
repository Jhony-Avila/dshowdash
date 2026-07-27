const MODULE_ID = "main-container-dom-factory";
const VERSION = "8.0.0-UNIFIED";
import { STATE, DOCK_SLOTS } from "./constants.js";
import { validateVariant } from "./helpers.js";
const DF_SVGS = {
  chevronDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'
};
let _domAdapter = null;
function initDOMFactory(domAdapter) {
  if (!domAdapter) throw new Error("[dom-factory] DOMAdapter \xE9 obrigat\xF3rio");
  _domAdapter = domAdapter;
  return true;
}
function _createElement(tagName, options = {}) {
  const opts = options || {};
  if (_domAdapter) return _domAdapter.createElement(tagName, opts);
  const el = document.createElement(tagName);
  if (opts.className) el.className = opts.className;
  if (opts.id) el.id = opts.id;
  if (opts.textContent) el.textContent = opts.textContent;
  if (opts.innerHTML) el.innerHTML = opts.innerHTML;
  if (opts.type) el.type = opts.type;
  if (opts.title) el.title = opts.title;
  if (opts.attributes) {
    const attrs = opts.attributes;
    for (const key in attrs) {
      if (attrs.hasOwnProperty(key)) el.setAttribute(key, attrs[key]);
    }
  }
  return el;
}
function _querySelector(selector, context = null) {
  if (_domAdapter) return _domAdapter.querySelector(selector, context);
  return context ? context.querySelector(selector) : document.querySelector(selector);
}
function ensureDockSlots(host) {
  if (!host) return false;
  const slotOrder = [DOCK_SLOTS.PRIMARY, DOCK_SLOTS.SECONDARY, DOCK_SLOTS.TERTIARY];
  slotOrder.forEach((slotName) => {
    if (!_querySelector(`[data-dock-slot="${slotName}"]`, host)) {
      const slotEl = _createElement("div", { className: `dsd-dock-slot dsd-dock-slot--${slotName}`, attributes: { "data-dock-slot": slotName } });
      host.insertBefore(slotEl, host.firstChild);
    }
  });
  const slots = slotOrder.map((s) => _querySelector(`[data-dock-slot="${s}"]`, host)).filter(Boolean);
  for (let i = slots.length - 1; i >= 0; i--) host.insertBefore(slots[i], host.firstChild);
  return true;
}
function getSlotElement(host, slotName) {
  ensureDockSlots(host);
  return _querySelector(`[data-dock-slot="${slotName}"]`, host) || host;
}
function createContainerElement(options) {
  const opts = options || {};
  const id = opts.id;
  const title = opts.title || "";
  const variant = opts.variant || "default";
  const collapsible = opts.collapsible !== false;
  const defaultCollapsed = opts.defaultCollapsed || false;
  const safeVariant = validateVariant(variant);
  const collapsedClass = defaultCollapsed ? " dsd-container--collapsed" : "";
  const rootEl = _createElement("div", { className: `dsd-container dsd-container--${safeVariant}${collapsedClass}`, attributes: { "data-container-id": id, "data-variant": safeVariant, "data-state": STATE.CREATING.toLowerCase(), "data-active": "false", "data-dock-slot": "", "data-layout-mode": "inherit", "role": "region", "aria-labelledby": `${id}-header` } });
  const headerEl = _createElement("div", { className: "dsd-container__header", id: `${id}-header` });
  const headerLeft = _createElement("div", { className: "dsd-container__header-left" });
  if (title) headerLeft.appendChild(_createElement("span", { className: "dsd-container__title", textContent: title }));
  const headerRight = _createElement("div", { className: "dsd-container__header-right" });
  if (collapsible) {
    const toggleBtn = _createElement("button", { className: "dsd-container__toggle", type: "button", title: "Minimizar/Expandir", attributes: { "aria-expanded": defaultCollapsed ? "false" : "true", "aria-controls": `${id}-content` } });
    toggleBtn.appendChild(_createElement("span", { className: "dsd-container__toggle-icon", innerHTML: DF_SVGS.chevronDown }));
    headerRight.appendChild(toggleBtn);
  }
  headerEl.appendChild(headerLeft);
  headerEl.appendChild(headerRight);
  const bodyEl = _createElement("div", { className: "dsd-container__body", id: `${id}-content` });
  const contentEl = _createElement("div", { className: "dsd-container__content" });
  bodyEl.appendChild(contentEl);
  const footerEl = _createElement("div", { className: "dsd-container__footer" });
  const loadingEl = _createElement("div", { className: "dsd-container__loading", attributes: { "aria-hidden": "true" } });
  loadingEl.appendChild(_createElement("div", { className: "dsd-container__spinner" }));
  const errorEl = _createElement("div", { className: "dsd-container__error", attributes: { "role": "alert", "aria-live": "polite" } });
  rootEl.appendChild(headerEl);
  rootEl.appendChild(bodyEl);
  rootEl.appendChild(footerEl);
  rootEl.appendChild(loadingEl);
  rootEl.appendChild(errorEl);
  return { rootEl, contentEl };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: !!_domAdapter };
}
function healthCheck() {
  const initialized = !!_domAdapter;
  return { status: initialized ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { initialized, domAdapterInfo: _domAdapter && typeof _domAdapter.info === "function" ? _domAdapter.info() : null } };
}
var dom_factory_default = { MODULE_ID, VERSION, initDOMFactory, ensureDockSlots, getSlotElement, createContainerElement, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createContainerElement,
  dom_factory_default as default,
  ensureDockSlots,
  getSlotElement,
  healthCheck,
  info,
  initDOMFactory
};
