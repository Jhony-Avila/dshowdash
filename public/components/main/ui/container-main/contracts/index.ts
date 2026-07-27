// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-HARDENED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:contracts
// PURPOSE: Contracts - Barrel export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   healthCheck as lifecycleHealth from ./lifecycle-contract.js
//   healthCheck as slotHealth from ./slot-contract.js
//   healthCheck as resourceHealth from ./resource-contract.js
//   healthCheck as panelHealth from ./panel-contract.js
//   healthCheck as capabilityHealth from ./capability-contract.js
//   healthCheck as utilsHealth from ./utils-contract.js
//   healthCheck as containerHealth from ./container-contract.js
//   healthCheck as layoutHealth from ./layout-contract.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CONTRACTS — exported value
//   contractsHealthCheck() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   LifecycleContract — exported value
//   SlotContract — exported value
//   ResourceContract — exported value
//   PanelContract — exported value
//   CapabilityContract — exported value
//   UtilsContract — exported value
//   ContainerContract — exported value
//   LayoutContract — exported value
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

export const VERSION = '3.2.0-HARDENED';
export const MODULE_ID = 'container-main:contracts';

// Core contracts
export * from './lifecycle-contract.js';
export * from './slot-contract.js';
export * from './resource-contract.js';
export * from './panel-contract.js';
export * from './capability-contract.js';

// FASE 3 contracts
export * from './utils-contract.js';

// P0 Governance contracts

// @ts-expect-error TS migration - TS2308
export * from './container-contract.js';

// @ts-expect-error TS migration - TS2308
export * from './layout-contract.js';

// Default exports
export { default as LifecycleContract } from './lifecycle-contract.js';
export { default as SlotContract } from './slot-contract.js';
export { default as ResourceContract } from './resource-contract.js';
export { default as PanelContract } from './panel-contract.js';
export { default as CapabilityContract } from './capability-contract.js';
export { default as UtilsContract } from './utils-contract.js';
export { default as ContainerContract } from './container-contract.js';
export { default as LayoutContract } from './layout-contract.js';

// Health checks imports
import { healthCheck as lifecycleHealth } from './lifecycle-contract.js';
import { healthCheck as slotHealth } from './slot-contract.js';
import { healthCheck as resourceHealth } from './resource-contract.js';
import { healthCheck as panelHealth } from './panel-contract.js';
import { healthCheck as capabilityHealth } from './capability-contract.js';
import { healthCheck as utilsHealth } from './utils-contract.js';
import { healthCheck as containerHealth } from './container-contract.js';
import { healthCheck as layoutHealth } from './layout-contract.js';

// Lista de contracts
export const CONTRACTS = Object.freeze([
  'lifecycle',
  'slot',
  'resource',
  'panel',
  'capability',
  'utils',
  'container',
  'layout'
]);

// Mapeamento nome → função de healthCheck
const _healthFns = {
  lifecycle: lifecycleHealth,
  slot: slotHealth,
  resource: resourceHealth,
  panel: panelHealth,
  capability: capabilityHealth,
  utils: utilsHealth,
  container: containerHealth,
  layout: layoutHealth
};

/**
 * Executa healthCheck de cada contrato com isolamento por try/catch.
 * Se um contrato falhar, retorna ERROR para aquele contrato sem derrubar os demais.
 */
export function contractsHealthCheck() {
  const results: Record<string, unknown> = {};
  for (const name in _healthFns) {
    if (_healthFns.hasOwnProperty(name)) {
      try {
        results[name] = ((_healthFns as Record<string, unknown>)[name] as () => unknown)();
      } catch (e) {
        results[name] = {
          status: 'ERROR',
          error: (e as Error).message || 'Unknown error',
          moduleId: `container-main:contracts:${name}`,
          version: 'unknown'
        };
      }
    }
  }
  return results;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    contracts: CONTRACTS,
    totalContracts: CONTRACTS.length
  };
}

export function healthCheck() {
  let checks;
  try {
    checks = contractsHealthCheck();
  } catch (e) {
    return {
      status: 'ERROR',
      version: VERSION,
      moduleId: MODULE_ID,
      error: (e as Error).message || 'contractsHealthCheck failed',
      contracts: null as Record<string, unknown> | null,
      totalContracts: CONTRACTS.length
    };
  }

  const statuses = Object.values(checks).map(c => (c as any).status);
  const hasError = statuses.indexOf('ERROR') !== -1;
  const hasDegraded = statuses.indexOf('DEGRADED') !== -1;
  const allHealthy = !hasError && !hasDegraded && statuses.every(s => s === 'HEALTHY');

  return {
    status: allHealthy ? 'HEALTHY' : hasError ? 'ERROR' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    contracts: checks,
    totalContracts: CONTRACTS.length,
    healthy: statuses.filter(s => s === 'HEALTHY').length,
    degraded: statuses.filter(s => s === 'DEGRADED').length,
    errors: statuses.filter(s => s === 'ERROR').length
  };
}

export default {
  VERSION, MODULE_ID, CONTRACTS,
  contractsHealthCheck, info, healthCheck
};
