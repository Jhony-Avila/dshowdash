const VERSION = "1.3.0-WARMUP-FIX";
const MODULE_ID = "fps-monitor";
let _isRunning = false;
let _rafId = null;
let _lastTime = 0;
let _frames = 0;
let _fps = 0;
let _fpsHistory = [];
let _maxHistory = 60;
let _callbacks = /* @__PURE__ */ new Set();
let _jankThreshold = 20;
let _jankCount = 0;
let _consecutiveLowFps = 0;
let _isTabHidden = false;
let _warmupSamplesRemaining = 0;
const _WARMUP_SAMPLES = 3;
let _visibilityHandler = null;
function _onVisibilityChange() {
  if (document.hidden) {
    _isTabHidden = true;
    if (_rafId) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
  } else {
    _isTabHidden = false;
    _warmupSamplesRemaining = _WARMUP_SAMPLES;
    _consecutiveLowFps = 0;
    if (_isRunning) {
      _frames = 0;
      _lastTime = performance.now();
      _rafId = requestAnimationFrame(_loop);
    }
  }
}
function _loop(timestamp) {
  if (!_isRunning || _isTabHidden) return;
  _frames++;
  if (timestamp - _lastTime >= 1e3) {
    const measuredFps = Math.round(_frames * 1e3 / (timestamp - _lastTime));
    if (_warmupSamplesRemaining > 0) {
      _warmupSamplesRemaining--;
      _frames = 0;
      _lastTime = timestamp;
      _rafId = requestAnimationFrame(_loop);
      return;
    }
    _fps = measuredFps;
    _fpsHistory.push({ timestamp: Date.now(), fps: _fps });
    if (_fpsHistory.length > _maxHistory) {
      _fpsHistory.shift();
    }
    if (_fps > 0 && _fps < _jankThreshold) {
      _consecutiveLowFps++;
      if (_consecutiveLowFps >= 3) {
        _jankCount++;
      }
    } else {
      _consecutiveLowFps = 0;
    }
    _callbacks.forEach((cb) => cb(_fps));
    _frames = 0;
    _lastTime = timestamp;
  }
  _rafId = requestAnimationFrame(_loop);
}
function start(options = {}) {
  if (_isRunning) return;
  _maxHistory = options.maxHistory || 60;
  _jankThreshold = options.jankThreshold || 20;
  _isRunning = true;
  _isTabHidden = document.hidden;
  _warmupSamplesRemaining = 0;
  _lastTime = performance.now();
  _frames = 0;
  _consecutiveLowFps = 0;
  if (!_visibilityHandler) {
    _visibilityHandler = _onVisibilityChange;
    document.addEventListener("visibilitychange", _visibilityHandler);
  }
  if (!_isTabHidden) {
    _rafId = requestAnimationFrame(_loop);
  }
}
function stop() {
  _isRunning = false;
  if (_rafId) cancelAnimationFrame(_rafId);
  _rafId = null;
}
function getCurrentFPS() {
  return _fps;
}
function getHistory() {
  return [..._fpsHistory];
}
function clearHistory() {
  _fpsHistory = [];
  _jankCount = 0;
  _consecutiveLowFps = 0;
}
function isRunning() {
  return _isRunning;
}
function getJankCount() {
  return _jankCount;
}
function subscribe(callback) {
  _callbacks.add(callback);
  return () => _callbacks.delete(callback);
}
function getStats() {
  if (_fpsHistory.length === 0) return null;
  const values = _fpsHistory.map((h) => h.fps).filter((f) => f > 0);
  if (values.length === 0) return { current: _fps, min: 0, max: 0, avg: 0, samples: 0, jankCount: 0, jankPercent: 0 };
  return {
    current: _fps,
    // @ts-expect-error TS migration - TS2345
    min: Math.min(...values),
    // @ts-expect-error TS migration - TS2345
    max: Math.max(...values),
    // @ts-expect-error TS migration - TS2349, TS7006
    avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    samples: values.length,
    jankCount: _jankCount,
    jankPercent: values.length > 0 ? Math.round(_jankCount / values.length * 100) : 0
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    isRunning: _isRunning,
    currentFPS: _fps,
    historyLength: _fpsHistory.length,
    isTabHidden: _isTabHidden,
    warmupRemaining: _warmupSamplesRemaining
  };
}
function healthCheck() {
  const status = !_isRunning ? "NOT_RUNNING" : _isTabHidden ? "PAUSED" : _fps > 0 && _fps < 10 ? "CRITICAL" : _fps > 0 && _fps < _jankThreshold ? "WARNING" : "HEALTHY";
  return { status, version: VERSION, moduleId: MODULE_ID, isRunning: _isRunning, currentFPS: _fps, jankCount: _jankCount, isTabHidden: _isTabHidden };
}
function destroy() {
  stop();
  if (_visibilityHandler) {
    document.removeEventListener("visibilitychange", _visibilityHandler);
    _visibilityHandler = null;
  }
  _fpsHistory = [];
  _callbacks.clear();
  _jankCount = 0;
  _consecutiveLowFps = 0;
  _isTabHidden = false;
  _warmupSamplesRemaining = 0;
}
var fps_monitor_default = { start, stop, getCurrentFPS, getHistory, clearHistory, isRunning, getJankCount, subscribe, getStats, info, healthCheck, destroy, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearHistory,
  fps_monitor_default as default,
  destroy,
  getCurrentFPS,
  getHistory,
  getJankCount,
  getStats,
  healthCheck,
  info,
  isRunning,
  start,
  stop,
  subscribe
};
