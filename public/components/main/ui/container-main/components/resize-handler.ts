// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-resize-handler
// PURPOSE: Container Resize Handler Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_EVENTS from /core/runtime/events/catalog/container.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   RESIZE_HANDLES — exported value
//   createResizeHandler() — exported function
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
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONTAINER_EVENTS } from '/core/runtime/events/catalog/container.events.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-resize-handler';

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _getEventBus() { return _injectedEventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  const eb = _getEventBus();
  if (eb?.emit) { eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload }); return true; }
  return false;
}

// Throttle helper for high-frequency events
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

export const RESIZE_HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

export function createResizeHandler(container: HTMLElement, options: Record<string, any> = {}) {
  const { minWidth = 200, minHeight = 150, maxWidth = Infinity, maxHeight = Infinity, handles = RESIZE_HANDLES, aspectRatio = null, throttleMs = 16, onResizeStart, onResize, onResizeEnd, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _enabled = true;
  let _isResizing = false;
  let _currentHandle: string | null = null;
  let _startX = 0;
  let _startY = 0;
  let _startWidth = 0;
  let _startHeight = 0;
  let _startLeft = 0;
  let _startTop = 0;
  let _handleElements: HTMLElement[] = [];
  let _boundMouseMove: EventListener | null = null;
  let _boundMouseUp: EventListener | null = null;
  let _throttledMouseMove: EventListener | null = null;

  function _createHandles() {
    handles.forEach((direction: string) => {
      const handle = document.createElement('div');
      handle.className = `dsd-resize-handle dsd-resize-handle--${direction}`;
      handle.dataset.direction = direction;
      handle.setAttribute('role', 'separator');
      handle.setAttribute('aria-orientation', direction === 'n' || direction === 's' ? 'horizontal' : 'vertical');
      handle.addEventListener('mousedown', (e) => _onMouseDown(e, direction));
      container.appendChild(handle);
      _handleElements.push(handle);
    });
  }

  function _onMouseDown(e: MouseEvent, direction: string) {
    if (!_enabled) return;
    e.preventDefault();
    e.stopPropagation();
    _isResizing = true;
    _currentHandle = direction;
    _startX = e.clientX;
    _startY = e.clientY;
    const rect = container.getBoundingClientRect();
    _startWidth = rect.width;
    _startHeight = rect.height;
    _startLeft = rect.left;
    _startTop = rect.top;
    container.classList.add('dsd-container--resizing');
    document.body.style.cursor = _getCursor(direction) as string;
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', _throttledMouseMove as EventListener);
    document.addEventListener('mouseup', _boundMouseUp as EventListener);
    onResizeStart?.({ width: _startWidth, height: _startHeight });
    _emitEvent(CONTAINER_EVENTS.RESIZE_START, { width: _startWidth, height: _startHeight, containerId: container.id });
  }

  function _onMouseMove(e: MouseEvent) {
    if (!_isResizing) return;
    const deltaX = e.clientX - _startX;
    const deltaY = e.clientY - _startY;
    let newWidth = _startWidth;
    let newHeight = _startHeight;
    let newLeft = _startLeft;
    let newTop = _startTop;
    if (_currentHandle!.includes('e')) newWidth = _startWidth + deltaX;
    if (_currentHandle!.includes('w')) { newWidth = _startWidth - deltaX; newLeft = _startLeft + deltaX; }
    if (_currentHandle!.includes('s')) newHeight = _startHeight + deltaY;
    if (_currentHandle!.includes('n')) { newHeight = _startHeight - deltaY; newTop = _startTop + deltaY; }
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    if (aspectRatio) {
      if (_currentHandle!.includes('e') || _currentHandle!.includes('w')) newHeight = newWidth / aspectRatio;
      else newWidth = newHeight * aspectRatio;
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    }
    if (_currentHandle!.includes('w')) newLeft = _startLeft + _startWidth - newWidth;
    if (_currentHandle!.includes('n')) newTop = _startTop + _startHeight - newHeight;
    container.style.width = `${newWidth}px`;
    container.style.height = `${newHeight}px`;
    container.style.left = `${newLeft}px`;
    container.style.top = `${newTop}px`;
    onResize?.({ width: newWidth, height: newHeight });
    _emitEvent(CONTAINER_EVENTS.RESIZE, { width: newWidth, height: newHeight, containerId: container.id });
  }

  function _onMouseUp() {
    if (!_isResizing) return;
    _isResizing = false;
    _currentHandle = null;
    container.classList.remove('dsd-container--resizing');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', _throttledMouseMove as EventListener);
    document.removeEventListener('mouseup', _boundMouseUp as EventListener);
    const rect = container.getBoundingClientRect();
    onResizeEnd?.({ width: rect.width, height: rect.height });
    _emitEvent(CONTAINER_EVENTS.RESIZE_END, { width: rect.width, height: rect.height, containerId: container.id });
  }

  function _getCursor(direction: string) {
    const cursors = { n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize' };
    return (cursors as Record<string, unknown>)[direction] || 'default';
  }

  const resizeApi = {
    init() {
      if (_initialized) return this;
      // @ts-expect-error strict migration — TS2322
      _boundMouseMove = _onMouseMove.bind(this);
      _boundMouseUp = _onMouseUp.bind(this);
      // @ts-expect-error strict migration — TS2345
      _throttledMouseMove = _throttle(_boundMouseMove, throttleMs);
      _createHandles();
      _initialized = true;
      return this;
    },
    enable() { _enabled = true; _handleElements.forEach(h => h.style.display = ''); return this; },
    disable() { _enabled = false; _handleElements.forEach(h => h.style.display = 'none'); return this; },
    isEnabled() { return _enabled; },
    isResizing() { return _isResizing; },
    getSize() { const rect = container.getBoundingClientRect(); return { width: rect.width, height: rect.height }; },
    setSize(width: number, height: number) {
      const w = Math.max(minWidth, Math.min(maxWidth, width));
      const h = Math.max(minHeight, Math.min(maxHeight, height));
      container.style.width = `${w}px`;
      container.style.height = `${h}px`;
      return { width: w, height: h };
    },
    isInitialized() { return _initialized; },
    destroy() {
      _handleElements.forEach(h => h.remove());
      _handleElements = [];
      document.removeEventListener('mousemove', _throttledMouseMove as EventListener);
      document.removeEventListener('mouseup', _boundMouseUp as EventListener);
      _boundMouseMove = null;
      _boundMouseUp = null;
      _throttledMouseMove = null;
      _initialized = false;
    },
    healthCheck() { return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, enabled: _enabled, isResizing: _isResizing, handleCount: _handleElements.length, throttleMs, hasInjectedEventBus: !!_injectedEventBus }; }
  };
  return resizeApi;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, throttleEnabled: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, throttleEnabled: true }; }

export default { createResizeHandler, injectEventBus, info, healthCheck, VERSION, MODULE_ID, RESIZE_HANDLES };
