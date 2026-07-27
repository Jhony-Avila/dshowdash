// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-globals-port
// PURPOSE: GlobalsPort - Contrato para acesso a globais do browser
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   GlobalsPortContract — exported value
//   createNullGlobalsPort() — exported function
//   validateGlobalsPort() — exported function
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
export const MODULE_ID = 'main-globals-port';

// Contrato do GlobalsPort
export const GlobalsPortContract = {
  getGlobal: 'function',
  hasGlobal: 'function',
  getDocument: 'function',
  getBody: 'function',
  getBodyAttribute: 'function'
};

// Null implementation para testes/fallback
export function createNullGlobalsPort() {
  const mockGlobals = new Map();
  
  return {
    getGlobal: (name: string): unknown => mockGlobals.get(name) || null,
    hasGlobal: (name: string): boolean => mockGlobals.has(name),
    setMockGlobal: (name: string, value: unknown) => mockGlobals.set(name, value),
    getDocument: (): null => null,
    getBody: (): null => null,
    getBodyAttribute: (attr: string): null => null,
    getBodyDataset: (): Record<string, never> => ({}),
    info: (): Record<string, unknown> => ({ type: 'null', mockGlobals: Array.from(mockGlobals.keys()) })
  };
}

// Validação do port
export function validateGlobalsPort(port: Record<string, unknown> | null | undefined) {
  if (!port) return false;
  return (
    typeof port.getGlobal === 'function' &&
    typeof port.hasGlobal === 'function'
  );
}

// Health check
export function healthCheck(port: Record<string, unknown> | null | undefined) {
  const isValid = validateGlobalsPort(port);
  return {
    status: isValid ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      hasGetGlobal: typeof port?.getGlobal === 'function',
      hasHasGlobal: typeof port?.hasGlobal === 'function',
      hasGetDocument: typeof port?.getDocument === 'function',
      hasGetBody: typeof port?.getBody === 'function',
      hasGetBodyAttribute: typeof port?.getBodyAttribute === 'function'
    }
  };
}

export default {
  GlobalsPortContract,
  createNullGlobalsPort,
  validateGlobalsPort,
  healthCheck,
  VERSION,
  MODULE_ID
};
