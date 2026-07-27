// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.6.1-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar._shared.base-feature
// PURPOSE: P18EC-REVIEWED: Uses internal this._emit() class method with dynamic event name (not global EventBus hardcoded)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.6.1-P18EC';
export const MODULE_ID = 'sidebar._shared.base-feature';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export class BaseFeature {
  [key: string]: any;
  constructor(config: { moduleId?: string; version?: string } = {}) { this.moduleId = config.moduleId || 'base-feature'; this.version = config.version || VERSION; this._initialized = false; this._enabled = true; this._eventBus = null; this._container = null; this._cleanups = []; this._metrics = { calls: 0, errors: 0, lastCall: null }; }
  init(eventBus: DynObj, container: HTMLElement) { if (this._initialized) return this; this._eventBus = eventBus; this._container = container; this._initialized = true; this._emit('init'); return this; }
  destroy() { this._cleanups.forEach((fn: DynObj) => { try { fn(); } catch (e) { _getPort('logger')?.warn?.(`[${this.moduleId}] cleanup error:`, e); } }); this._cleanups = []; this._initialized = false; this._emit('destroy'); }
  enable() { this._enabled = true; this._emit('enabled'); return this; }
  disable() { this._enabled = false; this._emit('disabled'); return this; }
  isEnabled() { return this._enabled; }
  addCleanup(fn: DynObj) { if (typeof fn === 'function') this._cleanups.push(fn); }
  _emit(event: string, data: DynObj = {}) { this._eventBus?.emit?.(`sidebar:${this.moduleId}:${event}`, { moduleId: this.moduleId, timestamp: Date.now(), ...data }); }
  _track(action: string) { this._metrics.calls++; this._metrics.lastCall = Date.now(); }
  getMetrics() { return { ...this._metrics, cleanups: this._cleanups.length }; }
  healthCheck() { return { status: this._initialized && this._enabled ? 'HEALTHY' : 'DEGRADED', version: this.version, moduleId: this.moduleId, checks: { initialized: this._initialized, enabled: this._enabled, hasEventBus: !!this._eventBus, hasContainer: !!this._container, cleanups: this._cleanups.length, portsInitialized: Ports.isInitialized() }, metrics: this.getMetrics() }; }
  info() { return { moduleId: this.moduleId, version: this.version, initialized: this._initialized, enabled: this._enabled, metrics: this.getMetrics() }; }
}
export function getMetrics() { return { classAvailable: true }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { classAvailable: true, portsInitialized: Ports.isInitialized() }, metrics: getMetrics() }; }
export default BaseFeature;
