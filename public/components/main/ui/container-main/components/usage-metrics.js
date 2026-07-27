import { TELEMETRY_EVENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-usage-metrics";
import { createLogger } from "../utils/logger.js";
const logger = createLogger(MODULE_ID);
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
  if (options.trackInteractions !== void 0 && typeof options.trackInteractions !== "boolean") errors.push("trackInteractions must be a boolean");
  if (options.trackVisibility !== void 0 && typeof options.trackVisibility !== "boolean") errors.push("trackVisibility must be a boolean");
  if (options.trackTime !== void 0 && typeof options.trackTime !== "boolean") errors.push("trackTime must be a boolean");
  if (options.sampleRate !== void 0 && (typeof options.sampleRate !== "number" || options.sampleRate < 0 || options.sampleRate > 1)) errors.push("sampleRate must be a number between 0 and 1");
  if (options.batchSize !== void 0 && (typeof options.batchSize !== "number" || options.batchSize < 1)) errors.push("batchSize must be a positive number");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
function createUsageMetrics(container, options = {}) {
  _validateOptions(options);
  const { trackInteractions = true, trackVisibility = true, trackTime = true, sampleRate = 1, onMetric, batchSize = 10, flushInterval = 3e4, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _metrics = [];
  let _sessionStart = Date.now();
  let _visibleTime = 0;
  let _lastVisibleStart = null;
  let _interactionCount = 0;
  let _flushTimer = null;
  let _heartbeatTimer = null;
  let _intersectionObserver = null;
  let _boundInteractionHandlers = [];
  let _boundScrollHandler = null;
  let _boundVisibilityChange = null;
  let _boundBeforeUnload = null;
  function _shouldSample() {
    return Math.random() < sampleRate;
  }
  function _createMetric(type, data = {}) {
    return { type, containerId: container.id, timestamp: Date.now(), sessionDuration: Date.now() - _sessionStart, ...data };
  }
  function _recordMetric(type, data = {}) {
    if (!_shouldSample()) return;
    const metric = _createMetric(type, data);
    _metrics.push(metric);
    onMetric?.(metric);
    _emitEvent(TELEMETRY_EVENTS.METRICS_RECORD, { metric, containerId: container.id });
    if (_metrics.length >= batchSize) metricsApi.flush();
  }
  function _setupInteractionTracking() {
    if (!trackInteractions) return;
    const events = ["click", "keydown", "focus"];
    events.forEach((eventType) => {
      const handler = (e) => {
        _interactionCount++;
        _recordMetric("interaction", { eventType, target: e.target.tagName, targetClass: e.target.className?.split?.(" ")?.[0] || "", interactionCount: _interactionCount });
      };
      container.addEventListener(eventType, handler, { passive: true });
      _boundInteractionHandlers.push({ eventType, handler });
    });
    const content = container.querySelector(".dsd-container__content");
    if (content) {
      let lastScrollTop = 0;
      _boundScrollHandler = () => {
        const scrollTop = content.scrollTop;
        const scrollHeight = content.scrollHeight;
        const clientHeight = content.clientHeight;
        const scrollPercent = Math.round(scrollTop / (scrollHeight - clientHeight) * 100) || 0;
        if (Math.abs(scrollTop - lastScrollTop) > 100) {
          _recordMetric("scroll", { scrollPercent, scrollTop });
          lastScrollTop = scrollTop;
        }
      };
      content.addEventListener("scroll", _boundScrollHandler, { passive: true });
    }
  }
  function _setupVisibilityTracking() {
    if (!trackVisibility) return;
    _intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          _lastVisibleStart = Date.now();
          _recordMetric("visibility", { visible: true, visibilityRatio: entry.intersectionRatio });
        } else {
          if (_lastVisibleStart) {
            _visibleTime += Date.now() - _lastVisibleStart;
            _lastVisibleStart = null;
          }
          _recordMetric("visibility", { visible: false, totalVisibleTime: _visibleTime });
        }
      });
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    _intersectionObserver.observe(container);
    _boundVisibilityChange = () => {
      if (document.hidden) {
        if (_lastVisibleStart) {
          _visibleTime += Date.now() - _lastVisibleStart;
          _lastVisibleStart = null;
        }
        _recordMetric("page-hidden", { totalVisibleTime: _visibleTime });
      } else {
        _lastVisibleStart = Date.now();
        _recordMetric("page-visible", {});
      }
    };
    document.addEventListener("visibilitychange", _boundVisibilityChange);
  }
  function _setupTimeTracking() {
    if (!trackTime) return;
    _heartbeatTimer = setInterval(() => {
      _recordMetric("heartbeat", { sessionDuration: Date.now() - _sessionStart, visibleTime: _visibleTime + (_lastVisibleStart ? Date.now() - _lastVisibleStart : 0), interactionCount: _interactionCount });
    }, 6e4);
    _boundBeforeUnload = () => metricsApi.flush();
    window.addEventListener("beforeunload", _boundBeforeUnload);
  }
  function _removeAllListeners() {
    _boundInteractionHandlers.forEach(({ eventType, handler }) => container.removeEventListener(eventType, handler));
    _boundInteractionHandlers = [];
    const content = container.querySelector(".dsd-container__content");
    if (content && _boundScrollHandler) content.removeEventListener("scroll", _boundScrollHandler);
    _boundScrollHandler = null;
    if (_boundVisibilityChange) {
      document.removeEventListener("visibilitychange", _boundVisibilityChange);
      _boundVisibilityChange = null;
    }
    if (_boundBeforeUnload) {
      window.removeEventListener("beforeunload", _boundBeforeUnload);
      _boundBeforeUnload = null;
    }
  }
  const metricsApi = {
    init() {
      if (_initialized) return this;
      _sessionStart = Date.now();
      _setupInteractionTracking();
      _setupVisibilityTracking();
      _setupTimeTracking();
      _flushTimer = setInterval(() => {
        if (_metrics.length > 0) metricsApi.flush();
      }, flushInterval);
      _recordMetric("session-start", {});
      _initialized = true;
      return this;
    },
    track(eventName, data = {}) {
      _recordMetric(eventName, data);
      return this;
    },
    trackTiming(name, duration, data = {}) {
      _recordMetric("timing", { name, duration, ...data });
      return this;
    },
    startTimer(name) {
      const start = performance.now();
      return { stop: () => {
        const duration = performance.now() - start;
        this.trackTiming(name, duration);
        return duration;
      } };
    },
    getMetrics() {
      return [..._metrics];
    },
    getStats() {
      return { sessionDuration: Date.now() - _sessionStart, visibleTime: _visibleTime + (_lastVisibleStart ? Date.now() - _lastVisibleStart : 0), interactionCount: _interactionCount, metricsCount: _metrics.length };
    },
    flush() {
      if (_metrics.length === 0) return [];
      const batch = [..._metrics];
      _metrics = [];
      _emitEvent(TELEMETRY_EVENTS.METRICS_FLUSH, { metrics: batch, count: batch.length, containerId: container.id });
      return batch;
    },
    clear() {
      _metrics = [];
      return this;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      _removeAllListeners();
      if (_flushTimer) clearInterval(_flushTimer);
      if (_heartbeatTimer) clearInterval(_heartbeatTimer);
      _intersectionObserver?.disconnect();
      metricsApi.flush();
      _flushTimer = null;
      _heartbeatTimer = null;
      _intersectionObserver = null;
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true, ...metricsApi.getStats() };
    }
  };
  return metricsApi;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
}
var usage_metrics_default = { createUsageMetrics, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createUsageMetrics,
  usage_metrics_default as default,
  healthCheck,
  info,
  injectEventBus
};
