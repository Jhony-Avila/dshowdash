import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { getCurrentProfile } from "./session.js";
const MODULE_ID = "profiler-monitors";
const VERSION = "1.2.0-P17WI";
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
const log = { debug(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
} };
let _memoryInterval = null;
let _fpsFrameId = null;
let _fpsLastTime = 0;
let _fpsFrameCount = 0;
let _longTaskObserver = null;
function startMemorySampling() {
  if (typeof performance === "undefined" || !performance.memory) return;
  _memoryInterval = setInterval(() => {
    const profile = getCurrentProfile();
    if (!profile) return;
    profile.memory.push({ time: performance.now() - profile.startTime, usedJSHeapSize: performance.memory.usedJSHeapSize, totalJSHeapSize: performance.memory.totalJSHeapSize, jsHeapSizeLimit: performance.memory.jsHeapSizeLimit });
  }, 100);
}
function stopMemorySampling() {
  if (_memoryInterval) {
    clearInterval(_memoryInterval);
    _memoryInterval = null;
  }
}
function startFPSMonitoring() {
  if (typeof requestAnimationFrame === "undefined") return;
  _fpsLastTime = performance.now();
  _fpsFrameCount = 0;
  function measureFPS(now) {
    const profile = getCurrentProfile();
    if (!profile) return;
    _fpsFrameCount++;
    const elapsed = now - _fpsLastTime;
    if (elapsed >= 1e3) {
      const fps = Math.round(_fpsFrameCount * 1e3 / elapsed);
      profile.fps.push({ time: now - profile.startTime, fps });
      _fpsFrameCount = 0;
      _fpsLastTime = now;
    }
    _fpsFrameId = requestAnimationFrame(measureFPS);
  }
  _fpsFrameId = requestAnimationFrame(measureFPS);
}
function stopFPSMonitoring() {
  if (_fpsFrameId) {
    cancelAnimationFrame(_fpsFrameId);
    _fpsFrameId = null;
  }
}
function startLongTaskObserver() {
  if (typeof PerformanceObserver === "undefined") return;
  try {
    _longTaskObserver = new PerformanceObserver((list) => {
      const profile = getCurrentProfile();
      if (!profile) return;
      const entries = list.getEntries();
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        profile.longTasks.push({ time: entry.startTime - profile.startTime, duration: entry.duration, name: entry.name });
      }
    });
    _longTaskObserver.observe({ entryTypes: ["longtask"] });
  } catch (e) {
    log.debug("Long task observer not supported");
  }
}
function stopLongTaskObserver() {
  if (_longTaskObserver) {
    _longTaskObserver.disconnect();
    _longTaskObserver = null;
  }
}
function captureResourceTiming() {
  const profile = getCurrentProfile();
  if (!profile) return;
  if (typeof performance === "undefined") return;
  try {
    const resources = performance.getEntriesByType("resource");
    profile.resources = resources.filter((r) => r.startTime >= 0).map((r) => ({
      name: r.name.split("/").pop(),
      // @ts-expect-error TS migration - TS2339
      type: r.initiatorType,
      duration: r.duration,
      // @ts-expect-error TS migration - TS2339
      transferSize: r.transferSize,
      startTime: r.startTime
    })).sort((a, b) => b.duration - a.duration).slice(0, 50);
  } catch (e) {
  }
}
function startAllMonitors() {
  startMemorySampling();
  startFPSMonitoring();
  startLongTaskObserver();
}
function stopAllMonitors() {
  stopMemorySampling();
  stopFPSMonitoring();
  stopLongTaskObserver();
  captureResourceTiming();
}
var monitors_default = { startMemorySampling, stopMemorySampling, startFPSMonitoring, stopFPSMonitoring, startLongTaskObserver, stopLongTaskObserver, captureResourceTiming, startAllMonitors, stopAllMonitors };
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, memoryMonitoring: !!_memoryInterval, fpsMonitoring: !!_fpsFrameId, longTaskObserver: !!_longTaskObserver };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { portsInitialized: ps._initialized } };
}
export {
  MODULE_ID,
  VERSION,
  captureResourceTiming,
  monitors_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  startAllMonitors,
  startFPSMonitoring,
  startLongTaskObserver,
  startMemorySampling,
  stopAllMonitors,
  stopFPSMonitoring,
  stopLongTaskObserver,
  stopMemorySampling
};
