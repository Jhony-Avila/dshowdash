// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-loja-integrada/core/circuit-breaker
// PURPOSE: panel-loja-integrada Circuit Breaker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createModuleCircuitBreaker from ../../_shared/core/circuit-breaker-base.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
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
import { createModuleCircuitBreaker } from '../../_shared/core/circuit-breaker-base.js';
export const MODULE_ID = 'header/components/panel-loja-integrada/core/circuit-breaker';
const _mod = createModuleCircuitBreaker(MODULE_ID);
export const { CircuitBreaker, getMetrics, resetMetrics, VERSION } = _mod;
export default CircuitBreaker;
