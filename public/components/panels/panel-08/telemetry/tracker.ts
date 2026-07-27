// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-08.telemetry.tracker
// PURPOSE: Panel-08 Telemetry Tracker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   trackMountSuccess() — exported function
//   trackUnmount() — exported function
//   trackRefreshStart() — exported function
//   trackRefreshSuccess() — exported function
//   trackRefreshError() — exported function
//   trackAlertAcknowledged() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   TRACKER_EVENTS — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'panel-08.telemetry.tracker';
const VERSION = '9.3.0-P2-ENTERPRISE';
const NAMESPACE = 'panel-08';

// P18EC: Local event constants
const TRACKER_EVENTS = Object.freeze({
  MOUNT_SUCCESS: `telemetry:${NAMESPACE}:mount:success`,
  UNMOUNT: `telemetry:${NAMESPACE}:unmount`,
  REFRESH_START: `telemetry:${NAMESPACE}:refresh:start`,
  REFRESH_SUCCESS: `telemetry:${NAMESPACE}:refresh:success`,
  REFRESH_ERROR: `telemetry:${NAMESPACE}:refresh:error`,
  ALERT_ACKNOWLEDGED: `telemetry:${NAMESPACE}:alert:acknowledged`
});

const Ports = createPanelPorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const metrics = { eventsTracked: 0, refreshCount: 0, errors: 0, acknowledgeCount: 0, sessionStart: Date.now() };

const _emit = (event: string, data?: Record<string, unknown>) => { const eb = _getPort('eventBus') as { emit?: (...a: unknown[]) => void } | null; if (eb?.emit) { eb.emit(event, { ...(data || {}), source: MODULE_ID, timestamp: Date.now() }); } };

export const trackMountSuccess = (duration: number) => { metrics.eventsTracked++; _emit(TRACKER_EVENTS.MOUNT_SUCCESS, { duration }); };
export const trackUnmount = () => { metrics.eventsTracked++; _emit(TRACKER_EVENTS.UNMOUNT, { uptime: Date.now() - metrics.sessionStart }); };
export const trackRefreshStart = () => { metrics.eventsTracked++; metrics.refreshCount++; _emit(TRACKER_EVENTS.REFRESH_START, {}); };
export const trackRefreshSuccess = (alertCount: number, duration: number) => { metrics.eventsTracked++; _emit(TRACKER_EVENTS.REFRESH_SUCCESS, { alertCount, duration }); };
export const trackRefreshError = (error: Error | unknown) => { metrics.eventsTracked++; metrics.errors++; _emit(TRACKER_EVENTS.REFRESH_ERROR, { error: (error as Error)?.message || String(error) }); };
export const trackAlertAcknowledged = (alertId: number | string, alertType: string) => { metrics.eventsTracked++; metrics.acknowledgeCount++; _emit(TRACKER_EVENTS.ALERT_ACKNOWLEDGED, { alertId, alertType }); };

export const getMetrics = () => ({ ...metrics, uptime: Date.now() - metrics.sessionStart });

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() });

export { TRACKER_EVENTS, MODULE_ID, VERSION };
export default { trackMountSuccess, trackUnmount, trackRefreshStart, trackRefreshSuccess, trackRefreshError, trackAlertAcknowledged, getMetrics, info, healthCheck, TRACKER_EVENTS, MODULE_ID, VERSION, injectPorts, getPorts };
