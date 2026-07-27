import { createTabBarHTML, createTabElementHTML, createTabPanelHTML } from "./templates.js";
const VERSION = "8.1.0-DI-STRICT";
const MODULE_ID = "container-tab-manager-renderer";
function createRenderer(state, options = {}) {
  const { closableTabs = true, draggableTabs = true } = options;
  function createTabBar(container) {
    const header = container.querySelector(".dsd-container__header");
    if (!header) return null;
    let existing = container.querySelector(".dsd-tab-bar");
    if (existing) return existing;
    const tabBar = document.createElement("div");
    tabBar.className = "dsd-tab-bar";
    tabBar.setAttribute("role", "tablist");
    tabBar.innerHTML = createTabBarHTML();
    header.insertAdjacentElement("afterend", tabBar);
    return tabBar;
  }
  function createTabElement(tab, eventHandlers = {}) {
    const { onClick, onDoubleClick, onClose, onDrag, onKeydown } = eventHandlers;
    const tabEl = document.createElement("div");
    tabEl.className = "dsd-tab";
    tabEl.setAttribute("role", "tab");
    tabEl.setAttribute("aria-selected", "false");
    tabEl.setAttribute("data-tab-id", String(tab.id));
    tabEl.tabIndex = -1;
    if (draggableTabs) tabEl.setAttribute("draggable", "true");
    tabEl.innerHTML = createTabElementHTML(tab, { closableTabs, draggableTabs });
    tabEl.addEventListener("click", (e) => {
      if (!e.target.closest(".dsd-tab__close")) onClick?.(String(tab.id));
    });
    tabEl.addEventListener("dblclick", (e) => {
      if (!e.target.closest(".dsd-tab__close")) onDoubleClick?.(String(tab.id));
    });
    const closeBtn = tabEl.querySelector(".dsd-tab__close");
    closeBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      onClose?.(String(tab.id));
    });
    if (onDrag) onDrag(tabEl, String(tab.id));
    if (onKeydown) onKeydown(tabEl, String(tab.id));
    return tabEl;
  }
  function createTabPanel(tab) {
    const panel = document.createElement("div");
    panel.className = "dsd-tab-panel";
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("data-tab-id", String(tab.id));
    panel.setAttribute("aria-hidden", "true");
    panel.tabIndex = 0;
    const content = createTabPanelHTML(tab);
    if (content) panel.innerHTML = content;
    else if (tab.content instanceof HTMLElement) panel.appendChild(tab.content);
    return panel;
  }
  function render(eventHandlers = {}) {
    if (!state.tabBarEl) return;
    const tabsSlot = state.tabBarEl.querySelector('[data-slot="tabs"]');
    if (!tabsSlot) return;
    tabsSlot.innerHTML = "";
    state.tabs.forEach((tab) => {
      const tabEl = createTabElement(tab, eventHandlers);
      tabsSlot.appendChild(tabEl);
      if (tab.id === state.activeTabId) {
        tabEl.classList.add("dsd-tab--active");
        tabEl.setAttribute("aria-selected", "true");
        tabEl.tabIndex = 0;
      }
    });
    updatePanels();
  }
  function updatePanels() {
    if (!state.tabContentEl) return;
    const panels = state.tabContentEl.querySelectorAll(".dsd-tab-panel");
    panels.forEach((panel) => {
      const tabId = panel.dataset.tabId;
      const isActive = tabId === state.activeTabId;
      panel.classList.toggle("dsd-tab-panel--active", isActive);
      panel.setAttribute("aria-hidden", String(!isActive));
    });
  }
  function startRename(tabId, onFinish) {
    const tabEl = state.tabBarEl?.querySelector(`[data-tab-id="${tabId}"]`);
    const titleEl = tabEl?.querySelector(".dsd-tab__title");
    if (!titleEl) return;
    const tab = state.findTab(tabId);
    if (!tab) return;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "dsd-tab__input";
    input.value = String(tab.title || "");
    const finishRename = () => {
      const newTitle = input.value.trim() || String(tab.title);
      tab.title = newTitle;
      titleEl.textContent = newTitle;
      titleEl.style.display = "";
      input.remove();
      onFinish?.(tabId, newTitle);
    };
    input.addEventListener("blur", finishRename);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finishRename();
      if (e.key === "Escape") {
        input.value = String(tab.title || "");
        finishRename();
      }
    });
    titleEl.style.display = "none";
    titleEl.insertAdjacentElement("afterend", input);
    input.focus();
    input.select();
  }
  function removePanel(tabId) {
    const panel = state.tabContentEl?.querySelector(`[data-tab-id="${tabId}"]`);
    panel?.remove();
  }
  function focusTab(tabId) {
    const tabEl = state.tabBarEl?.querySelector(`[data-tab-id="${tabId}"]`);
    tabEl?.focus();
  }
  return { createTabBar, createTabElement, createTabPanel, render, updatePanels, startRename, removePanel, focusTab };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { rendererReady: true } };
}
var renderer_default = { createRenderer, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createRenderer,
  renderer_default as default,
  healthCheck,
  info
};
