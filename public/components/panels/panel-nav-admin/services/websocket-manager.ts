

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.5.0-MIGRATION-PHASE9)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.services.websocket-manager
// PURPOSE: WebSocket Manager — Notificações em tempo real para colaboração
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isEnabled from ../config/feature-flags.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   WebSocketManager — Factory function
//   WS_EVENTS — WebSocket event types
//   info(), healthCheck()
//
// @origin Adapted from panel-01 WebSocket with auto-reconnect for nav-admin
// @changelog
//   10.5.0-MIGRATION-PHASE9: Initial creation — FASE 9 G.1
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isEnabled } from '../config/feature-flags.js';

export const VERSION = '10.5.0-MIGRATION-PHASE9';
export const MODULE_ID = 'panel-nav-admin.services.websocket-manager';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[WebSocketManager]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * WebSocket event types for nav-admin.
 * @type {Object}
 */
export const WS_EVENTS = Object.freeze({
  NAV_ITEM_CHANGED: 'nav:item:changed',
  NAV_ITEM_CREATED: 'nav:item:created',
  NAV_ITEM_DELETED: 'nav:item:deleted',
  NAV_SECTION_CHANGED: 'nav:section:changed',
  NAV_REORDERED: 'nav:reordered',
  NAV_BULK_UPDATE: 'nav:bulk:update',
  ADMIN_JOINED: 'admin:joined',
  ADMIN_LEFT: 'admin:left',
  ADMIN_EDITING: 'admin:editing',
  HEARTBEAT: 'heartbeat'
});

/**
 * Connection states.
 * @type {Object}
 */
export const WS_STATES = Object.freeze({
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting'
});

/**
 * Factory: creates a WebSocketManager with auto-reconnect.
 *
 * @param {Object} [options]
 * @param {string} [options.url] — WebSocket endpoint URL
 * @param {number} [options.reconnectDelayMs=3000] — Initial reconnect delay
 * @param {number} [options.maxReconnectDelayMs=30000] — Max reconnect delay
 * @param {number} [options.maxReconnectAttempts=10] — Max reconnect attempts
 * @param {number} [options.heartbeatIntervalMs=30000] — Heartbeat interval
 * @returns {Object} WebSocketManager instance
 */
