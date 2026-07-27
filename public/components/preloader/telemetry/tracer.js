import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.1.0-P17WI";
const MODULE_ID = "preloader.telemetry.tracer";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const DEFAULT_MAX_ENTRIES = 100;
class BootTracer {
  constructor(bootId, maxEntries = DEFAULT_MAX_ENTRIES) {
    this.bootId = bootId;
    this.bootStartTs = Date.now();
    this.maxEntries = maxEntries;
    this.trace = [];
  }
  add(action, data = null) {
    const entry = { action, data, timestamp: Date.now(), elapsed: Date.now() - this.bootStartTs };
    this.trace.push(entry);
    if (this.trace.length > this.maxEntries) {
      this.trace.shift();
    }
    return entry;
  }
  getTrace() {
    return [...this.trace];
  }
  getRecent(count = 10) {
    return this.trace.slice(-count);
  }
  clear() {
    this.trace = [];
  }
  getPerformanceMarks() {
    if (typeof performance === "undefined") return {};
    const marks = {};
    performance.getEntriesByType("measure").forEach((entry) => {
      if (entry.name.startsWith("preloader:")) {
        marks[entry.name] = Math.round(entry.duration);
      }
    });
    return marks;
  }
  markStart(name) {
    if (typeof performance !== "undefined") {
      performance.mark(`preloader:${name}:start`);
    }
  }
  markEnd(name) {
    if (typeof performance !== "undefined") {
      performance.mark(`preloader:${name}:end`);
      try {
        performance.measure(`preloader:${name}`, `preloader:${name}:start`, `preloader:${name}:end`);
      } catch {
      }
    }
  }
  getDuration() {
    return Date.now() - this.bootStartTs;
  }
  getStatus() {
    return { bootId: this.bootId, entries: this.trace.length, maxEntries: this.maxEntries, durationMs: this.getDuration() };
  }
}
function createTracer(bootId, maxEntries) {
  return new BootTracer(bootId, maxEntries);
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, hasPerformanceAPI: typeof performance !== "undefined", portsInitialized: Ports.isInitialized() };
}
var tracer_default = { VERSION, MODULE_ID, createTracer, BootTracer, healthCheck, injectPorts, getPorts };
export {
  BootTracer,
  MODULE_ID,
  VERSION,
  createTracer,
  tracer_default as default,
  getPorts,
  healthCheck,
  injectPorts
};
