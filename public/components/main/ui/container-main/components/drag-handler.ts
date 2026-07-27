// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-drag-handler
// PURPOSE: Container Drag Handler Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_EVENTS from /core/runtime/events/catalog/container.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   createDragHandler() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   'mousedown'
//   'mousemove'
//   'mouseup'
// WINDOW ACCESS:
//   window.innerHeight
//   window.innerWidth
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONTAINER_EVENTS } from '/core/runtime/events/catalog/container.events.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-drag-handler';

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _getEventBus() { return _injectedEventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  const eb = _getEventBus();
  if (eb?.emit) { eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload }); return true; }
  return false;
}

// Throttle helper using requestAnimationFrame for smooth 60fps
function _throttle(this: any, fn: (...args: unknown[]) => void, delay: number) {
  let lastCall = 0;
  let scheduledCall: number | null = null;
  return function(...args: unknown[]) {
    const now = performance.now();
    const remaining = delay - (now - lastCall);
    if (remaining <= 0) {
      if (scheduledCall) { cancelAnimationFrame(scheduledCall); scheduledCall = null; }
      lastCall = now;
      // @ts-expect-error strict migration — TS2683
      fn.apply(this, args);
    } else if (!scheduledCall) {
      scheduledCall = requestAnimationFrame(() => {
        lastCall = performance.now();
        scheduledCall = null;
        // @ts-expect-error strict migration — TS2683
        fn.apply(this, args);
      });
    }
  };
}

export function createDragHandler(container: HTMLElement, options: Record<string, any> = {}) {
  const { handle = '.dsd-container__header', bounds = 'viewport', grid = null, throttleMs = 16, onDragStart, onDrag, onDragEnd, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _enabled = true;
  let _isDragging = false;
  let _startX = 0;
  let _startY = 0;
  let _startLeft = 0;
  let _startTop = 0;
  let _handleEl: HTMLElement | null = null;
  let _boundMouseDown: EventListener | null = null;
  let _boundMouseMove: EventListener | null = null;
  let _boundMouseUp: EventListener | null = null;
  let _throttledMouseMove: EventListener | null = null;

  function _getPosition() {
    const rect = container.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }

  function _setPosition(x: number, y: number) {
    let newX = x;
    let newY = y;
    if (bounds === 'viewport') {
      const rect = container.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      newX = Math.max(0, Math.min(vw - rect.width, newX));
      newY = Math.max(0, Math.min(vh - rect.height, newY));
    } else if (bounds === 'parent' && container.parentElement) {
      const parentRect = container.parentElement.getBoundingClientRect();
      const rect = container.getBoundingClientRect();
      newX = Math.max(0, Math.min(parentRect.width - rect.width, newX));
      newY = Math.max(0, Math.min(parentRect.height - rect.height, newY));
    }
    if (grid) { newX = Math.round(newX / grid[0]) * grid[0]; newY = Math.round(newY / grid[1]) * grid[1]; }
    container.style.position = 'fixed';
    container.style.left = `${newX}px`;
    container.style.top = `${newY}px`;
    container.style.transform = 'none';
    return { x: newX, y: newY };
  }

  function _onMouseDown(e: MouseEvent) {
    if (!_enabled) return;
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, select, textarea, a, [data-no-drag]')) return;
    e.preventDefault();
    _isDragging = true;
    _startX = e.clientX;
    _startY = e.clientY;
    const pos = _getPosition();
    _startLeft = pos.x;
    _startTop = pos.y;
    container.classList.add('dsd-container--dragging');
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', _throttledMouseMove as EventListener);
    document.addEventListener('mouseup', _boundMouseUp as EventListener);
    onDragStart?.({ x: _startLeft, y: _startTop });
    _emitEvent(CONTAINER_EVENTS.DRAG_START, { x: _startLeft, y: _startTop, containerId: container.id });
  }

  function _onMouseMove(e: MouseEvent) {
    if (!_isDragging) return;
    const deltaX = e.clientX - _startX;
    const deltaY = e.clientY - _startY;
    const newPos = _setPosition(_startLeft + deltaX, _startTop + deltaY);
    onDrag?.(newPos);
    _emitEvent(CONTAINER_EVENTS.DRAG_MOVE, { ...newPos, containerId: container.id });
  }

  function _onMouseUp(e: Event) {
    if (!_isDragging) return;
    _isDragging = false;
    container.classList.remove('dsd-container--dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', _throttledMouseMove as EventListener);
    document.removeEventListener('mouseup', _boundMouseUp as EventListener);
    const finalPos = _getPosition();
    onDragEnd?.(finalPos);
    _emitEvent(CONTAINER_EVENTS.DRAG_END, { ...finalPos, containerId: container.id });
  }

  const dragApi = {
    init() {
      if (_initialized) return this;
      _handleEl = typeof handle === 'string' ? container.querySelector(handle) : handle;
      if (!_handleEl) _handleEl = container;
      // @ts-expect-error strict migration — TS2322
      _boundMouseDown = _onMouseDown.bind(this);
      // @ts-expect-error strict migration — TS2322
      _boundMouseMove = _onMouseMove.bind(this);
      _boundMouseUp = _onMouseUp.bind(this);
      // @ts-expect-error strict migration — TS2345
      _throttledMouseMove = _throttle(_boundMouseMove, throttleMs);
      // @ts-expect-error strict migration — TS2769
      _handleEl.addEventListener('mousedown', _boundMouseDown);
      _handleEl.style.cursor = 'grab';
      _handleEl.setAttribute('role', 'slider');
      _handleEl.setAttribute('aria-label', 'Arraste para mover');
      _initialized = true;
      return this;
    },
    enable() { _enabled = true; if (_handleEl) _handleEl.style.cursor = 'grab'; return this; },
    disable() { _enabled = false; if (_handleEl) _handleEl.style.cursor = 'default'; return this; },
    isEnabled() { return _enabled; },
    isDragging() { return _isDragging; },
    getPosition() { return _getPosition(); },
    setPosition(x: number, y: number) { return _setPosition(x, y); },
    center() {
      const rect = container.getBoundingClientRect();
      const x = (window.innerWidth - rect.width) / 2;
      const y = (window.innerHeight - rect.height) / 2;
      return this.setPosition(x, y);
    },
    isInitialized() { return _initialized; },
    destroy() {
      if (_handleEl && _boundMouseDown) {
        _handleEl.removeEventListener('mousedown', _boundMouseDown);
        _handleEl.style.cursor = '';
        _handleEl.removeAttribute('role');
        _handleEl.removeAttribute('aria-label');
      }
      document.removeEventListener('mousemove', _throttledMouseMove as EventListener);
      document.removeEventListener('mouseup', _boundMouseUp as EventListener);
      _boundMouseDown = null;
      _boundMouseMove = null;
      _boundMouseUp = null;
      _throttledMouseMove = null;
      _handleEl = null;
      _initialized = false;
    },
    healthCheck() { return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, enabled: _enabled, isDragging: _isDragging, throttleMs, hasInjectedEventBus: !!_injectedEventBus }; }
  };
  return dragApi;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, throttleEnabled: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, throttleEnabled: true }; }

export default { createDragHandler, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
