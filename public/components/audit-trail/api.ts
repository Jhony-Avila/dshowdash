// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.audit-trail.api
// PURPOSE: API communication for audit trail batch submission and history
// ───────────────────────────────────────────────────────────────
// @contract SEND_BATCH - sendBatch(batch, config, metrics, telemetry, emit) sends batch to API
// @contract GET_HISTORY - getHistory(opts, config, telemetry, emit) retrieves audit history
// @contract CREATE_ABORT_CONTROLLER - createAbortController() creates new abort controller
// @contract ABORT_ALL - abortAll() aborts all pending requests
// @contract GET_ABORT_CONTROLLER - getAbortController() returns current abort controller
// @contract SEND - send(entries, endpoint) legacy single send function
// @contract GET_METRICS - getMetrics() returns API metrics
// @contract RESET_METRICS - resetMetrics() resets API metrics
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// PROVIDES: sendBatch, getHistory, createAbortController, abortAll,
//           getAbortController, send, getMetrics, resetMetrics,
//           healthCheck, info, VERSION, MODULE_ID
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header,
//            expanded with sendBatch, getHistory, abort controller management
// @changelog v2.0.0-ENTERPRISE-AAA: Initial enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.audit-trail.api';

interface ApiMetrics {
  sent: number;
  errors: number;
  batches: number;
  historyQueries: number;
  lastSent: number | null;
  lastError: number | null;
}

const hasWindow = typeof window !== 'undefined';

let _abortController: AbortController | null = null;
let _metrics: ApiMetrics = {
  sent: 0,
  errors: 0,
  batches: 0,
  historyQueries: 0,
  lastSent: null,
  lastError: null
};

export function createAbortController(): AbortController | null {
  if (hasWindow && typeof AbortController !== 'undefined') {
    _abortController = new AbortController();
  }
  return _abortController;
}

export function getAbortController(): AbortController | null {
  return _abortController;
}

export function abortAll(): void {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
}

export async function sendBatch(
  batch: Record<string, unknown>[],
  config: { endpoint?: string } | null,
  metrics: Record<string, number> | null,
  trackTelemetry: ((event: string, data: Record<string, unknown>) => void) | null,
  emit: ((event: string, data: Record<string, unknown>) => void) | null
): Promise<{ success: boolean; sent?: number; error?: string; count?: number }> {
  if (!hasWindow || !batch || batch.length === 0) {
    return { success: true, sent: 0 };
  }

  const endpoint = config?.endpoint || '/api/audit';
  _metrics.batches++;

  try {
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: batch }),
      credentials: 'include'
    };

    if (_abortController && !_abortController.signal.aborted) {
      fetchOptions.signal = _abortController.signal;
    }

    const response = await fetch(endpoint, fetchOptions);

    if (response.ok) {
      _metrics.sent += batch.length;
      _metrics.lastSent = Date.now();

      if (metrics) {
        metrics.flushed = (metrics.flushed || 0) + batch.length;
        metrics.flushCount = (metrics.flushCount || 0) + 1;
        metrics.lastFlush = Date.now();
      }

      if (trackTelemetry) {
        trackTelemetry('batch-sent', { count: batch.length });
      }

      if (emit) {
        emit('batch-sent', { count: batch.length });
      }

      return { success: true, sent: batch.length };
    }

    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    _metrics.errors++;
    _metrics.lastError = Date.now();

    const err = error as Error;

    if (metrics) {
      metrics.errors = (metrics.errors || 0) + 1;
      metrics.lastError = Date.now();
    }

    if (trackTelemetry) {
      trackTelemetry('batch-failed', { error: err.message, count: batch.length });
    }

    if (emit) {
      emit('batch-failed', { error: err.message, count: batch.length });
    }

    return { success: false, error: err.message, count: batch.length };
  }
}

export async function getHistory(
  opts: { limit?: string; offset?: string; action?: string; resource_type?: string; from?: string; to?: string } = {},
  config: { endpoint?: string } | null,
  trackTelemetry: ((event: string, data: Record<string, unknown>) => void) | null,
  emit: ((event: string, data: Record<string, unknown>) => void) | null
): Promise<{ success: boolean; entries: unknown[]; total?: number; error?: string }> {
  if (!hasWindow) {
    return { success: false, entries: [] };
  }

  const endpoint = config?.endpoint || '/api/audit';
  const params = new URLSearchParams();

  if (opts.limit) params.append('limit', opts.limit);
  if (opts.offset) params.append('offset', opts.offset);
  if (opts.action) params.append('action', opts.action);
  if (opts.resource_type) params.append('resource_type', opts.resource_type);
  if (opts.from) params.append('from', opts.from);
  if (opts.to) params.append('to', opts.to);

  _metrics.historyQueries++;

  try {
    const fetchOptions: RequestInit = {
      method: 'GET',
      credentials: 'include'
    };

    if (_abortController && !_abortController.signal.aborted) {
      fetchOptions.signal = _abortController.signal;
    }

    const url = `${endpoint}?${params.toString()}`;
    const response = await fetch(url, fetchOptions);

    if (response.ok) {
      const data = await response.json();

      if (trackTelemetry) {
        trackTelemetry('history-fetched', { count: data.entries?.length || 0 });
      }

      return { success: true, entries: data.entries || [], total: data.total };
    }

    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    _metrics.errors++;
    _metrics.lastError = Date.now();

    const err = error as Error;

    if (trackTelemetry) {
      trackTelemetry('history-error', { error: err.message });
    }

    if (emit) {
      emit('error', { action: 'history', error: err.message });
    }

    return { success: false, error: err.message, entries: [] };
  }
}

// Legacy single send function
export async function send(entries: unknown[], endpoint = '/api/audit'): Promise<boolean> {
  _metrics.sent++;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries })
    });

    if (res.ok) {
      _metrics.lastSent = Date.now();
    }

    return res.ok;
  } catch (e) {
    _metrics.errors++;
    _metrics.lastError = Date.now();
    return false;
  }
}

export function getMetrics(): ApiMetrics {
  return { ..._metrics };
}

export function resetMetrics(): void {
  _metrics = {
    sent: 0,
    errors: 0,
    batches: 0,
    historyQueries: 0,
    lastSent: null,
    lastError: null
  };
}

export function healthCheck() {
  const errorRate = _metrics.sent === 0 ? 0 : _metrics.errors / _metrics.sent;

  const checks = {
    lowErrorRate: errorRate < 0.2,
    abortControllerAvailable: hasWindow && typeof AbortController !== 'undefined',
    noRecentErrors: !_metrics.lastError || (Date.now() - _metrics.lastError) > 60000
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = passed === total ? 'HEALTHY' : passed >= 1 ? 'DEGRADED' : 'UNHEALTHY';

  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    errorRate: (errorRate * 100).toFixed(1) + '%',
    abortControllerActive: !!_abortController && !_abortController?.signal?.aborted,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: getMetrics(),
    abortControllerActive: !!_abortController && !_abortController?.signal?.aborted,
    timestamp: Date.now()
  };
}

export default {
  sendBatch,
  getHistory,
  createAbortController,
  abortAll,
  getAbortController,
  send,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
