import { TAB_STATES } from "../constants.js";
import { getTabs, setTabs } from "../state.js";
import { _emit, _saveTabs } from "../helpers/index.js";
import { _renderTabs, _renderContent } from "../ui/renderer.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-tabs-manager.operations.updates";
function getTab(tabId) {
  const tabs = getTabs();
  return tabs.find((t) => t.id === tabId) || null;
}
function getActiveTab() {
  const tabs = getTabs();
  const { getActiveTabId } = require("../state.js");
  return tabs.find((t) => t.id === getActiveTabId()) || null;
}
function getAllTabs() {
  return [...getTabs()];
}
function updateTab(tabId, updates) {
  const tabs = getTabs();
  const tab = tabs.find((t) => t.id === tabId);
  if (!tab) return null;
  const allowedFields = ["title", "icon", "metadata"];
  allowedFields.forEach((field) => {
    if (updates[field] !== void 0) {
      tab[field] = updates[field];
    }
  });
  _renderTabs();
  _saveTabs();
  _emit("tabUpdated", { tab });
  return tab;
}
function setTabState(tabId, state) {
  const tabs = getTabs();
  const tab = tabs.find((t) => t.id === tabId);
  if (!tab || !Object.values(TAB_STATES).includes(state)) return false;
  tab.state = state;
  _renderTabs();
  _emit("tabStateChanged", { tab, state });
  return true;
}
function setTabContent(tabId, content) {
  const tabs = getTabs();
  const tab = tabs.find((t) => t.id === tabId);
  if (!tab) return false;
  tab.content = content;
  _renderContent();
  return true;
}
function moveTab(tabId, newIndex) {
  const tabs = getTabs();
  const currentIndex = tabs.findIndex((t) => t.id === tabId);
  if (currentIndex === -1) return false;
  newIndex = Math.max(0, Math.min(tabs.length - 1, newIndex));
  const [tab] = tabs.splice(currentIndex, 1);
  tabs.splice(newIndex, 0, tab);
  setTabs(tabs);
  _renderTabs();
  _saveTabs();
  _emit("tabMoved", { tabId, fromIndex: currentIndex, toIndex: newIndex });
  return true;
}
export {
  MODULE_ID,
  VERSION,
  getActiveTab,
  getAllTabs,
  getTab,
  moveTab,
  setTabContent,
  setTabState,
  updateTab
};
