const VERSION = "8.3.0-VISIBILITY-AWARE";
const MODULE_ID = "container-performance-monitor";
import { createLogger } from "../utils/logger.js";
const logger = createLogger(MODULE_ID);
const PERFORMANCE_EVENTS = { UPDATE: "performance:update", WARNING: "performance:warning" };
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _getEventBus() {
  return _injectedEventBus;
}
function _emitEvent(eventType, payload) {
  const eb = _getEventBus();
  if (eb?.emit) {
    eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
    return true;
  }
  return false;
}
function _validateOptions(options) {
  const errors = [];
  if (options.trackFPS !== void 0 && typeof options.trackFPS !== "boolean") errors.push("trackFPS must be a boolean");
  if (options.trackMemory !== void 0 && typeof options.trackMemory !== "boolean") errors.push("trackMemory must be a boolean");
  if (options.sampleInterval !== void 0 && (typeof options.sampleInterval !== "number" || options.sampleInterval < 100)) errors.push("sampleInterval must be a number >= 100");
  if (options.showOverlay !== void 0 && typeof options.showOverlay !== "boolean") errors.push("showOverlay must be a boolean");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
function createPerformanceMonitor(container, options = {}) {
  _validateOptions(options);
  const { trackFPS = true, trackMemory = true, trackRenderTime = true, trackLayoutShifts = true, sampleInterval = 1e3, warningThresholds: _warningThresholds = { fps: 30, memory: 100, renderTime: 16, layoutShift: 0.1 }, onWarning, showOverlay = false, eventBus } = options;
  const warningThresholds = _warningThresholds;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _isRunning = false;
  let _animationFrameId = null;
  let _intervalId = null;
  let _overlayEl = null;
  let _layoutShiftObserver = null;
  let _metrics = { fps: 60, fpsHistory: [], memory: 0, memoryHistory: [], renderTime: 0, renderTimeHistory: [], layoutShiftScore: 0, warnings: [] };
  let _frameCount = 0;
  let _lastFpsTime = performance.now();
  let _fpsTabHidden = false;
  let _fpsWarmupRemaining = 0;
  const _FPS_WARMUP_SAMPLES = 3;
  let _visibilityHandler = null;
  function _onVisibilityChange() {
    if (document.hidden) {
      _fpsTabHidden = true;
      if (_animationFrameId) {
        cancelAnimationFrame(_animationFrameId);
        _animationFrameId = null;
      }
    } else {
      _fpsTabHidden = false;
      _fpsWarmupRemaining = _FPS_WARMUP_SAMPLES;
      if (_isRunning && trackFPS) {
        _frameCount = 0;
        _lastFpsTime = performance.now();
        _animationFrameId = requestAnimationFrame(_trackFPS);
      }
    }
  }
  function _trackFPS() {
    if (!trackFPS || _fpsTabHidden) return;
    _frameCount++;
    const now = performance.now();
    const elapsed = now - _lastFpsTime;
    if (elapsed >= 1e3) {
      const measuredFps = Math.round(_frameCount * 1e3 / elapsed);
      if (_fpsWarmupRemaining > 0) {
        _fpsWarmupRemaining--;
        _frameCount = 0;
        _lastFpsTime = now;
        if (_isRunning) _animationFrameId = requestAnimationFrame(_trackFPS);
        return;
      }
      _metrics.fps = measuredFps;
      _metrics.fpsHistory.push(_metrics.fps);
      if (_metrics.fpsHistory.length > 60) _metrics.fpsHistory.shift();
      _frameCount = 0;
      _lastFpsTime = now;
      if (_metrics.fps < warningThresholds.fps) _addWarning("fps", `FPS baixo: ${_metrics.fps}`);
    }
    if (_isRunning) _animationFrameId = requestAnimationFrame(_trackFPS);
  }
  function _trackMemory() {
    if (!trackMemory || !performance.memory) return;
    _metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
    _metrics.memoryHistory.push(_metrics.memory);
    if (_metrics.memoryHistory.length > 60) _metrics.memoryHistory.shift();
    if (_metrics.memory > warningThresholds.memory) _addWarning("memory", `Mem\xF3ria alta: ${_metrics.memory}MB`);
  }
  function _trackRenderTime() {
    if (!trackRenderTime) return;
    const entries = performance.getEntriesByType("paint");
    const lastPaint = entries[entries.length - 1];
    if (lastPaint) {
      _metrics.renderTime = Math.round(lastPaint.duration * 100) / 100;
      _metrics.renderTimeHistory.push(_metrics.renderTime);
      if (_metrics.renderTimeHistory.length > 60) _metrics.renderTimeHistory.shift();
      if (_metrics.renderTime > warningThresholds.renderTime) _addWarning("renderTime", `Render lento: ${_metrics.renderTime}ms`);
    }
  }
  function _setupLayoutShiftObserver() {
    if (!trackLayoutShifts || typeof PerformanceObserver === "undefined") return null;
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            _metrics.layoutShiftScore += entry.value;
            if (entry.value > warningThresholds.layoutShift) _addWarning("layoutShift", `Layout shift: ${entry.value.toFixed(4)}`);
          }
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
      return observer;
    } catch {
      return null;
    }
  }
  function _addWarning(type, message) {
    const warning = { type, message, timestamp: Date.now() };
    _metrics.warnings.push(warning);
    if (_metrics.warnings.length > 20) _metrics.warnings.shift();
    if (typeof onWarning === "function") onWarning(warning);
    _emitEvent(PERFORMANCE_EVENTS.WARNING, { warning, containerId: container.id });
  }
  function _createOverlay() {
    if (!showOverlay) return null;
    let existing = container.querySelector(".dsd-perf-overlay");
    if (existing) return existing;
    const overlay = document.createElement("div");
    overlay.className = "dsd-perf-overlay";
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-label", "Monitor de performance");
    overlay.setAttribute("aria-live", "polite");
    overlay.innerHTML = `<div class="dsd-perf-overlay__item"><span class="dsd-perf-overlay__label">FPS</span><span class="dsd-perf-overlay__value" data-metric="fps">--</span></div><div class="dsd-perf-overlay__item"><span class="dsd-perf-overlay__label">MEM</span><span class="dsd-perf-overlay__value" data-metric="memory">--</span></div><div class="dsd-perf-overlay__item"><span class="dsd-perf-overlay__label">RT</span><span class="dsd-perf-overlay__value" data-metric="renderTime">--</span></div>`;
    container.appendChild(overlay);
    return overlay;
  }
  function _updateOverlay() {
    if (!_overlayEl) return;
    const fpsEl = _overlayEl.querySelector('[data-metric="fps"]');
    const memEl = _overlayEl.querySelector('[data-metric="memory"]');
    const rtEl = _overlayEl.querySelector('[data-metric="renderTime"]');
    if (fpsEl) {
      fpsEl.textContent = `${_metrics.fps}`;
      fpsEl.classList.toggle("dsd-perf-overlay__value--warning", _metrics.fps < warningThresholds.fps);
    }
    if (memEl) {
      memEl.textContent = `${_metrics.memory}MB`;
      memEl.classList.toggle("dsd-perf-overlay__value--warning", _metrics.memory > warningThresholds.memory);
    }
    if (rtEl) {
      rtEl.textContent = `${_metrics.renderTime}ms`;
      rtEl.classList.toggle("dsd-perf-overlay__value--warning", _metrics.renderTime > warningThresholds.renderTime);
    }
  }
  const perfMonitor = {
    init() {
      if (_initialized) return this;
      _overlayEl = _createOverlay();
      _layoutShiftObserver = _setupLayoutShiftObserver();
      if (!_visibilityHandler) {
        _visibilityHandler = _onVisibilityChange;
        document.addEventListener("visibilitychange", _visibilityHandler);
      }
      _fpsTabHidden = document.hidden;
      _initialized = true;
      return this;
    },
    start() {
      if (_isRunning) return this;
      _isRunning = true;
      _lastFpsTime = performance.now();
      if (trackFPS && !_fpsTabHidden) _animationFrameId = requestAnimationFrame(_trackFPS);
      _intervalId = setInterval(() => {
        _trackMemory();
        _trackRenderTime();
        _updateOverlay();
        _emitEvent(PERFORMANCE_EVENTS.UPDATE, { metrics: perfMonitor.getMetrics(), containerId: container.id });
      }, sampleInterval);
      return this;
    },
    stop() {
      _isRunning = false;
      if (_animationFrameId) {
        cancelAnimationFrame(_animationFrameId);
        _animationFrameId = null;
      }
      if (_intervalId) {
        clearInterval(_intervalId);
        _intervalId = null;
      }
      return this;
    },
    isRunning() {
      return _isRunning;
    },
    getMetrics() {
      return {
        fps: _metrics.fps,
        fpsAvg: _metrics.fpsHistory.length > 0 ? Math.round(_metrics.fpsHistory.reduce((a, b) => a + b, 0) / _metrics.fpsHistory.length) : 0,
        memory: _metrics.memory,
        memoryPeak: Math.max(..._metrics.memoryHistory, 0),
        renderTime: _metrics.renderTime,
        renderTimeAvg: _metrics.renderTimeHistory.length > 0 ? Math.round(_metrics.renderTimeHistory.reduce((a, b) => a + b, 0) / _metrics.renderTimeHistory.length * 100) / 100 : 0,
        layoutShiftScore: Math.round(_metrics.layoutShiftScore * 1e4) / 1e4,
        warningCount: _metrics.warnings.length
      };
    },
    getWarnings() {
      return [..._metrics.warnings];
    },
    clearWarnings() {
      _metrics.warnings = [];
      return this;
    },
    mark(name) {
      performance.mark(`dsd-${container.id}-${name}`);
      return this;
    },
    measure(name, startMark, endMark) {
      try {
        performance.measure(`dsd-${container.id}-${name}`, `dsd-${container.id}-${startMark}`, `dsd-${container.id}-${endMark}`);
        const entries = performance.getEntriesByName(`dsd-${container.id}-${name}`);
        return entries[entries.length - 1]?.duration || 0;
      } catch {
        return 0;
      }
    },
    showOverlay() {
      if (!_overlayEl) _overlayEl = _createOverlay();
      _overlayEl?.classList.add("dsd-perf-overlay--visible");
      return this;
    },
    hideOverlay() {
      _overlayEl?.classList.remove("dsd-perf-overlay--visible");
      return this;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      this.stop();
      _layoutShiftObserver?.disconnect();
      _layoutShiftObserver = null;
      _overlayEl?.remove();
      _overlayEl = null;
      if (_visibilityHandler) {
        document.removeEventListener("visibilitychange", _visibilityHandler);
        _visibilityHandler = null;
      }
      _fpsTabHidden = false;
      _fpsWarmupRemaining = 0;
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, isRunning: _isRunning, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true, fpsTabHidden: _fpsTabHidden, ...perfMonitor.getMetrics() };
    }
  };
  return perfMonitor;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
}
var performance_monitor_default = { createPerformanceMonitor, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createPerformanceMonitor,
  performance_monitor_default as default,
  healthCheck,
  info,
  injectEventBus
};
