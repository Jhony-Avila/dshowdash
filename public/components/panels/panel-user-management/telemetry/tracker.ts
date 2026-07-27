// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-management
// PURPOSE: Panel User Management - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createTelemetryPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   tracker — exported value
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

import { createTelemetryPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-user-management.telemetry.tracker';

const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
const getPorts = () => Ports.snapshot();

class TelemetryTracker {
  panelId: string;
  sessionId: string;
  telemetryCore: { track?: (...args: unknown[]) => void } | null;
  metrics: { events: number; errors: number; loads: number; searches: number; userViews: number; userUpdates: number; roleChanges: number; sessionTerminations: number; startTime: number };

  constructor(_options: Record<string, unknown> = {}) {
    this.panelId = MODULE_ID;
    this.sessionId = this._generateSessionId();
    this.telemetryCore = null;
    this.metrics = { events: 0, errors: 0, loads: 0, searches: 0, userViews: 0, userUpdates: 0, roleChanges: 0, sessionTerminations: 0, startTime: Date.now() };
    _initPorts();
  }

  _generateSessionId() { return `${MODULE_ID}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }
  _init() { if (this.telemetryCore) return; try { const tc = _getPort('telemetryCore'); if (tc?.track) this.telemetryCore = tc; } catch (e) {} }
  _buildPayload(eventName: string, data: Record<string, unknown> = {}) { return { moduleId: this.panelId, sessionId: this.sessionId, event: eventName, timestamp: Date.now(), uptime: Date.now() - this.metrics.startTime, ...data }; }
  track(eventName: string, data?: Record<string, unknown>) { this._init(); this.metrics.events++; const payload = this._buildPayload(eventName, data); try { if (this.telemetryCore?.track) this.telemetryCore.track(`${this.panelId}:${eventName}`, payload); } catch (e) {} return payload; }

  trackInit(status: string, data?: Record<string, unknown>) { const event = status === 'start' ? 'init:start' : status === 'complete' ? 'init:complete' : 'init:error'; return this.track(event, data || {}); }
  trackMount() { return this.track('mounted', { metrics: { ...this.metrics } }); }
  trackUnmount() { return this.track('unmounted', { metrics: { ...this.metrics }, duration: Date.now() - this.metrics.startTime }); }
  trackLoadStart() { this.metrics.loads++; return this.track('load:start'); }
  trackLoadSuccess(usersCount: number, rolesCount: number) { return this.track('load:success', { usersCount, rolesCount: rolesCount || 0 }); }
  trackLoadError(error: { message?: string; status?: number; code?: string } | unknown) { this.metrics.errors++; const e = error as { message?: string; status?: number; code?: string }; return this.track('load:error', { error: e?.message || String(error), errorCode: e?.status || e?.code }); }
  trackSearch(filters: Record<string, unknown>, resultsCount: number) { this.metrics.searches++; return this.track('search', { filters: this._sanitizeFilters(filters), resultsCount }); }
  trackFilterChanged(filters: Record<string, unknown>) { return this.track('filter:changed', { filters: this._sanitizeFilters(filters) }); }
  trackPaginationChanged(page: number, pageSize: number) { return this.track('pagination:changed', { page, pageSize }); }
  trackUserSelected(userId: string | number, source: string) { this.metrics.userViews++; return this.track('user:selected', { userId, source: source || 'grid' }); }
  trackUserUpdated(userId: string | number, fieldsChanged: string[] = []) { this.metrics.userUpdates++; return this.track('user:updated', { userId, fieldsChanged, fieldsCount: fieldsChanged.length }); }
  trackUserCreated(userId: string | number) { return this.track('user:created', { userId }); }
  trackRoleChanged(userId: string | number, fromRole: string, toRole: string) { this.metrics.roleChanges++; return this.track('role:changed', { userId, fromRole: this._sanitizeRole(fromRole), toRole: this._sanitizeRole(toRole) }); }
  trackSessionTerminated(sessionId: string | number, userId: string | number | null) { this.metrics.sessionTerminations++; return this.track('session:terminated', { sessionId, userId }); }
  trackPasswordReset(userId: string | number) { return this.track('password:reset', { userId }); }
  trackAccessDenied(action: string, reason: string) { return this.track('access:denied', { action, reason }); }
  trackAuthRequired(action: string) { return this.track('auth:required', { action }); }
  trackUserDeleted(userId: string | number) { return this.track('user:deleted', { userId }); }
  trackExport(format: string, count: number) { return this.track('export', { format, count }); }
  trackBulkAction(type: string, count: number, status: string) { return this.track('bulk:action', { type, count, status }); }

  _sanitizeFilters(filters: Record<string, unknown>) { if (!filters) return {}; return { hasSearch: !!filters.search, searchLength: filters.search ? String(filters.search).length : 0, status: filters.status || '', role: filters.role || '', limit: filters.limit, offset: filters.offset }; }
  _sanitizeRole(role: string | { name?: string; id?: string } | null) { if (!role) return null; if (typeof role === 'string') return role; return role.name || role.id || 'unknown'; }
  getMetrics() { return { ...this.metrics, uptime: Date.now() - this.metrics.startTime, errorRate: this.metrics.loads > 0 ? (this.metrics.errors / this.metrics.loads) : 0 }; }
  resetMetrics() { this.metrics = { events: 0, errors: 0, loads: 0, searches: 0, userViews: 0, userUpdates: 0, roleChanges: 0, sessionTerminations: 0, startTime: Date.now() }; }

  healthCheck() { const ps = Ports.snapshot(); const m = this.getMetrics(); const checks: Record<string, boolean> = { lowErrorRate: m.errorRate < 0.3, hasActivity: m.events > 0, recentActivity: m.uptime < 3600000, portsInitialized: ps._initialized, hasTelemetryCore: !!this.telemetryCore }; let passed = 0; for (const k in checks) { if (Object.prototype.hasOwnProperty.call(checks, k) && checks[k]) passed++; } return { status: passed === 5 ? 'healthy' : passed >= 3 ? 'degraded' : 'unhealthy', score: passed, maxScore: 5, checks, metrics: m }; }
  info() { const ps = Ports.snapshot(); return { version: VERSION, moduleId: MODULE_ID, sessionId: this.sessionId, portsInitialized: ps._initialized, hasTelemetryCore: !!this.telemetryCore, metrics: this.getMetrics(), healthCheck: this.healthCheck() }; }
}

// Also export the class as Tracker for index.ts compatibility
export { TelemetryTracker as Tracker };

const tracker = new TelemetryTracker();
export { tracker, VERSION, MODULE_ID, injectPorts, getPorts };
export default tracker;
