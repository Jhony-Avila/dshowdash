import { STORAGE_KEY } from "../constants.js";
import { getConfig, getTabs, getActiveTabId } from "../state.js";
import { _log } from "./logger.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-tabs-manager.helpers.storage";
function _generateTabId() {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function _saveTabs() {
  const config = getConfig();
  if (!config.persistTabs) return;
  try {
    const tabs = getTabs();
    const tabsData = tabs.map((t) => ({
      id: t.id,
      panelId: t.panelId,
      title: t.title,
      icon: t.icon,
      state: t.state,
      metadata: t.metadata
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tabs: tabsData,
      activeTabId: getActiveTabId()
    }));
  } catch (e) {
    _log("warn", "Failed to save tabs:", e.message);
  }
}
function _loadTabs() {
  const config = getConfig();
  if (!config.persistTabs) return { tabs: [], activeTabId: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        tabs: data.tabs || [],
        activeTabId: data.activeTabId
      };
    }
  } catch (e) {
  }
  return { tabs: [], activeTabId: null };
}
export {
  MODULE_ID,
  VERSION,
  _generateTabId,
  _loadTabs,
  _saveTabs
};
