// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Template Registry - Main Entry Point
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   BUILTIN_TEMPLATES from ./builtin.js
//   inject from ./state.js
//   register, unregister, get, has from ./crud.js
//   list, listCustom, listBuiltin from ./list.js
//   apply, create, clone from ./apply.js
//   restoreBuiltin, restoreAllBuiltins, clearCustom from ./restore.js
//   configure, getConfig from ./config.js
//   getMetrics, healthCheck, info from ./health.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   BUILTIN_TEMPLATES — exported value
//   inject — exported value
//   register — exported value
//   unregister — exported value
//   get — exported value
//   has — exported value
//   list — exported value
//   listCustom — exported value
//   listBuiltin — exported value
//   apply — exported value
//   create — exported value
//   clone — exported value
//   restoreBuiltin — exported value
//   restoreAllBuiltins — exported value
//   clearCustom — exported value
//   configure — exported value
//   getConfig — exported value
//   getMetrics — exported value
//   healthCheck — exported value
//   info — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

// Constants
export { VERSION, MODULE_ID } from './constants.js';

// Built-in
export { BUILTIN_TEMPLATES } from './builtin.js';

// DI
export { inject } from './state.js';

// CRUD
export { register, unregister, get, has } from './crud.js';

// List
export { list, listCustom, listBuiltin } from './list.js';

// Apply
export { apply, create, clone } from './apply.js';

// Restore
export { restoreBuiltin, restoreAllBuiltins, clearCustom } from './restore.js';

// Config
export { configure, getConfig } from './config.js';

// Health
export { getMetrics, healthCheck, info } from './health.js';

// Default export
import { VERSION, MODULE_ID } from './constants.js';
import { BUILTIN_TEMPLATES } from './builtin.js';
import { inject } from './state.js';
import { register, unregister, get, has } from './crud.js';
import { list, listCustom, listBuiltin } from './list.js';
import { apply, create, clone } from './apply.js';
import { restoreBuiltin, restoreAllBuiltins, clearCustom } from './restore.js';
import { configure, getConfig } from './config.js';
import { getMetrics, healthCheck, info } from './health.js';

export default {
  inject,
  register,
  unregister,
  get,
  has,
  list,
  listCustom,
  listBuiltin,
  apply,
  create,
  clone,
  restoreBuiltin,
  restoreAllBuiltins,
  clearCustom,
  configure,
  getConfig,
  getMetrics,
  healthCheck,
  info,
  BUILTIN_TEMPLATES,
  VERSION,
  MODULE_ID
};
