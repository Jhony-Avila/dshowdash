import { createLogger } from "./logger.js";
const VERSION = "1.2.0-LOGGER-INTEGRATED";
const MODULE_ID = "memory-monitor";
const logger = createLogger(MODULE_ID);
let _isRunning = false;
let _intervalId = null;
let _samples = [];
let _maxSamples = 60;
let _sampleInterval = 5e3;
let _callbacks = /* @__PURE__ */ new Set();
let _warningThreshold = 500;
let _criticalThreshold = 1e3;
function _getMemoryInfo() {
  if (!performance.memory) {
    return { supported: false, usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
  }
  return {
    supported: true,
    usedJSHeapSize: performance.memory.usedJSHeapSize,
    totalJSHeapSize: performance.memory.totalJSHeapSize,
    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
    usedMB: Math.round(performance.memory.usedJSHeapSize / 1048576 * 100) / 100,
    totalMB: Math.round(performance.memory.totalJSHeapSize / 1048576 * 100) / 100,
    limitMB: Math.round(performance.memory.jsHeapSizeLimit / 1048576 * 100) / 100,
    usagePercent: Math.round(performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100)
  };
}
function _collectSample() {
  const sample = { timestamp: Date.now(), ..._getMemoryInfo() };
  _samples.push(sample);
  if (_samples.length > _maxSamples) {
    _samples.shift();
  }
  if (sample.usedMB >= _criticalThreshold) {
    _notify("critical", sample);
  } else if (sample.usedMB >= _warningThreshold) {
    _notify("warning", sample);
  }
  _callbacks.forEach((cb) => cb(sample));
  return sample;
}
let _lastNotifyLevel = null;
let _notifyCount = 0;
function _notify(level, sample) {
  _notifyCount++;
  if (level !== _lastNotifyLevel || _notifyCount >= 12) {
    logger.warn(`Memory ${level}`, { usedMB: sample.usedMB, usagePercent: sample.usagePercent });
    _lastNotifyLevel = level;
    _notifyCount = 0;
  }
}
function _detectLeak() {
  if (_samples.length < 20) return { detected: false, reason: "Insufficient samples" };
  const recentSamples = _samples.slice(-20);
  const firstHalf = recentSamples.slice(0, 10);
  const secondHalf = recentSamples.slice(10);
  const avgFirst = firstHalf.reduce((a, s) => a + s.usedJSHeapSize, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, s) => a + s.usedJSHeapSize, 0) / secondHalf.length;
  if (avgFirst === 0) return { detected: false, growthRate: 0, reason: "No memory data" };
  const growthRate = (avgSecond - avgFirst) / avgFirst;
  const growthPercent = Math.round(growthRate * 100);
  if (growthRate > 0.5 && avgSecond > 200 * 1048576) {
    return { detected: true, growthRate: growthPercent, reason: "Consistent memory growth detected" };
  }
  return { detected: false, growthRate: growthPercent, reason: "Memory stable" };
}
function start(options = {}) {
  if (_isRunning) return;
  _sampleInterval = options.interval || 5e3;
  _maxSamples = options.maxSamples || 60;
  _warningThreshold = options.warningThreshold || 500;
  _criticalThreshold = options.criticalThreshold || 1e3;
  _collectSample();
  _intervalId = setInterval(_collectSample, _sampleInterval);
  _isRunning = true;
}
function stop() {
  if (_intervalId) clearInterval(_intervalId);
  _intervalId = null;
  _isRunning = false;
}
function getCurrentMemory() {
  return _getMemoryInfo();
}
function getSamples() {
  return [..._samples];
}
function getLastSample() {
  return _samples[_samples.length - 1] || null;
}
function clearSamples() {
  _samples = [];
}
function isRunning() {
  return _isRunning;
}
function detectLeak() {
  return _detectLeak();
}
function subscribe(callback) {
  _callbacks.add(callback);
  return () => _callbacks.delete(callback);
}
function getStats() {
  if (_samples.length === 0) return null;
  const usedValues = _samples.map((s) => s.usedMB).filter((v) => v > 0);
  if (usedValues.length === 0) return null;
  return {
    current: usedValues[usedValues.length - 1],
    // @ts-expect-error TS migration - TS2345
    min: Math.min(...usedValues),
    // @ts-expect-error TS migration - TS2345
    max: Math.max(...usedValues),
    // @ts-expect-error TS migration - TS2349, TS7006
    avg: Math.round(usedValues.reduce((a, b) => a + b, 0) / usedValues.length * 100) / 100,
    samples: usedValues.length,
    leak: _detectLeak()
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, isRunning: _isRunning, samplesCount: _samples.length, memorySupported: !!performance.memory };
}
function healthCheck() {
  const mem = _getMemoryInfo();
  const status = !mem.supported ? "UNSUPPORTED" : mem.usedMB >= _criticalThreshold ? "CRITICAL" : mem.usedMB >= _warningThreshold ? "WARNING" : "HEALTHY";
  return { status, version: VERSION, moduleId: MODULE_ID, isRunning: _isRunning, currentMemoryMB: mem.usedMB, leak: _detectLeak() };
}
function destroy() {
  stop();
  _samples = [];
  _callbacks.clear();
  _lastNotifyLevel = null;
  _notifyCount = 0;
}
var memory_monitor_default = { start, stop, getCurrentMemory, getSamples, getLastSample, clearSamples, isRunning, detectLeak, subscribe, getStats, info, healthCheck, destroy, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearSamples,
  memory_monitor_default as default,
  destroy,
  detectLeak,
  getCurrentMemory,
  getLastSample,
  getSamples,
  getStats,
  healthCheck,
  info,
  isRunning,
  start,
  stop,
  subscribe
};
