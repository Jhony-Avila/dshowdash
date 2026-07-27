import { createCorePorts } from "/core/runtime/ports-profiles.js";
import * as Session from "./profiler/session.js";
import * as Markers from "./profiler/markers.js";
import * as Monitors from "./profiler/monitors.js";
import * as Analysis from "./profiler/analysis.js";
const VERSION = "1.3.0-P17WI";
const MODULE_ID = "boot-performance-profiler";
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
const log = { info(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
} };
function startProfile(profileId) {
  Markers.clearMarkers();
  return Session.startProfile(profileId, () => {
    Monitors.startAllMonitors();
  });
}
function endProfile() {
  Monitors.stopAllMonitors();
  return Session.endProfile((profile) => {
    profile.summary = Analysis.calculateSummary(profile);
  });
}
const mark = Markers.mark;
const measure = Markers.measure;
const getMarker = Markers.getMarker;
const getMeasure = Markers.getMeasure;
const clearPerformanceMarks = Markers.clearPerformanceMarks;
const getCurrentProfile = Session.getCurrentProfile;
const getProfile = Session.getProfile;
const getLastProfile = Session.getLastProfile;
const getAllProfiles = Session.getAllProfiles;
const clearProfiles = Session.clearProfiles;
const isProfileRunning = Session.isProfileRunning;
function compareProfiles(profileId1, profileId2) {
  return Analysis.compareProfiles(Session.getProfile(profileId1), Session.getProfile(profileId2));
}
function generateReport(profile) {
  return Analysis.generateReport(profile || Session.getLastProfile());
}
function getStatus() {
  return { version: VERSION, moduleId: MODULE_ID, isRunning: Session.isProfileRunning(), profileCount: Session.getProfileCount(), currentProfileId: Session.getCurrentProfile() ? Session.getCurrentProfile().id : null };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, hasLogger: !!_getPort("logger"), portsInitialized: ps._initialized, timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, features: ["markers", "measures", "memory-sampling", "fps-monitoring", "long-tasks", "resource-timing", "reports"], status: getStatus() };
}
var profiler_default = { VERSION, MODULE_ID, startProfile, endProfile, mark, measure, getCurrentProfile, getProfile, getLastProfile, getAllProfiles, getMarker, getMeasure, compareProfiles, generateReport, clearProfiles, clearPerformanceMarks, isProfileRunning, getStatus, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  clearPerformanceMarks,
  clearProfiles,
  compareProfiles,
  profiler_default as default,
  endProfile,
  generateReport,
  getAllProfiles,
  getCurrentProfile,
  getLastProfile,
  getMarker,
  getMeasure,
  getPorts,
  getProfile,
  getStatus,
  healthCheck,
  info,
  injectPorts,
  isProfileRunning,
  mark,
  measure,
  startProfile
};
