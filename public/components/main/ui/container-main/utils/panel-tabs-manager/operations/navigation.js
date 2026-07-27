import { getTabs, getActiveTabId, setActiveTabId, incrementMetric } from "../state.js";
import { _emit, _saveTabs } from "../helpers/index.js";
import { _renderTabs, _renderContent } from "../ui/renderer.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-tabs-manager.operations.navigation";
function activateTab(tabId) {
  const tabs = getTabs();
  const tab = tabs.find((t) => t.id === tabId);
  if (!tab) return false;
  const currentActiveId = getActiveTabId();
  if (currentActiveId === tabId) return true;
  const previousTabId = currentActiveId;
  setActiveTabId(tabId);
  incrementMetric("tabsSwitched");
  _renderTabs();
  _renderContent();
  _saveTabs();
  _emit("tabActivated", { tab, previousTabId });
  return true;
}
function activateNextTab() {
  const tabs = getTabs();
  if (tabs.length === 0) return false;
  const currentIndex = tabs.findIndex((t) => t.id === getActiveTabId());
  const nextIndex = (currentIndex + 1) % tabs.length;
  return activateTab(tabs[nextIndex].id);
}
function activatePreviousTab() {
  const tabs = getTabs();
  if (tabs.length === 0) return false;
  const currentIndex = tabs.findIndex((t) => t.id === getActiveTabId());
  const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  return activateTab(tabs[prevIndex].id);
}
export {
  MODULE_ID,
  VERSION,
  activateNextTab,
  activatePreviousTab,
  activateTab
};
