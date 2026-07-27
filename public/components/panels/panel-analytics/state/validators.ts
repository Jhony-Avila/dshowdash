// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-analytics/state/validators
// PURPOSE: Analytics - State Validators
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isValidState() — exported function
//   hasRequiredFields() — exported function
//   isLoading() — exported function
//   hasError() — exported function
//   hasData() — exported function
//   validate() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-analytics/state/validators';

export function isValidState(state: unknown) { return state !== null && typeof state === 'object'; }
export function hasRequiredFields(state: Record<string, unknown>, fields: string[]) { return fields.every((f: string) => Object.prototype.hasOwnProperty.call(state, f)); }
export function isLoading(state: Record<string, unknown>) { return state?.loading === true; }
export function hasError(state: Record<string, unknown>) { return !!state?.error; }
export function hasData(state: Record<string, unknown>) { return state?.data !== null && state?.data !== undefined; }

export function validate(state: Record<string, unknown>, rules: { required?: string[]; custom?: (state: Record<string, unknown>) => string | null } = {}) {
  const errors = [];
  if (rules.required && !hasRequiredFields(state, rules.required)) errors.push('Missing required fields');
  if (rules.custom) { const customError = rules.custom(state); if (customError) errors.push(customError); }
  return { valid: errors.length === 0, errors };
}

export function healthCheck() { return { status: 'healthy', version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() }; }

export default { isValidState, hasRequiredFields, isLoading, hasError, hasData, validate, healthCheck, info, VERSION, MODULE_ID };
