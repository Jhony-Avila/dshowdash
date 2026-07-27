// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Template Registry - Health
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   BUILTIN_TEMPLATES from ./builtin.js
//   templates, config, state from ./state.js
//   list from ./list.js
//   getConfig from ./config.js
//
// PROVIDES:
//   getMetrics() — exported function
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

import { VERSION, MODULE_ID } from './constants.js';
import { BUILTIN_TEMPLATES } from './builtin.js';
import { templates, config, state } from './state.js';
import { list } from './list.js';
import { getConfig } from './config.js';

export function getMetrics() {
  const templateList = list();
  return {
    enabled: config.enabled,
    totalTemplates: templateList.length,
    builtinCount: templateList.filter(t => t.builtin).length,
    customCount: templateList.filter(t => t.custom).length,
    totalRegistered: state.totalRegistered,
    totalApplied: state.totalApplied,
    totalRemoved: state.totalRemoved
  };
}

export function healthCheck() {
  const metrics = getMetrics();
  
  const checks = {
    enabled: config.enabled,
    hasBuiltins: metrics.builtinCount > 0,
    templatesAccessible: typeof templates === 'object'
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    checks,
    templates: {
      total: metrics.totalTemplates,
      builtin: metrics.builtinCount,
      custom: metrics.customCount
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: config.enabled,
    config: getConfig(),
    metrics: getMetrics(),
    templates: list(),
    builtinTemplateIds: Object.keys(BUILTIN_TEMPLATES),
    timestamp: Date.now()
  };
}
