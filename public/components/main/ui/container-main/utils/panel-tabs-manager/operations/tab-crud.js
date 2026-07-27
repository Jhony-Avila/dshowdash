import { TAB_STATES, CLOSE_BEHAVIORS } from "../constants.js";
import {
  getConfig,
  getTabs,
  setTabs,
  getActiveTabId,
  setActiveTabId,
  incrementMetric
} from "../state.js";
import { _log, _emit, _generateTabId, _saveTabs } from "../helpers/index.js";
import { _renderTabs, _renderContent } from "../ui/renderer.js";
import { activateTab } from "./navigation.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-tabs-manager.operations.tab-crud";
function addTab(options = {}) {
  const config = getConfig();
  const tabs = getTabs();
  if (tabs.length >= config.maxTabs) {
    _log("warn", "Maximum tabs reached");
    _emit("maxTabsReached", { max: config.maxTabs });
    return null;
  }
  const { panelId, title, icon, content, metadata, activate = true } = options;
  if (!config.allowDuplicates && panelId) {
    const existing = tabs.find((t) => t.panelId === panelId);
    if (existing) {
      if (activate) activateTab(existing.id);
      return existing;
    }
  }
  const tab = {
    id: _generateTabId(),
    panelId: panelId || null,
    title: title || config.newTabTitle,
    icon: icon || config.newTabIcon,
    state: TAB_STATES.INACTIVE,
    content: content || null,
    metadata: metadata || {},
    createdAt: Date.now()
  };
  tabs.push(tab);
  setTabs(tabs);
  incrementMetric("tabsOpened");
  _renderTabs();
  _renderContent();
  if (activate) {
    activateTab(tab.id);
  }
  _saveTabs();
  _emit("tabAdded", { tab });
  return tab;
}
function closeTab(tabId) {
  const config = getConfig();
  const tabs = getTabs();
  const index = tabs.findIndex((t) => t.id === tabId);
  if (index === -1) return false;
  const tab = tabs[index];
  if (config.confirmClose && tab.metadata?.hasChanges) {
    if (!confirm("Esta aba tem altera\xE7\xF5es n\xE3o salvas. Deseja fechar mesmo assim?")) {
      return false;
    }
  }
  tabs.splice(index, 1);
  setTabs(tabs);
  incrementMetric("tabsClosed");
  if (tabId === getActiveTabId()) {
    if (tabs.length > 0) {
      let newActiveIndex;
      switch (config.closeBehavior) {
        case CLOSE_BEHAVIORS.ACTIVATE_NEXT:
          newActiveIndex = Math.min(index, tabs.length - 1);
          break;
        case CLOSE_BEHAVIORS.ACTIVATE_FIRST:
          newActiveIndex = 0;
          break;
        case CLOSE_BEHAVIORS.ACTIVATE_PREVIOUS:
        default:
          newActiveIndex = Math.max(0, index - 1);
      }
      setActiveTabId(tabs[newActiveIndex].id);
    } else {
      setActiveTabId(null);
    }
  }
  _renderTabs();
  _renderContent();
  _saveTabs();
  _emit("tabClosed", { tab, remainingTabs: tabs.length });
  return true;
}
function closeAllTabs() {
  const tabs = getTabs();
  const count = tabs.length;
  setTabs([]);
  setActiveTabId(null);
  _renderTabs();
  _renderContent();
  _saveTabs();
  _emit("allTabsClosed", { count });
  return count;
}
function closeOtherTabs(keepTabId) {
  const tabs = getTabs();
  const keepTab = tabs.find((t) => t.id === keepTabId);
  if (!keepTab) return 0;
  const closedCount = tabs.length - 1;
  setTabs([keepTab]);
  setActiveTabId(keepTabId);
  _renderTabs();
  _renderContent();
  _saveTabs();
  _emit("otherTabsClosed", { keptTabId: keepTabId, closedCount });
  return closedCount;
}
export {
  MODULE_ID,
  VERSION,
  addTab,
  closeAllTabs,
  closeOtherTabs,
  closeTab
};
