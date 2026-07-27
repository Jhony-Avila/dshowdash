const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.audit-trail.buffer";
const MAX_SIZE = 1e3;
let _buffer = [];
let _flushTimerId = null;
let _pendingFlushFn = null;
function addToBuffer(entry, config, flushFn) {
  _buffer.push({ ...entry, timestamp: Date.now() });
  _pendingFlushFn = flushFn;
  if (_buffer.length > MAX_SIZE) {
    _buffer.shift();
  }
  if (config && config.batchSize && _buffer.length >= config.batchSize && flushFn) {
    flushFn();
  }
}
function extractBatch() {
  const entries = [..._buffer];
  _buffer = [];
  return entries;
}
function getBufferSize() {
  return _buffer.length;
}
function restoreBatch(entries) {
  if (Array.isArray(entries)) {
    _buffer = [...entries, ..._buffer];
    if (_buffer.length > MAX_SIZE) {
      _buffer = _buffer.slice(-MAX_SIZE);
    }
  }
}
function startFlushTimer(config, flushFn) {
  stopFlushTimer();
  _pendingFlushFn = flushFn;
  if (config && config.flushInterval > 0) {
    _flushTimerId = setInterval(() => {
      if (_buffer.length > 0 && flushFn) {
        flushFn();
      }
    }, config.flushInterval);
  }
}
function stopFlushTimer() {
  if (_flushTimerId) {
    clearInterval(_flushTimerId);
    _flushTimerId = null;
  }
}
function flushBeforeUnload() {
  if (_buffer.length > 0 && _pendingFlushFn) {
    try {
      _pendingFlushFn();
    } catch (e) {
    }
  }
}
function isFlushTimerActive() {
  return _flushTimerId !== null;
}
function clearBuffer() {
  _buffer = [];
}
const add = (entry) => addToBuffer(entry, null, null);
const get = () => [..._buffer];
const flush = extractBatch;
const size = getBufferSize;
const clear = clearBuffer;
function healthCheck() {
  const checks = {
    bufferHealthy: _buffer.length < MAX_SIZE * 0.9,
    withinLimits: _buffer.length <= MAX_SIZE,
    timerConfigured: true
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = passed === total ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY";
  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    bufferSize: _buffer.length,
    maxSize: MAX_SIZE,
    flushTimerActive: isFlushTimerActive(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    bufferSize: getBufferSize(),
    maxSize: MAX_SIZE,
    flushTimerActive: isFlushTimerActive(),
    timestamp: Date.now()
  };
}
var buffer_default = {
  addToBuffer,
  extractBatch,
  getBufferSize,
  restoreBatch,
  startFlushTimer,
  stopFlushTimer,
  flushBeforeUnload,
  isFlushTimerActive,
  clearBuffer,
  add,
  get,
  flush,
  size,
  clear,
  healthCheck,
  info,
  VERSION,
  MODULE_ID,
  MAX_SIZE
};
export {
  MAX_SIZE,
  MODULE_ID,
  VERSION,
  add,
  addToBuffer,
  clear,
  clearBuffer,
  buffer_default as default,
  extractBatch,
  flush,
  flushBeforeUnload,
  get,
  getBufferSize,
  healthCheck,
  info,
  isFlushTimerActive,
  restoreBatch,
  size,
  startFlushTimer,
  stopFlushTimer
};
