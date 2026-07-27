// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.analytics.data-collector
// PURPOSE: Router Dashboard Data Collector
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   CONFIG from ./dashboard-config.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createDataCollector() — exported function
//   healthCheck() — exported function
//   DashboardDataCollector — exported class
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { CONFIG } from './dashboard-config.js';
export const VERSION = '1.1.0-P17WI';
export const MODULE_ID = 'router.analytics.data-collector';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export class DashboardDataCollector {
  [key: string]: any;
  constructor(maxPoints = CONFIG.maxDataPoints) { this.maxPoints = maxPoints; this.timeSeriesData = { navigations: [], resolveTime: [], errorRate: [], timestamps: [] }; }
  addDataPoint(metrics: Record<string, number>) { const now = Date.now(); this.timeSeriesData.timestamps.push(now); this.timeSeriesData.navigations.push(metrics.navigationsPerMinute || 0); this.timeSeriesData.resolveTime.push(metrics.avgResolveTime || 0); this.timeSeriesData.errorRate.push(metrics.errorRate || 0); if (this.timeSeriesData.timestamps.length > this.maxPoints) { this.timeSeriesData.timestamps.shift(); this.timeSeriesData.navigations.shift(); this.timeSeriesData.resolveTime.shift(); this.timeSeriesData.errorRate.shift(); } }
  getData() { return { ...this.timeSeriesData }; }
  getNavigations() { return [...this.timeSeriesData.navigations]; }
  getResolveTimes() { return [...this.timeSeriesData.resolveTime]; }
  getErrorRates() { return [...this.timeSeriesData.errorRate]; }
  getDataPointCount() { return this.timeSeriesData.timestamps.length; }
  clear() { this.timeSeriesData = { navigations: [], resolveTime: [], errorRate: [], timestamps: [] }; }
  getStatus() { return { dataPoints: this.getDataPointCount(), maxPoints: this.maxPoints, hasData: this.getDataPointCount() > 0 }; }
}
export function createDataCollector(maxPoints: number) { return new DashboardDataCollector(maxPoints); }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
