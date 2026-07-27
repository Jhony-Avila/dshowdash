// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-navrail-admin/handlers/ui-actions
// PURPOSE: NavRail Admin - UI Actions Handler
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
export const MODULE_ID = 'panels/panel-navrail-admin/handlers/ui-actions';
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export class UIActionsHandler {
  [key: string]: any;
  constructor(options = {}) { this.options = options; this._actions = new Map(); this._metrics = { actionCount: 0, errorCount: 0, lastActionAt: null }; }
  register(name: string, handler: (payload: unknown) => unknown) { this._actions.set(name, handler); }
  unregister(name: string) { this._actions.delete(name); }
  async execute(name: string, payload: unknown) { const handler = this._actions.get(name); if (!handler) { _getPort('logger')?.warn(`[${MODULE_ID}] Action not found: ${name}`); return { ok: false, reason: 'not_found' }; } this._metrics.actionCount++; this._metrics.lastActionAt = Date.now(); try { const result = await handler(payload); return { ok: true, result }; } catch (e: any) { this._metrics.errorCount++; _getPort('logger')?.error(`[${MODULE_ID}] Action error:`, e); return { ok: false, error: e.message }; } }
  healthCheck() { return { status: 'healthy', actionCount: this._actions.size, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, registeredActions: Array.from(this._actions.keys()), metrics: this._metrics, portsInitialized: Ports.isInitialized() }; }
  getMetrics() { return { ...this._metrics }; }
}
export default UIActionsHandler;
