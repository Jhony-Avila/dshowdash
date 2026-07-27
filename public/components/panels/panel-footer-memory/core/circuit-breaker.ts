// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-footer-memory/core/circuit-breaker
// PURPOSE: panel-footer-memory - CircuitBreaker Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createModuleCircuitBreaker from ../../_shared/core/circuit-breaker-base.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CircuitBreaker — exported class
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '9.3.0-P2-ENTERPRISE';
import { createModuleCircuitBreaker } from '../../_shared/core/circuit-breaker-base.js';
export const MODULE_ID = 'panels/panel-footer-memory/core/circuit-breaker';
const _mod = createModuleCircuitBreaker(MODULE_ID);
export const { CircuitBreaker } = _mod;
export default CircuitBreaker;
