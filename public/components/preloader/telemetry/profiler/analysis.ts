// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader.telemetry.profiler.analysis
// PURPOSE: Boot Profiler - Analysis & Reports
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   calculateSummary() — exported function
//   compareProfiles() — exported function
//   generateReport() — exported function
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
export const MODULE_ID = 'preloader.telemetry.profiler.analysis';
export const VERSION = '1.1.0-P17WI';
const Ports = createCorePorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
export function calculateSummary(profile: Record<string, any>) { if (!profile) return null; const summary: Record<string, any> = { totalDuration: profile.duration, markerCount: profile.markers.length, measureCount: profile.measures.length, longTaskCount: profile.longTasks.length, longTaskTotalTime: profile.longTasks.reduce((sum: number, t: Record<string, any>) => sum + t.duration, 0), resourceCount: profile.resources.length, resourceTotalSize: profile.resources.reduce((sum: number, r: Record<string, any>) => sum + (r.transferSize || 0), 0), avgFPS: 0, minFPS: Infinity, maxFPS: 0, memoryPeak: 0, memoryGrowth: 0 }; if (profile.fps.length > 0) { const fpsValues = profile.fps.map((f: Record<string, any>) => f.fps); summary.avgFPS = Math.round(fpsValues.reduce((a: number, b: number) => a + b, 0) / fpsValues.length); summary.minFPS = Math.min(...fpsValues); summary.maxFPS = Math.max(...fpsValues); } if (profile.memory.length > 0) { const memValues = profile.memory.map((m: Record<string, any>) => m.usedJSHeapSize); summary.memoryPeak = Math.max(...memValues); summary.memoryGrowth = memValues[memValues.length - 1] - memValues[0]; } summary.phases = {}; profile.measures.forEach((m: Record<string, unknown>) => { summary.phases[m.name as string] = { duration: m.duration, percent: `${(((m.duration as number) / profile.duration) * 100).toFixed(1)}%` }; }); summary.bottlenecks = profile.measures.filter((m: Record<string, any>) => m.duration > 100).sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.duration as number) - (a.duration as number)).slice(0, 5).map((m: Record<string, unknown>) => ({
  name: m.name,
  duration: m.duration
})); summary.slowResources = profile.resources.filter((r: Record<string, any>) => r.duration > 100).slice(0, 5); return summary; }
export function compareProfiles(p1: Record<string, any>, p2: Record<string, any>) { if (!p1 || !p2) return null; return { duration: { profile1: p1.duration, profile2: p2.duration, diff: p2.duration - p1.duration, diffPercent: `${(((p2.duration - p1.duration) / p1.duration) * 100).toFixed(2)}%` }, longTasks: { profile1: p1.summary.longTaskCount, profile2: p2.summary.longTaskCount, diff: p2.summary.longTaskCount - p1.summary.longTaskCount }, avgFPS: { profile1: p1.summary.avgFPS, profile2: p2.summary.avgFPS, diff: p2.summary.avgFPS - p1.summary.avgFPS }, memoryPeak: { profile1: p1.summary.memoryPeak, profile2: p2.summary.memoryPeak, diff: p2.summary.memoryPeak - p1.summary.memoryPeak } }; }
export function generateReport(profile: Record<string, any>) { if (!profile || !profile.summary) return 'No profile data available'; const p = profile; const lines = []; lines.push('BOOT PERFORMANCE PROFILE REPORT'); lines.push(`Profile ID: ${p.id}`); lines.push(`Duration: ${p.duration.toFixed(2)}ms`); lines.push(`Status: ${p.status}`); return lines.join('\n'); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
export default { MODULE_ID, VERSION, calculateSummary, compareProfiles, generateReport, info, healthCheck, injectPorts, getPorts };
