import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
import { createLogger } from "../../utils/logger.js";
import * as Ports from "./ports.js";
import { createState, generateTabId } from "./state.js";
import { createRenderer } from "./renderer.js";
import { createDragDropHandler } from "./drag-drop.js";
import { createKeyboardHandler } from "./keyboard.js";
const VERSION = "8.1.0-DI-STRICT";
const MODULE_ID = "container-tab-manager";
const logger = createLogger("TabManager");
function createTabManager(container, options = {}) {
  const { maxTabs = 10, closableTabs = true, draggableTabs = true, onTabChange, onTabClose, onTabCreate, onTabReorder } = options;
  const state = createState();
  const renderer = createRenderer(state, { closableTabs, draggableTabs });
  let dragDropHandler = null;
  let keyboardHandler = null;
  function getContainerId() {
    return container.id || "unknown";
  }
  function renderTabs() {
    renderer.render({
      onClick: (tabId) => tabManager.activateTab(tabId),
      onDoubleClick: (tabId) => renderer.startRename(tabId, () => {
      }),
      onClose: (tabId) => tabManager.closeTab(tabId),
      onDrag: draggableTabs ? (tabEl, tabId) => dragDropHandler?.attachListeners(tabEl, tabId) : null,
      onKeydown: (tabEl, tabId) => keyboardHandler?.attachListener(tabEl, tabId)
    });
  }
  const tabManager = {
    init() {
      if (state.initialized) return this;
      Ports.init();
      state.tabBarEl = renderer.createTabBar(container);
      state.tabContentEl = container.querySelector(".dsd-container__content");
      if (draggableTabs) dragDropHandler = createDragDropHandler(state, { onReorder: onTabReorder, onRender: renderTabs });
      keyboardHandler = createKeyboardHandler(state, { onActivate: (tabId) => tabManager.activateTab(tabId), onClose: (tabId) => tabManager.closeTab(tabId), closableTabs });
      const addBtn = state.tabBarEl?.querySelector(".dsd-tab-bar__add");
      if (addBtn) {
        state.addBtnHandler = () => tabManager.addTab({ title: "Nova Aba" });
        addBtn.addEventListener("click", state.addBtnHandler);
      }
      renderTabs();
      state.initialized = true;
      return this;
    },
    addTab(tabData = {}) {
      if (state.tabs.length >= maxTabs) {
        logger.warn(`Max tabs (${maxTabs}) reached`);
        return null;
      }
      const tab = { id: tabData.id || generateTabId(), title: tabData.title || "Nova Aba", icon: tabData.icon || "", badge: tabData.badge || "", closable: tabData.closable !== false, content: tabData.content || null, data: tabData.data || {} };
      state.addTab(tab);
      if (state.tabContentEl) {
        const panel = renderer.createTabPanel(tab);
        state.tabContentEl.appendChild(panel);
      }
      renderTabs();
      if (state.tabs.length === 1 || tabData.activate) tabManager.activateTab(tab.id);
      onTabCreate?.(tab);
      Ports.emitEvent(MAIN_EVENTS.TAB_CREATED, { tab, containerId: getContainerId() });
      return tab;
    },
    closeTab(tabId) {
      const index = state.findTabIndex(tabId);
      if (index === -1) return false;
      const tab = state.findTab(tabId);
      if (tab?.closable === false) return false;
      if (onTabClose?.(tab) === false) return false;
      state.removeTab(tabId);
      renderer.removePanel(tabId);
      if (state.activeTabId === tabId) {
        const newActive = state.tabs[Math.min(index, state.tabs.length - 1)];
        if (newActive) tabManager.activateTab(String(newActive.id));
        else state.activeTabId = null;
      }
      renderTabs();
      Ports.emitEvent(MAIN_EVENTS.TAB_CLOSED, { tabId, containerId: getContainerId() });
      return true;
    },
    activateTab(tabId) {
      const tab = state.findTab(tabId);
      if (!tab) return false;
      const prevTabId = state.activeTabId;
      state.activeTabId = tabId;
      renderTabs();
      renderer.focusTab(tabId);
      onTabChange?.(tab, prevTabId);
      Ports.emitEvent(MAIN_EVENTS.TAB_CHANGED, { tab, prevTabId, containerId: getContainerId() });
      return true;
    },
    updateTab(tabId, updates = {}) {
      const tab = state.findTab(tabId);
      if (!tab) return false;
      Object.assign(tab, updates);
      renderTabs();
      return true;
    },
    getTab(tabId) {
      return state.findTab(tabId);
    },
    // @ts-expect-error strict migration — TS2345
    getActiveTab() {
      return state.findTab(state.activeTabId);
    },
    getAllTabs() {
      return [...state.tabs];
    },
    getTabCount() {
      return state.tabs.length;
    },
    getTabPanel(tabId) {
      return state.tabContentEl?.querySelector(`[data-tab-id="${tabId}"]`) || null;
    },
    isInitialized() {
      return state.initialized;
    },
    setTabContent(tabId, content) {
      const panel = tabManager.getTabPanel(tabId);
      if (!panel) return false;
      if (typeof content === "string") panel.innerHTML = content;
      else if (content instanceof HTMLElement) {
        panel.innerHTML = "";
        panel.appendChild(content);
      }
      return true;
    },
    moveTab(fromIndex, toIndex) {
      const success = state.reorderTabs(fromIndex, toIndex);
      if (success) renderTabs();
      return success;
    },
    destroy() {
      if (state.tabBarEl) {
        const addBtn = state.tabBarEl.querySelector(".dsd-tab-bar__add");
        if (addBtn && state.addBtnHandler) addBtn.removeEventListener("click", state.addBtnHandler);
        state.tabBarEl.remove();
      }
      dragDropHandler?.cleanup?.();
      state.reset();
      dragDropHandler = null;
      keyboardHandler = null;
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, initialized: state.initialized, tabCount: state.tabs.length, activeTabId: state.activeTabId, maxTabs, modular: true, submodules: ["ports", "state", "templates", "renderer", "drag-drop", "keyboard"] };
    },
    healthCheck() {
      return { status: state.initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, tabCount: state.tabs.length, activeTabId: state.activeTabId, maxTabs, eventBusAvailable: Ports.isInitialized(), modular: true };
    }
  };
  return tabManager;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, modular: true, submodules: ["ports", "state", "templates", "renderer", "drag-drop", "keyboard"] };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { factoryReady: true }, modular: true };
}
var tab_manager_default = { createTabManager, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createTabManager,
  tab_manager_default as default,
  healthCheck,
  info
};
