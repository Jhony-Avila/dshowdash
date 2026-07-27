// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: tab-crud
// PURPOSE: Panel Tabs Manager - Tab CRUD Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TAB_STATES, CLOSE_BEHAVIORS from ../constants.js
//   getConfig, getTabs, setTabs, getActiveTabId, setActiveTabId, incrementMetric ...
//   _log, _emit, _generateTabId, _saveTabs from ../helpers/index.js
//   _renderTabs, _renderContent from ../ui/renderer.js
//   activateTab from ./navigation.js
//
// PROVIDES:
//   addTab() — exported function
//   closeTab() — exported function
//   closeAllTabs() — exported function
//   closeOtherTabs() — exported function
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

import { TAB_STATES, CLOSE_BEHAVIORS } from '../constants.js';
import { 
  getConfig, getTabs, setTabs, 
  getActiveTabId, setActiveTabId, 
  incrementMetric 
} from '../state.js';
import { _log, _emit, _generateTabId, _saveTabs } from '../helpers/index.js';
import { _renderTabs, _renderContent } from '../ui/renderer.js';
import { activateTab } from './navigation.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-tabs-manager.operations.tab-crud';

export function addTab(options: Record<string, unknown> = {}) {
  const config = getConfig();
  const tabs = getTabs();
  
  if (tabs.length >= config.maxTabs) {
    _log('warn', 'Maximum tabs reached');
    _emit('maxTabsReached', { max: config.maxTabs });
    return null;
  }
  
  const { panelId, title, icon, content, metadata, activate = true } = options;
  
  // Check for duplicates
  if (!config.allowDuplicates && panelId) {
    const existing = tabs.find(t => t.panelId === panelId);
    if (existing) {
      if (activate) activateTab((existing.id as string));
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
  incrementMetric('tabsOpened');
  
  _renderTabs();
  _renderContent();
  
  if (activate) {
    activateTab(tab.id);
  }
  
  _saveTabs();
  _emit('tabAdded', { tab });
  
  return tab;
}

export function closeTab(tabId: string) {
  const config = getConfig();
  const tabs = getTabs();
  const index = tabs.findIndex(t => t.id === tabId);
  if (index === -1) return false;
  
  const tab = tabs[index];
  
  // Confirm close if needed
  // @ts-expect-error TS migration - TS2339
  if (config.confirmClose && tab.metadata?.hasChanges) {
    if (!confirm('Esta aba tem alterações não salvas. Deseja fechar mesmo assim?')) {
      return false;
    }
  }
  
  tabs.splice(index, 1);
  setTabs(tabs);
  incrementMetric('tabsClosed');
  
  // Handle active tab closure
  if (tabId === getActiveTabId()) {
    if (tabs.length > 0) {
      let newActiveIndex;
      
      switch (config.closeBehavior) {

        // @ts-expect-error TS migration - TS2678
        case CLOSE_BEHAVIORS.ACTIVATE_NEXT:
          newActiveIndex = Math.min(index, tabs.length - 1);
          break;

        // @ts-expect-error TS migration - TS2678
        case CLOSE_BEHAVIORS.ACTIVATE_FIRST:
          newActiveIndex = 0;
          break;
        case CLOSE_BEHAVIORS.ACTIVATE_PREVIOUS:
        default:
          newActiveIndex = Math.max(0, index - 1);
      }
      
      // @ts-expect-error TS migration - TS2339
      setActiveTabId((tabs as unknown as string)[newActiveIndex].id);
    } else {
      // @ts-expect-error strict migration — TS2345
      setActiveTabId(null);
    }
  }
  
  _renderTabs();
  _renderContent();
  _saveTabs();
  
  _emit('tabClosed', { tab, remainingTabs: tabs.length });
  
  return true;
}

export function closeAllTabs() {
  const tabs = getTabs();
  const count = tabs.length;
  
  setTabs([]);
  // @ts-expect-error strict migration — TS2345
  setActiveTabId(null);
  
  _renderTabs();
  _renderContent();
  _saveTabs();
  
  _emit('allTabsClosed', { count });
  
  return count;
}

export function closeOtherTabs(keepTabId: unknown) {
  const tabs = getTabs();
  const keepTab = tabs.find(t => t.id === keepTabId);
  if (!keepTab) return 0;
  
  const closedCount = tabs.length - 1;
  
  setTabs([keepTab]);
  setActiveTabId((keepTabId as string));
  
  _renderTabs();
  _renderContent();
  _saveTabs();
  
  _emit('otherTabsClosed', { keptTabId: keepTabId, closedCount });
  
  return closedCount;
}
