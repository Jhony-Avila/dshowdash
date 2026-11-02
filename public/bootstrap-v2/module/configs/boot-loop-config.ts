// Boot Loop Detection Configuration
// @version 2.6.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: BOOT_LOOP_CONFIG (frozen)
// BROWSER-APIS: None
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.configs.boot-loop-config';

export const BOOT_LOOP_CONFIG = Object.freeze({
  maxBootsInWindow: 3,
  windowMs: 30000,
  cooldownMs: 60000,
  storageKey: '__BOOT_LOOP_TRACKER__'
});

export default BOOT_LOOP_CONFIG;
