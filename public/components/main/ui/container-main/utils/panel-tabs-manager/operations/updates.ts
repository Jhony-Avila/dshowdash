// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: updates
// PURPOSE: Panel Tabs Manager - Tab Updates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TAB_STATES from ../constants.js
//   getTabs, setTabs from ../state.js
//   _emit, _saveTabs from ../helpers/index.js
//   _renderTabs, _renderContent from ../ui/renderer.js
//
// PROVIDES:
//   getTab() — exported function
//   getActiveTab() — exported function
//   getAllTabs() — exported function
//   updateTab() — exported function
//   setTabState() — exported function
//   setTabContent() — exported function
//   moveTab() — exported function
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

import { TAB_STATES } from '../constants.js';
import { getTabs, setTabs } from '../state.js';
import { _emit, _saveTabs } from '../helpers/index.js';
import { _renderTabs, _renderContent } from '../ui/renderer.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-tabs-manager.operations.updates';

export function getTab(tabId: string) {
  const tabs = getTabs();
  return tabs.find(t => t.id === tabId) || null;
}

export function getActiveTab() {
  const tabs = getTabs();
  const { getActiveTabId } = require('../state.js');
  return tabs.find(t => t.id === getActiveTabId()) || null;
}

export function getAllTabs() {
  return [...getTabs()];
}

export function updateTab(tabId: string, updates: Record<string, unknown>) {
  const tabs = getTabs();
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return null;
  
  const allowedFields = ['title', 'icon', 'metadata'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      (tab as Record<string, unknown>)[field] = updates[field];
    }
  });
  
  _renderTabs();
  _saveTabs();
  
  _emit('tabUpdated', { tab });
  
  return tab;
}

export function setTabState(tabId: string, state: Record<string, unknown>) {
  const tabs = getTabs();
  const tab = tabs.find(t => t.id === tabId);
  // @ts-expect-error TS migration - TS2345
  if (!tab || !Object.values(TAB_STATES).includes(state)) return false;
  
  tab.state = state;
  _renderTabs();
  
  _emit('tabStateChanged', { tab, state });
  
  return true;
}

export function setTabContent(tabId: string, content: string) {
  const tabs = getTabs();
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return false;
  
  tab.content = content;
  _renderContent();
  
  return true;
}

export function moveTab(tabId: string, newIndex: unknown) {
  const tabs = getTabs();
  const currentIndex = tabs.findIndex(t => t.id === tabId);
  if (currentIndex === -1) return false;
  
  newIndex = Math.max(0, Math.min(tabs.length - 1, (newIndex as number)));
  
  const [tab] = tabs.splice(currentIndex, 1);
  tabs.splice((newIndex as number), 0, tab);
  setTabs(tabs);
  
  _renderTabs();
  _saveTabs();
  
  _emit('tabMoved', { tabId, fromIndex: currentIndex, toIndex: newIndex });
  
  return true;
}
