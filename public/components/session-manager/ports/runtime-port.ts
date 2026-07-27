// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.0.0-BULLETPROOF)
// ═══════════════════════════════════════════════════════════════
// MODULE: session-runtime-port
// PURPOSE: Session Manager - Runtime Port
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   RuntimePort — exported value
//   addEventListener() — exported function
//   removeEventListener() — exported function
//   setInterval() — exported function
//   clearInterval() — exported function
//   setTimeout() — exported function
//   clearTimeout() — exported function
//   getWindow() — exported function
//   getDocument() — exported function
//   isOnline() — exported function
//   getLocation() — exported function
//   getUserAgent() — exported function
//   cleanup() — exported function
//   useMemoryAdapter() — exported function
//   useBrowserAdapter() — exported function
//   getAdapterType() — exported function
//   getVersion() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '5.0.0-BULLETPROOF';
export const MODULE_ID = 'session-runtime-port';

const _metrics = { eventListeners: 0, eventRemovals: 0, timersCreated: 0, timersCleared: 0, errors: 0 };
const _activeListeners = new Map();
const _activeTimers = new Set();

function _isWindowAvailable() { return typeof window !== 'undefined'; }
function _isDocumentAvailable() { return typeof document !== 'undefined'; }

const _browserAdapter = {
  addEventListener(target: unknown, event: string, handler: (...args: unknown[]) => void, options: Record<string, unknown> = {}) { _metrics.eventListeners++; try { const el: any = target === 'document' ? document : target === 'window' ? window : target; if (!el?.addEventListener) return null; el.addEventListener(event, handler, options); const id = `${target}-${event}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; _activeListeners.set(id, { target: el, event, handler, options }); return id; } catch (e) { _metrics.errors++; return null; } },
  removeEventListener(listenerId: unknown) { _metrics.eventRemovals++; try { const listener = _activeListeners.get(listenerId); if (!listener) return false; listener.target.removeEventListener(listener.event, listener.handler); _activeListeners.delete(listenerId); return true; } catch (e) { _metrics.errors++; return false; } },
  setInterval(callback: () => void, ms: number): ReturnType<typeof globalThis.setInterval> | null { _metrics.timersCreated++; try { const id: ReturnType<typeof globalThis.setInterval> = globalThis.setInterval(callback, ms); _activeTimers.add(id); return id; } catch (e) { _metrics.errors++; return null; } },
  clearInterval(id: unknown) { _metrics.timersCleared++; try { globalThis.clearInterval(id as ReturnType<typeof globalThis.setInterval>); _activeTimers.delete(id); return true; } catch (e) { _metrics.errors++; return false; } },
  setTimeout(callback: () => void, ms: number): ReturnType<typeof globalThis.setTimeout> | null { _metrics.timersCreated++; try { let timerId: ReturnType<typeof globalThis.setTimeout>; timerId = globalThis.setTimeout(() => { _activeTimers.delete(timerId); callback(); }, ms); _activeTimers.add(timerId); return timerId; } catch (e) { _metrics.errors++; return null; } },
  clearTimeout(id: unknown) { _metrics.timersCleared++; try { globalThis.clearTimeout(id as ReturnType<typeof globalThis.setTimeout>); _activeTimers.delete(id); return true; } catch (e) { _metrics.errors++; return false; } },
  getWindow(): Window | null { return window; },
  getDocument(): Document | null { return document; },
  isOnline() { return (navigator as any)?.onLine ?? true; },
  getLocation() { return (window as any)?.location ?? null; },
  getUserAgent() { return (navigator as any)?.userAgent ?? null; }
};

const _memoryListeners = new Map();
let _memoryTimerCounter = 0;
const _memoryTimerCallbacks = new Map();

const _memoryAdapter = {
  addEventListener(target: unknown, event: string, handler: (...args: unknown[]) => void, options: Record<string, unknown> = {}) { _metrics.eventListeners++; const id = `mem-${target}-${event}-${++_memoryTimerCounter}`; _memoryListeners.set(id, { target, event, handler, options }); return id; },
  removeEventListener(listenerId: unknown) { _metrics.eventRemovals++; return _memoryListeners.delete(listenerId); },
  setInterval(callback: () => void, ms: number) { _metrics.timersCreated++; const id = ++_memoryTimerCounter; _memoryTimerCallbacks.set(id, { callback, ms, type: 'interval' }); return id; },
  clearInterval(id: unknown) { _metrics.timersCleared++; return _memoryTimerCallbacks.delete(id); },
  setTimeout(callback: () => void, ms: number) { _metrics.timersCreated++; const id = ++_memoryTimerCounter; _memoryTimerCallbacks.set(id, { callback, ms, type: 'timeout' }); return id; },
  clearTimeout(id: unknown) { _metrics.timersCleared++; return _memoryTimerCallbacks.delete(id); },
  getWindow(): Window | null { return null; },
  getDocument(): Document | null { return null; },
  isOnline() { return true; },
  getLocation() { return { href: 'http://localhost', pathname: '/', hostname: 'localhost' }; },
  getUserAgent() { return 'SSR/Test'; },
  triggerEvent(target: unknown, event: string, data: Record<string, unknown> = {}) { _memoryListeners.forEach((listener: Record<string, unknown>) => { if (listener.target === target && listener.event === event) { try { (listener.handler as (...args: unknown[]) => void)(data); } catch {} } }); },
  triggerTimer(id: unknown) { const timer = _memoryTimerCallbacks.get(id); if (timer) { try { timer.callback(); } catch {} if (timer.type === 'timeout') _memoryTimerCallbacks.delete(id); } }
};

type RuntimeAdapter = typeof _browserAdapter | typeof _memoryAdapter;
let _activeAdapter: RuntimeAdapter = _isWindowAvailable() ? _browserAdapter : _memoryAdapter;
let _adapterType = _isWindowAvailable() ? 'browser' : 'memory';

function addEventListener(target: unknown, event: string, handler: (...args: unknown[]) => void, options: Record<string, unknown> = {}) { return _activeAdapter.addEventListener(target, event, handler, options); }
function removeEventListener(listenerId: unknown) { return _activeAdapter.removeEventListener(listenerId); }
function setInterval(callback: () => void, ms: number) { return _activeAdapter.setInterval(callback, ms); }
function clearInterval(id: unknown) { return _activeAdapter.clearInterval(id); }
function setTimeout(callback: () => void, ms: number) { return _activeAdapter.setTimeout(callback, ms); }
function clearTimeout(id: unknown) { return _activeAdapter.clearTimeout(id); }
function getWindow() { return _activeAdapter.getWindow(); }
function getDocument() { return _activeAdapter.getDocument(); }
function isOnline() { return _activeAdapter.isOnline(); }
function getLocation() { return _activeAdapter.getLocation(); }
function getUserAgent() { return _activeAdapter.getUserAgent(); }

function cleanup() { _activeListeners.forEach((_: unknown, id: unknown) => removeEventListener(id)); _activeTimers.forEach((id: unknown) => { clearInterval(id); clearTimeout(id); }); _activeListeners.clear(); _activeTimers.clear(); }
function useMemoryAdapter() { cleanup(); _activeAdapter = _memoryAdapter; _adapterType = 'memory'; }
function useBrowserAdapter() { if (_isWindowAvailable()) { _activeAdapter = _browserAdapter; _adapterType = 'browser'; return true; } return false; }
function getAdapterType() { return _adapterType; }
function getVersion() { return VERSION; }
function getMetrics() { return { ..._metrics, adapterType: _adapterType, activeListeners: _activeListeners.size, activeTimers: _activeTimers.size }; }

function info() { return { moduleId: MODULE_ID, version: VERSION, adapterType: _adapterType, windowAvailable: _isWindowAvailable(), documentAvailable: _isDocumentAvailable(), activeListeners: _activeListeners.size, activeTimers: _activeTimers.size, isOnline: isOnline(), metrics: getMetrics(), timestamp: Date.now() }; }

function healthCheck() { const checks = { adapterActive: !!_activeAdapter, noLeakedListeners: _activeListeners.size < 100, noLeakedTimers: _activeTimers.size < 50, lowErrorRate: _metrics.eventListeners + _metrics.timersCreated === 0 || (_metrics.errors / (_metrics.eventListeners + _metrics.timersCreated)) < 0.1 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, adapterType: _adapterType, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

export const RuntimePort = { addEventListener, removeEventListener, setInterval, clearInterval, setTimeout, clearTimeout, getWindow, getDocument, isOnline, getLocation, getUserAgent, cleanup, useMemoryAdapter, useBrowserAdapter, getAdapterType, getVersion, getMetrics, info, healthCheck };
export { addEventListener, removeEventListener, setInterval, clearInterval, setTimeout, clearTimeout, getWindow, getDocument, isOnline, getLocation, getUserAgent, cleanup, useMemoryAdapter, useBrowserAdapter, getAdapterType, getVersion, getMetrics, info, healthCheck };
export default RuntimePort;
