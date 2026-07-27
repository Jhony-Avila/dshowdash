// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Pending Queue - Main Entry Point
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   inject from ./events.js
//   enqueue, dequeue, peek, getAll, remove, clear from ./queue.js
//   cleanExpired from ./expiration.js
//   process, startAutoProcess, stopAutoProcess, isAutoProcessEnabled from ./process.js
//   size, isEmpty, isFull from ./size.js
//   configure, getConfig, enable, disable, isEnabled from ./config.js
//   getMetrics, healthCheck, info from ./health.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   inject — exported value
//   enqueue — exported value
//   dequeue — exported value
//   peek — exported value
//   getAll — exported value
//   remove — exported value
//   clear — exported value
//   cleanExpired — exported value
//   process — exported value
//   startAutoProcess — exported value
//   stopAutoProcess — exported value
//   isAutoProcessEnabled — exported value
//   size — exported value
//   isEmpty — exported value
//   isFull — exported value
//   configure — exported value
//   getConfig — exported value
//   enable — exported value
//   disable — exported value
//   isEnabled — exported value
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

// DI
export { inject } from './events.js';

// Queue
export { enqueue, dequeue, peek, getAll, remove, clear } from './queue.js';

// Expiration
export { cleanExpired } from './expiration.js';

// Process
export { process, startAutoProcess, stopAutoProcess, isAutoProcessEnabled } from './process.js';

// Size
export { size, isEmpty, isFull } from './size.js';

// Config
export { configure, getConfig, enable, disable, isEnabled } from './config.js';

// Health
export { getMetrics, healthCheck, info } from './health.js';

// Default export
import { VERSION, MODULE_ID } from './constants.js';
import { inject } from './events.js';
import { enqueue, dequeue, peek, getAll, remove, clear } from './queue.js';
import { cleanExpired } from './expiration.js';
import { process, startAutoProcess, stopAutoProcess, isAutoProcessEnabled } from './process.js';
import { size, isEmpty, isFull } from './size.js';
import { configure, getConfig, enable, disable, isEnabled } from './config.js';
import { getMetrics, healthCheck, info } from './health.js';

export default {
  inject,
  enqueue,
  dequeue,
  peek,
  getAll,
  remove,
  clear,
  cleanExpired,
  process,
  startAutoProcess,
  stopAutoProcess,
  isAutoProcessEnabled,
  size,
  isEmpty,
  isFull,
  configure,
  getConfig,
  enable,
  disable,
  isEnabled,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
