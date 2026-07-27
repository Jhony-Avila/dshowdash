// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: profiler-markers
// PURPOSE: Boot Profiler - Markers & Measures
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   getCurrentProfile from ./session.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   mark() — exported function
//   measure() — exported function
//   getMarker() — exported function
//   getMeasure() — exported function
//   clearMarkers() — exported function
//   clearPerformanceMarks() — exported function
//   info() — exported function
//   healthCheck() — exported function
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
import { getCurrentProfile } from './session.js';
export const MODULE_ID = 'profiler-markers';
export const VERSION = '1.2.0-P17WI';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const log = { debug(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {})); }, warn(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx || {})); } };
const _markers = new Map();
const _measures = new Map();
export function mark(name: string, metadata: Record<string, unknown> = {}) {
  const profile = getCurrentProfile();if (!profile) return null;const marker = { name, time: performance.now() - profile.startTime, timestamp: Date.now(), metadata };_markers.set(name, marker);profile.markers.push(marker);try { performance.mark(`boot:${name}`); } catch (e) {}log.debug('Marker set', { name, time: marker.time });return marker;
}
export function measure(name: string, startMark: string, endMark?: string) { const profile = getCurrentProfile(); if (!profile) return null; const start = _markers.get(startMark); const end = endMark ? _markers.get(endMark) : { time: performance.now() - profile.startTime }; if (!start) { log.warn('Start marker not found', { startMark }); return null; } const measureData = { name, startMark, endMark: endMark || 'now', startTime: start.time, endTime: end.time, duration: end.time - start.time }; _measures.set(name, measureData); profile.measures.push(measureData); try { if (endMark) performance.measure(`boot:${name}`, `boot:${startMark}`, `boot:${endMark}`); } catch (e) {} log.debug('Measure recorded', { name, duration: measureData.duration }); return measureData; }
export function getMarker(name: string) { return _markers.get(name) || null; }
export function getMeasure(name: string) { return _measures.get(name) || null; }
export function clearMarkers() { _markers.clear(); _measures.clear(); }
export function clearPerformanceMarks() { try { performance.clearMarks(); performance.clearMeasures(); } catch (e) {} }
export default { mark, measure, getMarker, getMeasure, clearMarkers, clearPerformanceMarks };
export function info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, markerCount: _markers.size, measureCount: _measures.size }; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { portsInitialized: ps._initialized, markersActive: _markers.size > 0 || true } }; }
