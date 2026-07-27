const VERSION = "1.0.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-rate-limiter";
const PRESETS = Object.freeze({ RESIZE: 150, SCROLL: 100, INPUT: 300, SEARCH: 400, MOUSEMOVE: 50, CLICK: 250 });
const _throttled = /* @__PURE__ */ new Map();
const _debounced = /* @__PURE__ */ new Map();
const _metrics = { throttleCalls: 0, throttleSkipped: 0, debounceCalls: 0, debounceSkipped: 0 };
function throttle(fn, delay, options) {
  options = options || {};
  const leading = options.leading !== false;
  const trailing = options.trailing !== false;
  let lastCall = 0, lastArgs = null, timeoutId = null;
  function throttled() {
    _metrics.throttleCalls++;
    const now = Date.now();
    const remaining = delay - (now - lastCall);
    lastArgs = arguments;
    if (remaining <= 0 || remaining > delay) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn.apply(this, lastArgs);
    } else if (!timeoutId && trailing) {
      const self = this;
      timeoutId = setTimeout(() => {
        lastCall = leading ? Date.now() : 0;
        timeoutId = null;
        fn.apply(self, lastArgs);
      }, remaining);
    } else {
      _metrics.throttleSkipped++;
    }
  }
  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  throttled.flush = function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      fn.apply(this, lastArgs);
    }
  };
  return throttled;
}
function debounce(fn, delay, options) {
  options = options || {};
  const leading = options.leading || false;
  const trailing = options.trailing !== false;
  const maxWait = options.maxWait;
  let timeoutId = null, lastArgs = null, lastThis = null, lastCallTime = 0, lastInvokeTime = 0;
  function invokeFunc(time) {
    lastInvokeTime = time;
    fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = null;
  }
  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    return lastCallTime === 0 || timeSinceLastCall >= delay || maxWait !== void 0 && timeSinceLastInvoke >= maxWait;
  }
  function debounced() {
    _metrics.debounceCalls++;
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;
    if (isInvoking && leading && !timeoutId) {
      invokeFunc(time);
      return;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      _metrics.debounceSkipped++;
    }
    if (trailing) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        invokeFunc(Date.now());
      }, delay);
    }
  }
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = lastThis = null;
    lastCallTime = 0;
  };
  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      invokeFunc(Date.now());
    }
  };
  debounced.pending = () => timeoutId !== null;
  return debounced;
}
function rafThrottle(fn) {
  let rafId = null, lastArgs = null;
  function throttled() {
    lastArgs = arguments;
    if (rafId) return;
    const self = this;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      fn.apply(self, lastArgs);
    });
  }
  throttled.cancel = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
  return throttled;
}
function getThrottled(name, fn, delay, options) {
  if (_throttled.has(name)) return _throttled.get(name);
  const t = throttle(fn, delay, options);
  _throttled.set(name, t);
  return t;
}
function getDebounced(name, fn, delay, options) {
  if (_debounced.has(name)) return _debounced.get(name);
  const d = debounce(fn, delay, options);
  _debounced.set(name, d);
  return d;
}
function removeThrottled(name) {
  const t = _throttled.get(name);
  if (t) {
    t.cancel();
    _throttled.delete(name);
    return true;
  }
  return false;
}
function removeDebounced(name) {
  const d = _debounced.get(name);
  if (d) {
    d.cancel();
    _debounced.delete(name);
    return true;
  }
  return false;
}
function clearAll() {
  _throttled.forEach((t) => {
    t.cancel();
  });
  _debounced.forEach((d) => {
    d.cancel();
  });
  _throttled.clear();
  _debounced.clear();
}
function throttleWithPreset(fn, presetName, options) {
  const delay = PRESETS[presetName] || PRESETS[presetName.toUpperCase()] || 100;
  return throttle(fn, delay, options);
}
function debounceWithPreset(fn, presetName, options) {
  const delay = PRESETS[presetName] || PRESETS[presetName.toUpperCase()] || 300;
  return debounce(fn, delay, options);
}
function getMetrics() {
  return Object.assign({}, _metrics, { managedThrottled: _throttled.size, managedDebounced: _debounced.size });
}
function healthCheck() {
  const checks = { operational: true, notOverloaded: _throttled.size + _debounced.size < 100 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, presets: PRESETS, managedThrottled: Array.from(_throttled.keys()), managedDebounced: Array.from(_debounced.keys()), metrics: getMetrics(), timestamp: Date.now() };
}
var rate_limiter_default = { VERSION, MODULE_ID, PRESETS, throttle, debounce, rafThrottle, getThrottled, getDebounced, removeThrottled, removeDebounced, clearAll, throttleWithPreset, debounceWithPreset, getMetrics, healthCheck, info };
export {
  MODULE_ID,
  PRESETS,
  VERSION,
  clearAll,
  debounce,
  debounceWithPreset,
  rate_limiter_default as default,
  getDebounced,
  getMetrics,
  getThrottled,
  healthCheck,
  info,
  rafThrottle,
  removeDebounced,
  removeThrottled,
  throttle,
  throttleWithPreset
};
