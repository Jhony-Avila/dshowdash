// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.7.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-status.telemetry
// PURPOSE: Panel Status - Telemetry Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   info() — exported function
//   healthCheck() — exported function
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
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-status.telemetry';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export class StatusTracker {
  [key: string]: any;
    constructor(panelId: string, options: Record<string, unknown> = {}) {
        this.panelId = panelId;
        this.initialized = false;
        this.telemetryCore = null;
        this.metrics = { refreshes: 0, errors: 0, statusChanges: 0 };
        this.sessionStart = Date.now();
        _initPorts();
    }

    init() { if (this.initialized) return this; try { const telemetry = _getPort('telemetry'); if (telemetry) this.telemetryCore = telemetry; } catch (e) {} this.initialized = true; return this; }

    track(event: string, data: Record<string, unknown> = {}) {
        if (!this.initialized) this.init();
        const payload = { event: `panel.${this.panelId}.${event}`, panelId: this.panelId, timestamp: Date.now(), source: MODULE_ID, ...data };
        if (this.telemetryCore?.track) this.telemetryCore.track(payload.event, payload);
        return payload;
    }

    trackRefresh(duration: number, statusCount: number) { this.metrics.refreshes++; return this.track(LIFECYCLE_EVENTS.REFRESH, { duration, statusCount }); }
    trackStatusChange(statusId: string, oldLevel: string, newLevel: string) { this.metrics.statusChanges++; return this.track(LIFECYCLE_EVENTS.STATE_CHANGED, { statusId, oldLevel, newLevel }); }
    trackError(error: unknown, context: Record<string, unknown>) { this.metrics.errors++; return this.track(LIFECYCLE_EVENTS.ERROR, { error: (error as Error)?.message || String(error), context }); }

    getMetrics() { return { ...this.metrics, sessionDuration: Date.now() - this.sessionStart }; }
    healthCheck() { return { healthy: true, initialized: this.initialized, hasTelemetryCore: !!this.telemetryCore, metrics: this.getMetrics(), portsInitialized: Ports.isInitialized(), p22Compliant: true }; }
    destroy() { this.initialized = false; }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, p22Compliant: true }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, p22Compliant: true }; }

export default StatusTracker;
