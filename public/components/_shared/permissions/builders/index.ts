// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions.builders
// PURPOSE: Barrel export for canonical trigger builders
// ───────────────────────────────────────────────────────────────
// @contract EXPORTS - Re-exports all trigger builder functions
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: ./trigger-builders.js
// PROVIDES: buildNavigationItemTrigger, buildNavigationSectionTrigger, etc.
// @changelog v1.0.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0-ENTERPRISE: Initial version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'components._shared.permissions.builders';

export * from './trigger-builders.js';
export { default } from './trigger-builders.js';

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, exports: ['trigger-builders'], timestamp: Date.now() }; }
