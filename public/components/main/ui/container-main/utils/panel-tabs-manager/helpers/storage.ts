// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: storage
// PURPOSE: Panel Tabs Manager - Storage Helper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STORAGE_KEY from ../constants.js
//   getConfig, getTabs, getActiveTabId from ../state.js
//   _log from ./logger.js
//
// PROVIDES:
//   _generateTabId() — exported function
//   _saveTabs() — exported function
//   _loadTabs() — exported function
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

import { STORAGE_KEY } from '../constants.js';
import { getConfig, getTabs, getActiveTabId } from '../state.js';
import { _log } from './logger.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-tabs-manager.helpers.storage';

export function _generateTabId() {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function _saveTabs() {
  const config = getConfig();
  if (!config.persistTabs) return;
  
  try {
    const tabs = getTabs();
    const tabsData = tabs.map(t => ({
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
  } catch (e: any) {
    _log('warn', 'Failed to save tabs:', e.message);
  }
}

export function _loadTabs() {
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
  } catch (e: any) {}
  return { tabs: [], activeTabId: null };
}
