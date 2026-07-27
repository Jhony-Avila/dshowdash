// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: carousel-events
// PURPOSE: Carousel - Events v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   on() — exported function
//   off() — exported function
//   emit() — exported function
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
export const MODULE_ID = 'carousel-events';
const _handlers = new Map<string, Function[]>();
export function on(event: string, handler: Function) { if (!_handlers.has(event)) _handlers.set(event, []); _handlers.get(event)!.push(handler); }
export function off(event: string, handler: Function) { const h = _handlers.get(event); if (h) _handlers.set(event, h.filter((fn: Function) => fn !== handler)); }
export function emit(event: string, data?: unknown) { const h = _handlers.get(event); if (h) h.forEach((fn: Function) => { try { fn(data); } catch (e) {} }); }
export function healthCheck() { return { status: 'HEALTHY', score: '1/1', checks: { available: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, registeredEvents: Array.from(_handlers.keys()), timestamp: Date.now() }; }
export default { on, off, emit, healthCheck, info, VERSION, MODULE_ID };
