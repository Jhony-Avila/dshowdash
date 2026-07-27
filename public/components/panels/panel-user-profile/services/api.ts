// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-user-profile/services/api
// PURPOSE: User Profile - API Service
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
export const MODULE_ID = 'panels/panel-user-profile/services/api';
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export class ApiService {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) { this.baseUrl = options.baseUrl || '/api/user/profile'; this._metrics = { requestCount: 0, errorCount: 0, lastRequestAt: null }; }
  async fetch(endpoint: string, options: Record<string, unknown> = {}) { this._metrics.requestCount++; this._metrics.lastRequestAt = Date.now(); try { const url = `${this.baseUrl}${endpoint}`; const response = await fetch(url, { ...(options as Record<string, unknown>), headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return await response.json(); } catch (e) { this._metrics.errorCount++; _getPort('logger')?.error(`[${MODULE_ID}] API error:`, e); throw e; } }
  async get() { return this.fetch('/'); }
  async update(data: Record<string, unknown>) { return this.fetch('/', { method: 'PUT', body: JSON.stringify(data) }); }
  healthCheck() { return { status: 'healthy', portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, baseUrl: this.baseUrl, metrics: this._metrics, portsInitialized: Ports.isInitialized() }; }
  getMetrics() { return { ...this._metrics }; }
}
export default ApiService;
