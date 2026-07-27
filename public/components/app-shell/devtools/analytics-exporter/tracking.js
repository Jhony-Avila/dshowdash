const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.analytics-exporter.tracking";
function _getSessionId() {
  if (typeof sessionStorage !== "undefined") {
    let id = sessionStorage.getItem("app-shell-session-id");
    if (!id) {
      id = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("app-shell-session-id", id);
    }
    return id;
  }
  return "unknown";
}
function track(eventName, data, state) {
  if (!state.enabled) return false;
  const event = {
    name: eventName,
    data: data || {},
    timestamp: Date.now(),
    sessionId: _getSessionId()
  };
  state.queue.push(event);
  state.metrics.eventsQueued++;
  while (state.queue.length > state.config.maxQueueSize) {
    state.queue.shift();
  }
  if (state.queue.length >= state.config.batchSize) {
    flush(state);
  }
  return true;
}
function trackPerformance(name, duration, metadata, state) {
  return track("performance", { metric: name, duration, metadata: metadata || {} }, state);
}
function trackError(error, context, state) {
  return track("error", { message: error.message || String(error), stack: error.stack, context: context || {} }, state);
}
function trackHealthCheck(result, state) {
  return track("health-check", { status: result.status, score: result.score, checks: result.checks }, state);
}
function _sendToAdapter(entry, events, config, metrics, attempt) {
  attempt = attempt || 1;
  return entry.adapter.send(events).then((result) => {
    entry.sentCount += events.length;
    entry.lastSent = Date.now();
    metrics.eventsSent += events.length;
    metrics.batchesSent++;
    return result;
  }).catch((error) => {
    if (attempt < config.retryAttempts) {
      return new Promise((resolve) => {
        setTimeout(resolve, config.retryDelayMs * attempt);
      }).then(() => _sendToAdapter(entry, events, config, metrics, attempt + 1));
    }
    entry.errorCount++;
    entry.lastError = { message: error.message, timestamp: Date.now() };
    metrics.eventsFailed += events.length;
    throw error;
  });
}
function flush(state) {
  if (state.queue.length === 0) return Promise.resolve({ sent: 0 });
  const events = state.queue.splice(0, state.config.batchSize);
  const promises = [];
  state.adapters.forEach((entry) => {
    if (entry.enabled) {
      promises.push(_sendToAdapter(entry, events, state.config, state.metrics).catch((e) => ({
        error: e.message,
        adapter: entry.name
      })));
    }
  });
  if (promises.length === 0) {
    state.queue.unshift.apply(state.queue, events);
    return Promise.resolve({ sent: 0, reason: "no-adapters" });
  }
  return Promise.all(promises).then((results) => ({
    sent: events.length,
    results
  }));
}
function flushAll(state) {
  const allPromises = [];
  while (state.queue.length > 0) {
    allPromises.push(flush(state));
  }
  return Promise.all(allPromises).then((results) => {
    let totalSent = 0;
    for (let i = 0; i < results.length; i++) {
      totalSent += results[i].sent || 0;
    }
    return { totalSent, batches: results.length };
  });
}
export {
  MODULE_ID,
  VERSION,
  flush,
  flushAll,
  track,
  trackError,
  trackHealthCheck,
  trackPerformance
};
