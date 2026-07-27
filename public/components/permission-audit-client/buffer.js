import { CONFIG } from "./config.js";
const MODULE_ID = "components-permission-audit-client-buffer";
const VERSION = "1.2.0-P2-ENTERPRISE";
let _buffer = [];
let _flushTimer = null;
function getBuffer() {
  return _buffer;
}
function clearBuffer() {
  _buffer = [];
}
function getBufferSize() {
  return _buffer.length;
}
function addToBuffer(entry, metrics, flushFn) {
  _buffer.push(entry);
  metrics.batchCount++;
  if (entry.action === "allowed") metrics.allowedCount++;
  if (entry.action === "denied") metrics.deniedCount++;
  if (_buffer.length >= CONFIG.batchSize) flushFn();
}
function startFlushTimer(flushFn) {
  if (_flushTimer) return;
  _flushTimer = setInterval(() => {
    if (_buffer.length > 0) flushFn();
  }, CONFIG.flushInterval);
}
function stopFlushTimer() {
  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }
}
function isFlushTimerActive() {
  return _flushTimer !== null;
}
function flushBeforeUnload() {
  if (_buffer.length > 0) navigator.sendBeacon(CONFIG.endpoints.batch, JSON.stringify({ entries: _buffer }));
}
function extractBatch() {
  const batch = _buffer.slice();
  _buffer = [];
  return batch;
}
function restoreBatch(batch) {
  _buffer = batch.concat(_buffer);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, bufferSize: getBufferSize(), timerActive: isFlushTimerActive() };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true, bufferSize: getBufferSize(), timerActive: isFlushTimerActive() } };
}
var buffer_default = { getBuffer, clearBuffer, getBufferSize, addToBuffer, startFlushTimer, stopFlushTimer, isFlushTimerActive, flushBeforeUnload, extractBatch, restoreBatch, info, healthCheck, MODULE_ID, VERSION };
export {
  MODULE_ID,
  VERSION,
  addToBuffer,
  clearBuffer,
  buffer_default as default,
  extractBatch,
  flushBeforeUnload,
  getBuffer,
  getBufferSize,
  healthCheck,
  info,
  isFlushTimerActive,
  restoreBatch,
  startFlushTimer,
  stopFlushTimer
};
