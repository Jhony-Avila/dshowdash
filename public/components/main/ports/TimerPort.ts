// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-timer-port
// PURPOSE: TimerPort - Contrato para operações de temporização
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TimerPortContract — exported value
//   createNullTimerPort() — exported function
//   validateTimerPort() — exported function
//   healthCheck() — exported function
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

export const VERSION = '1.0.0-P1-HEX';
export const MODULE_ID = 'main-timer-port';

// Contrato do TimerPort
export const TimerPortContract = {
  setTimeout: 'function',
  clearTimeout: 'function',
  setInterval: 'function',
  clearInterval: 'function',
  delay: 'function'
};

// Null implementation para testes/fallback
export function createNullTimerPort() {
  const nullTimeouts = new Set();
  let nextId = 1;
  
  return {
    setTimeout: (fn: () => void, ms: number) => {
      const id = nextId++;
      nullTimeouts.add(id);
      return id;
    },
    clearTimeout: (id: number) => {
      nullTimeouts.delete(id);
    },
    setInterval: (fn: () => void, ms: number) => {
      const id = nextId++;
      nullTimeouts.add(id);
      return id;
    },
    clearInterval: (id: number) => {
      nullTimeouts.delete(id);
    },
    delay: (ms: number) => Promise.resolve(),
    info: () => ({ type: 'null', pendingTimers: nullTimeouts.size })
  };
}

// Validação do port
export function validateTimerPort(port: Record<string, unknown> | null | undefined) {
  if (!port) return false;
  return (
    typeof port.setTimeout === 'function' &&
    typeof port.clearTimeout === 'function' &&
    typeof port.setInterval === 'function' &&
    typeof port.clearInterval === 'function'
  );
}

// Health check
export function healthCheck(port: Record<string, unknown> | null | undefined) {
  const isValid = validateTimerPort(port);
  return {
    status: isValid ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      hasSetTimeout: typeof port?.setTimeout === 'function',
      hasClearTimeout: typeof port?.clearTimeout === 'function',
      hasSetInterval: typeof port?.setInterval === 'function',
      hasClearInterval: typeof port?.clearInterval === 'function',
      hasDelay: typeof port?.delay === 'function'
    }
  };
}

export default {
  TimerPortContract,
  createNullTimerPort,
  validateTimerPort,
  healthCheck,
  VERSION,
  MODULE_ID
};
