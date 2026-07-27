// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-offline-mode
// PURPOSE: core   offline mode
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   destroy() — exported function
//   checkNow() — exported function
//   canBootOffline() — exported function
//   getOfflineBootConfig() — exported function
//   waitForConnection() — exported function
//   subscribe() — exported function
//   isOnline() — exported function
//   isOffline() — exported function
//   wasOffline() — exported function
//   getOfflineDuration() — exported function
//   getMetrics() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
// Preloader Offline Mode
// @version 1.2.0-P17WI-ES6
// P17WI: PortsFactory/PortsProfiles migration

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'preloader-offline-mode';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const log = { info(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {})); }, debug(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {})); }, warn(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx || {})); } };

let _isOnline = hasWindow && typeof navigator !== 'undefined' ? navigator.onLine : true;
let _wasOffline = false;
let _offlineSince: number | null = null;
let _initialized = false;
const _subscribers = new Set();

const _config: Record<string, any> = { enabled: true, showOfflineIndicator: true, cacheStrategy: 'network-first', offlineMessage: 'You are offline', reconnectingMessage: 'Reconnecting...', reconnectedMessage: 'Back online!', checkInterval: 30000, pingEndpoint: null as string | null, allowOfflineBoot: true, offlineBootTimeout: 5000 };

const _metrics = { offlineEvents: 0, onlineEvents: 0, totalOfflineDuration: 0, longestOfflineDuration: 0, lastOfflineAt: null as number | null, lastOnlineAt: null as number | null, reconnectAttempts: 0 };

let _checkTimer: ReturnType<typeof setInterval> | null = null;
let _indicatorElement: HTMLElement | null = null;

function _handleOnline() { const offlineDuration = _offlineSince ? Date.now() - _offlineSince : 0; _isOnline = true; _metrics.onlineEvents++; _metrics.lastOnlineAt = Date.now(); _metrics.totalOfflineDuration += offlineDuration; if (offlineDuration > _metrics.longestOfflineDuration) { _metrics.longestOfflineDuration = offlineDuration; } if (_wasOffline) { _notifySubscribers('reconnected', { offlineDuration, message: _config.reconnectedMessage }); if (_config.showOfflineIndicator) { _hideOfflineIndicator(); } } _wasOffline = false; _offlineSince = null; log.info('Connection restored', { offlineDuration }); }

function _handleOffline() { _isOnline = false; _wasOffline = true; _offlineSince = Date.now(); _metrics.offlineEvents++; _metrics.lastOfflineAt = Date.now(); _notifySubscribers('offline', { message: _config.offlineMessage }); if (_config.showOfflineIndicator) { _showOfflineIndicator(); } log.warn('Connection lost'); }

function _startConnectivityCheck() { _stopConnectivityCheck(); _checkTimer = setInterval(_checkConnectivity, _config.checkInterval); }

function _stopConnectivityCheck() { if (_checkTimer) { clearInterval(_checkTimer); _checkTimer = null; } }

function _checkConnectivity() { if (!_config.pingEndpoint) return Promise.resolve(); _metrics.reconnectAttempts++; const controller = new AbortController(); const timeout = setTimeout(() => { controller.abort(); }, 5000); return fetch(_config.pingEndpoint, { method: 'HEAD', cache: 'no-store', signal: controller.signal }).then(response => { clearTimeout(timeout); if (response.ok && !_isOnline) { _handleOnline(); } }).catch(() => { clearTimeout(timeout); if (_isOnline) { _handleOffline(); } }); }

function _showOfflineIndicator() { if (typeof document === 'undefined') return; if (_indicatorElement) return; _indicatorElement = document.createElement('div'); _indicatorElement.id = 'offline-indicator'; _indicatorElement.innerHTML = '<div style="position:fixed;top:0;left:0;right:0;background:linear-gradient(90deg,#f59e0b,#ef4444);color:white;padding:8px 16px;text-align:center;font-family:system-ui,sans-serif;font-size:14px;z-index:999999;display:flex;align-items:center;justify-content:center;gap:8px;animation:slideDown 0.3s ease-out"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg><span data-offline-msg></span></div><style>@keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}</style>'; const msgSpan = _indicatorElement.querySelector('[data-offline-msg]'); if (msgSpan) msgSpan.textContent = _config.offlineMessage; document.body.appendChild(_indicatorElement); }

