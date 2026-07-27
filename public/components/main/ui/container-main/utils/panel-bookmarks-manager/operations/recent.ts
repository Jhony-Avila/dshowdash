// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: recent
// PURPOSE: Panel Bookmarks Manager - Recent Operations
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getRecentPanels as getRecentPanelsState, setRecentPanels from ../s...
//   emit from ../helpers/logger.js
//   saveRecentPanels from ../storage/recent.js
//
// PROVIDES:
//   addToRecent() — exported function
//   getRecentPanels() — exported function
//   clearRecentPanels() — exported function
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

import { getConfig, getRecentPanels as getRecentPanelsState, setRecentPanels } from '../state.js';
import { emit } from '../helpers/logger.js';
import { saveRecentPanels } from '../storage/recent.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-bookmarks-manager.operations.recent';

export function addToRecent(panelId: string, metadata: Record<string, unknown> = {}) {
  const config = getConfig();
  let recentPanels = getRecentPanelsState();
  
  recentPanels = recentPanels.filter(r => (r as Record<string, unknown>).panelId !== panelId);
  
  recentPanels.unshift({
    panelId,
    title: metadata.title || panelId,
    timestamp: Date.now(),
    ...metadata
  });
  
  if (recentPanels.length > config.maxRecentPanels) {
    recentPanels = recentPanels.slice(0, config.maxRecentPanels);
  }
  
  setRecentPanels(recentPanels);
  saveRecentPanels();
  emit('recentPanelAdded', { panelId });
}

export function getRecentPanels(limit: number | null = null) {
  const panels = [...getRecentPanelsState()];
  return limit ? panels.slice(0, limit) : panels;
}

export function clearRecentPanels() {
  setRecentPanels([]);
  saveRecentPanels();
  emit('recentPanelsCleared', {});
}
