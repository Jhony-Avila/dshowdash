// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:network-manager
// PURPOSE: Network Manager - Monitoramento de conectividade
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   NETWORK_STATES — exported value
//   CONNECTION_TYPES — exported value
//   createNetworkManager() — exported function
//   getNetworkManager() — exported function
//   resetNetworkManager() — exported function
//   isOnline() — exported function
//   isOffline() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'offline'
//   'online'
// WINDOW ACCESS:
//   window.addEventListener
//   window.removeEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE7';
export const MODULE_ID = 'container-main:network-manager';

export const NETWORK_STATES = Object.freeze({ ONLINE: 'online', OFFLINE: 'offline', SLOW: 'slow', UNKNOWN: 'unknown' });
export const CONNECTION_TYPES = Object.freeze({ WIFI: 'wifi', CELLULAR: 'cellular', ETHERNET: 'ethernet', BLUETOOTH: 'bluetooth', NONE: 'none', UNKNOWN: 'unknown' });

export function createNetworkManager(options: Record<string, any> = {}) {
  const { pingUrl = '/api/health', pingInterval = 30000, slowThresholdMs = 2000, onStatusChange = null } = options;

  const _logger = createLogger(MODULE_ID);
  const _listeners = new Map<string, Record<string, unknown>>();
  let _status: unknown = navigator.onLine ? NETWORK_STATES.ONLINE : NETWORK_STATES.OFFLINE;
  let _connectionType = CONNECTION_TYPES.UNKNOWN;
  let _effectiveType = 'unknown';
  let _downlink = 0;
  let _rtt = 0;
  let _pingTimer: ReturnType<typeof setTimeout> | null = null;
  let _counter = 0;
  let _metrics = { statusChanges: 0, pings: 0, failures: 0 };

  function _updateConnectionInfo() {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      _connectionType = conn.type || CONNECTION_TYPES.UNKNOWN;
      _effectiveType = conn.effectiveType || 'unknown';
      _downlink = conn.downlink || 0;
      _rtt = conn.rtt || 0;
    }
  }

  function _notifyListeners(event: string, data: Record<string, unknown>) {
    _listeners.forEach((config: Record<string, unknown>) => {
      if (config.event === event || config.event === 'all') {
        try { (config.callback as (...args: unknown[]) => void)(data); } catch (e) { _logger.error('Listener error:', e); }
      }
    });
  }

  function _handleOnline() {
    if (_status !== NETWORK_STATES.ONLINE) {
      _status = NETWORK_STATES.ONLINE;
      _metrics.statusChanges++;
      _updateConnectionInfo();
      _notifyListeners('online', { status: _status, connectionType: _connectionType });
      onStatusChange?.(_status);
    }
  }

  function _handleOffline() {
    if (_status !== NETWORK_STATES.OFFLINE) {
      _status = NETWORK_STATES.OFFLINE;
      _metrics.statusChanges++;
      _notifyListeners('offline', { status: _status });
      onStatusChange?.(_status);
    }
  }

  async function _ping() {
    if (!navigator.onLine) return false;
    _metrics.pings++;
    const start = performance.now();
    try {
      const response = await fetch(pingUrl, { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(5000) });
      const latency = performance.now() - start;
      if (latency > slowThresholdMs && _status !== NETWORK_STATES.SLOW) {
        _status = NETWORK_STATES.SLOW;
        _notifyListeners('slow', { status: _status, latency });
      } else if (latency <= slowThresholdMs && _status === NETWORK_STATES.SLOW) {
        _status = NETWORK_STATES.ONLINE;
        _notifyListeners('online', { status: _status, latency });
      }
      return response.ok;
    } catch (e) {
      _metrics.failures++;
      return false;
    }
  }

  // Inicialização
  window.addEventListener('online', _handleOnline);
  window.addEventListener('offline', _handleOffline);
  _updateConnectionInfo();

  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (conn) conn.addEventListener('change', _updateConnectionInfo);

  const manager = {
    isOnline() { return _status === NETWORK_STATES.ONLINE || _status === NETWORK_STATES.SLOW; },
    isOffline() { return _status === NETWORK_STATES.OFFLINE; },
    isSlow() { return _status === NETWORK_STATES.SLOW; },
    getStatus() { return _status; },

    getConnectionInfo() {
      return { status: _status, type: _connectionType, effectiveType: _effectiveType, downlink: _downlink, rtt: _rtt, online: navigator.onLine };
    },

    async ping() { return _ping(); },

    startMonitoring(interval = pingInterval) {
      this.stopMonitoring();
      _pingTimer = setInterval(() => _ping(), interval);
      _ping();
    },

    stopMonitoring() {
      if (_pingTimer) { clearInterval(_pingTimer); _pingTimer = null; }
    },

    onOnline(callback: (...args: unknown[]) => void) { const id = `on-${++_counter}`; _listeners.set(id, { event: 'online', callback }); return id; },
    onOffline(callback: (...args: unknown[]) => void) { const id = `off-${++_counter}`; _listeners.set(id, { event: 'offline', callback }); return id; },
    onSlow(callback: (...args: unknown[]) => void) { const id = `slow-${++_counter}`; _listeners.set(id, { event: 'slow', callback }); return id; },
    onChange(callback: (...args: unknown[]) => void) { const id = `all-${++_counter}`; _listeners.set(id, { event: 'all', callback }); return id; },
    off(id: string) { return _listeners.delete(id); },

    async waitForOnline(timeoutMs = 30000) {
      if (this.isOnline()) return true;
      return new Promise((resolve) => {
        const timeout = setTimeout(() => { this.off(id); resolve(false); }, timeoutMs);
        const id = this.onOnline(() => { clearTimeout(timeout); this.off(id); resolve(true); });
      });
    },

    async fetchWithRetry(url: string, options: Record<string, any> = {}, retries = 3, delay = 1000) {
      for (let i = 0; i < retries; i++) {
        try {
          if (!this.isOnline()) await this.waitForOnline(10000);
          return await fetch(url, options);
        } catch (e) {
          if (i === retries - 1) throw e;
          await new Promise(r => setTimeout(r, delay * (i + 1)));
        }
      }
    },

    getMetrics() { return { ..._metrics, status: _status, connectionType: _connectionType, listeners: _listeners.size }; },
    resetMetrics() { _metrics = { statusChanges: 0, pings: 0, failures: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, networkStatus: _status, connectionType: _connectionType, online: navigator.onLine, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, status: _status, connectionInfo: this.getConnectionInfo() }; },

    destroy() {
      this.stopMonitoring();
      window.removeEventListener('online', _handleOnline);
      window.removeEventListener('offline', _handleOffline);
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (conn) conn.removeEventListener('change', _updateConnectionInfo);
      _listeners.clear();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getNetworkManager(options: Record<string, any> = {}) { if (!_instance) _instance = createNetworkManager(options); return _instance; }
export function resetNetworkManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function isOnline() { return (getNetworkManager().isOnline as (...args: unknown[]) => unknown)(); }
export function isOffline() { return (getNetworkManager().isOffline as (...args: unknown[]) => unknown)(); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, states: Object.keys(NETWORK_STATES) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, NETWORK_STATES, CONNECTION_TYPES, createNetworkManager, getNetworkManager, resetNetworkManager, isOnline, isOffline, info, healthCheck };
