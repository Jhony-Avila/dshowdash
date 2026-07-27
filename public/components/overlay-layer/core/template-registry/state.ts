// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Template Registry - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG from ./constants.js
//   BUILTIN_TEMPLATES from ./builtin.js
//
// PROVIDES:
//   templates — exported value
//   config — exported value
//   state — exported value
//   refs — exported value
//   inject() — exported function
//   initBuiltinTemplates() — exported function
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

import { DEFAULT_CONFIG } from './constants.js';
import { BUILTIN_TEMPLATES } from './builtin.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.template-registry.state';

export const templates = {};
export const config = { ...DEFAULT_CONFIG };
export const state = {
  totalRegistered: 0,
  totalApplied: 0,
  totalRemoved: 0
};

export const refs = {
  schemaValidator: null as DynObj
};

export function inject(dependencies: DynObj) {
  if (dependencies.schemaValidator) refs.schemaValidator = dependencies.schemaValidator;
}

export function initBuiltinTemplates() {
  for (const [id, template] of Object.entries(BUILTIN_TEMPLATES)) {
    if (!(templates as DynObj)[id]) {
      (templates as DynObj)[id] = { ...template, _builtin: true };
    }
  }
}

// Initialize built-ins
initBuiltinTemplates();
