// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.ui.constants
// PURPOSE: UI constants and fallback icons for accordion view
// ───────────────────────────────────────────────────────────────
// @contract VERSION - Module version constant
// @contract MODULE_ID - Module identifier constant
// @contract FALLBACK_ICONS - SVG fallback icons object
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// PROVIDES: VERSION, MODULE_ID, FALLBACK_ICONS, healthCheck, info
// @changelog v2.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.1.0-UNIFIED-TRIGGERS: Initial unified triggers version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.ui.constants';

export const FALLBACK_ICONS = {
  chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
  folder: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
  file: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>',
  empty: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
};

export function healthCheck() {
  const checks = {
    versionDefined: !!VERSION,
    moduleIdDefined: !!MODULE_ID,
    fallbackIconsDefined: !!FALLBACK_ICONS
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    iconCount: Object.keys(FALLBACK_ICONS).length,
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  VERSION,
  MODULE_ID,
  FALLBACK_ICONS,
  healthCheck,
  info
};
