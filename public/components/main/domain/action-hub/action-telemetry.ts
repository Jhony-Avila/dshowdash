// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.0.0-AAA-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: action-telemetry
// PURPOSE: ActionTelemetry - Telemetria de Ações
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   track() — exported function
//   getHistory() — exported function
//   clearHistory() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   createActionTelemetry() — exported function
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

export const VERSION = '3.0.0-AAA-P0-FIX';
export const MODULE_ID = 'action-telemetry';

let _history: Array<Record<string, unknown>> = [];
let _maxHistory = 500;
let _metrics = { tracked: 0, errors: 0, starts: 0, successes: 0, failures: 0 };

export function track(action: Record<string, unknown>) {
  try {
    _history.push({ ...action, trackedAt: Date.now() });
    if (_history.length > _maxHistory) _history.shift();
    _metrics.tracked++;
  } catch (error) {
    _metrics.errors++;
  }
}

export function getHistory(filter: Record<string, unknown> = {}) {
  let result = [..._history];
  if (filter.type) result = result.filter(a => a.type === filter.type);
  if (filter.limit) result = result.slice(-filter.limit);
  return result;
}

export function clearHistory() { _history = []; }

export function getMetrics() { return { ..._metrics, historySize: _history.length }; }

export function healthCheck() {
  const isFull = _history.length >= _maxHistory * 0.9;
  return { status: isFull ? 'DEGRADED' : 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { historySize: _history.length, maxHistory: _maxHistory, isFull }, metrics: getMetrics() };
}

// Class para compatibilidade
export class ActionTelemetry {
  [key: string]: any;
  constructor(context: Record<string, unknown> = {}) {
    this._context = context;
    this._ports = context.ports || {};
    this._localHistory = [];
    this._localMetrics = { tracked: 0, errors: 0, starts: 0, successes: 0, failures: 0 };
  }
  
  track(action: Record<string, unknown>) { 
    track(action); 
    this._localHistory.push({ ...action, trackedAt: Date.now() }); 
    this._localMetrics.tracked++; 
    if (this._localHistory.length > _maxHistory) this._localHistory.shift(); 
  }
  
  // FIX P0: Métodos exigidos pelo ActionExecutor
  emitStart(action: Record<string, unknown>) {
    this._localMetrics.starts++;
    _metrics.starts++;
    const event = {
      phase: 'start',
      actionId: action?.actionId,
      type: action?.type,
      timestamp: Date.now()
    };
    this.track({ ...action, ...event });
    // Emitir para TelemetryPort se disponível
    this._ports?.telemetry?.track?.('action:start', event);
  }
  
  emitSuccess(action: Record<string, unknown>, result: Record<string, unknown> = {}) {
    this._localMetrics.successes++;
    _metrics.successes++;
    const event = {
      phase: 'success',
      actionId: action?.actionId,
      type: action?.type,
      result,
      timestamp: Date.now()
    };
    this.track({ ...action, ...event });
    this._ports?.telemetry?.track?.('action:success', event);
  }
  
  emitError(action: Record<string, unknown>, error: Error) {
    this._localMetrics.failures++;
    _metrics.failures++;
    const event = {
      phase: 'error',
      actionId: action?.actionId,
      type: action?.type,
      error: typeof error === 'string' ? error : error?.message || 'Unknown error',
      timestamp: Date.now()
    };
    this.track({ ...action, ...event });
    this._ports?.telemetry?.track?.('action:error', event);
  }
  
  emitEnd(action: Record<string, unknown>, result: Record<string, unknown> = {}) {
    const event = {
      phase: 'end',
      actionId: action?.actionId,
      type: action?.type,
      result,
      timestamp: Date.now()
    };
    this.track({ ...action, ...event });
    this._ports?.telemetry?.track?.('action:end', event);
  }
  
  getHistory(filter: Record<string, unknown> = {}) { return getHistory(filter); }
  getLocalHistory(limit = 100) { return this._localHistory.slice(-limit); }
  clearHistory() { this._localHistory = []; clearHistory(); }
  getMetrics() { return { global: getMetrics(), local: { ...this._localMetrics, historySize: this._localHistory.length } }; }
  healthCheck() { return { ...healthCheck(), localHistorySize: this._localHistory.length }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, localHistorySize: this._localHistory.length, metrics: this.getMetrics() }; }
  destroy() { this._localHistory = []; this._localMetrics = { tracked: 0, errors: 0, starts: 0, successes: 0, failures: 0 }; }
}

// Factory function
export function createActionTelemetry(context: Record<string, unknown> = {}) {
  return new ActionTelemetry(context);
}

export default { track, getHistory, clearHistory, getMetrics, healthCheck, ActionTelemetry, createActionTelemetry, VERSION, MODULE_ID };
