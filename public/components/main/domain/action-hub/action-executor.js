import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.main.domain.action-executor";
const VERSION = "3.0.0-P1-HEX";
const EXECUTOR_TELEMETRY = {
  SUCCESS: "action-executor:success",
  FAILED: "action-executor:failed"
};
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
const _state = { initialized: false, queue: [], processing: false, maxRetries: 3 };
const _metrics = { executed: 0, queued: 0, retries: 0, errors: 0 };
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function _setTimeout(fn, ms) {
  const timerPort = _getPort("timer");
  if (timerPort && timerPort.setTimeout) return timerPort.setTimeout(fn, ms);
  return setTimeout(fn, ms);
}
function execute(action, payload, options) {
  options = options || {};
  const retries = options.retries || 0;
  const maxRetries = options.maxRetries || _state.maxRetries;
  return new Promise((resolve, reject) => {
    try {
      const result = typeof action === "function" ? action(payload) : null;
      Promise.resolve(result).then((res) => {
        _metrics.executed++;
        _track(EXECUTOR_TELEMETRY.SUCCESS, { retries });
        resolve({ ok: true, result: res });
      }).catch((error) => {
        if (retries < maxRetries) {
          _metrics.retries++;
          _setTimeout(() => {
            execute(action, payload, { retries: retries + 1, maxRetries }).then(resolve).catch(reject);
          }, Math.pow(2, retries) * 100);
        } else {
          _metrics.errors++;
          _track(EXECUTOR_TELEMETRY.FAILED, { error: error.message, retries });
          reject(error);
        }
      });
    } catch (e) {
      _metrics.errors++;
      reject(e);
    }
  });
}
function enqueue(action, payload, options) {
  _metrics.queued++;
  _state.queue.push({ action, payload, options, enqueuedAt: Date.now() });
  processQueue();
  return { ok: true, queueSize: _state.queue.length };
}
function processQueue() {
  if (_state.processing || _state.queue.length === 0) return;
  _state.processing = true;
  const item = _state.queue.shift();
  execute(item.action, item.payload, item.options).finally(() => {
    _state.processing = false;
    if (_state.queue.length > 0) _setTimeout(processQueue, 0);
  });
}
function getQueueSize() {
  return _state.queue.length;
}
function clearQueue() {
  _state.queue = [];
  return { ok: true };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.maxRetries) _state.maxRetries = ctx.maxRetries;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    score: 100,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      initialized: { ok: _state.initialized, severity: "info" },
      queueNotFull: { ok: _state.queue.length < 100, severity: "warn" },
      portsInitialized: { ok: Ports.isInitialized(), severity: "info" }
    },
    metrics: _metrics,
    p1HexCompliant: true
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _state.initialized,
    queueSize: _state.queue.length,
    processing: _state.processing,
    maxRetries: _state.maxRetries,
    metrics: _metrics,
    portsInitialized: Ports.isInitialized(),
    p1HexCompliant: true
  };
}
var action_executor_default = { MODULE_ID, VERSION, EXECUTOR_TELEMETRY, init, execute, enqueue, processQueue, getQueueSize, clearQueue, healthCheck, info, injectPorts, getPorts };
export {
  EXECUTOR_TELEMETRY,
  MODULE_ID,
  VERSION,
  clearQueue,
  action_executor_default as default,
  enqueue,
  execute,
  getPorts,
  getQueueSize,
  healthCheck,
  info,
  init,
  injectPorts,
  processQueue
};
