// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-feature-flags-admin/services/api
// PURPOSE: API Client - Panel Feature Flags Admin
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS from /core/runtime/events/catalog/auth.events.js
//   API_BASE, PANEL_ID from ../core/constants.js
//
// PROVIDES:
//   ApiClient — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
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
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { API_BASE, PANEL_ID } from '../core/constants.js';
const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-feature-flags-admin/services/api';
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
class ApiClient {
  [key: string]: any;
  constructor(logger: Record<string, unknown>) { this.logger = logger; this.activeController = null; _initPorts(); }
  async request(endpoint: string, options: Record<string, unknown> = {}) {
    const { method = 'GET', body, signal, timeout = 10000 } = options;
    const controller = signal ? null : new AbortController();
    const abortSignal = signal || controller?.signal;
    if (!signal) this.activeController = controller;
    const timeoutId = setTimeout(() => controller?.abort(), Number(timeout));
    const url = `${API_BASE}/${endpoint}`;
    try {
      const res = await fetch(url, { method: method as string, signal: abortSignal as AbortSignal, credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Panel-Id': PANEL_ID }, body: body ? JSON.stringify(body) : undefined });
      clearTimeout(timeoutId);
      if (res.status === 401) { this.logger?.warn?.('api.auth-expired'); _getPort('eventBus')?.emit?.(AUTH_EVENTS.SESSION_EXPIRED, { source: MODULE_ID }); return { success: false, error: 'HTTP_401', message: 'Sessão expirada' }; }
      if (res.status === 403) return { success: false, error: 'HTTP_403', message: 'Acesso negado' };
      if (!res.ok) return { success: false, error: `HTTP_${res.status}`, message: `Erro HTTP: ${res.status}` };
      const data = await res.json();
      if (data.ok === false) return { success: false, error: data.error || 'REQUEST_ERROR', message: data.message || 'Erro na requisição' };
      this.logger?.debug?.('api.request-success', { url });
      return { success: true, payload: data };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') return { success: false, error: 'REQUEST_ABORTED', message: 'Requisição cancelada' };
      this.logger?.error?.('api.request-error', { url, error: error.message });
      return { success: false, error: 'NETWORK_ERROR', message: error.message };
    } finally { if (controller) this.activeController = null; }
  }
  fetchFlags(options: Record<string, unknown>) { return this.request('?action=all', options); }
  toggleFlag(flagKey: string, options: Record<string, unknown>) { return this.request(`?action=toggle&flag=${encodeURIComponent(flagKey)}`, { method: 'PUT', ...options }); }
  createFlag(flagData: Record<string, unknown>, options: Record<string, unknown>) { return this.request('?action=create', { method: 'POST', body: flagData, ...options }); }
  updateFlag(flagKey: string, flagData: Record<string, unknown>, options: Record<string, unknown>) { return this.request(`?action=update&flag=${encodeURIComponent(flagKey)}`, { method: 'PUT', body: flagData, ...options }); }
  deleteFlag(flagKey: string, options: Record<string, unknown>) { return this.request(`?action=delete&flag=${encodeURIComponent(flagKey)}`, { method: 'DELETE', ...options }); }
  cancel() { this.activeController?.abort(); this.activeController = null; }
}
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized });
const healthCheck = () => ({ status: Ports.snapshot()._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { apiReady: true, portsInitialized: Ports.snapshot()._initialized } });
export { ApiClient, VERSION, MODULE_ID, info, healthCheck, injectPorts, getPorts };
export default ApiClient;
