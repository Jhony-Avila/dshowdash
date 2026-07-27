// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.0.1-LOTE11-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: features-toolbar/index
// PURPOSE: Features Toolbar - Modular Index
// @changelog v3.0.1-LOTE11-FIX: Corrigido re-export incorreto do main.bundle.js
// @changelog v3.0.0-SPRINT-AAA: Versão modular original
// ═══════════════════════════════════════════════════════════════
'use strict';

export { VERSION, MODULE_ID, BUTTON_IDS, DROPDOWN_IDS, ALL_BUTTON_IDS, ALL_DROPDOWN_IDS, GROUPS, GROUP_ORDER } from './constants.js';

export {
  init,
  destroy,
  show,
  hide,
  toggle,
  registerAction,
  registerActions,
  unregisterAction,
  hasAction,
  getRegisteredActions,
  registerStateProvider,
  unregisterStateProvider,
  registerHook,
  unregisterHook,
  setConfig,
  registerGroup,
  unregisterGroup,
  updateButtonStates,
  info,
  healthCheck
} from './api.js';

import { VERSION, MODULE_ID, BUTTON_IDS, DROPDOWN_IDS, ALL_BUTTON_IDS, ALL_DROPDOWN_IDS, GROUPS, GROUP_ORDER } from './constants.js';
import {
  init, destroy, show, hide, toggle,
  registerAction, registerActions, unregisterAction,
  hasAction, getRegisteredActions,
  registerStateProvider, unregisterStateProvider,
  registerHook, unregisterHook,
  setConfig,
  registerGroup, unregisterGroup,
  updateButtonStates, info, healthCheck
} from './api.js';

export default {
  VERSION,
  MODULE_ID,
  BUTTON_IDS,
  DROPDOWN_IDS,
  ALL_BUTTON_IDS,
  ALL_DROPDOWN_IDS,
  GROUPS,
  GROUP_ORDER,
  init,
  destroy,
  show,
  hide,
  toggle,
  registerAction,
  registerActions,
  unregisterAction,
  hasAction,
  getRegisteredActions,
  registerStateProvider,
  unregisterStateProvider,
  registerHook,
  unregisterHook,
  setConfig,
  registerGroup,
  unregisterGroup,
  updateButtonStates,
  info,
  healthCheck
};