export function WebSocketManager(options: Record<string, unknown> = {}) {
  const url = options.url as string | undefined;
  const reconnectDelayMs = (options.reconnectDelayMs as number) ?? 3000;
  const maxReconnectDelayMs = (options.maxReconnectDelayMs as number) ?? 30000;
  const maxReconnectAttempts = (options.maxReconnectAttempts as number) ?? 10;
  const heartbeatIntervalMs = (options.heartbeatIntervalMs as number) ?? 30000;

  /** @private */
  let _ws: WebSocket | null = null;
  let _state: string = WS_STATES.DISCONNECTED;
  let _reconnectAttempts = 0;
  let _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let _intentionalClose = false;
  const _listeners = new Map<string, ((data: unknown) => void)[]>();
  const _messageQueue: string[] = [];

  /**
   * Connect to the WebSocket server.
   *
   * @param {string} [wsUrl] — Override URL
   * @returns {Promise<boolean>} Connected successfully
   */
  function connect(wsUrl?: string) {
    if (!isEnabled('websocket')) {
      _log('debug', 'WebSocket disabled by feature flag');
      return Promise.resolve(false);
    }

    const endpoint = wsUrl || url;
    if (!endpoint) {
      _log('error', 'No WebSocket URL provided');
      return Promise.resolve(false);
    }

    _intentionalClose = false;
    _state = WS_STATES.CONNECTING;

    return new Promise((resolve) => {
      try {
        _ws = new WebSocket(endpoint);

        _ws.onopen = () => {
          _state = WS_STATES.CONNECTED;
          _reconnectAttempts = 0;
          _startHeartbeat();
          _flushQueue();
          _log('info', 'Connected');
          _emit('_connected', { url: endpoint });
          resolve(true);
        };

        _ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === WS_EVENTS.HEARTBEAT) return;
            _emit(msg.type || '_message', msg.data || msg);
          } catch {
            _emit('_message', event.data);
          }
        };

        _ws.onclose = (event) => {
          _stopHeartbeat();
          if (_intentionalClose) {
            _state = WS_STATES.DISCONNECTED;
            _log('info', 'Disconnected intentionally');
            return;
          }
          _state = WS_STATES.RECONNECTING;
          _log('debug', `Connection closed (code: ${event.code}). Reconnecting...`);
          _scheduleReconnect(endpoint);
        };

        _ws.onerror = () => {
          _log('error', 'Connection error');
          resolve(false);
        };
      } catch (err) {
        _log('error', 'Failed to create WebSocket:', err);
        resolve(false);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server.
   */
  function disconnect() {
    _intentionalClose = true;
    _stopHeartbeat();
    if (_reconnectTimer) {
      clearTimeout(_reconnectTimer);
      _reconnectTimer = null;
    }
    if (_ws) {
      _ws.close(1000, 'Client disconnect');
      _ws = null;
    }
    _state = WS_STATES.DISCONNECTED;
  }

  /**
   * Send a message through the WebSocket.
   *
   * @param {string} type — Message type
   * @param {*} data — Message payload
   */
  function send(type: string, data: unknown) {
    const msg = JSON.stringify({ type, data, timestamp: Date.now() });
    if (_ws && _ws.readyState === WebSocket.OPEN) {
      _ws.send(msg);
    } else {
      _messageQueue.push(msg);
    }
  }

  /**
   * Listen for a message type.
   *
   * @param {string} type — Message type
   * @param {Function} handler
   * @returns {Function} Unsubscribe
   */
  function on(type: string, handler: (data: unknown) => void) {
    if (!_listeners.has(type)) _listeners.set(type, []);
    // @ts-expect-error strict migration — TS2532
    _listeners.get(type).push(handler);
    return () => off(type, handler);
  }

  /**
   * Remove a listener.
   */
  function off(type: string, handler: (data: unknown) => void) {
    const handlers = _listeners.get(type);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  }

  /** @private */
  function _emit(type: string, data: unknown) {
    const handlers = _listeners.get(type);
    if (!handlers) return;
    for (const handler of [...handlers]) {
      try { handler(data); } catch (err) {
        _log('error', `Handler error for "${type}":`, err);
      }
    }
  }

  /** @private */
  function _flushQueue() {
    while (_messageQueue.length > 0 && _ws && _ws.readyState === WebSocket.OPEN) {
      // @ts-expect-error strict migration — TS2345
      _ws.send(_messageQueue.shift());
    }
  }

  /** @private */
  function _scheduleReconnect(endpoint: string) {
    if (_reconnectAttempts >= Number(maxReconnectAttempts)) {
      _state = WS_STATES.DISCONNECTED;
      _log('error', `Max reconnect attempts (${maxReconnectAttempts}) reached`);
      _emit('_maxReconnect', { attempts: _reconnectAttempts });
      return;
    }

    const delay = Math.min(Number(reconnectDelayMs) * Math.pow(2, _reconnectAttempts), Number(maxReconnectDelayMs));
    _reconnectAttempts++;

    _log('debug', `Reconnect attempt ${_reconnectAttempts} in ${delay}ms`);
    _reconnectTimer = setTimeout(() => connect(endpoint), delay);
  }

  /** @private */
  function _startHeartbeat() {
    _stopHeartbeat();
    _heartbeatTimer = setInterval(() => {
      if (_ws && _ws.readyState === WebSocket.OPEN) {
        _ws.send(JSON.stringify({ type: WS_EVENTS.HEARTBEAT }));
      }
    }, Number(heartbeatIntervalMs));
  }

  /** @private */
  function _stopHeartbeat() {
    if (_heartbeatTimer) {
      clearInterval(_heartbeatTimer);
      _heartbeatTimer = null;
    }
  }

  /**
   * Get current connection state.
   * @returns {string}
   */
  function getState() {
    return _state;
  }

  /**
   * Check if connected.
   * @returns {boolean}
   */
  function isConnected() {
    return _state === WS_STATES.CONNECTED && _ws && _ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection stats.
   * @returns {Object}
   */
  function getStats() {
    return {
      state: _state,
      reconnectAttempts: _reconnectAttempts,
      queuedMessages: _messageQueue.length,
      listenerCount: [..._listeners.values()].reduce((sum, h) => sum + h.length, 0)
    };
  }

  return {
    connect, disconnect, send,
    on, off,
    getState, isConnected, getStats
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, eventTypes: Object.keys(WS_EVENTS).length };
}

export function healthCheck() {
  return {
    status: typeof WebSocket !== 'undefined' ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    webSocketSupport: typeof WebSocket !== 'undefined'
  };
}

export default { WebSocketManager, WS_EVENTS, WS_STATES, injectPorts, info, healthCheck, VERSION, MODULE_ID };
