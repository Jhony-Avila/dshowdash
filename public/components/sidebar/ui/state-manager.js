import { CSS_CLASSES as C } from "./constants.js";
const VERSION = "6.0.0-NCS";
const MODULE_ID = "sidebar-state-manager";
let _metrics = { updates: 0, errors: 0 };
function setActiveItem(sidebar, itemId, expandedSections) {
  try {
    if (!sidebar) return false;
    sidebar.querySelectorAll(`.${C.ITEM_ACTIVE}`).forEach((el) => {
      el.classList.remove(C.ITEM_ACTIVE);
      el.querySelector("a")?.removeAttribute("aria-current");
    });
    const item = sidebar.querySelector(`[data-item-id="${itemId}"]`);
    if (item) {
      item.classList.add(C.ITEM_ACTIVE);
      item.querySelector("a")?.setAttribute("aria-current", "page");
      const section = item.closest("[data-section-id]");
      if (section) {
        const sectionId = section.getAttribute("data-section-id");
        expandedSections?.add(sectionId);
        section.classList.add(C.SECTION_EXPANDED);
        const items = section.querySelector(`.${C.SECTION_ITEMS}`);
        if (items) items.style.height = "";
      }
    }
    _metrics.updates++;
    return true;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}
function setCollapsed(sidebar, collapsed) {
  try {
    if (!sidebar) return false;
    sidebar.classList.toggle(C.MOD_COLLAPSED, collapsed);
    const toggle = sidebar.querySelector(`.${C.TOGGLE}`);
    toggle?.setAttribute("aria-expanded", String(!collapsed));
    toggle?.setAttribute("aria-label", collapsed ? "Expandir menu" : "Recolher menu");
    _metrics.updates++;
    return true;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}
function setMobileOpen(sidebar, open) {
  try {
    if (!sidebar) return false;
    sidebar.classList.toggle(C.MOD_MOBILE_OPEN, open);
    _metrics.updates++;
    return true;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}
function announce(sidebar, message) {
  try {
    const announcer = sidebar?.querySelector(`.${C.ANNOUNCE}`);
    if (announcer) announcer.textContent = message;
    return true;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}
function highlightText(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.replace(regex, '<mark class="highlight">$1</mark>');
}
function clearHighlights(sidebar) {
  sidebar.querySelectorAll(`.${C.ITEM_TEXT} mark`).forEach((mark) => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}
function filterItems(sidebar, query, expandedSections) {
  try {
    if (!sidebar) return { visible: 0, hidden: 0 };
    const normalizedQuery = query.toLowerCase().trim();
    let visible = 0, hidden = 0;
    clearHighlights(sidebar);
    sidebar.classList.toggle(C.MOD_SEARCHING, !!normalizedQuery);
    sidebar.querySelectorAll(`.${C.ITEM}`).forEach((item) => {
      const textEl = item.querySelector(`.${C.ITEM_TEXT}`);
      const originalText = textEl?.textContent || "";
      const text = originalText.toLowerCase();
      const matches = !normalizedQuery || text.includes(normalizedQuery);
      item.style.display = matches ? "" : "none";
      item.classList.toggle(C.ITEM_MATCH, matches && !!normalizedQuery);
      if (matches && normalizedQuery && textEl) textEl.innerHTML = highlightText(originalText, normalizedQuery);
      matches ? visible++ : hidden++;
    });
    if (normalizedQuery) sidebar.querySelectorAll("[data-section-id]").forEach((section) => {
      const sectionId = section.getAttribute("data-section-id");
      expandedSections?.add(sectionId);
      section.classList.add(C.SECTION_EXPANDED);
      const items = section.querySelector(`.${C.SECTION_ITEMS}`);
      if (items) items.style.height = "";
    });
    let emptyEl = sidebar.querySelector(`.${C.SEARCH_EMPTY}`);
    if (normalizedQuery && visible === 0) {
      if (!emptyEl) {
        emptyEl = document.createElement("div");
        emptyEl.className = C.SEARCH_EMPTY;
        emptyEl.innerHTML = `<span class="${C.SEARCH_EMPTY_ICON}">\u{1F50D}</span><span class="${C.SEARCH_EMPTY_TEXT}">Nenhum resultado encontrado</span>`;
        sidebar.querySelector(`.${C.NAV_CONTENT}`)?.appendChild(emptyEl);
      }
      emptyEl.style.display = "";
    } else if (emptyEl) emptyEl.style.display = "none";
    _metrics.updates++;
    return { visible, hidden };
  } catch (error) {
    _metrics.errors++;
    return { visible: 0, hidden: 0 };
  }
}
function clearSearch(sidebar, expandedSections) {
  try {
    if (!sidebar) return false;
    clearHighlights(sidebar);
    sidebar.classList.remove(C.MOD_SEARCHING);
    sidebar.querySelectorAll(`.${C.ITEM}`).forEach((item) => {
      item.style.display = "";
      item.classList.remove(C.ITEM_MATCH);
    });
    const emptyEl = sidebar.querySelector(`.${C.SEARCH_EMPTY}`);
    if (emptyEl) emptyEl.style.display = "none";
    const searchInput = sidebar.querySelector(`.${C.SEARCH_INPUT}`);
    if (searchInput) searchInput.value = "";
    _metrics.updates++;
    return true;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  let status = "HEALTHY";
  if (_metrics.errors > 0) status = "DEGRADED";
  return { status, version: VERSION, moduleId: MODULE_ID, checks: { noErrors: _metrics.errors === 0 }, metrics: getMetrics() };
}
var state_manager_default = { setActiveItem, setCollapsed, setMobileOpen, announce, filterItems, clearSearch, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  announce,
  clearSearch,
  state_manager_default as default,
  filterItems,
  getMetrics,
  healthCheck,
  info,
  setActiveItem,
  setCollapsed,
  setMobileOpen
};
