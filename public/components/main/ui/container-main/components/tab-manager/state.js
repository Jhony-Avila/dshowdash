const VERSION = "8.1.0-DI-STRICT";
const MODULE_ID = "container-tab-manager-state";
function createState() {
  let _tabs = [];
  let _activeTabId = null;
  let _initialized = false;
  let _tabBarEl = null;
  let _tabContentEl = null;
  let _addBtnHandler = null;
  return {
    get tabs() {
      return _tabs;
    },
    set tabs(val) {
      _tabs = val;
    },
    get activeTabId() {
      return _activeTabId;
    },
    set activeTabId(val) {
      _activeTabId = val;
    },
    get initialized() {
      return _initialized;
    },
    set initialized(val) {
      _initialized = val;
    },
    get tabBarEl() {
      return _tabBarEl;
    },
    set tabBarEl(val) {
      _tabBarEl = val;
    },
    get tabContentEl() {
      return _tabContentEl;
    },
    set tabContentEl(val) {
      _tabContentEl = val;
    },
    get addBtnHandler() {
      return _addBtnHandler;
    },
    set addBtnHandler(val) {
      _addBtnHandler = val;
    },
    findTab(tabId) {
      return _tabs.find((t) => t.id === tabId) || null;
    },
    findTabIndex(tabId) {
      return _tabs.findIndex((t) => t.id === tabId);
    },
    addTab(tab) {
      _tabs.push(tab);
    },
    removeTab(tabId) {
      const index = this.findTabIndex(tabId);
      if (index !== -1) {
        _tabs.splice(index, 1);
        return true;
      }
      return false;
    },
    reorderTabs(fromIndex, toIndex) {
      if (fromIndex < 0 || fromIndex >= _tabs.length) return false;
      if (toIndex < 0 || toIndex >= _tabs.length) return false;
      const [tab] = _tabs.splice(fromIndex, 1);
      _tabs.splice(toIndex, 0, tab);
      return true;
    },
    reset() {
      _tabs = [];
      _activeTabId = null;
      _initialized = false;
      _tabBarEl = null;
      _tabContentEl = null;
      _addBtnHandler = null;
    },
    getSnapshot() {
      return { tabCount: _tabs.length, activeTabId: _activeTabId, initialized: _initialized, tabIds: _tabs.map((t) => t.id) };
    }
  };
}
function generateTabId() {
  return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { factoryReady: true } };
}
var state_default = { createState, generateTabId, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createState,
  state_default as default,
  generateTabId,
  healthCheck,
  info
};
