// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header.components._base.component-factory
// PURPOSE: Component Factory - Base Helper (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createComponent() — exported function
//   setDebug() — exported function
//   getLogs() — exported function
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
export const VERSION = '5.4.0-ES6';
export const MODULE_ID = 'header.components._base.component-factory';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now(), moduleId: MODULE_ID }); if (_logBuffer.length > 50) _logBuffer.shift(); }
// @ts-expect-error strict migration — TS7005
export class BaseComponent { [key: string]: any; constructor(options: { container?: HTMLElement | null; logger?: Record<string, unknown> | null; telemetry?: Record<string, unknown> | null; eventBus?: Record<string, unknown> | null; config?: Record<string, unknown> } = {}) { this.container = options.container || null; this.logger = options.logger || null; this.telemetry = options.telemetry || null; this.eventBus = options.eventBus || _getPort('eventBus'); this.config = options.config || {}; this.mounted = false; this.element = null; this.cleanups = []; this._debug = false; this._metrics = { mountCount: 0, unmountCount: 0, cleanupCount: 0, lastMountAt: null, lastUnmountAt: null }; } _log(level: string, ...args: unknown[]) { if (!this._debug && level === 'debug') return; _log(level, ...args); } mount(container: HTMLElement|null) { if (this.mounted) { this._log('warn', `[${this.constructor.name}] Already mounted`); return this; } this.container = container || this.container; if (!this.container) throw new Error(`[${this.constructor.name}] Container required`); this.mounted = true; this._metrics.mountCount++; this._metrics.lastMountAt = Date.now(); this._log('debug', `[${this.constructor.name}] Mounted`); return this; } unmount() { if (!this.mounted) return; this.cleanups.forEach((fn: Function) => { try { fn(); this._metrics.cleanupCount++; } catch (e) { this._log('error', 'Cleanup error:', e); } }); this.cleanups = []; if (this.element) { this.element.remove(); this.element = null; } this.mounted = false; this._metrics.unmountCount++; this._metrics.lastUnmountAt = Date.now(); this._log('debug', `[${this.constructor.name}] Unmounted`); } destroy() { this.unmount(); this.container = null; this.logger = null; this.telemetry = null; this.eventBus = null; this._log('debug', `[${this.constructor.name}] Destroyed`); } addCleanup(fn: Function) { if (typeof fn === 'function') this.cleanups.push(fn); } getState() { return { mounted: this.mounted, cleanupsPending: this.cleanups.length }; } healthCheck() { const ps = Ports.snapshot(); const checks = { hasContainer: !!this.container || !this.mounted, isMounted: this.mounted, noOrphanCleanups: this.cleanups.length < 50, portsInitialized: ps._initialized }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, componentName: this.constructor.name, timestamp: new Date().toISOString() }; } info() { const ps = Ports.snapshot(); return { version: VERSION, moduleId: MODULE_ID, componentName: this.constructor.name, state: this.getState(), metrics: this._metrics, portsInitialized: ps._initialized, healthCheck: this.healthCheck() }; } setDebug(enabled: boolean) { this._debug = !!enabled; } resetMetrics() { this._metrics = { mountCount: 0, unmountCount: 0, cleanupCount: 0, lastMountAt: null, lastUnmountAt: null }; } getMetrics() { return { ...this._metrics }; } static getLogs() { return [..._logBuffer]; } }
// @ts-expect-error TS migration - TS2351
export function createComponent(ComponentClass: string, options: Record<string,unknown>) { return new ComponentClass(options); }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default BaseComponent;
