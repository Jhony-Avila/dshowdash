// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.0.0-P0-AUTH-OWNERSHIP)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/header-events/helpers
// PURPOSE: Re-exports helper utilities (logger, event-bus) for header-events submodules
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * from ./logger.js
//   * from ./event-bus.js
// PROVIDES:
//   All exports from logger.js — logging helpers
//   All exports from event-bus.js — event bus helpers
// ═══════════════════════════════════════════════════════════════

// Header Events - Helpers Index
// @version 6.0.0-P0-AUTH-OWNERSHIP
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header.core.header-events.helpers';

export * from './logger.js';
export * from './event-bus.js';
