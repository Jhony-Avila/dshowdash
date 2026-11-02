// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events.payloads.SESSION
// PURPOSE: P18 Event Payload Schemas - SESSION Domain
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// P18 Events Payloads - SESSION Domain
// DEPENDENCY CONTRACT — Payload schema (self-contained)
// @version 1.1.0-P2-ENTERPRISE
'use strict';

export const VERSION: string = '2.9.0-STRICT-MODE';
export const MODULE_ID: string = 'core.runtime.events.payloads.session.payloads';

export const SESSION_PAYLOADS = { INITIALIZED: { timestamp: 'number', source: 'string', moduleId: 'string', sessionId: 'string', userId: 'string?', expiresAt: 'number?' }, STATE_CHANGED: { timestamp: 'number', source: 'string', moduleId: 'string', previousState: 'object?', currentState: 'object', changedKeys: 'array?' }, TIMEOUT_WARNING: { timestamp: 'number', source: 'string', moduleId: 'string', remainingMs: 'number', expiresAt: 'number' }, TIMEOUT_EXPIRED: { timestamp: 'number', source: 'string', moduleId: 'string', sessionId: 'string', reason: 'string?' } } as const;

/** Derived type: keys of SESSION_PAYLOADS */
export type SessionPayloadKey = keyof typeof SESSION_PAYLOADS;
