import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "profiler-session";
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
const log = { info(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
} };
const _profiles = [];
const MAX_PROFILES = 50;
let _currentProfile = null;
function startProfile(profileId, onStart) {
  _currentProfile = { id: profileId || `profile_${Date.now()}`, startTime: performance.now(), startTimestamp: Date.now(), markers: [], measures: [], memory: [], fps: [], longTasks: [], resources: [], status: "running" };
  if (onStart) onStart(_currentProfile);
  log.info("Profile started", { profileId: _currentProfile.id });
  return _currentProfile.id;
}
function endProfile(onEnd) {
  if (!_currentProfile) return null;
  _currentProfile.endTime = performance.now();
  _currentProfile.duration = _currentProfile.endTime - _currentProfile.startTime;
  _currentProfile.status = "completed";
  if (onEnd) onEnd(_currentProfile);
  _profiles.push(_currentProfile);
  if (_profiles.length > MAX_PROFILES) _profiles.shift();
  const result = Object.assign({}, _currentProfile);
  log.info("Profile completed", { profileId: result.id, duration: result.duration });
  _currentProfile = null;
  return result;
}
function getCurrentProfile() {
  return _currentProfile;
}
function setCurrentProfile(profile) {
  _currentProfile = profile;
}
function getProfile(profileId) {
  for (let i = 0; i < _profiles.length; i++) {
    if (_profiles[i].id === profileId) return _profiles[i];
  }
  return null;
}
function getLastProfile() {
  return _profiles.length > 0 ? _profiles[_profiles.length - 1] : null;
}
function getAllProfiles() {
  return _profiles.slice();
}
function clearProfiles() {
  _profiles.length = 0;
}
function isProfileRunning() {
  return _currentProfile !== null;
}
function getProfileCount() {
  return _profiles.length;
}
var session_default = { startProfile, endProfile, getCurrentProfile, setCurrentProfile, getProfile, getLastProfile, getAllProfiles, clearProfiles, isProfileRunning, getProfileCount };
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: ps._initialized, profileCount: _profiles.length, isRunning: !!_currentProfile };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { portsInitialized: ps._initialized, profileCount: _profiles.length, noOverflow: _profiles.length <= MAX_PROFILES } };
}
export {
  MODULE_ID,
  VERSION,
  clearProfiles,
  session_default as default,
  endProfile,
  getAllProfiles,
  getCurrentProfile,
  getLastProfile,
  getPorts,
  getProfile,
  getProfileCount,
  healthCheck,
  info,
  injectPorts,
  isProfileRunning,
  setCurrentProfile,
  startProfile
};
