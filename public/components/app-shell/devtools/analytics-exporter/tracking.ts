// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: analytics-exporter/tracking
// PURPOSE: Event tracking e flushing para analytics
// ───────────────────────────────────────────────────────────────
// IMPORTS: none (usa state passado como parâmetro)
// EXPORTS:
//   track — Registra evento
//   trackPerformance — Registra métrica de performance
//   trackError — Registra erro
//   trackHealthCheck — Registra resultado de health check
//   flush — Envia batch de eventos
//   flushAll — Envia todos os eventos pendentes
// BROWSER APIs: sessionStorage
// ═══════════════════════════════════════════════════════════════
/**
 * @module AnalyticsExporterTracking
 * @description Event tracking e flushing
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.analytics-exporter.tracking';

function _getSessionId() {
    if (typeof sessionStorage !== 'undefined') {
        let id = sessionStorage.getItem('app-shell-session-id');
        if (!id) {
            id = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('app-shell-session-id', id);
        }
        return id;
    }
    return 'unknown';
}

export function track(eventName: string, data: DynObj, state: DynObj) {
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

export function trackPerformance(name: string, duration: number, metadata: DynObj, state: DynObj) {
    return track('performance', { metric: name, duration, metadata: metadata || {} }, state);
}

export function trackError(error: DynObj, context: DynObj, state: DynObj) {
    return track('error', { message: error.message || String(error), stack: error.stack, context: context || {} }, state);
}

export function trackHealthCheck(result: DynObj, state: DynObj) {
    return track('health-check', { status: result.status, score: result.score, checks: result.checks }, state);
}

function _sendToAdapter(entry: DynObj, events: DynObj, config: DynObj, metrics?: DynObj, attempt?: number) {
    attempt = attempt || 1;

    return entry.adapter.send(events).then((result: DynObj) => {
        entry.sentCount += events.length;
        entry.lastSent = Date.now();
        metrics.eventsSent += events.length;
        metrics.batchesSent++;
        return result;
    }).catch((error: DynObj) => {
        if (attempt < config.retryAttempts) {
            return new Promise(resolve => {
                setTimeout(resolve, config.retryDelayMs * attempt);
            }).then(() => _sendToAdapter(entry, events, config, metrics, attempt + 1));
        }

        entry.errorCount++;
        entry.lastError = { message: error.message, timestamp: Date.now() };
        metrics.eventsFailed += events.length;
        throw error;
    });
}

export function flush(state: DynObj) {
    if (state.queue.length === 0) return Promise.resolve({ sent: 0 });

    const events = state.queue.splice(0, state.config.batchSize);
    const promises: DynObj[] = [];

    state.adapters.forEach((entry: DynObj) => {
        if (entry.enabled) {
            promises.push(_sendToAdapter(entry, events, state.config, state.metrics).catch((e: DynObj) => ({
                error: e.message,
                adapter: entry.name
            })));
        }
    });

    if (promises.length === 0) {
        state.queue.unshift.apply(state.queue, events);
        return Promise.resolve({ sent: 0, reason: 'no-adapters' });
    }

    return Promise.all(promises).then(results => ({
        sent: events.length,
        results
    }));
}

export function flushAll(state: DynObj) {
    const allPromises = [];

    while (state.queue.length > 0) {
        allPromises.push(flush(state));
    }

    return Promise.all(allPromises).then(results => {
        let totalSent = 0;
        for (let i = 0; i < results.length; i++) {
            totalSent += results[i].sent || 0;
        }
        return { totalSent, batches: results.length };
    });
}
