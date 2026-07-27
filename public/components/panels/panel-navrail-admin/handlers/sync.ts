// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-navrail-admin/handlers/sync
// PURPOSE: NavRail Admin - Sync Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
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
import { createPanelPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-navrail-admin/handlers/sync';
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export class SyncHandler {
  [key: string]: any;
  constructor(options = {}) { this.options = options; this._syncing = false; this._metrics = { syncCount: 0, errorCount: 0, lastSyncAt: null }; }
  async sync(data: unknown) { if (this._syncing) return { ok: false, reason: 'already_syncing' }; this._syncing = true; this._metrics.syncCount++; this._metrics.lastSyncAt = Date.now(); try { _getPort('logger')?.debug(`[${MODULE_ID}] Syncing...`); return { ok: true, data }; } catch (e: any) { this._metrics.errorCount++; _getPort('logger')?.error(`[${MODULE_ID}] Sync error:`, e); return { ok: false, error: e.message }; } finally { this._syncing = false; } }
  isSyncing() { return this._syncing; }
  healthCheck() { return { status: 'healthy', syncing: this._syncing, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, syncing: this._syncing, metrics: this._metrics, portsInitialized: Ports.isInitialized() }; }
  getMetrics() { return { ...this._metrics }; }
}
export default SyncHandler;
