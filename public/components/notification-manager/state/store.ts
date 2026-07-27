// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-manager-store
// PURPOSE: Notification Manager - Store v2.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   getNotifications() — exported function
//   addNotification() — exported function
//   removeNotification() — exported function
//   clear() — exported function
//   subscribe() — exported function
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
export const VERSION = '2.1.0-ENTERPRISE';
export const MODULE_ID = 'notification-manager-store';
interface StoreNotification { id: string | number; [key: string]: unknown; }
interface StoreState { notifications: StoreNotification[]; config: { maxVisible: number }; }
type StoreSubscriber = (state: StoreState) => void;
let _state: StoreState = { notifications: [], config: { maxVisible: 5 } };
let _subscribers: StoreSubscriber[] = [];
export function getState() { return { ..._state }; }
export function getNotifications() { return [..._state.notifications]; }
export function addNotification(n: StoreNotification) { if (!n?.id) return false; _state.notifications.push(n); _notify(); return true; }
export function removeNotification(id: string | number) { _state.notifications = _state.notifications.filter(n => n.id !== id); _notify(); return true; }
export function clear() { _state.notifications = []; _notify(); }
export function subscribe(fn: StoreSubscriber) { if (typeof fn === 'function') _subscribers.push(fn); return () => { _subscribers = _subscribers.filter(s => s !== fn); }; }
function _notify() { _subscribers.forEach(s => { try { s(_state); } catch (e) {} }); }
export function healthCheck() { const checks = { hasState: true, notOverloaded: _state.notifications.length < 50 }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, notificationCount: _state.notifications.length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, notificationCount: _state.notifications.length, subscriberCount: _subscribers.length, timestamp: Date.now() }; }
export default { getState, getNotifications, addNotification, removeNotification, clear, subscribe, healthCheck, info, VERSION, MODULE_ID };
