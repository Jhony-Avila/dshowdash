// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-DI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-tab-manager-state
// PURPOSE: Tab Manager - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createState() — exported function
//   generateTabId() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '8.1.0-DI-STRICT';
export const MODULE_ID = 'container-tab-manager-state';

export function createState() {
  let _tabs: Record<string, unknown>[] = [];
  let _activeTabId: string | null = null;
  let _initialized = false;
  let _tabBarEl: HTMLElement | null = null;
  let _tabContentEl: HTMLElement | null = null;
  let _addBtnHandler: EventListener | null = null;

  return {
    get tabs() { return _tabs; },
    set tabs(val) { _tabs = val; },
    get activeTabId() { return _activeTabId; },
    set activeTabId(val) { _activeTabId = val; },
    get initialized() { return _initialized; },
    set initialized(val) { _initialized = val; },
    get tabBarEl() { return _tabBarEl; },
    set tabBarEl(val) { _tabBarEl = val; },
    get tabContentEl() { return _tabContentEl; },
    set tabContentEl(val) { _tabContentEl = val; },
    get addBtnHandler() { return _addBtnHandler; },
    set addBtnHandler(val) { _addBtnHandler = val; },
    findTab(tabId: string) { return _tabs.find(t => (t as Record<string, unknown>).id === tabId) || null; },
    findTabIndex(tabId: string) { return _tabs.findIndex(t => (t as Record<string, unknown>).id === tabId); },
    addTab(tab: Record<string, unknown>) { _tabs.push(tab); },
    removeTab(tabId: string) {
      const index = this.findTabIndex(tabId);
      if (index !== -1) { _tabs.splice(index, 1); return true; }
      return false;
    },
    reorderTabs(fromIndex: number, toIndex: number) {
      if (fromIndex < 0 || fromIndex >= _tabs.length) return false;
      if (toIndex < 0 || toIndex >= _tabs.length) return false;
      const [tab] = _tabs.splice(fromIndex, 1);
      _tabs.splice(toIndex, 0, tab);
      return true;
    },
    reset() {
      _tabs = []; _activeTabId = null; _initialized = false;
      _tabBarEl = null; _tabContentEl = null; _addBtnHandler = null;
    },
    getSnapshot() {
      return { tabCount: _tabs.length, activeTabId: _activeTabId, initialized: _initialized, tabIds: _tabs.map(t => (t as Record<string, unknown>).id) };
    }
  };
}

export function generateTabId() {
  return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { factoryReady: true } };
}

export default { createState, generateTabId, info, healthCheck, VERSION, MODULE_ID };
