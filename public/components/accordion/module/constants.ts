// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.module.constants
// PURPOSE: Accordion module constants and configuration
// ───────────────────────────────────────────────────────────────
// @contract VERSION - Module version constant
// @contract MODULE_ID - Module identifier constant
// @contract STYLE_PATHS - Style paths configuration
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// PROVIDES: VERSION, MODULE_ID, STYLE_PATHS, healthCheck, info
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.0-MODULAR: Initial modular architecture
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.module.constants';

export const STYLE_PATHS = Object.freeze({
  TOKENS: '/components/accordion/styles/accordion.tokens.css',
  MAIN: '/components/accordion/styles/accordion.css'
});

export function healthCheck() {
  const checks = {
    versionDefined: !!VERSION,
    moduleIdDefined: !!MODULE_ID,
    stylePathsDefined: !!STYLE_PATHS
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
    stylePaths: STYLE_PATHS,
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default { VERSION, MODULE_ID, STYLE_PATHS, healthCheck, info };
