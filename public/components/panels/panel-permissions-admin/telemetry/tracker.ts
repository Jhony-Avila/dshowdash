// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-permissions-admin.telemetry.tracker
// PURPOSE: Panel Telemetry Tracker - Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   Telemetry — exported value
//   info() — exported function
//   healthCheck() — exported function
//   PanelTelemetryTracker() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';

const MODULE_ID = 'panel-permissions-admin.telemetry.tracker';
const VERSION = '9.3.0-P2-ENTERPRISE';
const NAMESPACE = 'panel';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function PanelTelemetryTracker(this: any, panelId: string, config: Record<string, unknown>) {
    this.panelId = panelId;
    this.config = config || {};
    this.initialized = false;
    _initPorts();
}

PanelTelemetryTracker.prototype.init = function() { if (this.initialized) return this; this.initialized = true; return this; };

PanelTelemetryTracker.prototype.track = function(event: string, data: Record<string, unknown>) {
    if (!this.initialized) this.init();
    data = data || {};
    const telemetry = _getPort('telemetry');
    if (telemetry?.event) telemetry.event(PANEL_EVENTS.TELEMETRY, Object.assign({ panelId: this.panelId, event }, data), { component: `${NAMESPACE}-${this.panelId}` });
};

PanelTelemetryTracker.prototype.trackLoad = function(duration: number, success: boolean) {
    if (!this.initialized) this.init();
    if (success === undefined) success = true;
    const telemetry = _getPort('telemetry');
    if (telemetry?.metric) telemetry.metric(PANEL_EVENTS.LOADED, { panelId: this.panelId, duration, success, unit: 'ms' }, { component: `${NAMESPACE}-${this.panelId}` });
};

PanelTelemetryTracker.prototype.trackError = function(error: unknown, context: string) {
    if (!this.initialized) this.init();
    if (context === undefined) context = '';
    const telemetry = _getPort('telemetry');
    if (telemetry?.error) telemetry.error(PANEL_EVENTS.ERROR, { panelId: this.panelId, context, message: (error as Error)?.message || String(error), stack: (error as Error)?.stack || null }, { component: `${NAMESPACE}-${this.panelId}` });
};

PanelTelemetryTracker.prototype.trackDataRefresh = function(source: string, success: boolean, data: Record<string, unknown>) {
    if (!this.initialized) this.init();
    if (success === undefined) success = true;
    data = data || {};
    const telemetry = _getPort('telemetry');
    if (telemetry?.event) telemetry.event(PANEL_EVENTS.REFRESH, Object.assign({ panelId: this.panelId, source, success }, data), { component: `${NAMESPACE}-${this.panelId}` });
};

PanelTelemetryTracker.prototype.trackInteraction = function(action: string, detail: Record<string, unknown>) {
    if (!this.initialized) this.init();
    detail = detail || {};
    const telemetry = _getPort('telemetry');
    if (telemetry?.event) telemetry.event(PANEL_EVENTS.TELEMETRY, Object.assign({ panelId: this.panelId, action, type: 'interaction' }, detail), { component: `${NAMESPACE}-${this.panelId}` });
};

// Singleton instance for static usage

// @ts-expect-error TS migration - TS2554
const _instance = new PanelTelemetryTracker('panel-permissions-admin');

// Static Telemetry object for index.js compatibility
export const Telemetry = {
    track: (event: string, data: Record<string, unknown>) => _instance.track(event, data),
    trackLoad: (duration: number, success: boolean) => _instance.trackLoad(duration, success),
    trackError: (error: unknown, context: string) => _instance.trackError(error, context),
    trackDataRefresh: (source: string, success: boolean, data: Record<string, unknown>) => _instance.trackDataRefresh(source, success, data),
    trackInteraction: (action: string, detail: Record<string, unknown>) => _instance.trackInteraction(action, detail),
    init: () => _instance.init()
};

export default PanelTelemetryTracker;
export { PanelTelemetryTracker, MODULE_ID, VERSION };
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { trackerReady: true } }; }
