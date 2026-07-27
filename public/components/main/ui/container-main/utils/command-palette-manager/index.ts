// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Command Palette Manager - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, COMMAND_TYPES, PALETTE_MODES from ./constants.js
//   createCommandPaletteManager, getCommandPaletteManager, init, destroy, open, c...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   COMMAND_TYPES — exported value
//   PALETTE_MODES — exported value
//   createCommandPaletteManager — exported value
//   getCommandPaletteManager — exported value
//   init — exported value
//   destroy — exported value
//   open — exported value
//   close — exported value
//   toggle — exported value
//   registerCommand — exported value
//   unregisterCommand — exported value
//   registerCommands — exported value
//   getCommand — exported value
//   getAllCommands — exported value
//   clearCommands — exported value
//   setMode — exported value
//   subscribe — exported value
//   healthCheck — exported value
//   ... and 1 more exports
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
export { VERSION, MODULE_ID, COMMAND_TYPES, PALETTE_MODES } from './constants.js';

// Re-export public API
export {
  createCommandPaletteManager,
  getCommandPaletteManager,
  init,
  destroy,
  open,
  close,
  toggle,
  registerCommand,
  unregisterCommand,
  registerCommands,
  getCommand,
  getAllCommands,
  clearCommands,
  setMode,
  subscribe,
  healthCheck,
  info
} from './api.js';

// Default export for backward compatibility
import { VERSION, MODULE_ID, COMMAND_TYPES, PALETTE_MODES } from './constants.js';
import {
  createCommandPaletteManager,
  getCommandPaletteManager,
  init,
  destroy,
  open,
  close,
  toggle,
  registerCommand,
  unregisterCommand,
  registerCommands,
  getCommand,
  getAllCommands,
  clearCommands,
  setMode,
  subscribe,
  healthCheck,
  info
} from './api.js';

export default {
  VERSION,
  MODULE_ID,
  COMMAND_TYPES,
  PALETTE_MODES,
  createCommandPaletteManager,
  getCommandPaletteManager,
  init,
  destroy,
  open,
  close,
  toggle,
  registerCommand,
  unregisterCommand,
  registerCommands,
  getCommand,
  getAllCommands,
  clearCommands,
  setMode,
  subscribe,
  healthCheck,
  info
};
