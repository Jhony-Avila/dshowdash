// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Template Registry - Restore
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BUILTIN_TEMPLATES from ./builtin.js
//   templates, initBuiltinTemplates from ./state.js
//
// PROVIDES:
//   restoreBuiltin() — exported function
//   restoreAllBuiltins() — exported function
//   clearCustom() — exported function
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
import { templates, initBuiltinTemplates } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.template-registry.restore';

export function restoreBuiltin(templateId: string) {
  if (!(BUILTIN_TEMPLATES as DynObj)[templateId]) {
    return { ok: false, error: 'not-a-builtin', templateId };
  }
  
  (templates as DynObj)[templateId] = { ...(BUILTIN_TEMPLATES as DynObj)[templateId], _builtin: true };
  
  return { ok: true, templateId, restored: true };
}

export function restoreAllBuiltins() {
  const restored = [];
  for (const [id, template] of Object.entries(BUILTIN_TEMPLATES)) {
    (templates as DynObj)[id] = { ...template, _builtin: true };
    restored.push(id);
  }
  return { ok: true, restored };
}

export function clearCustom() {
  const removed = [];
  for (const [id, template] of Object.entries(templates)) {

    // @ts-expect-error TS migration - TS2339
    if (template._custom) {
      delete (templates as DynObj)[id];
      removed.push(id);
    }
  }
  
  initBuiltinTemplates();
  
  return { ok: true, removed };
}
