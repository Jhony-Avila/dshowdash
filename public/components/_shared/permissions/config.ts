// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions.config
// PURPOSE: UARPS configuration settings for permissions system
// ───────────────────────────────────────────────────────────────
// @contract CONFIG - PermissionsConfig object with system settings
// @contract GLOBAL - Exposes to window.PermissionsConfig
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: None
// PROVIDES: PermissionsConfig, MODULE_ID, VERSION, info(), healthCheck()
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0-ENTERPRISE-ES6: Initial version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'components._shared.permissions.config';
export const VERSION = '1.1.0-P2-ENTERPRISE';

const PermissionsConfig = {
  mode: 'uarps-first',
  debug: false,
  silentMode: true,
  cache: { enabled: true, ttl: 300000, maxSize: 1000 },
  sync: { enabled: true, interval: 60000, endpoint: '/api/permissions/uarps.php' },
  uiFeedback: { enabled: true, mode: 'disable', showTooltips: true },
  migrationBridge: { enabled: true, mode: 'uarps-first', logDecisions: false },
  fallback: { useRoles: true, defaultDeny: false },
  version: VERSION,
  lastMigration: '2025-12-23T03:45:00Z'
};

if (typeof window !== 'undefined') window.PermissionsConfig = PermissionsConfig;

export default PermissionsConfig;

export function info() { return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true }, timestamp: Date.now() }; }
