// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: profiler-monitors
// PURPOSE: Boot Profiler - Performance Monitors
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
//   startMemorySampling() — exported function
//   stopMemorySampling() — exported function
//   startFPSMonitoring() — exported function
//   stopFPSMonitoring() — exported function
//   startLongTaskObserver() — exported function
//   stopLongTaskObserver() — exported function
//   captureResourceTiming() — exported function
//   startAllMonitors() — exported function
//   stopAllMonitors() — exported function
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
export const MODULE_ID = 'profiler-monitors';
export const VERSION = '1.2.0-P17WI';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const log = { debug(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {})); } };
let _memoryInterval: ReturnType<typeof setInterval> | null = null;
let _fpsFrameId: number | null = null;
let _fpsLastTime = 0;
let _fpsFrameCount = 0;
let _longTaskObserver: PerformanceObserver | null = null;

// @ts-expect-error TS migration - TS2339
export function startMemorySampling() { if (typeof performance === 'undefined' || !performance.memory) return; _memoryInterval = setInterval(() => { const profile = getCurrentProfile(); if (!profile) return; profile.memory.push({ time: performance.now() - profile.startTime, usedJSHeapSize: performance.memory.usedJSHeapSize, totalJSHeapSize: performance.memory.totalJSHeapSize, jsHeapSizeLimit: performance.memory.jsHeapSizeLimit }); }, 100); }
export function stopMemorySampling() { if (_memoryInterval) { clearInterval(_memoryInterval); _memoryInterval = null; } }
export function startFPSMonitoring() { if (typeof requestAnimationFrame === 'undefined') return; _fpsLastTime = performance.now(); _fpsFrameCount = 0; function measureFPS(now: number) { const profile = getCurrentProfile(); if (!profile) return; _fpsFrameCount++; const elapsed = now - _fpsLastTime; if (elapsed >= 1000) { const fps = Math.round((_fpsFrameCount * 1000) / elapsed); profile.fps.push({ time: now - profile.startTime, fps }); _fpsFrameCount = 0; _fpsLastTime = now; } _fpsFrameId = requestAnimationFrame(measureFPS); } _fpsFrameId = requestAnimationFrame(measureFPS); }
export function stopFPSMonitoring() { if (_fpsFrameId) { cancelAnimationFrame(_fpsFrameId); _fpsFrameId = null; } }

export function startLongTaskObserver() { if (typeof PerformanceObserver === 'undefined') return; try { _longTaskObserver = new PerformanceObserver(list => { const profile = getCurrentProfile(); if (!profile) return; const entries = list.getEntries(); for (let i = 0; i < entries.length; i++) { const entry = entries[i]; profile.longTasks.push({ time: entry.startTime - profile.startTime, duration: entry.duration, name: entry.name }); } }); _longTaskObserver.observe({ entryTypes: ['longtask'] }); } catch (e) { log.debug('Long task observer not supported'); } }
export function stopLongTaskObserver() { if (_longTaskObserver) { _longTaskObserver.disconnect(); _longTaskObserver = null; } }
export function captureResourceTiming() { const profile = getCurrentProfile(); if (!profile) return; if (typeof performance === 'undefined') return; try { const resources = performance.getEntriesByType('resource'); profile.resources = resources.filter(r => r.startTime >= 0).map(r => ({
  name: r.name.split('/').pop(),

  // @ts-expect-error TS migration - TS2339
  type: r.initiatorType,
  duration: r.duration,

  // @ts-expect-error TS migration - TS2339
  transferSize: r.transferSize,
  startTime: r.startTime
})).sort((a, b) => b.duration - a.duration).slice(0, 50); } catch (e) {} }
export function startAllMonitors() { startMemorySampling(); startFPSMonitoring(); startLongTaskObserver(); }
export function stopAllMonitors() { stopMemorySampling(); stopFPSMonitoring(); stopLongTaskObserver(); captureResourceTiming(); }
export default { startMemorySampling, stopMemorySampling, startFPSMonitoring, stopFPSMonitoring, startLongTaskObserver, stopLongTaskObserver, captureResourceTiming, startAllMonitors, stopAllMonitors };
export function info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, memoryMonitoring: !!_memoryInterval, fpsMonitoring: !!_fpsFrameId, longTaskObserver: !!_longTaskObserver }; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { portsInitialized: ps._initialized } }; }
