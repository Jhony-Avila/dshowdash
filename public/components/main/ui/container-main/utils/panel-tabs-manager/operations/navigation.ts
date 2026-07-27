// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navigation
// PURPOSE: Panel Tabs Manager - Navigation Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getTabs, getActiveTabId, setActiveTabId, incrementMetric from ../state.js
//   _emit, _saveTabs from ../helpers/index.js
//   _renderTabs, _renderContent from ../ui/renderer.js
//
// PROVIDES:
//   activateTab() — exported function
//   activateNextTab() — exported function
//   activatePreviousTab() — exported function
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

import { getTabs, getActiveTabId, setActiveTabId, incrementMetric } from '../state.js';
import { _emit, _saveTabs } from '../helpers/index.js';
import { _renderTabs, _renderContent } from '../ui/renderer.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-tabs-manager.operations.navigation';

export function activateTab(tabId: string) {
  const tabs = getTabs();
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return false;
  
  const currentActiveId = getActiveTabId();
  if (currentActiveId === tabId) return true;
  
  const previousTabId = currentActiveId;
  setActiveTabId(tabId);
  incrementMetric('tabsSwitched');
  
  _renderTabs();
  _renderContent();
  _saveTabs();
  
  _emit('tabActivated', { tab, previousTabId });
  
  return true;
}

export function activateNextTab() {
  const tabs = getTabs();
  if (tabs.length === 0) return false;
  
  const currentIndex = tabs.findIndex(t => t.id === getActiveTabId());
  const nextIndex = (currentIndex + 1) % tabs.length;
  
  // @ts-expect-error TS migration - TS2339
  return activateTab((tabs as unknown as string)[nextIndex].id);
}

export function activatePreviousTab() {
  const tabs = getTabs();
  if (tabs.length === 0) return false;
  
  const currentIndex = tabs.findIndex(t => t.id === getActiveTabId());
  const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  
  // @ts-expect-error TS migration - TS2339
  return activateTab((tabs as unknown as string)[prevIndex].id);
}
