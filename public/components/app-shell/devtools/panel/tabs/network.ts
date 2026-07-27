// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: devtools/panel/tabs/network
// PURPOSE: Tab de Network do Debug Panel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   icon, sanitizeAttr, formatDate, formatBytes, makeSectionHtml from ../helpers.js
// EXPORTS:
//   interceptNetwork — Ativa interceptação
//   restoreNetwork — Restaura originals
//   getNetworkRequests — Lista requests
//   clearNetworkRequests — Limpa requests
//   getNetworkStats — Estatísticas
//   renderNetworkTab — Renderiza tab
// BROWSER APIs: window.fetch, XMLHttpRequest, performance
// ═══════════════════════════════════════════════════════════════
/**
 * @module DevToolsPanelTabsNetwork
 * @description Tab de Network
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { icon, sanitizeAttr, formatDate, formatBytes, makeSectionHtml } from '../helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.panel.tabs.network';

let _requests: DynObj[] = [];
const _NETWORK_MAX = 100;
let _intercepted = false;
let _origFetch: DynObj = null;
let _origXhrOpen: DynObj = null;
let _origXhrSend: DynObj = null;

export function interceptNetwork() {
    if (_intercepted) return;
    if (typeof window === 'undefined') return;

    _origFetch = window.fetch;
    _origXhrOpen = XMLHttpRequest.prototype.open;
    _origXhrSend = XMLHttpRequest.prototype.send;

    if (window.fetch && (window.fetch as any).__dsdIntercepted) return;

    _intercepted = true;

    const safeFetch = _origFetch;
    window.fetch = function (input, init) {
        const url = typeof input === 'string' ? input : (input && (input as any).url ? (input as any).url : String(input));
        const method = (init && init.method) ? init.method.toUpperCase() : 'GET';
        const entry = { url, method, status: 0, duration: 0, size: 0, type: 'fetch', timestamp: Date.now(), error: null as DynObj };
        const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        try {
            return safeFetch.apply(this, arguments).then((response: DynObj) => {
                entry.status = response.status;
                entry.duration = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
                try { const cl = response.headers.get('content-length'); if (cl) entry.size = parseInt(cl, 10); } catch (e) {}
                _pushEntry(entry);
                return response;
            }).catch((err: DynObj) => {
                entry.error = err.message || 'Network Error';
                entry.duration = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
                _pushEntry(entry);
                throw err;
            });
        } catch (err: any) {
            entry.error = err.message || 'Fetch Error';
            _pushEntry(entry);
            throw err;
        }
    };
    (window.fetch as any).__dsdIntercepted = true;

    const safeOpen = _origXhrOpen;
    const safeSend = _origXhrSend;
    XMLHttpRequest.prototype.open = function (method, url) {
        // @ts-expect-error strict migration — TS2339
        this._dsdNet = { method: (method || 'GET').toUpperCase(), url };
        return safeOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
        const self = this;
        // @ts-expect-error strict migration — TS2339
        const meta = self._dsdNet || {};
        const entry = { url: meta.url || '', method: meta.method || 'GET', status: 0, duration: 0, size: 0, type: 'xhr', timestamp: Date.now(), error: null as DynObj };
        const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        self.addEventListener('loadend', () => {
            entry.status = self.status;
            entry.duration = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
            try { const cl = self.getResponseHeader('content-length'); if (cl) entry.size = parseInt(cl, 10); } catch (e) {}
            _pushEntry(entry);
        });
        self.addEventListener('error', () => {
            entry.error = 'XHR Error';
            entry.duration = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
            _pushEntry(entry);
        });
        return safeSend.apply(this, arguments);
    };
}

export function restoreNetwork() {
    if (!_intercepted) return;
    if (_origFetch) { window.fetch = _origFetch; _origFetch = null; }
    if (_origXhrOpen) { XMLHttpRequest.prototype.open = _origXhrOpen; _origXhrOpen = null; }
    if (_origXhrSend) { XMLHttpRequest.prototype.send = _origXhrSend; _origXhrSend = null; }
    _intercepted = false;
}

function _pushEntry(entry: DynObj) {
    _requests.push(entry);
    if (_requests.length > _NETWORK_MAX) _requests = _requests.slice(-_NETWORK_MAX);
}

export function getNetworkRequests() { return _requests; }
export function clearNetworkRequests() { _requests = []; }

export function getNetworkStats() {
    const total = _requests.length;
    const failed = _requests.filter(r => r.status >= 400 || r.error).length;
    const avgDuration = total > 0 ? Math.round(_requests.reduce((s, r) => s + r.duration, 0) / total) : 0;
    const totalSize = _requests.reduce((s, r) => s + (r.size || 0), 0);
    return { total, failed, avgDuration, totalSize };
}

export function renderNetworkTab() {
    const stats = getNetworkStats();
    const reqs = _requests.slice(-30).reverse();
    const listHtml = reqs.length === 0 ? '<div class="dsd-ui-empty">No requests captured yet. Navigate the app to see requests.</div>' :
        reqs.map(r => {
            const sc = r.error ? 'dsd-ui-status--unhealthy' : r.status >= 400 ? 'dsd-ui-status--unhealthy' : r.status >= 300 ? 'dsd-ui-status--degraded' : 'dsd-ui-status--healthy';
            const shortUrl = r.url.length > 60 ? `${r.url.substring(0, 57)}...` : r.url;
            return `<div class="dsd-ui-log-item"><span class="dsd-ui-log-time">${formatDate(r.timestamp)}</span><span class="dsd-ui-tag">${r.method}</span><span class="${sc}">${r.error ? 'ERR' : r.status}</span><span>${r.duration}ms</span><span class="dsd-ui-net-url" title="${sanitizeAttr(r.url)}">${sanitizeAttr(shortUrl)}</span></div>`;
        }).join('');

    return makeSectionHtml('net-summary', 'wifi', 'Network Summary',
        `<div class="dsd-ui-grid"><div class="dsd-ui-card"><div class="dsd-ui-card__label">Total</div><div class="dsd-ui-card__value">${stats.total}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Failed</div><div class="dsd-ui-card__value ${stats.failed > 0 ? 'dsd-ui-status--unhealthy' : 'dsd-ui-status--healthy'}">${stats.failed}</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Avg Duration</div><div class="dsd-ui-card__value">${stats.avgDuration}ms</div></div><div class="dsd-ui-card"><div class="dsd-ui-card__label">Data Transfer</div><div class="dsd-ui-card__value dsd-ui-card__value--sm">${formatBytes(stats.totalSize)}</div></div></div>`) +
    makeSectionHtml('net-requests', 'globe', 'Requests (last 30)',
        `<div class="dsd-ui-toolbar"><button class="dsd-ui-btn" id="btn-clear-network">${icon('trash', 14)} Clear</button></div><div class="dsd-ui-log">${listHtml}</div>`);
}

export default { renderNetworkTab, interceptNetwork, restoreNetwork, getNetworkRequests, clearNetworkRequests, getNetworkStats };
