const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-debounce";
function debounce(fn, delayMs = 300, options = {}) {
  const { leading = false, trailing = true, maxWait = 0 } = options;
  let timeoutId = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let lastArgs = null;
  let lastThis = null;
  function invokeFunc() {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = null;
    lastInvokeTime = Date.now();
    return fn.apply(thisArg, args);
  }
  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    return lastCallTime === 0 || timeSinceLastCall >= delayMs || Number(maxWait) > 0 && timeSinceLastInvoke >= Number(maxWait);
  }
  function trailingEdge2() {
    timeoutId = null;
    if (trailing && lastArgs) {
      return invokeFunc();
    }
    lastArgs = null;
    lastThis = null;
  }
  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    if (isInvoking) {
      if (timeoutId === null && leading) {
        lastInvokeTime = time;
        timeoutId = setTimeout(trailingEdge2, delayMs);
        return invokeFunc();
      }
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(trailingEdge2, delayMs);
    }
  }
  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = 0;
    lastInvokeTime = 0;
    lastArgs = null;
    lastThis = null;
  };
  debounced.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      return trailingEdge2();
    }
  };
  debounced.pending = () => timeoutId !== null;
  return debounced;
}
function throttle(fn, limitMs = 100, options = {}) {
  const { leading = true, trailing = true } = options;
  let lastCallTime = 0;
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  function invokeFunc() {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = null;
    lastCallTime = Date.now();
    return fn.apply(thisArg, args);
  }
  function trailingEdge2() {
    timeoutId = null;
    if (trailing && lastArgs) {
      invokeFunc();
    }
  }
  function throttled(...args) {
    const now = Date.now();
    const remaining = limitMs - (now - lastCallTime);
    lastArgs = args;
    lastThis = this;
    if (remaining <= 0 || remaining > limitMs) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (leading || lastCallTime !== 0) {
        return invokeFunc();
      }
      lastCallTime = now;
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(trailingEdge2, remaining);
    }
  }
  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = 0;
    lastArgs = null;
    lastThis = null;
  };
  return throttled;
}
function throttleRAF(fn) {
  let rafId = null;
  let lastArgs = null;
  function rafThrottled(...args) {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        fn(...lastArgs);
      });
    }
  }
  rafThrottled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastArgs = null;
  };
  return rafThrottled;
}
function debounceInput(fn, delayMs = 300) {
  return debounce(fn, delayMs, { leading: false, trailing: true });
}
function throttleEvent(fn, limitMs = 16) {
  return throttle(fn, limitMs, { leading: true, trailing: true });
}
function throttleStrict(fn, intervalMs = 100) {
  let lastCallTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCallTime >= intervalMs) {
      lastCallTime = now;
      return fn.apply(this, args);
    }
  };
}
function leadingEdge(fn, delayMs = 300) {
  return debounce(fn, delayMs, { leading: true, trailing: false });
}
function trailingEdge(fn, delayMs = 300) {
  return debounce(fn, delayMs, { leading: false, trailing: true });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var debounce_default = {
  debounce,
  throttle,
  throttleRAF,
  debounceInput,
  throttleEvent,
  throttleStrict,
  leadingEdge,
  trailingEdge,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  debounce,
  debounceInput,
  debounce_default as default,
  healthCheck,
  info,
  leadingEdge,
  throttle,
  throttleEvent,
  throttleRAF,
  throttleStrict,
  trailingEdge
};
