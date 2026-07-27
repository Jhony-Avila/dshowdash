// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Template Registry - CRUD
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BUILTIN_TEMPLATES from ./builtin.js
//   templates, config, state, refs from ./state.js
//
// PROVIDES:
//   register() — exported function
//   unregister() — exported function
//   get() — exported function
//   has() — exported function
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

import { BUILTIN_TEMPLATES } from './builtin.js';
import { templates, config, state, refs } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.template-registry.crud';

export function register(templateId: string, baseConfig: DynObj, options: { force?: boolean } = {}) {
  if (!templateId || typeof templateId !== 'string') {
    return { ok: false, error: 'invalid-template-id' };
  }
  
  if (!baseConfig || typeof baseConfig !== 'object') {
    return { ok: false, error: 'invalid-base-config' };
  }
  
  if ((templates as DynObj)[templateId] && !config.allowOverwrite && !options.force) {
    return { ok: false, error: 'template-exists', templateId };
  }
  
  if (config.validateOnRegister && refs.schemaValidator?.validate) {
    const validation = refs.schemaValidator.validate(baseConfig);
    if (!validation.valid) {
      return { 
        ok: false, 
        error: 'validation-failed', 
        errors: validation.errors 
      };
    }
  }
  
  const isOverwritingBuiltin = (templates as DynObj)[templateId]?._builtin;
  
  (templates as DynObj)[templateId] = {
    ...baseConfig,
    meta: {
      ...baseConfig.meta,
      templateId,
      registeredAt: Date.now(),
      overwrittenBuiltin: isOverwritingBuiltin
    },
    _builtin: false,
    _custom: true
  };
  
  state.totalRegistered++;
  
  return { 
    ok: true, 
    templateId,
    overwritten: isOverwritingBuiltin
  };
}

export function unregister(templateId: string) {
  if (!(templates as DynObj)[templateId]) {
    return { ok: false, error: 'template-not-found' };
  }
  
  if ((templates as DynObj)[templateId]._builtin) {
    return { ok: false, error: 'cannot-remove-builtin' };
  }
  
  delete (templates as DynObj)[templateId];
  state.totalRemoved++;
  
  if ((BUILTIN_TEMPLATES as DynObj)[templateId]) {
    (templates as DynObj)[templateId] = { ...(BUILTIN_TEMPLATES as DynObj)[templateId], _builtin: true };
  }
  
  return { ok: true, templateId };
}

export function get(templateId: string) {
  const template = (templates as DynObj)[templateId];
  if (!template) return null;
  
  const { _builtin, _custom, ...rest } = template;
  return { ...rest };
}

export function has(templateId: string) {
  return !!(templates as DynObj)[templateId];
}
