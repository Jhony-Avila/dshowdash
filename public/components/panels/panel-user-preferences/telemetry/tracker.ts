// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences.telemetry.tracker
// PURPOSE: Panel User Preferences - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   tracker — exported value
//   track() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
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

const MODULE_ID = 'panel-user-preferences.telemetry.tracker';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const metrics = { eventsTracked: 0, lastEventAt: null as number | null, errors: 0, sessionStart: Date.now() };

const track = (event: string, data: Record<string, unknown> = {}) => {
  const timestamp = Date.now();
  const payload = { component: MODULE_ID, event, timestamp, sessionDuration: timestamp - metrics.sessionStart, ...data };
  metrics.eventsTracked++;
  metrics.lastEventAt = timestamp;
  const core = _getPort('telemetryCore');
  if (core?.track) { try { core.track(`${MODULE_ID}:${event}`, payload); } catch (e) { metrics.errors++; } }
  return payload;
};

const tracker = {
  mounted: (context: Record<string, unknown>) => track('mounted', { context: context || {}, status: 'success' }),
  unmounted: (reason: string) => track('unmounted', { reason: reason || 'normal', sessionDuration: Date.now() - metrics.sessionStart }),
  mountBlocked: (reason: string) => track('mount_blocked', { reason, status: 'blocked' }),
  authRequired: (source: string) => track('auth_required', { source: source || 'unknown', status: 'unauthenticated' }),
  authExpired: () => track('auth_expired', { status: 'expired' }),
  authSuccess: (source: string) => track('auth_success', { source }),
  refreshSuccess: (duration: number, source: string) => track('refresh_success', { duration, source: source || 'manual', status: 'success' }),
  refreshError: (error: Error | unknown, duration: number) => { metrics.errors++; return track('refresh_error', { error: (error as Error)?.message ?? String(error), duration, status: 'error' }); },
  refreshSkipped: (reason: string) => track('refresh_skipped', { reason }),
  preferenceSaved: (key: string, value: unknown) => track('preference_saved', { key, valueType: typeof value, status: 'success' }),
  preferenceError: (key: string, error: Error | unknown) => { metrics.errors++; return track('preference_error', { key, error: (error as Error)?.message ?? String(error), status: 'error' }); },
  layoutSaved: (key: string, isDefault: boolean) => track('layout_saved', { key, isDefault, status: 'success' }),
  layoutDeleted: (key: string) => track('layout_deleted', { key, status: 'success' }),
  layoutApplied: (key: string) => track('layout_applied', { key, status: 'success' }),
  layoutError: (action: string, error: Error | unknown) => { metrics.errors++; return track('layout_error', { action, error: (error as Error)?.message ?? String(error), status: 'error' }); },
  viewApplied: (viewId: string) => track('view_applied', { viewId, status: 'success' }),
  viewDeleted: (viewId: string) => track('view_deleted', { viewId, status: 'success' }),
  viewError: (action: string, error: Error | unknown) => { metrics.errors++; return track('view_error', { action, error: (error as Error)?.message ?? String(error), status: 'error' }); },
  exportDone: (itemCount: number) => track('export_done', { itemCount, status: 'success' }),
  importDone: (itemCount: number) => track('import_done', { itemCount, status: 'success' }),
  importError: (error: Error | unknown) => { metrics.errors++; return track('import_error', { error: (error as Error)?.message ?? String(error), status: 'error' }); },
  themeChanged: (theme: string) => track('theme_changed', { theme }),
  panelToggled: (panelId: string, visible: boolean) => track('panel_toggled', { panelId, visible }),
  healthCheck: () => { const core = _getPort('telemetryCore'); return { healthy: true, coreAvailable: !!core, portsInitialized: Ports.isInitialized(), metrics: { ...metrics }, sessionDuration: Date.now() - metrics.sessionStart, p22Compliant: true, timestamp: Date.now() }; },
  info: () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), p22Compliant: true, metrics: { ...metrics }, coreAvailable: !!_getPort('telemetryCore') }),
  reset: () => { metrics.eventsTracked = 0; metrics.lastEventAt = null; metrics.errors = 0; metrics.sessionStart = Date.now(); },
  track, injectPorts, getPorts
};

export default tracker;
export { tracker, track, VERSION, MODULE_ID };

// Alias export: consumers import { Tracker } from this module
export const Tracker = tracker;
