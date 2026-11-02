// Global Timeout Configuration
// @version 2.6.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: GLOBAL_TIMEOUT_CONFIG (frozen)
// BROWSER-APIS: None
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.configs.global-timeout-config';

export const GLOBAL_TIMEOUT_CONFIG = Object.freeze({
  enabled: true,
  timeoutMs: 120000,
  warningMs: 90000
});

export default GLOBAL_TIMEOUT_CONFIG;