function _hideOfflineIndicator() { if (_indicatorElement) { _indicatorElement.style.animation = 'slideUp 0.3s ease-out forwards'; setTimeout(() => { if (_indicatorElement && _indicatorElement.parentNode) { _indicatorElement.parentNode.removeChild(_indicatorElement); } _indicatorElement = null; }, 300); } }

// @ts-expect-error strict migration — TS2345
function _notifySubscribers(type: string, data?: Record<string, unknown>) { _subscribers.forEach((callback: (event: Record<string, unknown>) => void) => { try { callback({ type, data, timestamp: Date.now(), isOnline: _isOnline }); } catch (e) {} }); }

export function init(options?: Record<string, unknown>) { if (_initialized) return; _initPorts(); if (options) Object.assign(_config, options); if (hasWindow) { window.addEventListener('online', _handleOnline); window.addEventListener('offline', _handleOffline); _isOnline = navigator.onLine; if (!_isOnline) { _offlineSince = Date.now(); } } if (_config.checkInterval > 0) { _startConnectivityCheck(); } _initialized = true; log.info('Offline mode initialized', { isOnline: _isOnline }); }

export function destroy() { if (hasWindow) { window.removeEventListener('online', _handleOnline); window.removeEventListener('offline', _handleOffline); } _stopConnectivityCheck(); _initialized = false; }

export function checkNow() { return _checkConnectivity().then(() => _isOnline); }

export function canBootOffline() { return _config.allowOfflineBoot; }
export function getOfflineBootConfig() { return { allowed: _config.allowOfflineBoot, timeout: _config.offlineBootTimeout, cacheStrategy: _config.cacheStrategy }; }

export function waitForConnection(timeoutMs?: number) { if (!timeoutMs) timeoutMs = 30000; if (_isOnline) return Promise.resolve(true); return new Promise(resolve => { const timeout = setTimeout(() => { unsubscribe(); resolve(false); }, timeoutMs); const unsubscribe = subscribe((event: Record<string, unknown>) => { if (event.type === 'reconnected') { clearTimeout(timeout); unsubscribe(); resolve(true); } }); }); }

export function subscribe(callback: (event: Record<string, unknown>) => void) { _subscribers.add(callback); return () => { _subscribers.delete(callback); }; }

export function isOnline() { return _isOnline; }
export function isOffline() { return !_isOnline; }
export function wasOffline() { return _wasOffline; }
export function getOfflineDuration() { return _offlineSince ? Date.now() - _offlineSince : 0; }
export function getMetrics() { return Object.assign({}, _metrics); }

export function getStatus() { return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, isOnline: _isOnline, wasOffline: _wasOffline, offlineDuration: getOfflineDuration(), portsInitialized: Ports.isInitialized(), metrics: getMetrics() }; }

export function healthCheck() { const logger = _getPort('logger'); const checks = { initialized: _initialized, online: _isOnline, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: _isOnline ? 'HEALTHY' : 'OFFLINE', score: `${passed}/4`, moduleId: MODULE_ID, version: VERSION, checks, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

export function info() { return { version: VERSION, moduleId: MODULE_ID, features: ['offline-detection', 'indicator-ui', 'connectivity-check', 'offline-boot', 'metrics'], portsInitialized: Ports.isInitialized(), status: getStatus() }; }

export default { VERSION, MODULE_ID, init, destroy, isOnline, isOffline, wasOffline, getOfflineDuration, canBootOffline, getOfflineBootConfig, waitForConnection, checkNow, subscribe, getMetrics, getStatus, healthCheck, info, injectPorts, getPorts };
