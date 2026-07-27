// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: profiler-session
// PURPOSE: Boot Profiler - Session Management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   startProfile() — exported function
//   endProfile() — exported function
//   getCurrentProfile() — exported function
//   setCurrentProfile() — exported function
//   getProfile() — exported function
//   getLastProfile() — exported function
//   getAllProfiles() — exported function
//   clearProfiles() — exported function
//   isProfileRunning() — exported function
//   getProfileCount() — exported function
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
export const MODULE_ID = 'profiler-session';
export const VERSION = '1.2.0-P17WI';
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const log = { info(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {})); } };
const _profiles: Record<string, any>[] = [];
const MAX_PROFILES = 50;
let _currentProfile: Record<string, any> | null = null;
export function startProfile(profileId?: string, onStart?: (profile: Record<string, any>) => void) { _currentProfile = { id: profileId || `profile_${Date.now()}`, startTime: performance.now(), startTimestamp: Date.now(), markers: [], measures: [], memory: [], fps: [], longTasks: [], resources: [], status: 'running' }; if (onStart) onStart(_currentProfile); log.info('Profile started', { profileId: _currentProfile.id }); return _currentProfile.id; }
export function endProfile(onEnd?: (profile: Record<string, any>) => void) { if (!_currentProfile) return null; _currentProfile.endTime = performance.now(); _currentProfile.duration = _currentProfile.endTime - _currentProfile.startTime; _currentProfile.status = 'completed'; if (onEnd) onEnd(_currentProfile); _profiles.push(_currentProfile); if (_profiles.length > MAX_PROFILES) _profiles.shift(); const result = Object.assign({}, _currentProfile); log.info('Profile completed', { profileId: result.id, duration: result.duration }); _currentProfile = null; return result; }
export function getCurrentProfile() { return _currentProfile; }
export function setCurrentProfile(profile: Record<string, any> | null) { _currentProfile = profile; }
export function getProfile(profileId: string) { for (let i = 0; i < _profiles.length; i++) { if (_profiles[i].id === profileId) return _profiles[i]; } return null; }
export function getLastProfile() { return _profiles.length > 0 ? _profiles[_profiles.length - 1] : null; }
export function getAllProfiles() { return _profiles.slice(); }
export function clearProfiles() { _profiles.length = 0; }
export function isProfileRunning() { return _currentProfile !== null; }
export function getProfileCount() { return _profiles.length; }
export default { startProfile, endProfile, getCurrentProfile, setCurrentProfile, getProfile, getLastProfile, getAllProfiles, clearProfiles, isProfileRunning, getProfileCount };
export function info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, profileCount: _profiles.length, isRunning: !!_currentProfile }; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { portsInitialized: ps._initialized, profileCount: _profiles.length, noOverflow: _profiles.length <= MAX_PROFILES } }; }
