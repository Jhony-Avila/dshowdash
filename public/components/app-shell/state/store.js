import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { SHELL_EVENTS } from "/core/runtime/events/catalog/shell.events.js";
const VERSION = "5.4.0-P18EC-AAA";
const MODULE_ID = "app-shell-store";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
const SHELL_PHASES = Object.freeze({ IDLE: "IDLE", MOUNTING: "MOUNTING", MOUNTED: "MOUNTED", INITIALIZING: "INITIALIZING", READY: "READY", DEGRADED: "DEGRADED", FAILED: "FAILED", UNMOUNTING: "UNMOUNTING", DESTROYED: "DESTROYED" });
const LIFECYCLE_STATES = SHELL_PHASES;
const CONFIG = Object.freeze({ DEBOUNCE_MS: 16, MAX_HISTORY: 50, MAX_SUBSCRIBERS: 100 });
const _initialState = Object.freeze({ phase: SHELL_PHASES.IDLE, mounted: false, ready: false, error: null, lastTransitionAt: null, transitionHistory: [], meta: {} });
let _state = { ..._initialState, transitionHistory: [] };
let _subscribers = [];
let _notifyCount = 0;
let _debounceTimer = null;
let _pendingNotify = false;
let _bootStartTime = null;
let _metrics = { transitions: 0, subscriptions: 0, unsubscriptions: 0, notifications: 0, debounced: 0, errors: 0, invalidCallbacks: 0, bootTime: null, phaseTimings: {} };
function _now() {
  return Date.now();
}
function _isValidCallback(cb) {
  if (typeof cb !== "function") {
    _metrics.invalidCallbacks++;
    return false;
  }
  const fnStr = cb.toString();
  if (fnStr.includes("eval(") || fnStr.includes("Function(")) {
    _metrics.invalidCallbacks++;
    _log("warn", "Callback rejeitado: cont\xE9m eval/Function");
    return false;
  }
  return true;
}
function _notify() {
  if (_pendingNotify) {
    _metrics.debounced++;
    return;
  }
  _pendingNotify = true;
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(() => {
    _pendingNotify = false;
    _notifyCount++;
    _metrics.notifications++;
    const snapshot = getState();
    _subscribers.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (e) {
        _metrics.errors++;
      }
    });
  }, CONFIG.DEBOUNCE_MS);
}
function _addToHistory(from, to, meta = {}) {
  const entry = { from, to, at: _now(), duration: _state.lastTransitionAt ? _now() - _state.lastTransitionAt : 0, ...meta };
  _state.transitionHistory = [..._state.transitionHistory.slice(-(CONFIG.MAX_HISTORY - 1)), entry];
  if (!_metrics.phaseTimings[to]) _metrics.phaseTimings[to] = { count: 0, totalTime: 0 };
  _metrics.phaseTimings[to].count++;
}
function setPhase(phase, meta = {}) {
  _initPorts();
  if (!Object.values(SHELL_PHASES).includes(phase)) {
    _metrics.errors++;
    return false;
  }
  const prevPhase = _state.phase;
  if (prevPhase === phase) return true;
  if (phase === SHELL_PHASES.MOUNTING && !_bootStartTime) _bootStartTime = _now();
  if (phase === SHELL_PHASES.READY && _bootStartTime) _metrics.bootTime = _now() - _bootStartTime;
  if (_state.lastTransitionAt && _metrics.phaseTimings[prevPhase]) _metrics.phaseTimings[prevPhase].totalTime += _now() - _state.lastTransitionAt;
  _addToHistory(prevPhase, phase, meta);
  _state = { ..._state, phase, lastTransitionAt: _now(), meta: { ...meta, prevPhase } };
  if (phase === SHELL_PHASES.MOUNTED || phase === SHELL_PHASES.READY || phase === SHELL_PHASES.DEGRADED) _state.mounted = true;
  if (phase === SHELL_PHASES.READY) _state.ready = true;
  if (phase === SHELL_PHASES.FAILED || phase === SHELL_PHASES.DESTROYED || phase === SHELL_PHASES.IDLE) {
    _state.mounted = false;
    _state.ready = false;
  }
  if (phase === SHELL_PHASES.UNMOUNTING) _state.ready = false;
  _metrics.transitions++;
  _notify();
  if (phase === SHELL_PHASES.DEGRADED) {
    try {
      const eventBus = _getPort("eventBus");
      if (eventBus?.emit) eventBus.emit(SHELL_EVENTS.DEGRADED, { phase, meta, timestamp: _now() });
    } catch (e) {
    }
  }
  return true;
}
function getState() {
  return { ..._state, transitionHistory: [..._state.transitionHistory] };
}
function getPhase() {
  return _state.phase;
}
function isMounted() {
  return _state.mounted;
}
function isReady() {
  return _state.ready;
}
function isDegraded() {
  return _state.phase === SHELL_PHASES.DEGRADED;
}
function isFailed() {
  return _state.phase === SHELL_PHASES.FAILED;
}
function getTransitionHistory() {
  return [..._state.transitionHistory];
}
function getLastTransition() {
  return _state.transitionHistory[_state.transitionHistory.length - 1] || null;
}
function setError(error) {
  _state.error = error ? { code: error.code || "UNKNOWN", message: error.message || String(error), context: error.context || null, timestamp: _now() } : null;
  if (error && _state.phase !== SHELL_PHASES.FAILED) setPhase(SHELL_PHASES.DEGRADED, { errorSet: true });
  _notify();
}
function clearError() {
  if (!_state.error) return;
  _state.error = null;
  if (_state.phase === SHELL_PHASES.DEGRADED) setPhase(SHELL_PHASES.READY, { errorCleared: true });
  _notify();
}
function getError() {
  return _state.error ? { ..._state.error } : null;
}
function subscribe(callback) {
  if (!_isValidCallback(callback)) return () => {
  };
  if (_subscribers.length >= CONFIG.MAX_SUBSCRIBERS) {
    _log("warn", `Max subscribers (${CONFIG.MAX_SUBSCRIBERS}) reached`);
    return () => {
    };
  }
  _subscribers.push(callback);
  _metrics.subscriptions++;
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) {
      _subscribers.splice(idx, 1);
      _metrics.unsubscriptions++;
    }
  };
}
function reset() {
  _state = { ..._initialState, transitionHistory: [] };
  _subscribers = [];
  _notifyCount = 0;
  _bootStartTime = null;
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _debounceTimer = null;
  _pendingNotify = false;
}
function setMounting() {
  return setPhase(SHELL_PHASES.MOUNTING);
}
function setMounted(flag) {
  return setPhase(SHELL_PHASES.MOUNTED);
}
function setInitializing() {
  return setPhase(SHELL_PHASES.INITIALIZING);
}
function setReady(flag) {
  return setPhase(SHELL_PHASES.READY);
}
function setDegraded(reason) {
  return setPhase(SHELL_PHASES.DEGRADED, { reason });
}
function setFailed(reason) {
  return setPhase(SHELL_PHASES.FAILED, { reason });
}
function setUnmounting() {
  return setPhase(SHELL_PHASES.UNMOUNTING);
}
function setDestroyed() {
  return setPhase(SHELL_PHASES.DESTROYED);
}
function setLifecycleState(state, meta = {}) {
  return setPhase(state, meta);
}
function getStatus() {
  return getState();
}
function getMetrics() {
  const ps = Ports.snapshot();
  return { ..._metrics, subscriberCount: _subscribers.length, historySize: _state.transitionHistory.length, config: { ...CONFIG }, portsStatus: { initialized: ps._initialized } };
}
function getBootTime() {
  return _metrics.bootTime;
}
function getPhaseTimings() {
  return { ..._metrics.phaseTimings };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const logger = _getPort("logger");
  const checks = { hasValidPhase: Object.values(SHELL_PHASES).includes(_state.phase), noError: !_state.error, subscribersHealthy: _subscribers.length < CONFIG.MAX_SUBSCRIBERS, lowErrorRate: _metrics.notifications === 0 || _metrics.errors / _metrics.notifications < 0.1, lowInvalidCallbacks: _metrics.subscriptions === 0 || _metrics.invalidCallbacks / _metrics.subscriptions < 0.1, loggerReady: !!logger, portsInitialized: ps._initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 4 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, phase: _state.phase, mounted: _state.mounted, ready: _state.ready, hasError: !!_state.error, subscriberCount: _subscribers.length, bootTime: _metrics.bootTime, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: _now() };
}
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, state: getState(), phase: _state.phase, mounted: _state.mounted, ready: _state.ready, error: _state.error, subscriberCount: _subscribers.length, notifyCount: _notifyCount, transitionCount: _state.transitionHistory.length, transitionHistory: getTransitionHistory(), lastTransition: getLastTransition(), bootTime: _metrics.bootTime, phaseTimings: getPhaseTimings(), metrics: getMetrics(), config: { ...CONFIG }, portsStatus: { initialized: ps._initialized }, timestamp: _now() };
}
const shellStore = { setLifecycleState: setPhase, setMounted: (v) => v ? setMounted() : setUnmounting(), setReady: (v) => v ? setReady() : null, setError, clearError, getStatus: getState, subscribe, reset, info, healthCheck };
var store_default = { VERSION, MODULE_ID, SHELL_PHASES, LIFECYCLE_STATES, CONFIG, setPhase, getState, getPhase, isMounted, isReady, isDegraded, isFailed, setError, clearError, getError, subscribe, reset, setMounting, setMounted, setInitializing, setReady, setDegraded, setFailed, setUnmounting, setDestroyed, getTransitionHistory, getLastTransition, getMetrics, getBootTime, getPhaseTimings, healthCheck, info, shellStore, injectPorts, getPorts };
export {
  LIFECYCLE_STATES,
  MODULE_ID,
  SHELL_PHASES,
  VERSION,
  clearError,
  store_default as default,
  getBootTime,
  getError,
  getLastTransition,
  getMetrics,
  getPhase,
  getPhaseTimings,
  getPorts,
  getState,
  getStatus,
  getTransitionHistory,
  healthCheck,
  info,
  injectPorts,
  isDegraded,
  isFailed,
  isMounted,
  isReady,
  reset,
  setDegraded,
  setDestroyed,
  setError,
  setFailed,
  setInitializing,
  setLifecycleState,
  setMounted,
  setMounting,
  setPhase,
  setReady,
  setUnmounting,
  shellStore,
  subscribe
};
