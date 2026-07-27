// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: api
// PURPOSE: Panel Tabs Manager - Public API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, TAB_STATES, TAB_POSITIONS, CLOSE_BEHAVIORS, DEFAULT_CONFI...
//   _instance, setInstance, getConfig, setConfig, getTabs, setTabs, getActiveTabI...
//   _log, _emit, _loadTabs from ./helpers/index.js
//   _createTabsUI, _renderTabs, _renderContent from ./ui/index.js
//   addTab, closeTab, closeAllTabs, closeOtherTabs from ./operations/tab-crud.js
//   activateTab, activateNextTab, activatePreviousTab from ./operations/navigatio...
//   getTab, getActiveTab, getAllTabs, updateTab, setTabState, setTabContent, move...
//
// PROVIDES:
//   createPanelTabsManager() — exported function
//   getPanelTabsManager() — exported function
//   init() — exported function
//   destroy() — exported function
//   subscribe() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   addTab — exported value
//   closeTab — exported value
//   closeAllTabs — exported value
//   closeOtherTabs — exported value
//   activateTab — exported value
//   activateNextTab — exported value
//   activatePreviousTab — exported value
//   getTab — exported value
//   getActiveTab — exported value
//   getAllTabs — exported value
//   updateTab — exported value
//   setTabState — exported value
//   setTabContent — exported value
//   ... and 1 more exports
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

import { VERSION, MODULE_ID, TAB_STATES, TAB_POSITIONS, CLOSE_BEHAVIORS, DEFAULT_CONFIG } from './constants.js';
import {
  _instance, setInstance,
  getConfig, setConfig,
  getTabs, setTabs,
  getActiveTabId, setActiveTabId,
  getTabsContainer, setTabsContainer,
  getContentContainer, setContentContainer,
  isInitialized, setIsInitialized,
  _listeners, getMetrics
} from './state.js';
import { _log, _emit, _loadTabs } from './helpers/index.js';
import { _createTabsUI, _renderTabs, _renderContent } from './ui/index.js';
import { addTab, closeTab, closeAllTabs, closeOtherTabs } from './operations/tab-crud.js';
import { activateTab, activateNextTab, activatePreviousTab } from './operations/navigation.js';
import { getTab, getActiveTab, getAllTabs, updateTab, setTabState, setTabContent, moveTab } from './operations/updates.js';

export function createPanelTabsManager(options: Record<string, unknown> = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });
  
  _log('info', 'Panel Tabs Manager created');
  
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

export function getPanelTabsManager(options: Record<string, unknown> = {}) {
  if (!_instance) {
    setInstance(createPanelTabsManager(options));
  }
  return _instance;
}

export function init(container: HTMLElement) {
  if (isInitialized()) return true;
  
  const targetContainer = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!targetContainer) {
    _log('error', 'Container not found');
    return false;
  }
  
  _createTabsUI(targetContainer);
  
  // Load persisted tabs
  const { tabs, activeTabId } = _loadTabs();
  if (tabs.length > 0) {
    tabs.forEach((tabData: unknown) => {
      const currentTabs = getTabs();
      currentTabs.push({
        ...(tabData as Record<string, unknown>),
        state: TAB_STATES.INACTIVE
      });
      setTabs(currentTabs);
    });
    setActiveTabId(activeTabId || tabs[0]?.id);
    _renderTabs();
    _renderContent();
  }
  
  setIsInitialized(true);
  _emit('initialized', {});
  _log('info', 'Initialized');
  
  return true;
}

export function destroy() {
  if (!isInitialized()) return true;
  
  const tabsContainer = getTabsContainer();
  if (tabsContainer) {
    tabsContainer.remove();
    // @ts-expect-error strict migration — TS2345
    setTabsContainer(null);
  }
  
  const contentContainer = getContentContainer();
  if (contentContainer) {
    contentContainer.remove();
    // @ts-expect-error strict migration — TS2345
    setContentContainer(null);
  }
  
  setTabs([]);
  // @ts-expect-error strict migration — TS2345
  setActiveTabId(null);
  setIsInitialized(false);
  
  _log('info', 'Destroyed');
  return true;
}

export function subscribe(callback: (...args: unknown[]) => void) {
  if (typeof callback !== 'function') return () => {};
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}

export function healthCheck() {
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
    status: passed >= 3 ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
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

export function info() {
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

// Re-export operations for direct access
export { addTab, closeTab, closeAllTabs, closeOtherTabs };
export { activateTab, activateNextTab, activatePreviousTab };
export { getTab, getActiveTab, getAllTabs, updateTab, setTabState, setTabContent, moveTab };
