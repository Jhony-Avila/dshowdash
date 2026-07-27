// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.accessibility.announce
// PURPOSE: Ticker Announce Manager (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
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
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '5.4.0-P17WI';
export const MODULE_ID = 'ticker.accessibility.announce';
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug ?? false; };
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args); };
export class AnnounceManager {
  liveRegion: HTMLElement | null; _metrics: { mountCount: number; announceCount: number; lastAnnounceAt: number | null };
  constructor() { this.liveRegion = null; this._metrics = { mountCount: 0, announceCount: 0, lastAnnounceAt: null }; }
  mount(container: unknown) { this.liveRegion = (container as HTMLElement).querySelector('[aria-live]'); this._metrics.mountCount++; _log('debug', 'AnnounceManager mounted'); }
  announce(message: string) { if (this.liveRegion) { this.liveRegion.setAttribute('aria-label', message); this._metrics.announceCount++; this._metrics.lastAnnounceAt = Date.now(); _log('debug', 'Announced:', message); } }
  unmount() { this.liveRegion = null; _log('debug', 'AnnounceManager unmounted'); }
  healthCheck() { const logger = _getPort('logger'); const checks = { ready: true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, hasLiveRegion: !!this.liveRegion, metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { mountCount: 0, announceCount: 0, lastAnnounceAt: null }; }
}
export function getVersion() { return VERSION; }
export default AnnounceManager;
