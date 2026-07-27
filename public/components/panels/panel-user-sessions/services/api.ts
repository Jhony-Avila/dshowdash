// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-user-sessions/services/api
// PURPOSE: User Sessions - API Service
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
export const MODULE_ID = 'panels/panel-user-sessions/services/api';
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export class ApiService {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) { this.baseUrl = options.baseUrl || '/api/user/sessions'; this._metrics = { requestCount: 0, errorCount: 0, lastRequestAt: null }; }
  async fetch(endpoint: string, options: Record<string, unknown> = {}) { this._metrics.requestCount++; this._metrics.lastRequestAt = Date.now(); try { const url = `${this.baseUrl}${endpoint}`; const response = await fetch(url, { ...(options as Record<string, unknown>), headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return await response.json(); } catch (e) { this._metrics.errorCount++; _getPort('logger')?.error(`[${MODULE_ID}] API error:`, e); throw e; } }
  async getAll() { return this.fetch('/'); }
  async revoke(id: string) { return this.fetch(`/${id}`, { method: 'DELETE' }); }
  async revokeAll() { return this.fetch('/all', { method: 'DELETE' }); }
  healthCheck() { return { status: 'healthy', portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, baseUrl: this.baseUrl, metrics: this._metrics, portsInitialized: Ports.isInitialized() }; }
  getMetrics() { return { ...this._metrics }; }
}
export default ApiService;
