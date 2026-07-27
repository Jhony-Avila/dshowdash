// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.0.0-P0-AUTH-OWNERSHIP)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-events/user-menu/index
// PURPOSE: Barrel re-export of user-menu updater utilities
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * from ./updater.js
// PROVIDES:
//   Re-exports getUserMenu, updateUserMenu from updater.js
// ═══════════════════════════════════════════════════════════════
// Header Events - User Menu Index
// @version 6.0.0-P0-AUTH-OWNERSHIP
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header.core.header-events.user-menu';

export * from './updater.js';
