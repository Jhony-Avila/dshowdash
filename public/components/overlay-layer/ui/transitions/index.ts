// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Overlay Layer Transitions - Modular Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, BUILTIN_TRANSITIONS from ./constants.js
//   register, unregister from ./registry/register.js
//   get, has, list, setDefault, getDefault from ./registry/query.js
//   apply, enter, exit from ./animation/apply.js
//   cancel, cancelAll, getActiveCount from ./animation/cancel.js
//   generateCSS from ./helpers/css-generator.js
//   configure, getConfig, getMetrics, healthCheck, info from ./api.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   BUILTIN_TRANSITIONS — exported value
//   register — exported value
//   unregister — exported value
//   get — exported value
//   has — exported value
//   list — exported value
//   setDefault — exported value
//   getDefault — exported value
//   apply — exported value
//   enter — exported value
//   exit — exported value
//   cancel — exported value
//   cancelAll — exported value
//   getActiveCount — exported value
//   generateCSS — exported value
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

export { VERSION, MODULE_ID, BUILTIN_TRANSITIONS } from './constants.js';

// Registry
export { register, unregister } from './registry/register.js';
export { get, has, list, setDefault, getDefault } from './registry/query.js';

// Animation
export { apply, enter, exit } from './animation/apply.js';
export { cancel, cancelAll, getActiveCount } from './animation/cancel.js';

// Helpers
export { generateCSS } from './helpers/css-generator.js';

// API
export { configure, getConfig, getMetrics, healthCheck, info } from './api.js';

// Default export
import { VERSION, MODULE_ID, BUILTIN_TRANSITIONS } from './constants.js';
import { register, unregister } from './registry/register.js';
import { get, has, list, setDefault, getDefault } from './registry/query.js';
import { apply, enter, exit } from './animation/apply.js';
import { cancel, cancelAll, getActiveCount } from './animation/cancel.js';
import { generateCSS } from './helpers/css-generator.js';
import { configure, getConfig, getMetrics, healthCheck, info } from './api.js';

export default {
  register,
  unregister,
  get,
  has,
  list,
  setDefault,
  getDefault,
  apply,
  enter,
  exit,
  cancel,
  cancelAll,
  getActiveCount,
  generateCSS,
  configure,
  getConfig,
  getMetrics,
  healthCheck,
  info,
  BUILTIN_TRANSITIONS,
  VERSION,
  MODULE_ID
};
