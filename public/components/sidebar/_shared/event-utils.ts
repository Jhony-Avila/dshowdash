// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.7.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar._shared.event-utils
// PURPOSE: P18EC-LOCAL: Local CustomEvent emissions for sidebar components (utility, not global bridge)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createEventEmitter() — exported function
//   waitForEvent() — exported function
//   dispatchCustomEvent() — exported function
//   createDelegatedHandler() — exported function
//   isEnterOrSpace() — exported function
//   isEscape() — exported function
//   isArrowKey() — exported function
//   getModifiers() — exported function
//   prevent() — exported function
//   once() — exported function
//   addListeners() — exported function
//   createAbortable() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   event
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.7.0-P18EC';
export const MODULE_ID = 'sidebar._shared.event-utils';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
let _metrics = { emittersCreated: 0, customEventsDispatched: 0 };
export function createEventEmitter() { _metrics.emittersCreated++; const listeners = new Map(); return { on(event: string, handler: DynObj) { if (!listeners.has(event)) listeners.set(event, new Set()); listeners.get(event).add(handler); return () => this.off(event, handler); }, off(event: string, handler: DynObj) { listeners.get(event)?.delete(handler); }, emit(event: string, data: DynObj) { listeners.get(event)?.forEach((handler: DynObj) => { try { handler(data); } catch (e) { _getPort('logger')?.warn?.(`Event ${event} handler error:`, e); } }); }, once(event: string, handler: DynObj) { const wrapper = (data: DynObj) => { this.off(event, wrapper); handler(data); }; return this.on(event, wrapper); }, clear(event: string) { if (event) listeners.delete(event); else listeners.clear(); }, listenerCount(event: string) { return listeners.get(event)?.size || 0; } }; }
export function waitForEvent(target: EventTarget, event: string, timeout = 5000) { return new Promise((resolve, reject) => { const timer = setTimeout(() => { target.removeEventListener(event, handler); reject(new Error(`Event ${event} timeout after ${timeout}ms`)); }, timeout); const handler = (e: DynObj) => { clearTimeout(timer); target.removeEventListener(event, handler); resolve(e); }; target.addEventListener(event, handler); }); }
// P18EC-LOCAL: Utility function for local CustomEvent dispatch
export function dispatchCustomEvent(element: HTMLElement, name: string, detail = {}, options = {}) { _metrics.customEventsDispatched++; const event = new CustomEvent(name, { bubbles: true, cancelable: true, detail, ...options }); return element.dispatchEvent(event); }

// @ts-expect-error TS migration - TS2349
export function createDelegatedHandler(handlers) { return (e) => { for (const [selector, handler] of Object.entries(handlers)) { const target = e.target.closest(selector); if (target) { handler(e, target); break; } } }; }
export function isEnterOrSpace(e: KeyboardEvent) { return e.key === 'Enter' || e.key === ' '; }
export function isEscape(e: KeyboardEvent) { return e.key === 'Escape'; }
export function isArrowKey(e: KeyboardEvent) { return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key); }
export function getModifiers(e: DynObj) { return { ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey }; }
export function prevent(e: DynObj) { e.preventDefault(); e.stopPropagation(); }
export function once(target: EventTarget, event: string, handler: DynObj, options = {}) { target.addEventListener(event, handler, { ...options, once: true }); }
export function addListeners(target: EventTarget, events: string, handler: DynObj, options = {}) { const eventList = events.split(' '); eventList.forEach((event: DynObj) => target.addEventListener(event, handler, options)); return () => eventList.forEach((event: DynObj) => target.removeEventListener(event, handler, options)); }
export function createAbortable() { const controller = new AbortController(); return { signal: controller.signal, abort: () => controller.abort(), isAborted: () => controller.signal.aborted }; }
export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), p18ECLocal: true }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { customEventSupported: typeof CustomEvent !== 'undefined', portsInitialized: Ports.isInitialized() }, metrics: getMetrics(), p18ECLocal: true }; }
export default { createEventEmitter, waitForEvent, dispatchCustomEvent, createDelegatedHandler, isEnterOrSpace, isEscape, isArrowKey, getModifiers, prevent, once, addListeners, createAbortable, healthCheck, info, getMetrics, injectPorts, getPorts, VERSION, MODULE_ID };
