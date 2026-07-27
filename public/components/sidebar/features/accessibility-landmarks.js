import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { CSS_CLASSES as C } from "../ui/constants.js";
const VERSION = "6.1.0-ES6";
const MODULE_ID = "sidebar-accessibility-landmarks";
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
let _metrics = { applies: 0, updates: 0, errors: 0 };
const ARIA_ROLES = { sidebar: "navigation", section: "region", list: "list", listitem: "listitem", button: "button", link: "link", search: "search", menu: "menu", menuitem: "menuitem", tree: "tree", treeitem: "treeitem", group: "group" };
function init(eventBus, container) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  if (container) applyLandmarks(container);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.A11Y_INITIALIZED);
}
function applyLandmarks(container) {
  if (!container) return;
  _metrics.applies++;
  container.setAttribute("role", ARIA_ROLES.sidebar);
  container.setAttribute("aria-label", "Menu de navega\xE7\xE3o principal");
  const header = container.querySelector(`.${C.HEADER}`);
  if (header) {
    header.setAttribute("role", "banner");
    header.setAttribute("aria-label", "Cabe\xE7alho do menu");
  }
  const logo = container.querySelector(`.${C.LOGO}`);
  if (logo) {
    logo.setAttribute("role", "img");
    logo.setAttribute("aria-label", "Logo da aplica\xE7\xE3o");
  }
  const search = container.querySelector(`.${C.SEARCH}`);
  if (search) {
    search.setAttribute("role", ARIA_ROLES.search);
    search.setAttribute("aria-label", "Buscar no menu");
    const searchInput = search.querySelector("input");
    if (searchInput) {
      searchInput.setAttribute("aria-label", "Campo de busca");
      searchInput.setAttribute("aria-describedby", "search-hint");
      if (!search.querySelector("#search-hint")) {
        const hint = document.createElement("span");
        hint.id = "search-hint";
        hint.className = "sr-only";
        hint.textContent = "Digite para filtrar os itens do menu. Use setas para navegar.";
        search.appendChild(hint);
      }
    }
  }
  const nav = container.querySelector(`.${C.NAV}, .${C.NAV_CONTENT}`);
  if (nav) {
    nav.setAttribute("role", "tree");
    nav.setAttribute("aria-label", "Itens do menu");
    nav.setAttribute("aria-multiselectable", "false");
  }
  applyToSections(container);
  applyToItems(container);
  const footer = container.querySelector(`.${C.FOOTER}`);
  if (footer) {
    footer.setAttribute("role", "contentinfo");
    footer.setAttribute("aria-label", "Rodap\xE9 do menu");
  }
  return container;
}
function applyToSections(container) {
  container.querySelectorAll(`.${C.SECTION}`).forEach((section, index) => {
    const sectionId = section.dataset.sectionId || `section-${index}`;
    const title = section.querySelector(`.${C.GROUP_TITLE}, .${C.SECTION_TITLE}`);
    const titleText = title?.textContent?.trim() || `Se\xE7\xE3o ${index + 1}`;
    section.setAttribute("role", "group");
    section.setAttribute("aria-labelledby", `${sectionId}-title`);
    if (title) title.id = `${sectionId}-title`;
    const collapseBtn = section.querySelector(`.${C.GROUP_BUTTON}, .${C.SECTION_TOGGLE}`);
    if (collapseBtn) {
      const isExpanded = section.classList.contains(C.SECTION_EXPANDED);
      collapseBtn.setAttribute("role", "button");
      collapseBtn.setAttribute("aria-expanded", String(isExpanded));
      collapseBtn.setAttribute("aria-controls", `${sectionId}-content`);
      collapseBtn.setAttribute("aria-label", `${isExpanded ? "Colapsar" : "Expandir"} ${titleText}`);
    }
    const content = section.querySelector(`.${C.SECTION_CONTENT}, .${C.GROUP_ITEMS}`);
    if (content) {
      content.id = `${sectionId}-content`;
      content.setAttribute("role", "group");
    }
  });
}
function applyToItems(container) {
  container.querySelectorAll(`.${C.ITEM}`).forEach((item) => {
    const link = item.querySelector(`.${C.LINK}`);
    const label = item.querySelector(`.${C.ITEM_LABEL}, .${C.ITEM_TEXT}`);
    const labelText = label?.textContent?.trim() || "";
    const badge = item.querySelector(`.${C.BADGE}, .dsd-badge`);
    const badgeText = badge?.textContent?.trim();
    const hasChildren = item.querySelector(`.${C.SUBMENU}, .${C.CHILDREN}`);
    const isActive = item.classList.contains(C.ITEM_ACTIVE);
    const isDisabled = item.classList.contains(C.ITEM_DISABLED);
    item.setAttribute("role", "treeitem");
    item.setAttribute("aria-selected", String(isActive));
    if (isDisabled) item.setAttribute("aria-disabled", "true");
    if (hasChildren) {
      const isExpanded = item.classList.contains(C.ITEM_EXPANDED);
      item.setAttribute("aria-expanded", String(isExpanded));
    }
    if (link) {
      link.setAttribute("tabindex", isActive ? "0" : "-1");
      let ariaLabel = labelText;
      if (badgeText) ariaLabel += `, ${badgeText} notifica\xE7\xF5es`;
      if (isActive) ariaLabel += ", p\xE1gina atual";
      if (isDisabled) ariaLabel += ", desabilitado";
      link.setAttribute("aria-label", ariaLabel);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    const icon = item.querySelector(`.${C.ITEM_ICON}`);
    if (icon) icon.setAttribute("aria-hidden", "true");
    if (badge) {
      badge.setAttribute("role", "status");
      badge.setAttribute("aria-label", `${badgeText} notifica\xE7\xF5es`);
    }
  });
}
function updateExpansionState(sectionId, isExpanded) {
  _metrics.updates++;
  const section = _container?.querySelector(`[data-section-id="${sectionId}"]`);
  if (!section) return;
  const btn = section.querySelector(`.${C.GROUP_BUTTON}, .${C.SECTION_TOGGLE}`);
  if (btn) {
    btn.setAttribute("aria-expanded", String(isExpanded));
    const title = section.querySelector(`.${C.GROUP_TITLE}`)?.textContent || "Se\xE7\xE3o";
    btn.setAttribute("aria-label", `${isExpanded ? "Colapsar" : "Expandir"} ${title}`);
  }
}
function updateActiveItem(itemId) {
  _metrics.updates++;
  if (!_container) return;
  _container.querySelectorAll('[aria-current="page"]').forEach((el) => {
    el.removeAttribute("aria-current");
    el.setAttribute("tabindex", "-1");
    el.closest(`.${C.ITEM}`)?.setAttribute("aria-selected", "false");
  });
  const item = _container.querySelector(`[data-item-id="${itemId}"]`);
  if (item) {
    const link = item.querySelector(`.${C.LINK}`);
    if (link) {
      link.setAttribute("aria-current", "page");
      link.setAttribute("tabindex", "0");
    }
    item.setAttribute("aria-selected", "true");
  }
}
function addDescribedBy(elementId, descriptionId, description) {
  if (!_container) return;
  const element = _container.querySelector(`#${elementId}, [data-item-id="${elementId}"]`);
  if (!element) return;
  let descEl = _container.querySelector(`#${descriptionId}`);
  if (!descEl) {
    descEl = document.createElement("span");
    descEl.id = descriptionId;
    descEl.className = "sr-only";
    element.parentNode?.insertBefore(descEl, element.nextSibling);
  }
  descEl.textContent = description;
  element.setAttribute("aria-describedby", descriptionId);
}
function setLoadingState(isLoading, message) {
  if (!_container) return;
  message = message || "Carregando menu...";
  _container.setAttribute("aria-busy", String(isLoading));
  if (isLoading) {
    _container.setAttribute("aria-describedby", "sidebar-loading-msg");
    let loadingMsg = _container.querySelector("#sidebar-loading-msg");
    if (!loadingMsg) {
      loadingMsg = document.createElement("div");
      loadingMsg.id = "sidebar-loading-msg";
      loadingMsg.className = "sr-only";
      loadingMsg.setAttribute("role", "status");
      loadingMsg.setAttribute("aria-live", "polite");
      _container.appendChild(loadingMsg);
    }
    loadingMsg.textContent = message;
  } else {
    _container.removeAttribute("aria-describedby");
    _container.querySelector("#sidebar-loading-msg")?.remove();
  }
}
function destroy() {
  _container?.querySelector("#search-hint")?.remove();
  _container?.querySelector("#sidebar-loading-msg")?.remove();
  _container = null;
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), hasContainer: !!_container, sectionsCount: _container?.querySelectorAll('[role="group"]').length || 0, itemsCount: _container?.querySelectorAll('[role="treeitem"]').length || 0, metrics: getMetrics() };
}
function healthCheck() {
  const hasRole = _container?.hasAttribute("role");
  const hasLabel = _container?.hasAttribute("aria-label");
  return { status: hasRole && hasLabel ? "HEALTHY" : _container ? "DEGRADED" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { hasContainer: !!_container, hasRole, hasLabel }, metrics: getMetrics() };
}
var accessibility_landmarks_default = { init, applyLandmarks, updateExpansionState, updateActiveItem, addDescribedBy, setLoadingState, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  addDescribedBy,
  applyLandmarks,
  accessibility_landmarks_default as default,
  destroy,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  setLoadingState,
  updateActiveItem,
  updateExpansionState
};
