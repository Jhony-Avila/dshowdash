const MODULE_ID = "header-panel-bling-telemetry-tracker";
import { VERSION } from "/core/version.js";
class TelemetryTracker {
  constructor() {
    this._events = [];
  }
  track(event, data = {}) {
    this._events.push({ event, data, timestamp: Date.now() });
  }
  getEvents() {
    return [...this._events];
  }
  clear() {
    this._events = [];
  }
  getMetrics() {
    return { eventCount: this._events.length };
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, metrics: this.getMetrics() };
  }
  healthCheck() {
    return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { trackerReady: true }, metrics: this.getMetrics() };
  }
}
function getMetrics() {
  return { eventCount: 0 };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { trackerReady: true } };
}
export {
  MODULE_ID,
  TelemetryTracker,
  VERSION,
  getMetrics,
  healthCheck,
  info
};
