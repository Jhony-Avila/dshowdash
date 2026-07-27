// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-AAA-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-eventbus-port
// PURPOSE: EventBusPort - Contrato para comunicação de eventos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   EventBusPortContract — exported value
//   createNullEventBusPort() — exported function
//   validateEventBusPort() — exported function
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

export const VERSION = '2.0.0-AAA-P4';
export const MODULE_ID = 'main-eventbus-port';

export const EventBusPortContract = { emit: 'function', on: 'function', off: 'function' };

export function createNullEventBusPort() { 
  return { emit: () => {}, on: () => () => {}, off: () => {} }; 
}

export function validateEventBusPort(port: Record<string, unknown> | null | undefined) {
  return port && typeof port.emit === 'function' && typeof port.on === 'function';
}

export function healthCheck(port: Record<string, unknown> | null | undefined) {
  const isValid = validateEventBusPort(port);
  return {
    status: isValid ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { hasEmit: typeof port?.emit === 'function', hasOn: typeof port?.on === 'function', hasOff: typeof port?.off === 'function' }
  };
}

export default { EventBusPortContract, createNullEventBusPort, validateEventBusPort, healthCheck, VERSION, MODULE_ID };
