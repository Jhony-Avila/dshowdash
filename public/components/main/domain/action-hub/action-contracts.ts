// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-AAA-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: action-contracts
// PURPOSE: ActionContracts - Contratos de Ações
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ACTION_KINDS — exported value
//   ACTION_SOURCES — exported value
//   getContract() — exported function
//   validate() — exported function
//   validateAction() — exported function
//   normalizeUIAction() — exported function
//   registerContract() — exported function
//   getAllContracts() — exported function
//   getMetrics() — exported function
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

export const VERSION = '2.1.0-AAA-P4';
export const MODULE_ID = 'action-contracts';

// Tipos de ações
export const ACTION_KINDS = Object.freeze({
  NAVIGATION: 'navigation',
  SYSTEM: 'system',
  UI: 'ui',
  EXTERNAL: 'external',
  DATA: 'data',
  AUTH: 'auth'
});

// Fontes de ações
export const ACTION_SOURCES = Object.freeze({
  HEADER: 'header',
  SIDEBAR: 'sidebar',
  FOOTER: 'footer',
  NAVRAIL: 'navrail',
  PANEL: 'panel',
  KEYBOARD: 'keyboard',
  API: 'api',
  SYSTEM: 'system'
});

const CONTRACTS: Record<string, { required: string[]; optional: string[] }> = {
  'navigate': { required: ['target'], optional: ['params', 'origin'] },
  'panel:load': { required: ['panelId'], optional: ['options'] },
  'panel:unload': { required: ['panelId'], optional: [] as string[] },
  'layout:change': { required: ['layout'], optional: ['animate'] },
  'state:update': { required: ['key', 'value'], optional: [] as string[] }
};

let _metrics = { validations: 0, failures: 0, normalized: 0 };

export function getContract(actionType: string) { return CONTRACTS[actionType] || null; }

export function validate(actionType: string, payload: Record<string, unknown>) {
  _metrics.validations++;
  const contract = CONTRACTS[actionType];
  if (!contract) return { valid: true, warnings: ['no_contract'] };
  const missing = contract.required.filter((key: string) => !(key in payload));
  if (missing.length > 0) { _metrics.failures++; return { valid: false, missing }; }
  return { valid: true };
}

export function validateAction(action: Record<string, unknown>) {
  _metrics.validations++;
  if (!action) return { valid: false, error: 'no_action' };
  if (!action.actionId && !action.type) return { valid: false, error: 'no_action_id' };
  return { valid: true, action };
}

export function normalizeUIAction(rawAction: Record<string, unknown>) {
  _metrics.normalized++;
  const normalized = {
    actionId: rawAction.actionId || rawAction.action || rawAction.type || 'unknown',
    kind: rawAction.kind || ACTION_KINDS.UI,
    source: rawAction.source || ACTION_SOURCES.SYSTEM,
    payload: rawAction.payload || rawAction.data || {},
    timestamp: rawAction.timestamp || Date.now(),
    meta: rawAction.meta || {}
  };
  return normalized;
}

export function registerContract(actionType: string, contract: { required: string[]; optional: string[] }) { CONTRACTS[actionType] = contract; }
export function getAllContracts() { return { ...CONTRACTS }; }
export function getMetrics() { return { ..._metrics, contractCount: Object.keys(CONTRACTS).length }; }

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { contractCount: Object.keys(CONTRACTS).length, validationFailures: _metrics.failures }, metrics: getMetrics() };
}

export default { ACTION_KINDS, ACTION_SOURCES, getContract, validate, validateAction, normalizeUIAction, registerContract, getAllContracts, getMetrics, healthCheck, VERSION, MODULE_ID };
