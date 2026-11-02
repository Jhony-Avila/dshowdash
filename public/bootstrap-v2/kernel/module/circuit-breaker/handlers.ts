// Circuit Breaker Event Handlers
// @version 1.2.3-CONTRACTS
// @changelog v1.2.3-CONTRACTS: Dependency Contract formalizado
// @changelog v1.2.2 - Changed to absolute path for circuit-breaker import
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.3)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   CircuitBreakerModule from /bootstrap-v2/domain/circuit-breaker.js
//   KERNEL_EVENTS, KERNEL_MODES from ../../constants.js
// RECEIVES (via createCircuitBreakerHandlers context):
//   context.log, emit, getMode, setModeInternal,
//   context.checkIfDegraded, degradationThreshold
// PROVIDES: handleEvent(), checkHealth(), checkRecovery()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import * as CircuitBreakerModule from '/bootstrap-v2/domain/circuit-breaker.js';
import { KERNEL_EVENTS, KERNEL_MODES } from '../../constants.js';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.kernel.module.circuit-breaker.handlers';

interface CircuitBreakerHandlersContext {
  log: (level: string, message: string, data?: Record<string, unknown>) => void;
  emit: (event: string, data: Record<string, unknown>) => void;
  getMode: () => string;
  setModeInternal: (mode: string, reason: string, fromSync: boolean) => { success: boolean };
  checkIfDegraded: () => boolean;
  degradationThreshold?: number;
}

interface CircuitBreakerEvent {
  event?: string;
  data?: Record<string, unknown>;
}

export function createCircuitBreakerHandlers(context: CircuitBreakerHandlersContext) {
  var log = context.log;
  var emit = context.emit;
  var getMode = context.getMode;
  var setModeInternal = context.setModeInternal;
  var checkIfDegraded = context.checkIfDegraded;
  var degradationThreshold = context.degradationThreshold || 1;

  function handleEvent(event: CircuitBreakerEvent) {
    if (!event || !event.event) return;

    var eventType = event.event;
    var data = event.data || {};

    log('debug', 'Circuit Breaker event', { type: eventType, moduleId: data.moduleId });

    emit(KERNEL_EVENTS.CIRCUIT_BREAKER_CHANGE, {
      breakerEvent: eventType,
      moduleId: data.moduleId,
      state: data.to || data.state,
      failures: data.failures
    });

    if (eventType === CircuitBreakerModule.BREAKER_EVENTS.OPENED) {
      checkHealth();
    } else if (eventType === CircuitBreakerModule.BREAKER_EVENTS.CLOSED) {
      checkRecovery();
    }
  }

  function checkHealth() {
    var openCount = CircuitBreakerModule.getOpenCount();

    if (openCount >= degradationThreshold && getMode() === KERNEL_MODES.NORMAL) {
      log('warn', 'Circuit Breakers degraded, switching to DEGRADED mode', { openCount: openCount });
      setModeInternal(KERNEL_MODES.DEGRADED, 'Circuit Breakers OPEN: ' + openCount, false);
    }
  }

  function checkRecovery() {
    var openCount = CircuitBreakerModule.getOpenCount();
    var isDegraded = checkIfDegraded();

    if (openCount === 0 && getMode() === KERNEL_MODES.DEGRADED && !isDegraded) {
      log('info', 'All Circuit Breakers recovered, switching to NORMAL mode');
      setModeInternal(KERNEL_MODES.NORMAL, 'All Circuit Breakers recovered', false);
    }
  }

  return {
    handleEvent: handleEvent,
    checkHealth: checkHealth,
    checkRecovery: checkRecovery
  };
}

export default { createCircuitBreakerHandlers };
