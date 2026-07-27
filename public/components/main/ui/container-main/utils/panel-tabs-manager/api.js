import { VERSION, MODULE_ID, TAB_STATES, TAB_POSITIONS, CLOSE_BEHAVIORS, DEFAULT_CONFIG } from "./constants.js";
import {
  _instance,
  setInstance,
  getConfig,
  setConfig,
  getTabs,
  setTabs,
  getActiveTabId,
  setActiveTabId,
  getTabsContainer,
  setTabsContainer,
  getContentContainer,
  setContentContainer,
  isInitialized,
  setIsInitialized,
  _listeners,
  getMetrics
} from "./state.js";
import { _log, _emit, _loadTabs } from "./helpers/index.js";
import { _createTabsUI, _renderTabs, _renderContent } from "./ui/index.js";
import { addTab, closeTab, closeAllTabs, closeOtherTabs } from "./operations/tab-crud.js";
import { activateTab, activateNextTab, activatePreviousTab } from "./operations/navigation.js";
import { getTab, getActiveTab, getAllTabs, updateTab, setTabState, setTabContent, moveTab } from "./operations/updates.js";
function createPanelTabsManager(options = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });
  _log("info", "Panel Tabs Manager created");
  return {
    init,
    destroy,
    addTab,
    closeTab,
    closeAllTabs,
    closeOtherTabs,
    activateTab,
    activateNextTab,
    activatePreviousTab,
    getTab,
    getActiveTab,
    getAllTabs,
    updateTab,
    setTabState,
    setTabContent,
    moveTab,
    getTabCount: () => getTabs().length,
    subscribe,
    healthCheck,
    info
  };
}
function getPanelTabsManager(options = {}) {
  if (!_instance) {
    setInstance(createPanelTabsManager(options));
  }
  return _instance;
}
function init(container) {
  if (isInitialized()) return true;
  const targetContainer = typeof container === "string" ? document.querySelector(container) : container;
  if (!targetContainer) {
    _log("error", "Container not found");
    return false;
  }
  _createTabsUI(targetContainer);
  const { tabs, activeTabId } = _loadTabs();
  if (tabs.length > 0) {
    tabs.forEach((tabData) => {
      const currentTabs = getTabs();
      currentTabs.push({
        ...tabData,
        state: TAB_STATES.INACTIVE
      });
      setTabs(currentTabs);
    });
    setActiveTabId(activeTabId || tabs[0]?.id);
    _renderTabs();
    _renderContent();
  }
  setIsInitialized(true);
  _emit("initialized", {});
  _log("info", "Initialized");
  return true;
}
function destroy() {
  if (!isInitialized()) return true;
  const tabsContainer = getTabsContainer();
  if (tabsContainer) {
    tabsContainer.remove();
    setTabsContainer(null);
  }
  const contentContainer = getContentContainer();
  if (contentContainer) {
    contentContainer.remove();
    setContentContainer(null);
  }
  setTabs([]);
  setActiveTabId(null);
  setIsInitialized(false);
  _log("info", "Destroyed");
  return true;
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}
function healthCheck() {
  const tabsContainer = getTabsContainer();
  const tabs = getTabs();
  const activeTabId = getActiveTabId();
  const metrics = getMetrics();
  const checks = {
    initialized: isInitialized(),
    hasContainer: !!tabsContainer,
    hasTabs: tabs.length > 0,
    hasActiveTab: !!activeTabId,
    noErrors: metrics.errors === 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed >= 3 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    tabCount: tabs.length,
    activeTabId,
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const config = getConfig();
  const tabs = getTabs();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    tabStates: Object.values(TAB_STATES),
    tabPositions: Object.values(TAB_POSITIONS),
    closeBehaviors: Object.values(CLOSE_BEHAVIORS),
    config: {
      maxTabs: config.maxTabs,
      position: config.position,
      allowReorder: config.allowReorder,
      allowDuplicates: config.allowDuplicates
    },
    isInitialized: isInitialized(),
    tabCount: tabs.length,
    activeTabId: getActiveTabId()
  };
}
export {
  activateNextTab,
  activatePreviousTab,
  activateTab,
  addTab,
  closeAllTabs,
  closeOtherTabs,
  closeTab,
  createPanelTabsManager,
  destroy,
  getActiveTab,
  getAllTabs,
  getPanelTabsManager,
  getTab,
  healthCheck,
  info,
  init,
  moveTab,
  setTabContent,
  setTabState,
  subscribe,
  updateTab
};
