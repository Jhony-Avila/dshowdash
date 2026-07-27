// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-debounce
// PURPOSE: Container-Main Debounce/Throttle Utilities
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   debounce() — exported function
//   throttle() — exported function
//   throttleRAF() — exported function
//   debounceInput() — exported function
//   throttleEvent() — exported function
//   throttleStrict() — exported function
//   leadingEdge() — exported function
//   trailingEdge() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-debounce';

// Standard debounce
export function debounce(fn: (...args: unknown[]) => void, delayMs = 300, options: Record<string, unknown> = {}) {
  const { leading = false, trailing = true, maxWait = 0 } = options;
  let timeoutId: unknown = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let lastArgs: unknown = null;
  let lastThis: unknown = null;
  
  function invokeFunc() {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = null;
    lastInvokeTime = Date.now();
    // @ts-expect-error strict migration — TS2345
    return fn.apply(thisArg, args);
  }
  
  function shouldInvoke(time: unknown) {
    const timeSinceLastCall = (time as number) - lastCallTime;
    const timeSinceLastInvoke = (time as number) - lastInvokeTime;
    return lastCallTime === 0 || timeSinceLastCall >= delayMs || (Number(maxWait) > 0 && timeSinceLastInvoke >= Number(maxWait));
  }
  
  function trailingEdge() {
    timeoutId = null;
    if (trailing && lastArgs) {
      return invokeFunc();
    }
    lastArgs = null;
    lastThis = null;
  }
  
  function debounced(this: any, ...args: unknown[]) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    
    if (isInvoking) {
      if (timeoutId === null && leading) {
        lastInvokeTime = time;
        timeoutId = setTimeout(trailingEdge, delayMs);
        return invokeFunc();
      }
    }
    
    if (timeoutId === null) {
      timeoutId = setTimeout(trailingEdge, delayMs);
    }
  }
  
  debounced.cancel = () => {
    if (timeoutId !== null) {
      // @ts-expect-error TS migration - TS2769
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
      // @ts-expect-error TS migration - TS2769
      clearTimeout(timeoutId);
      return trailingEdge();
    }
  };
  
  debounced.pending = () => timeoutId !== null;
  
  return debounced;
}

// Standard throttle
export function throttle(fn: (...args: unknown[]) => void, limitMs = 100, options: Record<string, unknown> = {}) {
  const { leading = true, trailing = true } = options;
  let lastCallTime = 0;
  let timeoutId: unknown = null;
  let lastArgs: unknown = null;
  let lastThis: unknown = null;
  
  function invokeFunc() {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = null;
    lastCallTime = Date.now();
    // @ts-expect-error strict migration — TS2345
    return fn.apply(thisArg, args);
  }
  
  function trailingEdge() {
    timeoutId = null;
    if (trailing && lastArgs) {
      invokeFunc();
    }
  }
  
  function throttled(this: any, ...args: unknown[]) {
    const now = Date.now();
    const remaining = limitMs - (now - lastCallTime);
    
    lastArgs = args;
    lastThis = this;
    
    if (remaining <= 0 || remaining > limitMs) {
      if (timeoutId) {
        // @ts-expect-error TS migration - TS2769
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (leading || lastCallTime !== 0) {
        return invokeFunc();
      }
      lastCallTime = now;
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(trailingEdge, remaining);
    }
  }
  
  throttled.cancel = () => {
    if (timeoutId !== null) {
      // @ts-expect-error TS migration - TS2769
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = 0;
    lastArgs = null;
    lastThis = null;
  };
  
  return throttled;
}

// RAF-based throttle for animations
export function throttleRAF(fn: (...args: unknown[]) => void) {
  let rafId: unknown = null;
  let lastArgs: unknown = null;
  
  function rafThrottled(...args: unknown[]) {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        // @ts-expect-error TS migration - TS2488
        fn(...lastArgs);
      });
    }
  }
  
  rafThrottled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame((rafId as number));
      rafId = null;
    }
    lastArgs = null;
  };
  
  return rafThrottled;
}

// Debounce for input fields with immediate display
export function debounceInput(fn: (...args: unknown[]) => void, delayMs = 300) {
  return debounce(fn, delayMs, { leading: false, trailing: true });
}

// Throttle for scroll/resize events
export function throttleEvent(fn: (...args: unknown[]) => void, limitMs = 16) {
  return throttle(fn, limitMs, { leading: true, trailing: true });
}

// Throttle that ensures minimum interval between calls
export function throttleStrict(this: any, fn: (...args: unknown[]) => void, intervalMs = 100) {
  let lastCallTime = 0;
  
  return function(...args: unknown[]) {
    const now = Date.now();
    if (now - lastCallTime >= intervalMs) {
      lastCallTime = now;
      // @ts-expect-error strict migration — TS2683
      return fn.apply(this, args);
    }
  };
}

// Leading edge only (immediate first call, ignore subsequent)
export function leadingEdge(fn: (...args: unknown[]) => void, delayMs = 300) {
  return debounce(fn, delayMs, { leading: true, trailing: false });
}

// Trailing edge only (standard debounce)
export function trailingEdge(fn: (...args: unknown[]) => void, delayMs = 300) {
  return debounce(fn, delayMs, { leading: false, trailing: true });
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID };
}

export default {
  debounce, throttle, throttleRAF, debounceInput, throttleEvent, throttleStrict,
  leadingEdge, trailingEdge,
  info, healthCheck, VERSION, MODULE_ID
};
