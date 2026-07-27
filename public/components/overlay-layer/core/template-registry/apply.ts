// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Template Registry - Apply
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   templates, state from ./state.js
//   deepMerge from ./utils.js
//   get from ./crud.js
//   register from ./crud.js
//
// PROVIDES:
//   apply() — exported function
//   create() — exported function
//   clone() — exported function
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

import { templates, state } from './state.js';
import { deepMerge } from './utils.js';
import { get } from './crud.js';
import { register } from './crud.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.template-registry.apply';

export function apply(templateId: string, overrides = {}) {
  const template = (templates as DynObj)[templateId];
  if (!template) {
    return { ok: false, error: 'template-not-found', templateId };
  }
  
  const { _builtin, _custom, ...baseTemplate } = template;
  const merged = deepMerge(baseTemplate, overrides);
  
  merged.meta = {
    ...merged.meta,
    appliedTemplate: templateId,
    appliedAt: Date.now()
  };
  
  state.totalApplied++;
  
  return {
    ok: true,
    descriptor: merged,
    templateId,
    templateType: template.type
  };
}

export function create(templateId: string, content: DynObj, overrides = {}) {
  const result = apply(templateId, { content, ...overrides });
  if (!result.ok) return result;
  return result.descriptor;
}

export function clone(sourceId: string, newId: string, modifications = {}) {
  const source = get(sourceId);
  if (!source) {
    return { ok: false, error: 'source-not-found', sourceId };
  }
  
  const cloned = deepMerge(source, modifications);
  cloned.meta = {
    ...cloned.meta,
    clonedFrom: sourceId,
    clonedAt: Date.now()
  };
  
  return register(newId, cloned);
}
