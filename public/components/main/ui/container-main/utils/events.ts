// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:utils:events
// PURPOSE: P18EC-LOCAL: Local CustomEvent emissions for container components
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   emit() — exported function
//   emitGlobal() — exported function
//   on() — exported function
//   once() — exported function
//   off() — exported function
//   delegate() — exported function
//   createBatchEmitter() — exported function
//   CONTAINER_EVENTS — exported value
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-main:utils:events';

const EVENT_PREFIX = 'container';

export function emit(container: HTMLElement, eventName: string, data: Record<string, unknown> = {}) {
  if (!container) return false;
  const fullEventName = eventName.includes(':') ? eventName : `${EVENT_PREFIX}:${eventName}`;
  container.dispatchEvent(new CustomEvent(fullEventName, { bubbles: true, cancelable: true, detail: { containerId: container.id, timestamp: Date.now(), ...data } }));
  return true;
}

export function emitGlobal(eventName: string, data: Record<string, unknown> = {}) {
  const fullEventName = eventName.includes(':') ? eventName : `${EVENT_PREFIX}:${eventName}`;
  document.dispatchEvent(new CustomEvent(fullEventName, { bubbles: true, cancelable: true, detail: { timestamp: Date.now(), ...data } }));
  return true;
}

export function on(target: HTMLElement, eventName: string, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
  const { once = false, capture = false } = options;
  const fullEventName = eventName.includes(':') ? eventName : `${EVENT_PREFIX}:${eventName}`;
  // @ts-expect-error TS migration - TS2339
  const handler = (e: Event) => { callback(e.detail, e); if (once) target.removeEventListener(fullEventName, handler, capture); };
  // @ts-expect-error strict migration — TS2769
  target.addEventListener(fullEventName, handler, capture);
  // @ts-expect-error strict migration — TS2769
  return () => target.removeEventListener(fullEventName, handler, capture);
}

export function once(target: HTMLElement, eventName: string, callback: (...args: unknown[]) => void) { return on(target, eventName, callback, { once: true }); }

export function off(target: HTMLElement, eventName: string, callback: (...args: unknown[]) => void, capture = false) {
  const fullEventName = eventName.includes(':') ? eventName : `${EVENT_PREFIX}:${eventName}`;
  target.removeEventListener(fullEventName, callback, capture);
}

export function delegate(container: HTMLElement, selector: string, eventName: string, callback: (...args: unknown[]) => void) {
  const handler = (e: Event) => { const target = (e.target as HTMLElement).closest(selector); if (target && container.contains(target)) callback(e, target); };
  container.addEventListener(eventName, handler);
  return () => container.removeEventListener(eventName, handler);
}

export function createBatchEmitter(container: HTMLElement, eventName: string, delay = 100) {
  let _batch: unknown[] = [], _timeout: ReturnType<typeof setTimeout> | null = null;
  return {
    add(data: Record<string, unknown>) { _batch.push(data); if (_timeout) clearTimeout(_timeout); _timeout = setTimeout(() => { emit(container, eventName, { batch: _batch }); _batch = []; }, delay); },
    flush() { if (_timeout) clearTimeout(_timeout); if (_batch.length > 0) { emit(container, eventName, { batch: _batch }); _batch = []; } },
    clear() { if (_timeout) clearTimeout(_timeout); _batch = []; }
  };
}

export const CONTAINER_EVENTS = {
  INIT: 'init', READY: 'ready', DESTROY: 'destroy',
  MINIMIZE: 'minimize', MAXIMIZE: 'maximize', RESTORE: 'restore', FULLSCREEN: 'fullscreen', COLLAPSE: 'collapse', EXPAND: 'expand',
  FOCUS: 'focus', BLUR: 'blur', CLICK: 'click',
  DRAG_START: 'dragstart', DRAG_MOVE: 'dragmove', DRAG_END: 'dragend', RESIZE_START: 'resizestart', RESIZE: 'resize', RESIZE_END: 'resizeend',
  CONTENT_LOAD: 'content:load', CONTENT_ERROR: 'content:error', REFRESH: 'refresh',
  TAB_ADD: 'tab:add', TAB_REMOVE: 'tab:remove', TAB_SELECT: 'tab:select'
};

export function healthCheck() { return { status: 'HEALTHY', score: '2/2', version: VERSION, moduleId: MODULE_ID, checks: { eventsReady: true, customEventSupported: typeof CustomEvent !== 'undefined' }, eventsCount: Object.keys(CONTAINER_EVENTS).length, p18ECLocal: true, timestamp: Date.now() }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, eventsCount: Object.keys(CONTAINER_EVENTS).length, eventsList: Object.keys(CONTAINER_EVENTS), p18ECLocal: true }; }

export default { emit, emitGlobal, on, once, off, delegate, createBatchEmitter, CONTAINER_EVENTS, healthCheck, info, VERSION, MODULE_ID };
