// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events.payloads.PERMISSIONS
// PURPOSE: P18 Event Payload Schemas - PERMISSIONS Domain
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// P18 Events Payloads - PERMISSIONS Domain
// DEPENDENCY CONTRACT — Payload schema (self-contained)
// @version 1.1.0-P2-ENTERPRISE
'use strict';

export const VERSION: string = '2.9.0-STRICT-MODE';
export const MODULE_ID: string = 'core.runtime.events.payloads.permissions.payloads';

export const PERMISSIONS_PAYLOADS = { LOADED: { timestamp: 'number', source: 'string', moduleId: 'string', permissions: 'array', userId: 'string?' }, CHECK_REQUEST: { timestamp: 'number', source: 'string', moduleId: 'string', permission: 'string', resource: 'string?' }, CHECK_PASSED: { timestamp: 'number', source: 'string', moduleId: 'string', permission: 'string', resource: 'string?' }, CHECK_DENIED: { timestamp: 'number', source: 'string', moduleId: 'string', permission: 'string', resource: 'string?', reason: 'string?' } } as const;

/** Derived type: keys of PERMISSIONS_PAYLOADS */
export type PermissionsPayloadKey = keyof typeof PERMISSIONS_PAYLOADS;
