// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-multi-window
// PURPOSE: Container Multi-Window Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//   CONTAINER_EVENTS from /core/runtime/events/catalog/container.events.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectEventBus() — exported function
//   createMultiWindow() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventType
// LISTENS (eventos):
//   'beforeunload'
//   'message'
//   CONTAINER_EVENTS.DRAG_END
//   CONTAINER_EVENTS.RESIZE_END
// WINDOW ACCESS:
//   window.addEventListener
//   window.removeEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';
import { CONTAINER_EVENTS } from '/core/runtime/events/catalog/container.events.js';

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-multi-window';
import { createLogger } from '../utils/logger.js';
const logger = createLogger(MODULE_ID);

let _injectedEventBus: { emit?: (event: string, data: Record<string, unknown>) => void; on?: (event: string, callback: (data: Record<string, unknown>) => void) => (() => void) } | null = null;

export function injectEventBus(eventBus: typeof _injectedEventBus) { _injectedEventBus = eventBus; }

function _getEventBus() { return _injectedEventBus; }

function _emitEvent(eventType: string, payload: Record<string, unknown>) {
  const eb = _getEventBus();
  if (eb?.emit) { eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload }); return true; }
  return false;
}

// Options validation
function _validateOptions(options: Record<string, unknown>) {
  const errors = [];
  if (options.channelName !== undefined && typeof options.channelName !== 'string') errors.push('channelName must be a string');
  if (options.syncState !== undefined && typeof options.syncState !== 'boolean') errors.push('syncState must be a boolean');
  if (options.syncPosition !== undefined && typeof options.syncPosition !== 'boolean') errors.push('syncPosition must be a boolean');
  if (options.onMessage !== undefined && typeof options.onMessage !== 'function') errors.push('onMessage must be a function');
  if (errors.length > 0) logger.warn('Invalid options', { errors });
  return errors.length === 0;
}

export function createMultiWindow(container: HTMLElement, options: Record<string, any> = {}) {
  _validateOptions(options);
  const { channelName = 'dsd-container-sync', syncState = true, syncPosition = false, syncSize = false, onMessage, onWindowJoin, onWindowLeave, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;

  let _initialized = false;
  let _channel: BroadcastChannel | null = null;
  let _windowId = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  let _knownWindows = new Set();
  let _boundMessageHandler: EventListener | null = null;
  let _boundBeforeUnload: EventListener | null = null;

  function _createMessage(type: string, data: Record<string, any> = {}) {
    return { type, windowId: _windowId, containerId: container.id, timestamp: Date.now(), ...data };
  }

  function _broadcast(type: string, data: Record<string, any> = {}) {
    if (!_channel) return false;
    try { _channel.postMessage(_createMessage(type, data)); return true; }
    catch { return false; }
  }

  function _handleMessage(event: MessageEvent) {
    const msg = event.data;
    if (!msg || msg.windowId === _windowId) return;
    if (msg.containerId && msg.containerId !== container.id) return;

    switch (msg.type) {
      case 'ping':
        _knownWindows.add(msg.windowId);
        _broadcast('pong', { respondingTo: msg.windowId });
        onWindowJoin?.(msg.windowId);
        break;
      case 'pong':
        _knownWindows.add(msg.windowId);
        break;
      case 'leave':
        _knownWindows.delete(msg.windowId);
        onWindowLeave?.(msg.windowId);
        break;
      case 'state-update':
        if (syncState && msg.state) _emitEvent(MAIN_EVENTS.STATE_SYNC, { state: msg.state, fromWindow: msg.windowId });
        break;
      case 'position-update':
        if (syncPosition && msg.position) {
          container.style.left = `${msg.position.x}px`;
          container.style.top = `${msg.position.y}px`;
        }
        break;
      case 'size-update':
        if (syncSize && msg.size) {
          container.style.width = `${msg.size.width}px`;
          container.style.height = `${msg.size.height}px`;
        }
        break;
      case 'custom':
        onMessage?.(msg);
        _emitEvent(MAIN_EVENTS.MULTIWINDOW_MESSAGE, { message: msg, fromWindow: msg.windowId });
        break;
    }
  }

  function _setupEventBusListeners() {
    const eb = _getEventBus();
    if (!eb?.on) return;
    if (syncPosition) {
      eb.on(CONTAINER_EVENTS.DRAG_END, (data: Record<string, unknown>) => {
        if (data.containerId === container.id) _broadcast('position-update', { position: { x: data.x, y: data.y } });
      });
    }
    if (syncSize) {
      eb.on(CONTAINER_EVENTS.RESIZE_END, (data: Record<string, unknown>) => {
        if (data.containerId === container.id) _broadcast('size-update', { size: { width: data.width, height: data.height } });
      });
    }
  }

  const multiWindow = {
    init() {
      if (_initialized) return this;
      if (typeof BroadcastChannel === 'undefined') { logger.warn('BroadcastChannel not supported'); return this; }
      _channel = new BroadcastChannel(channelName);
      // @ts-expect-error strict migration — TS2322
      _boundMessageHandler = _handleMessage;
      _channel!.addEventListener('message', _boundMessageHandler as EventListener);
      _boundBeforeUnload = () => { _broadcast('leave'); _channel?.close(); };
      window.addEventListener('beforeunload', _boundBeforeUnload as EventListener);
      _setupEventBusListeners();
      _broadcast('ping');
      _initialized = true;
      return this;
    },
    getWindowId() { return _windowId; },
    getKnownWindows() { return [..._knownWindows]; },
    getWindowCount() { return _knownWindows.size + 1; },
    broadcast(type: string, data: Record<string, any> = {}) {
      if (typeof type !== 'string') return false;
      return _broadcast('custom', { customType: type, ...data });
    },
    syncState(state: Record<string, unknown>) {
      if (!syncState) return false;
      return _broadcast('state-update', { state });
    },
    requestSync() {
      _broadcast('ping');
      return this;
    },
    isInitialized() { return _initialized; },
    destroy() {
      if (_channel) {
        _broadcast('leave');
        if (_boundMessageHandler) _channel!.removeEventListener('message', _boundMessageHandler as EventListener);
        _channel.close();
        _channel = null;
      }
      if (_boundBeforeUnload) window.removeEventListener('beforeunload', _boundBeforeUnload as EventListener);
      _boundMessageHandler = null;
      _boundBeforeUnload = null;
      _knownWindows.clear();
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, windowId: _windowId, knownWindows: _knownWindows.size, channelName, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
    }
  };
  return multiWindow;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true }; }

export default { createMultiWindow, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
