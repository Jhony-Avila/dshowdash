// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.domain.action-executor
// PURPOSE: Main - Action Executor
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   EXECUTOR_TELEMETRY — exported value
//   init() — exported function
//   execute() — exported function
//   enqueue() — exported function
//   processQueue() — exported function
//   getQueueSize() — exported function
//   clearQueue() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.main.domain.action-executor';
const VERSION = '3.0.0-P1-HEX';

const EXECUTOR_TELEMETRY = {
  SUCCESS: 'action-executor:success',
  FAILED: 'action-executor:failed'
};

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false, queue: [] as Record<string, unknown>[], processing: false, maxRetries: 3 };
const _metrics = { executed: 0, queued: 0, retries: 0, errors: 0 };

function _track(eventKey: string, payload: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

// P1-HEX: Timer helper using TimerPort
function _setTimeout(fn: (...args: unknown[]) => unknown, ms: number) {
  const timerPort = _getPort('timer');
  if (timerPort && timerPort.setTimeout) return timerPort.setTimeout(fn, ms);
  return setTimeout(fn, ms);
}

function execute(action: Record<string, unknown>, payload: Record<string, unknown>, options: Record<string, unknown>) {
  options = options || {};
  const retries = options.retries || 0;
  const maxRetries = options.maxRetries || _state.maxRetries;
  
  return new Promise((resolve, reject) => {
    try {
// @ts-expect-error TS migration - TS2349
      const result = typeof action === 'function' ? action(payload) : null;
      Promise.resolve(result).then(res => {
        _metrics.executed++;
        _track(EXECUTOR_TELEMETRY.SUCCESS, { retries });
        resolve({ ok: true, result: res });
      }).catch(error => {
        if (retries < maxRetries) {
          _metrics.retries++;
          // P1-HEX: Use TimerPort via helper
          _setTimeout(() => {
// @ts-expect-error TS migration - TS2365
            execute(action, payload, { retries: retries + 1, maxRetries }).then(resolve).catch(reject);
// @ts-expect-error TS migration - TS2345
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

function enqueue(action: Record<string, unknown>, payload: Record<string, unknown>, options: Record<string, unknown>) {
  _metrics.queued++;
  _state.queue.push({ action, payload, options, enqueuedAt: Date.now() });
  processQueue();
  return { ok: true, queueSize: _state.queue.length };
}

function processQueue() {
  if (_state.processing || _state.queue.length === 0) return;
  _state.processing = true;
  const item = _state.queue.shift();
// @ts-expect-error TS migration - TS2345
  execute(item.action, item.payload, item.options).finally(() => {
    _state.processing = false;
    // P1-HEX: Use TimerPort via helper
    if (_state.queue.length > 0) _setTimeout(processQueue, 0);
  });
}

function getQueueSize() { return _state.queue.length; }
function clearQueue() { _state.queue = []; return { ok: true }; }

function init(ctx: Record<string, unknown>) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
// @ts-expect-error TS migration - TS2345
  if (ctx && ctx.ports) injectPorts(ctx.ports);
// @ts-expect-error TS migration - TS2322
  if (ctx && ctx.maxRetries) _state.maxRetries = ctx.maxRetries;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}

function healthCheck() {
  return {
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION,
    checks: {
      initialized: { ok: _state.initialized, severity: 'info' },
      queueNotFull: { ok: _state.queue.length < 100, severity: 'warn' },
      portsInitialized: { ok: Ports.isInitialized(), severity: 'info' }
    },
    metrics: _metrics, p1HexCompliant: true
  };
}

function info() {
  return {
    moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized,
    queueSize: _state.queue.length, processing: _state.processing,
    maxRetries: _state.maxRetries, metrics: _metrics, portsInitialized: Ports.isInitialized(),
    p1HexCompliant: true
  };
}

export { MODULE_ID, VERSION, EXECUTOR_TELEMETRY, init, execute, enqueue, processQueue, getQueueSize, clearQueue, healthCheck, info };
export default { MODULE_ID, VERSION, EXECUTOR_TELEMETRY, init, execute, enqueue, processQueue, getQueueSize, clearQueue, healthCheck, info, injectPorts, getPorts };
