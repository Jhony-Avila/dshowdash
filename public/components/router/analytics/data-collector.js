import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { CONFIG } from "./dashboard-config.js";
const VERSION = "1.1.0-P17WI";
const MODULE_ID = "router.analytics.data-collector";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
class DashboardDataCollector {
  constructor(maxPoints = CONFIG.maxDataPoints) {
    this.maxPoints = maxPoints;
    this.timeSeriesData = { navigations: [], resolveTime: [], errorRate: [], timestamps: [] };
  }
  addDataPoint(metrics) {
    const now = Date.now();
    this.timeSeriesData.timestamps.push(now);
    this.timeSeriesData.navigations.push(metrics.navigationsPerMinute || 0);
    this.timeSeriesData.resolveTime.push(metrics.avgResolveTime || 0);
    this.timeSeriesData.errorRate.push(metrics.errorRate || 0);
    if (this.timeSeriesData.timestamps.length > this.maxPoints) {
      this.timeSeriesData.timestamps.shift();
      this.timeSeriesData.navigations.shift();
      this.timeSeriesData.resolveTime.shift();
      this.timeSeriesData.errorRate.shift();
    }
  }
  getData() {
    return { ...this.timeSeriesData };
  }
  getNavigations() {
    return [...this.timeSeriesData.navigations];
  }
  getResolveTimes() {
    return [...this.timeSeriesData.resolveTime];
  }
  getErrorRates() {
    return [...this.timeSeriesData.errorRate];
  }
  getDataPointCount() {
    return this.timeSeriesData.timestamps.length;
  }
  clear() {
    this.timeSeriesData = { navigations: [], resolveTime: [], errorRate: [], timestamps: [] };
  }
  getStatus() {
    return { dataPoints: this.getDataPointCount(), maxPoints: this.maxPoints, hasData: this.getDataPointCount() > 0 };
  }
}
function createDataCollector(maxPoints) {
  return new DashboardDataCollector(maxPoints);
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
}
export {
  DashboardDataCollector,
  MODULE_ID,
  VERSION,
  createDataCollector,
  getPorts,
  healthCheck,
  injectPorts
};
