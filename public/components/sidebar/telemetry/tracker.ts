// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.6.2-P22-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar.telemetry.tracker
// PURPOSE: Sidebar V2 - Tracker
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createTracker() — exported function
//   getDefaultTracker() — exported function
//   getMetrics() — exported function
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

import { createUiPorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.6.2-P22';
export const MODULE_ID = 'sidebar.telemetry.tracker';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export class SidebarTracker {
  [key: string]: any;
  constructor(options: { enabled?: boolean; prefix?: string } = {}) {
    this._enabled = options.enabled ?? true;
    this._prefix = options.prefix ?? 'sidebar:';
    this._metrics = { tracks: 0, navigations: 0, toggles: 0, sectionToggles: 0, searches: 0, errors: 0, lastTrack: null };
  }

  _getTelemetry() { return _getPort('telemetryCore') || _getPort('telemetry'); }

  track(event: string, data: DynObj = {}) {
    if (!this._enabled) return;
    _initPorts();
    const telemetry = this._getTelemetry();
    const fullEvent = event.startsWith(this._prefix) ? event : `${this._prefix}${event}`;
    const payload = { source: MODULE_ID, timestamp: Date.now(), ...data };
    // P22: Telemetry Core only - NO EventBus emission (removed dual-emit)
    if (telemetry?.track) telemetry.track(fullEvent, payload);
    this._metrics.tracks++;
    this._metrics.lastTrack = { event: fullEvent, timestamp: Date.now() };
  }

  trackNavigation(itemId: string, route: string) { this.track('navigate', { itemId, route }); this._metrics.navigations++; }
  trackToggle(collapsed: boolean) { this.track('toggle', { collapsed }); this._metrics.toggles++; }
  trackSectionToggle(sectionId: string, expanded: boolean) { this.track('section:toggle', { sectionId, expanded }); this._metrics.sectionToggles++; }
  trackSearch(query: string, resultsCount: number) { this.track('search', { query, resultsCount }); this._metrics.searches++; }
  trackError(error: Error, context: DynObj = {}) { this.track('error', { error: error?.message || error, ...context }); this._metrics.errors++; }
  // @ts-expect-error strict migration — TS2322
  trackKeyboardNav(action: DynObj, itemId : string = null) { this.track('keyboard:nav', { action, itemId }); }
  setEnabled(value: string) { this._enabled = !!value; }
  getMetrics() { return { ...this._metrics }; }
  reset() { this._metrics = { tracks: 0, navigations: 0, toggles: 0, sectionToggles: 0, searches: 0, errors: 0, lastTrack: null }; }

  healthCheck() {
    const hasTelemetry = !!this._getTelemetry();
    const checks = { enabled: this._enabled, hasTelemetry, noErrors: this._metrics.errors === 0, trackingWorks: this._metrics.tracks >= 0, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed >= 4 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: this._metrics, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }

  getInfo() { return { moduleId: MODULE_ID, version: VERSION, enabled: this._enabled, prefix: this._prefix, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics() }; }
}

export function createTracker(options: DynObj) { return new SidebarTracker(options); }

let _defaultInstance: DynObj | null = null;
export function getDefaultTracker() { if (!_defaultInstance) _defaultInstance = new SidebarTracker(); return _defaultInstance; }
export function getMetrics() { return getDefaultTracker().getMetrics(); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: getMetrics() }; }
export function healthCheck() { return getDefaultTracker().healthCheck(); }

export default { VERSION, MODULE_ID, SidebarTracker, createTracker, getDefaultTracker, info, getMetrics, healthCheck, injectPorts, getPorts };
