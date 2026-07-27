// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Panel Tabs Manager - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, TAB_STATES, TAB_POSITIONS, CLOSE_BEHAVIORS from ./constan...
//   createPanelTabsManager, getPanelTabsManager, init, destroy, addTab, closeTab,...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TAB_STATES — exported value
//   TAB_POSITIONS — exported value
//   CLOSE_BEHAVIORS — exported value
//   createPanelTabsManager — exported value
//   getPanelTabsManager — exported value
//   init — exported value
//   destroy — exported value
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
//   ... and 6 more exports
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

// Re-export constants
export { VERSION, MODULE_ID, TAB_STATES, TAB_POSITIONS, CLOSE_BEHAVIORS } from './constants.js';

// Re-export public API
export {
  createPanelTabsManager,
  getPanelTabsManager,
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
  subscribe,
  healthCheck,
  info
} from './api.js';

// Default export for backward compatibility
import { VERSION, MODULE_ID, TAB_STATES, TAB_POSITIONS, CLOSE_BEHAVIORS } from './constants.js';
import {
  createPanelTabsManager,
  getPanelTabsManager,
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
  subscribe,
  healthCheck,
  info
} from './api.js';

export default {
  VERSION,
  MODULE_ID,
  TAB_STATES,
  TAB_POSITIONS,
  CLOSE_BEHAVIORS,
  createPanelTabsManager,
  getPanelTabsManager,
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
  subscribe,
  healthCheck,
  info
};
