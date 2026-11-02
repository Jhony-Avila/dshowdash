// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events.payloads.SECURITY
// PURPOSE: P18 Event Payload Schemas - SECURITY Domain
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// P18 Events Payloads - SECURITY Domain
// DEPENDENCY CONTRACT — Payload schema (self-contained)
// @version 1.1.0-P2-ENTERPRISE
'use strict';

export const VERSION: string = '2.9.0-STRICT-MODE';
export const MODULE_ID: string = 'core.runtime.events.payloads.security.payloads';

export const SECURITY_PAYLOADS = { POLICY_LOADED: { timestamp: 'number', source: 'string', moduleId: 'string', policyId: 'string', rules: 'array?' }, DECISION_ALLOW: { timestamp: 'number', source: 'string', moduleId: 'string', action: 'string', resource: 'string?', policyId: 'string?' }, DECISION_DENY: { timestamp: 'number', source: 'string', moduleId: 'string', action: 'string', resource: 'string?', reason: 'string' }, INCIDENT_DETECTED: { timestamp: 'number', source: 'string', moduleId: 'string', type: 'string', severity: 'string', details: 'object?' }, CSRF_TOKEN_REFRESHED: { timestamp: 'number', source: 'string', moduleId: 'string', tokenId: 'string?', expiresAt: 'number?' } } as const;

/** Derived type: keys of SECURITY_PAYLOADS */
export type SecurityPayloadKey = keyof typeof SECURITY_PAYLOADS;
