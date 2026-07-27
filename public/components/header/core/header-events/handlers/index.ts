// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v7.0.0-P3)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-events/handlers/index
// PURPOSE: Barrel re-export of all handler modules
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * from ./intents.js
//   * from ./auth.js
//   * from ./visibility.js
//   * from ./connectivity.js
//   * from ./refresh.js
//   * from ./runtime-context.js
// PROVIDES:
//   Re-exports all handlers from sub-modules
// ═══════════════════════════════════════════════════════════════
// Header Events - Handlers Index
// @version 7.0.0-P3
// @changelog v7.0.0-P3 - Adicionado RuntimeContext handlers
// @changelog v6.0.0-P0-AUTH-OWNERSHIP - Versão anterior
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header.core.header-events.handlers';

export * from './intents.js';
export * from './auth.js';
export * from './visibility.js';
export * from './connectivity.js';
export * from './refresh.js';
export * from './runtime-context.js';
