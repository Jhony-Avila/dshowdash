// Circuit Breaker Setup
// @version 1.2.2-MODULAR
// @changelog v1.2.2 - Changed to absolute path for circuit-breaker import
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.2)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: CircuitBreakerModule from /bootstrap-v2/domain/circuit-breaker.js
// PROVIDES: setupCircuitBreakerIntegration(context)
// BROWSER-APIS: None
'use strict';

import * as CircuitBreakerModule from '/bootstrap-v2/domain/circuit-breaker.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.kernel.module.circuit-breaker.setup';

interface CircuitBreakerSetupContext {
  log: (level: string, message: string) => void;
  cleanups: Array<() => void>;
  onEvent: (event: { event: string; data: Record<string, unknown>; timestamp: number }) => void;
}

export function setupCircuitBreakerIntegration(context: CircuitBreakerSetupContext) {
  const log = context.log;
  const cleanups = context.cleanups;
  const onEvent = context.onEvent;

  if (!CircuitBreakerModule || !CircuitBreakerModule.subscribe) {
    log('warn', 'CircuitBreaker module not available');
    return { enabled: false };
  }

  const cleanup = CircuitBreakerModule.subscribe(function(event) {
    onEvent(event);
  });

  if (typeof cleanup === 'function') {
    cleanups.push(cleanup);
  }

  log('info', 'Circuit Breaker integration enabled');
  return { enabled: true };
}

export default { setupCircuitBreakerIntegration };
