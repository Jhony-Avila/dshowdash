// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.feature-flags.utils.helpers
// PURPOSE: Feature flags helper functions for parsing and checking
// ───────────────────────────────────────────────────────────────
// @contract PARSE_FLAG - parseFlag(value) parses value to boolean
// @contract IS_ENABLED - isEnabled(flags, key) checks if flag is enabled
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// PROVIDES: parseFlag, isEnabled, healthCheck, info, VERSION, MODULE_ID
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.0.0-ENTERPRISE-AAA: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.feature-flags.utils.helpers';

export function parseFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return !!value;
}

export function isEnabled(flags: Record<string, unknown>, key: string): boolean {
  return parseFlag(flags?.[key]);
}

export function healthCheck() {
  const checks = {
    available: true,
    functionsValid: typeof parseFlag === 'function' && typeof isEnabled === 'function'
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
    helpers: ['parseFlag', 'isEnabled'],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  parseFlag,
  isEnabled,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
