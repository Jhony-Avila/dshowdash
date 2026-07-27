// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: dev-tools-event-timeline-constants
// PURPOSE: Dev Tools - Event Timeline Constants v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   MAX_EVENTS — exported value
//   TIMELINE_COLORS — exported value
//   EVENT_TYPES — exported value
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
export const VERSION = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'dev-tools-event-timeline-constants';
export const MAX_EVENTS = 1000;
export const TIMELINE_COLORS = Object.freeze({ info: '#3b82f6', warn: '#f59e0b', error: '#ef4444', debug: '#8b5cf6' });
export const EVENT_TYPES = Object.freeze({ USER: 'user', SYSTEM: 'system', NETWORK: 'network', DOM: 'dom' });
export function healthCheck() { return { status: 'HEALTHY', score: '1/1', checks: { available: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, constants: { MAX_EVENTS, eventTypes: Object.keys(EVENT_TYPES) }, timestamp: Date.now() }; }
export const TIMELINE_STATES = Object.freeze({ IDLE: 'idle', RECORDING: 'recording', PAUSED: 'paused', REPLAYING: 'replaying' });
export const DEFAULT_OPTIONS = Object.freeze({ maxEvents: 1000, autoRecord: true });
export default { MAX_EVENTS, TIMELINE_COLORS, EVENT_TYPES, healthCheck, info, VERSION, MODULE_ID };
