const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.memory-leak-detector.patchers";
let _origAddEvent = null;
let _origRemoveEvent = null;
let _origSetInterval = null;
let _origClearInterval = null;
let _origSetTimeout = null;
let _origClearTimeout = null;
function _generateId() {
  return `leak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function patchEventListeners(trackedListeners) {
  if (_origAddEvent) return;
  _origAddEvent = EventTarget.prototype.addEventListener;
  _origRemoveEvent = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    const id = _generateId();
    const target = this;
    trackedListeners.set(id, {
      id,
      target,
      targetName: target.constructor ? target.constructor.name : "Unknown",
      type,
      listener,
      options,
      addedAt: Date.now(),
      stack: new Error().stack
    });
    return _origAddEvent.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function(type, listener, options) {
    trackedListeners.forEach(function(entry, id) {
      if (entry.target === this && entry.type === type && entry.listener === listener) {
        trackedListeners.delete(id);
      }
    }, this);
    return _origRemoveEvent.call(this, type, listener, options);
  };
}
function unpatchEventListeners() {
  if (_origAddEvent) {
    EventTarget.prototype.addEventListener = _origAddEvent;
    EventTarget.prototype.removeEventListener = _origRemoveEvent;
    _origAddEvent = null;
    _origRemoveEvent = null;
  }
}
function patchTimers(trackedIntervals, trackedTimeouts) {
  if (_origSetInterval) return;
  _origSetInterval = window.setInterval;
  _origClearInterval = window.clearInterval;
  _origSetTimeout = window.setTimeout;
  _origClearTimeout = window.clearTimeout;
  window.setInterval = function(fn, delay) {
    const id = _origSetInterval.apply(window, arguments);
    trackedIntervals.set(id, {
      id,
      delay,
      createdAt: Date.now(),
      stack: new Error().stack
    });
    return id;
  };
  window.clearInterval = (id) => {
    trackedIntervals.delete(id);
    return _origClearInterval.call(window, id);
  };
  window.setTimeout = function(fn, delay) {
    const id = _origSetTimeout.apply(window, arguments);
    trackedTimeouts.set(id, {
      id,
      delay,
      createdAt: Date.now(),
      stack: new Error().stack
    });
    const originalFn = fn;
    arguments[0] = function() {
      trackedTimeouts.delete(id);
      if (typeof originalFn === "function") {
        return originalFn.apply(this, arguments);
      }
    };
    return id;
  };
  window.clearTimeout = (id) => {
    trackedTimeouts.delete(id);
    return _origClearTimeout.call(window, id);
  };
}
function unpatchTimers() {
  if (_origSetInterval) {
    window.setInterval = _origSetInterval;
    window.clearInterval = _origClearInterval;
    window.setTimeout = _origSetTimeout;
    window.clearTimeout = _origClearTimeout;
    _origSetInterval = null;
    _origClearInterval = null;
    _origSetTimeout = null;
    _origClearTimeout = null;
  }
}
export {
  MODULE_ID,
  VERSION,
  patchEventListeners,
  patchTimers,
  unpatchEventListeners,
  unpatchTimers
};
