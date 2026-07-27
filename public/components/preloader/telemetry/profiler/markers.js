import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { getCurrentProfile } from "./session.js";
const MODULE_ID = "profiler-markers";
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
}, warn(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
} };
const _markers = /* @__PURE__ */ new Map();
const _measures = /* @__PURE__ */ new Map();
function mark(name, metadata = {}) {
  const profile = getCurrentProfile();
  if (!profile) return null;
  const marker = { name, time: performance.now() - profile.startTime, timestamp: Date.now(), metadata };
  _markers.set(name, marker);
  profile.markers.push(marker);
  try {
    performance.mark(`boot:${name}`);
  } catch (e) {
  }
  log.debug("Marker set", { name, time: marker.time });
  return marker;
}
function measure(name, startMark, endMark) {
  const profile = getCurrentProfile();
  if (!profile) return null;
  const start = _markers.get(startMark);
  const end = endMark ? _markers.get(endMark) : { time: performance.now() - profile.startTime };
  if (!start) {
    log.warn("Start marker not found", { startMark });
    return null;
  }
  const measureData = { name, startMark, endMark: endMark || "now", startTime: start.time, endTime: end.time, duration: end.time - start.time };
  _measures.set(name, measureData);
  profile.measures.push(measureData);
  try {
    if (endMark) performance.measure(`boot:${name}`, `boot:${startMark}`, `boot:${endMark}`);
  } catch (e) {
  }
  log.debug("Measure recorded", { name, duration: measureData.duration });
  return measureData;
}
function getMarker(name) {
  return _markers.get(name) || null;
}
function getMeasure(name) {
  return _measures.get(name) || null;
}
function clearMarkers() {
  _markers.clear();
  _measures.clear();
}
function clearPerformanceMarks() {
  try {
    performance.clearMarks();
    performance.clearMeasures();
  } catch (e) {
  }
}
var markers_default = { mark, measure, getMarker, getMeasure, clearMarkers, clearPerformanceMarks };
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, markerCount: _markers.size, measureCount: _measures.size };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { portsInitialized: ps._initialized, markersActive: _markers.size > 0 || true } };
}
export {
  MODULE_ID,
  VERSION,
  clearMarkers,
  clearPerformanceMarks,
  markers_default as default,
  getMarker,
  getMeasure,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  mark,
  measure
};
