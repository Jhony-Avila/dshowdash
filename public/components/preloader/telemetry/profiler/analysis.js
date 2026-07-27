import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "preloader.telemetry.profiler.analysis";
const VERSION = "1.1.0-P17WI";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function calculateSummary(profile) {
  if (!profile) return null;
  const summary = { totalDuration: profile.duration, markerCount: profile.markers.length, measureCount: profile.measures.length, longTaskCount: profile.longTasks.length, longTaskTotalTime: profile.longTasks.reduce((sum, t) => sum + t.duration, 0), resourceCount: profile.resources.length, resourceTotalSize: profile.resources.reduce((sum, r) => sum + (r.transferSize || 0), 0), avgFPS: 0, minFPS: Infinity, maxFPS: 0, memoryPeak: 0, memoryGrowth: 0 };
  if (profile.fps.length > 0) {
    const fpsValues = profile.fps.map((f) => f.fps);
    summary.avgFPS = Math.round(fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length);
    summary.minFPS = Math.min(...fpsValues);
    summary.maxFPS = Math.max(...fpsValues);
  }
  if (profile.memory.length > 0) {
    const memValues = profile.memory.map((m) => m.usedJSHeapSize);
    summary.memoryPeak = Math.max(...memValues);
    summary.memoryGrowth = memValues[memValues.length - 1] - memValues[0];
  }
  summary.phases = {};
  profile.measures.forEach((m) => {
    summary.phases[m.name] = { duration: m.duration, percent: `${(m.duration / profile.duration * 100).toFixed(1)}%` };
  });
  summary.bottlenecks = profile.measures.filter((m) => m.duration > 100).sort((a, b) => b.duration - a.duration).slice(0, 5).map((m) => ({
    name: m.name,
    duration: m.duration
  }));
  summary.slowResources = profile.resources.filter((r) => r.duration > 100).slice(0, 5);
  return summary;
}
function compareProfiles(p1, p2) {
  if (!p1 || !p2) return null;
  return { duration: { profile1: p1.duration, profile2: p2.duration, diff: p2.duration - p1.duration, diffPercent: `${((p2.duration - p1.duration) / p1.duration * 100).toFixed(2)}%` }, longTasks: { profile1: p1.summary.longTaskCount, profile2: p2.summary.longTaskCount, diff: p2.summary.longTaskCount - p1.summary.longTaskCount }, avgFPS: { profile1: p1.summary.avgFPS, profile2: p2.summary.avgFPS, diff: p2.summary.avgFPS - p1.summary.avgFPS }, memoryPeak: { profile1: p1.summary.memoryPeak, profile2: p2.summary.memoryPeak, diff: p2.summary.memoryPeak - p1.summary.memoryPeak } };
}
function generateReport(profile) {
  if (!profile || !profile.summary) return "No profile data available";
  const p = profile;
  const lines = [];
  lines.push("BOOT PERFORMANCE PROFILE REPORT");
  lines.push(`Profile ID: ${p.id}`);
  lines.push(`Duration: ${p.duration.toFixed(2)}ms`);
  lines.push(`Status: ${p.status}`);
  return lines.join("\n");
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
}
var analysis_default = { MODULE_ID, VERSION, calculateSummary, compareProfiles, generateReport, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  calculateSummary,
  compareProfiles,
  analysis_default as default,
  generateReport,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
