// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.events.payloads.TELEMETRY
// PURPOSE: P18 Event Payload Schemas - TELEMETRY Domain
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// P18 Events Payloads - TELEMETRY Domain
// DEPENDENCY CONTRACT — Payload schema (self-contained)
// @version 1.1.0-P2-ENTERPRISE
'use strict';

export const VERSION: string = '2.9.0-STRICT-MODE';
export const MODULE_ID: string = 'core.runtime.events.payloads.telemetry.payloads';

export const TELEMETRY_PAYLOADS = { TRACK_REQUEST: { timestamp: 'number', source: 'string', moduleId: 'string', event: 'string', category: 'string?', data: 'object?', correlationId: 'string?' }, TRACKED: { timestamp: 'number', source: 'string', moduleId: 'string', event: 'string', trackId: 'string?' }, ERROR_CAPTURED: { timestamp: 'number', source: 'string', moduleId: 'string', error: 'string', stack: 'string?', context: 'object?', severity: 'string?' }, HEALTH_SNAPSHOT_CREATED: { timestamp: 'number', source: 'string', moduleId: 'string', status: 'string', components: 'object?', metrics: 'object?' }, PERFORMANCE_MEASURE: { timestamp: 'number', source: 'string', moduleId: 'string', name: 'string', duration: 'number', startTime: 'number?' } } as const;

/** Derived type: keys of TELEMETRY_PAYLOADS */
export type TelemetryPayloadKey = keyof typeof TELEMETRY_PAYLOADS;
