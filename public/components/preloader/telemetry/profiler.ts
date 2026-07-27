// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: boot-performance-profiler
// PURPOSE: Boot Performance Profiler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   * as Session from ./profiler/session.js
//   * as Markers from ./profiler/markers.js
//   * as Monitors from ./profiler/monitors.js
//   * as Analysis from ./profiler/analysis.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   mark — exported value
//   measure — exported value
//   getMarker — exported value
//   getMeasure — exported value
//   clearPerformanceMarks — exported value
//   getCurrentProfile — exported value
//   getProfile — exported value
//   getLastProfile — exported value
//   getAllProfiles — exported value
//   clearProfiles — exported value
//   isProfileRunning — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   startProfile() — exported function
//   endProfile() — exported function
//   compareProfiles() — exported function
//   generateReport() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
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
import * as Session from './profiler/session.js';
import * as Markers from './profiler/markers.js';
import * as Monitors from './profiler/monitors.js';
import * as Analysis from './profiler/analysis.js';
export const VERSION = '1.3.0-P17WI';
export const MODULE_ID = 'boot-performance-profiler';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const log = { info(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {})); } };
export function startProfile(profileId?: string) { Markers.clearMarkers(); return Session.startProfile(profileId, () => { Monitors.startAllMonitors(); }); }
export function endProfile() { Monitors.stopAllMonitors(); return Session.endProfile((profile: Record<string, any>) => { profile.summary = Analysis.calculateSummary(profile); }); }
export const mark = Markers.mark;
export const measure = Markers.measure;
export const getMarker = Markers.getMarker;
export const getMeasure = Markers.getMeasure;
export const clearPerformanceMarks = Markers.clearPerformanceMarks;
export const getCurrentProfile = Session.getCurrentProfile;
export const getProfile = Session.getProfile;
export const getLastProfile = Session.getLastProfile;
export const getAllProfiles = Session.getAllProfiles;
export const clearProfiles = Session.clearProfiles;
export const isProfileRunning = Session.isProfileRunning;
// @ts-expect-error strict migration — TS2345
export function compareProfiles(profileId1: string, profileId2: string) { return Analysis.compareProfiles(Session.getProfile(profileId1), Session.getProfile(profileId2)); }
// @ts-expect-error strict migration — TS2345
export function generateReport(profile?: Record<string, any>) { return Analysis.generateReport(profile || Session.getLastProfile()); }
// @ts-expect-error strict migration — TS2531
export function getStatus() { return { version: VERSION, moduleId: MODULE_ID, isRunning: Session.isProfileRunning(), profileCount: Session.getProfileCount(), currentProfileId: Session.getCurrentProfile() ? Session.getCurrentProfile().id : null }; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, hasLogger: !!_getPort('logger'), portsInitialized: ps._initialized, timestamp: Date.now() }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, features: ['markers', 'measures', 'memory-sampling', 'fps-monitoring', 'long-tasks', 'resource-timing', 'reports'], status: getStatus() }; }
export default { VERSION, MODULE_ID, startProfile, endProfile, mark, measure, getCurrentProfile, getProfile, getLastProfile, getAllProfiles, getMarker, getMeasure, compareProfiles, generateReport, clearProfiles, clearPerformanceMarks, isProfileRunning, getStatus, healthCheck, info };
