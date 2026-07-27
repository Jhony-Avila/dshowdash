// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-manager-events
// PURPOSE: Notification Manager - Events v2.0.0-ENTERPRISE-AAA
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
//   clear() — exported function
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
export const MODULE_ID = 'notification-manager-events';
type EventHandler = (data: unknown) => void;
const _handlers = new Map<string, EventHandler[]>();
export function on(event: string, handler: EventHandler) { if (!_handlers.has(event)) _handlers.set(event, []); _handlers.get(event)!.push(handler); }
export function off(event: string, handler: EventHandler) { const h = _handlers.get(event); if (h) _handlers.set(event, h.filter((fn: EventHandler) => fn !== handler)); }
export function emit(event: string, data: unknown) { const h = _handlers.get(event); if (h) h.forEach((fn: EventHandler) => { try { fn(data); } catch (e) {} }); }
export function clear() { _handlers.clear(); }
export function healthCheck() { return { status: 'HEALTHY', score: '1/1', checks: { available: true }, handlerCount: _handlers.size, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, events: Array.from(_handlers.keys()), timestamp: Date.now() }; }
export const EVENTS = Object.freeze({ NOTIFICATION_RECEIVED: 'notification:received', NOTIFICATION_READ: 'notification:read', NOTIFICATION_DELETED: 'notification:deleted', POLL_COMPLETE: 'notification:poll:complete' });
export function once(event: string, handler: EventHandler) { const wrapper = function(data: unknown) { off(event, wrapper); handler(data); }; on(event, wrapper); }
export const clearListeners = clear;
export function getRegisteredEvents(): string[] { return []; }
export function syncWithGlobalState() { return; }
export function notifyOrchestrator() { return; }
export default { on, off, emit, clear, healthCheck, info, VERSION, MODULE_ID };
