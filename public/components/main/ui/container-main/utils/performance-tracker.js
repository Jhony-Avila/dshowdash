import * as fpsMonitor from "./fps-monitor.js";
import * as memoryMonitor from "./memory-monitor.js";
const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "performance-tracker";
let _isRunning = false;
let _callbacks = /* @__PURE__ */ new Set();
let _intervalId = null;
function start(options = {}) {
  if (_isRunning) return;
  fpsMonitor.start({ jankThreshold: options.fpsThreshold || 30 });
  memoryMonitor.start({
    warningThreshold: options.memoryWarning || 100,
    criticalThreshold: options.memoryCritical || 200
  });
  _intervalId = setInterval(() => {
    const snapshot = getSnapshot();
    _callbacks.forEach((cb) => cb(snapshot));
  }, Number(options.reportInterval || 5e3));
  _isRunning = true;
}
function stop() {
  fpsMonitor.stop();
  memoryMonitor.stop();
  if (_intervalId) clearInterval(_intervalId);
  _intervalId = null;
  _isRunning = false;
}
function getSnapshot() {
  return {
    timestamp: Date.now(),
    fps: fpsMonitor.getStats(),
    memory: memoryMonitor.getStats(),
    isHealthy: isHealthy()
  };
}
function isHealthy() {
  const fpsHealth = fpsMonitor.healthCheck();
  const memHealth = memoryMonitor.healthCheck();
  return fpsHealth.status === "HEALTHY" && (memHealth.status === "HEALTHY" || memHealth.status === "UNSUPPORTED");
}
function subscribe(callback) {
  _callbacks.add(callback);
  return () => _callbacks.delete(callback);
}
function isRunning() {
  return _isRunning;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, isRunning: _isRunning, fps: fpsMonitor.info(), memory: memoryMonitor.info() };
}
function healthCheck() {
  const fpsHealth = fpsMonitor.healthCheck();
  const memHealth = memoryMonitor.healthCheck();
  let status = "HEALTHY";
  if (fpsHealth.status === "CRITICAL" || memHealth.status === "CRITICAL") status = "CRITICAL";
  else if (fpsHealth.status === "WARNING" || memHealth.status === "WARNING") status = "WARNING";
  else if (!_isRunning) status = "NOT_RUNNING";
  return { status, version: VERSION, moduleId: MODULE_ID, isRunning: _isRunning, fps: fpsHealth, memory: memHealth };
}
function destroy() {
  stop();
  fpsMonitor.destroy();
  memoryMonitor.destroy();
  _callbacks.clear();
}
var performance_tracker_default = { start, stop, getSnapshot, isHealthy, subscribe, isRunning, info, healthCheck, destroy, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  performance_tracker_default as default,
  destroy,
  getSnapshot,
  healthCheck,
  info,
  isHealthy,
  isRunning,
  start,
  stop,
  subscribe
};
