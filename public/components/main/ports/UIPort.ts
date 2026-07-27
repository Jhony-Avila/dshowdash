// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-AAA-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ui-port
// PURPOSE: UIPort - Contrato de UI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   UIPortContract — exported value
//   createNullUIPort() — exported function
//   validateUIPort() — exported function
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
export const MODULE_ID = 'ui-port';

export const UIPortContract = { mount: 'function', unmount: 'function', update: 'function' };

export function createNullUIPort() {
  return { mount: (): null => null, unmount: (): void => {}, update: (): boolean => false };
}

export function validateUIPort(port: Record<string, unknown> | null | undefined) {
  return port && typeof port.mount === 'function';
}

export function healthCheck(port: Record<string, unknown> | null | undefined) {
  const hasMount = typeof port?.mount === 'function';
  const hasUnmount = typeof port?.unmount === 'function';
  return {
    status: hasMount ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { hasMount, hasUnmount }
  };
}

export default { UIPortContract, createNullUIPort, validateUIPort, healthCheck, VERSION, MODULE_ID };
