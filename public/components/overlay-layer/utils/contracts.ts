// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-contracts
// PURPOSE: Overlay Layer - Contracts v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   VALID_TYPES — exported value
//   VALID_SCOPES — exported value
//   validateOverlayDescriptor() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'overlay-layer-contracts';

export const VALID_TYPES = ['modal', 'drawer', 'dialog', 'loading', 'toast', 'sheet'];
export const VALID_SCOPES = ['global', 'page', 'component'];

export function validateOverlayDescriptor(descriptor: DynObj) {
  const errors = [];
  if (!descriptor) { errors.push('descriptor is required'); return { valid: false, errors }; }
  if (!descriptor.id) errors.push('id is required');
  if (!descriptor.type) errors.push('type is required');
  else if (!VALID_TYPES.includes(descriptor.type)) errors.push(`invalid type: ${descriptor.type}`);
  if (descriptor.scope && !VALID_SCOPES.includes(descriptor.scope)) errors.push(`invalid scope: ${descriptor.scope}`);
  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, normalized: { id: descriptor.id, type: descriptor.type, scope: descriptor.scope || 'global', content: descriptor.content || null, config: descriptor.config || {}, meta: descriptor.meta || {} } };
}

export function healthCheck() {
  const checks = { typesValid: VALID_TYPES.length > 0, scopesValid: VALID_SCOPES.length > 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, validTypes: VALID_TYPES, validScopes: VALID_SCOPES, timestamp: Date.now() }; }

export default { VALID_TYPES, VALID_SCOPES, validateOverlayDescriptor, healthCheck, info, VERSION, MODULE_ID };
