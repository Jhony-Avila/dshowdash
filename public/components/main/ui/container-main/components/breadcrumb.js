import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
import { NAV_INTENTS } from "/core/runtime/events/catalog/nav.events.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-breadcrumb";
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
  if (options.separator !== void 0 && typeof options.separator !== "string") errors.push("separator must be a string");
  if (options.maxItems !== void 0 && (typeof options.maxItems !== "number" || options.maxItems < 1)) errors.push("maxItems must be a positive number");
  if (options.onNavigate !== void 0 && typeof options.onNavigate !== "function") errors.push("onNavigate must be a function");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
function _escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function createBreadcrumb(container, options = {}) {
  _validateOptions(options);
  const { separator = "/", maxItems = 5, onNavigate, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _items = [];
  let _breadcrumbEl = null;
  let _linkHandlers = [];
  function _createBreadcrumbElement() {
    const header = container.querySelector(".dsd-container__header");
    if (!header) return null;
    let existing = container.querySelector(".dsd-breadcrumb");
    if (existing) return existing;
    const breadcrumb2 = document.createElement("nav");
    breadcrumb2.className = "dsd-breadcrumb";
    breadcrumb2.setAttribute("aria-label", "Navega\xE7\xE3o estrutural");
    const list = document.createElement("ol");
    list.className = "dsd-breadcrumb__list";
    list.setAttribute("role", "list");
    breadcrumb2.appendChild(list);
    const tabBar = container.querySelector(".dsd-tab-bar");
    const insertAfter = tabBar || header;
    insertAfter.insertAdjacentElement("afterend", breadcrumb2);
    return breadcrumb2;
  }
  function _clearLinkHandlers() {
    _linkHandlers.forEach(({ link, handler }) => link.removeEventListener("click", handler));
    _linkHandlers = [];
  }
  function _handleNavigation(item) {
    if (item.panelId || item.route || item.href) {
      const route = item.route || item.href || item.panelId;
      _emitEvent(NAV_INTENTS.NAVIGATE, { route, panelId: item.panelId || null, meta: { source: MODULE_ID, itemId: item.id, itemLabel: item.label, containerId: container.id } });
    }
    _emitEvent(MAIN_EVENTS.BREADCRUMB_NAVIGATE, { item, containerId: container.id });
    onNavigate?.(item);
  }
  function _render() {
    if (!_breadcrumbEl) return;
    const list = _breadcrumbEl.querySelector(".dsd-breadcrumb__list");
    if (!list) return;
    _clearLinkHandlers();
    list.innerHTML = "";
    let displayItems = _items;
    if (_items.length > maxItems) {
      displayItems = [_items[0], { id: "ellipsis", label: "...", disabled: true }, ..._items.slice(-maxItems + 2)];
    }
    displayItems.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "dsd-breadcrumb__item";
      const isLast = index === displayItems.length - 1;
      const safeLabel = _escapeHtml(item.label);
      const safeHref = _escapeHtml(item.href || "#");
      const safeId = _escapeHtml(item.id);
      if (item.id === "ellipsis") {
        li.innerHTML = `<span class="dsd-breadcrumb__ellipsis" aria-hidden="true">${safeLabel}</span>`;
      } else if (isLast || item.disabled) {
        li.innerHTML = `<span class="dsd-breadcrumb__text ${isLast ? "dsd-breadcrumb__text--current" : ""}" ${isLast ? 'aria-current="page"' : ""}>${item.icon ? `<span class="dsd-breadcrumb__icon" aria-hidden="true">${item.icon}</span>` : ""}${safeLabel}</span>`;
      } else {
        li.innerHTML = `<a href="${safeHref}" class="dsd-breadcrumb__link" data-id="${safeId}">${item.icon ? `<span class="dsd-breadcrumb__icon" aria-hidden="true">${item.icon}</span>` : ""}${safeLabel}</a>`;
        const link = li.querySelector(".dsd-breadcrumb__link");
        if (link) {
          const handler = (e) => {
            e.preventDefault();
            _handleNavigation(item);
          };
          link.addEventListener("click", handler);
          _linkHandlers.push({ link, handler });
        }
      }
      if (index < displayItems.length - 1) {
        const sep = document.createElement("span");
        sep.className = "dsd-breadcrumb__separator";
        sep.setAttribute("aria-hidden", "true");
        sep.setAttribute("role", "presentation");
        sep.textContent = separator;
        li.appendChild(sep);
      }
      list.appendChild(li);
    });
  }
  const breadcrumb = {
    init() {
      if (_initialized) return this;
      _breadcrumbEl = _createBreadcrumbElement();
      _render();
      _initialized = true;
      return this;
    },
    setItems(items) {
      if (!Array.isArray(items)) return this;
      _items = items.map((item, index) => ({
        id: item.id || `item-${index}`,
        label: item.label || item,
        icon: item.icon || "",
        href: item.href || "#",
        panelId: item.panelId || null,
        route: item.route || null,
        disabled: item.disabled || false,
        data: item.data || {}
      }));
      _render();
      return this;
    },
    push(item) {
      if (!item) return this;
      _items.push({
        id: item.id || `item-${_items.length}`,
        label: item.label || item,
        icon: item.icon || "",
        href: item.href || "#",
        panelId: item.panelId || null,
        route: item.route || null,
        data: item.data || {}
      });
      _render();
      return this;
    },
    pop() {
      const item = _items.pop();
      _render();
      return item;
    },
    navigateTo(itemId) {
      const index = _items.findIndex((item) => item.id === itemId);
      if (index !== -1) {
        _items = _items.slice(0, index + 1);
        _render();
      }
      return this;
    },
    clear() {
      _items = [];
      _render();
      return this;
    },
    getItems() {
      return [..._items];
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      _clearLinkHandlers();
      _breadcrumbEl?.remove();
      _breadcrumbEl = null;
      _items = [];
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, itemCount: _items.length, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
    }
  };
  return breadcrumb;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
}
var breadcrumb_default = { createBreadcrumb, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createBreadcrumb,
  breadcrumb_default as default,
  healthCheck,
  info,
  injectEventBus
};
