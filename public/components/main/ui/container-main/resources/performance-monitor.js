import * as memoryMonitor from "../utils/memory-monitor.js";
import * as fpsMonitor from "../utils/fps-monitor.js";
import * as telemetry from "../utils/telemetry.js";
import { createLogger } from "../utils/logger.js";
var VERSION = "1.2.0-THRESHOLD-TUNING";
var MODULE_ID = "container-main:performance-monitor";
var MONITOR_STATES = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
  DEGRADED: "degraded",
  CRITICAL: "critical"
});
var DEFAULT_THRESHOLDS = Object.freeze({
  memoryWarningMB: 500,
  memoryCriticalMB: 1e3,
  fpsWarning: 15,
  fpsCritical: 8,
  jankPercentWarning: 20,
  jankPercentCritical: 40,
  alertCooldownMs: 9e4
});
function createPerformanceMonitor(options) {
  if (options === void 0) options = {};
  var eventBus = options.eventBus || null;
  var thresholds = options.thresholds || {};
  var autoStart = options.autoStart || false;
  var sampleInterval = options.sampleInterval || 5e3;
  var onWarning = options.onWarning || null;
  var onCritical = options.onCritical || null;
  var onStateChange = options.onStateChange || null;
  var _thresholds = Object.assign({}, DEFAULT_THRESHOLDS, thresholds);
  var _logger = createLogger(MODULE_ID);
  var _state = MONITOR_STATES.IDLE;
  var _eventBus = eventBus;
  var _checkInterval = null;
  var _lastCheck = null;
  var _history = [];
  var _alerts = [];
  var _lastAlertByType = {};
  function _emit(event, data) {
    if (_eventBus && typeof _eventBus.emit === "function") {
      _eventBus.emit(event, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
    }
  }
  function _setState(newState) {
    if (_state === newState) return;
    var oldState = _state;
    _state = newState;
    _logger.debug("State: " + oldState + " -> " + newState);
    if (typeof onStateChange === "function") onStateChange(newState, oldState);
    _emit("performance:state-changed", { state: newState, previousState: oldState });
  }
  function _canCreateAlert(type) {
    var lastTime = _lastAlertByType[type] || 0;
    var now = Date.now();
    return now - lastTime >= _thresholds.alertCooldownMs;
  }
  function _createAlert(type, level, message, data) {
    if (data === void 0) data = {};
    if (!_canCreateAlert(type)) return null;
    _lastAlertByType[type] = Date.now();
    var alert = {
      id: "alert-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
      timestamp: Date.now(),
      type,
      level,
      message,
      data
    };
    _alerts.push(alert);
    if (_alerts.length > 100) _alerts.shift();
    _emit("performance:" + level, alert);
    if (level === "warning" && typeof onWarning === "function") onWarning(alert);
    if (level === "critical" && typeof onCritical === "function") onCritical(alert);
    return alert;
  }
  function _collectSnapshot() {
    var memory = memoryMonitor.getCurrentMemory();
    var fps = fpsMonitor.getCurrentFPS();
    var memoryStats = memoryMonitor.getStats();
    var fpsStats = fpsMonitor.getStats();
    var snapshot = {
      timestamp: Date.now(),
      memory: {
        usedMB: memory.usedMB || 0,
        usagePercent: memory.usagePercent || 0,
        leak: memoryMonitor.detectLeak()
      },
      fps: {
        current: fps,
        jankCount: fpsMonitor.getJankCount(),
        jankPercent: fpsStats && fpsStats.jankPercent ? fpsStats.jankPercent : 0
      },
      stats: {
        memory: memoryStats,
        fps: fpsStats
      }
    };
    _history.push(snapshot);
    if (_history.length > 60) _history.shift();
    _lastCheck = snapshot;
    _evaluateState(snapshot);
    if (_history.length % 12 === 0) {
      telemetry.track("performance", "snapshot", "", null, snapshot);
    }
    return snapshot;
  }
  function _evaluateState(snapshot) {
    var memory = snapshot.memory;
    var fps = snapshot.fps;
    var newState = MONITOR_STATES.RUNNING;
    if (memory.usedMB >= _thresholds.memoryCriticalMB) {
      newState = MONITOR_STATES.CRITICAL;
      _createAlert("memory", "critical", "Memory critical: " + Math.round(memory.usedMB) + "MB", { usedMB: memory.usedMB });
    } else if (fps.current > 0 && fps.current < _thresholds.fpsCritical) {
      newState = MONITOR_STATES.CRITICAL;
      _createAlert("fps", "critical", "FPS critical: " + fps.current, { fps: fps.current });
    } else if (memory.usedMB >= _thresholds.memoryWarningMB) {
      newState = MONITOR_STATES.DEGRADED;
      _createAlert("memory", "warning", "Memory warning: " + Math.round(memory.usedMB) + "MB", { usedMB: memory.usedMB });
    } else if (fps.current > 0 && fps.current < _thresholds.fpsWarning) {
      newState = MONITOR_STATES.DEGRADED;
      _createAlert("fps", "warning", "FPS warning: " + fps.current, { fps: fps.current });
    } else if (fps.jankPercent >= _thresholds.jankPercentCritical) {
      newState = MONITOR_STATES.DEGRADED;
      _createAlert("jank", "warning", "Jank detected: " + fps.jankPercent + "%", { jankPercent: fps.jankPercent });
    } else if (memory.leak && memory.leak.detected && memory.leak.growthRate > 100) {
      newState = MONITOR_STATES.DEGRADED;
      _createAlert("leak", "warning", "Memory leak detected", memory.leak);
    }
    _setState(newState);
  }
  var monitor = {
    init: function() {
      telemetry.injectEventBus(_eventBus);
      _logger.debug("Performance monitor initialized");
      _emit("performance:initialized", {});
      return this;
    },
    start: function() {
      if (_state === MONITOR_STATES.RUNNING) return this;
      memoryMonitor.start({
        interval: sampleInterval,
        warningThreshold: _thresholds.memoryWarningMB,
        criticalThreshold: _thresholds.memoryCriticalMB
      });
      fpsMonitor.start({
        jankThreshold: _thresholds.fpsWarning
      });
      _collectSnapshot();
      _checkInterval = setInterval(function() {
        _collectSnapshot();
      }, sampleInterval);
      _setState(MONITOR_STATES.RUNNING);
      _logger.debug("Performance monitoring started");
      _emit("performance:started", {});
      return this;
    },
    stop: function() {
      if (_checkInterval) {
        clearInterval(_checkInterval);
        _checkInterval = null;
      }
      memoryMonitor.stop();
      fpsMonitor.stop();
      _setState(MONITOR_STATES.IDLE);
      _logger.debug("Performance monitoring stopped");
      _emit("performance:stopped", {});
      return this;
    },
    pause: function() {
      if (_state !== MONITOR_STATES.RUNNING && _state !== MONITOR_STATES.DEGRADED) return this;
      if (_checkInterval) {
        clearInterval(_checkInterval);
        _checkInterval = null;
      }
      fpsMonitor.stop();
      _setState(MONITOR_STATES.PAUSED);
      _emit("performance:paused", {});
      return this;
    },
    resume: function() {
      if (_state !== MONITOR_STATES.PAUSED) return this;
      fpsMonitor.start({ jankThreshold: _thresholds.fpsWarning });
      _checkInterval = setInterval(function() {
        _collectSnapshot();
      }, sampleInterval);
      _setState(MONITOR_STATES.RUNNING);
      _emit("performance:resumed", {});
      return this;
    },
    collect: function() {
      return _collectSnapshot();
    },
    getState: function() {
      return _state;
    },
    getLastCheck: function() {
      return _lastCheck;
    },
    getHistory: function() {
      return _history.slice();
    },
    getAlerts: function(limit) {
      return _alerts.slice(-(limit || 20));
    },
    getThresholds: function() {
      return Object.assign({}, _thresholds);
    },
    getStats: function() {
      return {
        state: _state,
        memory: memoryMonitor.getStats(),
        fps: fpsMonitor.getStats(),
        alertCount: _alerts.length,
        historyLength: _history.length,
        lastCheck: _lastCheck ? _lastCheck.timestamp : null
      };
    },
    onMemory: function(callback) {
      return memoryMonitor.subscribe(callback);
    },
    onFPS: function(callback) {
      return fpsMonitor.subscribe(callback);
    },
    track: function(category, action, label = "", value = null, meta = {}) {
      return telemetry.track(category, action, label, value, meta);
    },
    clearHistory: function() {
      _history = [];
      _alerts = [];
      _lastAlertByType = {};
      memoryMonitor.clearSamples();
      fpsMonitor.clearHistory();
    },
    resetCooldowns: function() {
      _lastAlertByType = {};
    },
    healthCheck: function() {
      var memHealth = memoryMonitor.healthCheck();
      var fpsHealth = fpsMonitor.healthCheck();
      var status = "HEALTHY";
      if (_state === MONITOR_STATES.CRITICAL) status = "CRITICAL";
      else if (_state === MONITOR_STATES.DEGRADED) status = "WARNING";
      else if (_state === MONITOR_STATES.IDLE) status = "NOT_RUNNING";
      else if (memHealth.status === "CRITICAL" || fpsHealth.status === "CRITICAL") status = "CRITICAL";
      else if (memHealth.status === "WARNING" || fpsHealth.status === "WARNING") status = "WARNING";
      return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        monitorState: _state,
        subsystems: {
          memory: memHealth,
          fps: fpsHealth
        },
        alertCount: _alerts.length,
        lastCheck: _lastCheck ? _lastCheck.timestamp : null
      };
    },
    info: function() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        state: _state,
        thresholds: _thresholds,
        historyLength: _history.length,
        alertCount: _alerts.length,
        subsystems: ["memory-monitor", "fps-monitor", "telemetry"]
      };
    },
    destroy: function() {
      this.stop();
      memoryMonitor.destroy();
      fpsMonitor.destroy();
      _history = [];
      _alerts = [];
      _lastAlertByType = {};
      _logger.debug("Performance monitor destroyed");
    }
  };
  if (autoStart) {
    monitor.init().start();
  }
  return monitor;
}
var _instance = null;
function getPerformanceMonitor(options) {
  if (options === void 0) options = {};
  if (!_instance) {
    _instance = createPerformanceMonitor(options);
  }
  return _instance;
}
function resetPerformanceMonitor() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, states: Object.keys(MONITOR_STATES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var performance_monitor_default = {
  VERSION,
  MODULE_ID,
  MONITOR_STATES,
  DEFAULT_THRESHOLDS,
  createPerformanceMonitor,
  getPerformanceMonitor,
  resetPerformanceMonitor,
  info,
  healthCheck
};
export {
  DEFAULT_THRESHOLDS,
  MODULE_ID,
  MONITOR_STATES,
  VERSION,
  createPerformanceMonitor,
  performance_monitor_default as default,
  getPerformanceMonitor,
  healthCheck,
  info,
  resetPerformanceMonitor
};
