// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Bootstrap Helpers - Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createAllHelpers() — exported function
//   createLifecycleHelpers — exported value
//   createKernelHelpers — exported value
//   createUtilsHelpers — exported value
//   createUIHelpers — exported value
//   createDeviceHelpers — exported value
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

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap.helpers';

export { createLifecycleHelpers } from './lifecycle.js';
export { createKernelHelpers } from './kernel.js';
export { createUtilsHelpers } from './utils.js';
export { createUIHelpers } from './ui.js';
export { createDeviceHelpers } from './device.js';

export function createAllHelpers(refs: unknown) {
  const { createLifecycleHelpers } = require('./lifecycle.js');
  const { createKernelHelpers } = require('./kernel.js');
  const { createUtilsHelpers } = require('./utils.js');
  const { createUIHelpers } = require('./ui.js');
  const { createDeviceHelpers } = require('./device.js');
  
  return {
    ...createLifecycleHelpers(refs),
    ...createKernelHelpers(refs),
    ...createUtilsHelpers(refs),
    ...createUIHelpers(refs),
    ...createDeviceHelpers(refs)
  };
}
