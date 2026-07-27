// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: focus-manager
// PURPOSE: Entry point da API de Foco Avançada
// ───────────────────────────────────────────────────────────────
// RE-EXPORTS FROM:
//   ./constants.js — VERSION, MODULE_ID, FOCUS_STRATEGIES
//   ./core.js — focusElement, focusRegion, focusNext, focusPrevious, getCurrentFocus, isFocused, getFocusableIn
//   ./persistence.js — saveFocus, restoreFocus, clearSavedFocus, getSavedFocusKeys
//   ./trap.js — createTrap, releaseTrap, hasTrap, getActiveTraps
//   ./guard.js — createGuard, removeGuard
//   ./history.js — getHistory, goBack, clearHistory
//   ./announce.js — announce
//   ./config.js — configure, getConfig
//   ./subscription.js — subscribe
//   ./health.js — getMetrics, healthCheck, info
// ═══════════════════════════════════════════════════════════════
/**
 * @module FocusManager
 * @description API de Foco Avançada
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

// Constants
export { VERSION, MODULE_ID, FOCUS_STRATEGIES } from './constants.js';

// Core
export { focusElement, focusRegion, focusNext, focusPrevious, getCurrentFocus, isFocused, getFocusableIn } from './core.js';

// Save/Restore
export { saveFocus, restoreFocus, clearSavedFocus, getSavedFocusKeys } from './persistence.js';

// Traps
export { createTrap, releaseTrap, hasTrap, getActiveTraps } from './trap.js';

// Guards
export { createGuard, removeGuard } from './guard.js';

// History
export { getHistory, goBack, clearHistory } from './history.js';

// Announce
export { announce } from './announce.js';

// Config
export { configure, getConfig } from './config.js';

// Subscription
export { subscribe } from './subscription.js';

// Health
export { getMetrics, healthCheck, info } from './health.js';

// Default export
import { VERSION, MODULE_ID, FOCUS_STRATEGIES } from './constants.js';
import { focusElement, focusRegion, focusNext, focusPrevious, getCurrentFocus, isFocused, getFocusableIn } from './core.js';
import { saveFocus, restoreFocus, clearSavedFocus, getSavedFocusKeys } from './persistence.js';
import { createTrap, releaseTrap, hasTrap, getActiveTraps } from './trap.js';
import { createGuard, removeGuard } from './guard.js';
import { getHistory, goBack, clearHistory } from './history.js';
import { announce } from './announce.js';
import { configure, getConfig } from './config.js';
import { subscribe } from './subscription.js';
import { getMetrics, healthCheck, info } from './health.js';

export default {
    VERSION, MODULE_ID, FOCUS_STRATEGIES,
    focusElement, focusRegion, focusNext, focusPrevious,
    saveFocus, restoreFocus, clearSavedFocus, getSavedFocusKeys,
    createTrap, releaseTrap, hasTrap, getActiveTraps,
    createGuard, removeGuard,
    getHistory, goBack, clearHistory,
    getCurrentFocus, isFocused, getFocusableIn,
    announce, configure, getConfig, subscribe,
    getMetrics, healthCheck, info
};
