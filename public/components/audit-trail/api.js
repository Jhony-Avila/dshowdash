const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.audit-trail.api";
const hasWindow = typeof window !== "undefined";
let _abortController = null;
let _metrics = {
  sent: 0,
  errors: 0,
  batches: 0,
  historyQueries: 0,
  lastSent: null,
  lastError: null
};
function createAbortController() {
  if (hasWindow && typeof AbortController !== "undefined") {
    _abortController = new AbortController();
  }
  return _abortController;
}
function getAbortController() {
  return _abortController;
}
function abortAll() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
}
async function sendBatch(batch, config, metrics, trackTelemetry, emit) {
  if (!hasWindow || !batch || batch.length === 0) {
    return { success: true, sent: 0 };
  }
  const endpoint = config?.endpoint || "/api/audit";
  _metrics.batches++;
  try {
    const fetchOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: batch }),
      credentials: "include"
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
        trackTelemetry("batch-sent", { count: batch.length });
      }
      if (emit) {
        emit("batch-sent", { count: batch.length });
      }
      return { success: true, sent: batch.length };
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    _metrics.errors++;
    _metrics.lastError = Date.now();
    const err = error;
    if (metrics) {
      metrics.errors = (metrics.errors || 0) + 1;
      metrics.lastError = Date.now();
    }
    if (trackTelemetry) {
      trackTelemetry("batch-failed", { error: err.message, count: batch.length });
    }
    if (emit) {
      emit("batch-failed", { error: err.message, count: batch.length });
    }
    return { success: false, error: err.message, count: batch.length };
  }
}
async function getHistory(opts = {}, config, trackTelemetry, emit) {
  if (!hasWindow) {
    return { success: false, entries: [] };
  }
  const endpoint = config?.endpoint || "/api/audit";
  const params = new URLSearchParams();
  if (opts.limit) params.append("limit", opts.limit);
  if (opts.offset) params.append("offset", opts.offset);
  if (opts.action) params.append("action", opts.action);
  if (opts.resource_type) params.append("resource_type", opts.resource_type);
  if (opts.from) params.append("from", opts.from);
  if (opts.to) params.append("to", opts.to);
  _metrics.historyQueries++;
  try {
    const fetchOptions = {
      method: "GET",
      credentials: "include"
    };
    if (_abortController && !_abortController.signal.aborted) {
      fetchOptions.signal = _abortController.signal;
    }
    const url = `${endpoint}?${params.toString()}`;
    const response = await fetch(url, fetchOptions);
    if (response.ok) {
      const data = await response.json();
      if (trackTelemetry) {
        trackTelemetry("history-fetched", { count: data.entries?.length || 0 });
      }
      return { success: true, entries: data.entries || [], total: data.total };
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    _metrics.errors++;
    _metrics.lastError = Date.now();
    const err = error;
    if (trackTelemetry) {
      trackTelemetry("history-error", { error: err.message });
    }
    if (emit) {
      emit("error", { action: "history", error: err.message });
    }
    return { success: false, error: err.message, entries: [] };
  }
}
async function send(entries, endpoint = "/api/audit") {
  _metrics.sent++;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
function getMetrics() {
  return { ..._metrics };
}
function resetMetrics() {
  _metrics = {
    sent: 0,
    errors: 0,
    batches: 0,
    historyQueries: 0,
    lastSent: null,
    lastError: null
  };
}
function healthCheck() {
  const errorRate = _metrics.sent === 0 ? 0 : _metrics.errors / _metrics.sent;
  const checks = {
    lowErrorRate: errorRate < 0.2,
    abortControllerAvailable: hasWindow && typeof AbortController !== "undefined",
    noRecentErrors: !_metrics.lastError || Date.now() - _metrics.lastError > 6e4
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const status = passed === total ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY";
  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
    errorRate: (errorRate * 100).toFixed(1) + "%",
    abortControllerActive: !!_abortController && !_abortController?.signal?.aborted,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: getMetrics(),
    abortControllerActive: !!_abortController && !_abortController?.signal?.aborted,
    timestamp: Date.now()
  };
}
var api_default = {
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
export {
  MODULE_ID,
  VERSION,
  abortAll,
  createAbortController,
  api_default as default,
  getAbortController,
  getHistory,
  getMetrics,
  healthCheck,
  info,
  resetMetrics,
  send,
  sendBatch
};
