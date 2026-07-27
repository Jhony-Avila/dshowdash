// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: telemetry-helper
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   track() — exported function
//   trackMetricFetch() — exported function
//   trackHealthCheck() — exported function
//   trackRefresh() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).TelemetryService
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-health-dashboard.telemetry-helper';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Health Dashboard - Telemetry Helper
 * @module panel-health-dashboard/telemetry-helper
 * @version 1.1.0-AAA
 */

const PANEL_NAME = 'panel-health-dashboard';

export function track(eventName: string, data: Record<string, unknown> = {}) {
    const payload = {
        panel: PANEL_NAME,
        event: eventName,
        timestamp: Date.now(),
        ...data
    };
    
    if ((window as any).TelemetryService?.track) {
        (window as any).TelemetryService.track(payload);
    }
}

export function trackMetricFetch(metricName: string, duration: number) {
    track('metric_fetch', { metricName, duration });
}

export function trackHealthCheck(status: string, details: Record<string, unknown> = {}) {
    track('health_check', { status, ...details });
}

export function trackRefresh(success: boolean, duration: number) {
    track('refresh', { success, duration });
}

// ── Alias exports (compatibility) ──────────────────────────────
/**
 * createTelemetry — factory alias used by consumers that import { createTelemetry }.
 * Returns a telemetry-like object optionally scoped to a namespace.
 */
export function createTelemetry(namespace?: string) {
    const scope = namespace || PANEL_NAME;
    return {
        track: (eventName: string, data: Record<string, unknown> = {}) =>
            track(eventName, { scope, ...data }),
        trackMetricFetch: (metricName: string, duration: number) =>
            trackMetricFetch(metricName, duration),
        trackHealthCheck: (status: string, details: Record<string, unknown> = {}) =>
            trackHealthCheck(status, details),
        trackRefresh: (success: boolean, duration: number) =>
            trackRefresh(success, duration)
    };
}

export default { track, trackMetricFetch, trackHealthCheck, trackRefresh, createTelemetry };
