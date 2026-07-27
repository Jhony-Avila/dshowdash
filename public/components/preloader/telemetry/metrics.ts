// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader.telemetry.metrics
// PURPOSE: Preloader Metrics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createMetrics() — exported function
//   healthCheck() — exported function
//   PreloaderMetrics — exported class
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
import { createCorePorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.1.0-P17WI';
export const MODULE_ID = 'preloader.telemetry.metrics';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
class PreloaderMetrics { _metrics!: { initCount: number; mountCount: number; hideCount: number; cleanupCount: number; lastInitAt: number | null; lastMountAt: number | null; lastHideAt: number | null; lastCleanupAt: number | null }; constructor() { this.reset(); } reset() { this._metrics = { initCount: 0, mountCount: 0, hideCount: 0, cleanupCount: 0, lastInitAt: null, lastMountAt: null, lastHideAt: null, lastCleanupAt: null }; } recordInit() { this._metrics.initCount++; this._metrics.lastInitAt = Date.now(); } recordMount() { this._metrics.mountCount++; this._metrics.lastMountAt = Date.now(); } recordHide() { this._metrics.hideCount++; this._metrics.lastHideAt = Date.now(); } recordCleanup() { this._metrics.cleanupCount++; this._metrics.lastCleanupAt = Date.now(); } get() { return { ...this._metrics }; } getStatus() { return { ...this._metrics, uptime: this._metrics.lastInitAt ? Date.now() - this._metrics.lastInitAt : 0 }; } }
export function createMetrics() { return new PreloaderMetrics(); }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
export { PreloaderMetrics };
export default { VERSION, MODULE_ID, createMetrics, PreloaderMetrics, healthCheck, injectPorts, getPorts };
