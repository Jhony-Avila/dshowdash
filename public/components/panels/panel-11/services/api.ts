// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-11.services.api
// PURPOSE: Panel-11 API Client - Enterprise Premium AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   REQUEST_TIMEOUT from ../core/constants.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   ApiClient() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
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

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { REQUEST_TIMEOUT } from '../core/constants.js';

const MODULE_ID = 'panel-11.services.api';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function ApiClient(this: any, panelId: string, logger: Record<string, unknown>) {
    this.panelId = panelId;
    this.logger = logger || console;
    this.activeController = null;
    this.baseURL = '/api/modules/panels';
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000;
}

ApiClient.prototype._delay = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });

ApiClient.prototype.fetchData = function(options: Record<string, any> = {}) {
    const { signal, timeout = REQUEST_TIMEOUT, period = '30d', filters = {} } = options;

    const controller = signal ? null : new AbortController();
    const abortSignal = signal || controller?.signal;
    if (!signal) this.activeController = controller;

    const params = new URLSearchParams();
    params.append('period', period);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    const url = `${this.baseURL}/${this.panelId}/api.php?${params.toString()}`;

    const timeoutId = setTimeout(() => { if (controller) controller.abort(); }, timeout);

    this.logger?.debug?.('api.fetch.start', { url, period });


    // @ts-expect-error TS migration - TS2345
    return fetch(url, { method: 'GET', signal: abortSignal, credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Panel-Id': this.panelId, 'X-Requested-With': 'XMLHttpRequest' } }).then((response) => {
        clearTimeout(timeoutId);
        if (!response.ok) { this.logger?.error?.('api.fetch.http-error', { status: response.status }); return { success: false, error: `HTTP_${response.status}`, status: response.status }; }
        return response.json().then((data) => {
            this.retryCount = 0;
            this.logger?.debug?.('api.fetch.success', { records: data?.data?.executions?.total || 0 });
            return { success: true, payload: data, timestamp: Date.now() };
        });
    }).catch((error) => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') { this.logger?.warn?.('api.fetch.aborted'); return { success: false, error: 'REQUEST_ABORTED', aborted: true }; }
        this.logger?.error?.('api.fetch.error', { error: error.message });
        if (this.retryCount < this.maxRetries) { this.retryCount++; this.logger?.info?.('api.fetch.retry', { attempt: this.retryCount }); return this._delay(this.retryDelay * this.retryCount).then(() => this.fetchData(options)); }
        return { success: false, error: 'NETWORK_ERROR', message: error.message, retries: this.retryCount };
    });
};

ApiClient.prototype.fetchErrors = function(options: Record<string, any> = {}) {
    const { signal, limit = 10 } = options;

    const controller = signal ? null : new AbortController();
    const abortSignal = signal || controller?.signal;

    const params = new URLSearchParams();
    params.append('action', 'errors');
    params.append('limit', limit);

    const url = `${this.baseURL}/${this.panelId}/api.php?${params.toString()}`;


    // @ts-expect-error TS migration - TS2345
    return fetch(url, { method: 'GET', signal: abortSignal, credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Panel-Id': this.panelId } }).then((response) => {
        if (!response.ok) { return { success: false, error: `HTTP_${response.status}` }; }
        return response.json().then(data => ({
            success: true,
            payload: data
        }));
    }).catch((error) => {
        if (error.name === 'AbortError') { return { success: false, error: 'REQUEST_ABORTED' }; }
        return { success: false, error: 'NETWORK_ERROR', message: error.message };
    });
};

ApiClient.prototype.fetchTrend = function(options: Record<string, any> = {}) {
    const { signal, period = '30d' } = options;

    const controller = signal ? null : new AbortController();
    const abortSignal = signal || controller?.signal;

    const params = new URLSearchParams();
    params.append('action', 'trend');
    params.append('period', period);

    const url = `${this.baseURL}/${this.panelId}/api.php?${params.toString()}`;


    // @ts-expect-error TS migration - TS2345
    return fetch(url, { method: 'GET', signal: abortSignal, credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Panel-Id': this.panelId } }).then((response) => {
        if (!response.ok) { return { success: false, error: `HTTP_${response.status}` }; }
        return response.json().then(data => ({
            success: true,
            payload: data
        }));
    }).catch((error) => {
        if (error.name === 'AbortError') { return { success: false, error: 'REQUEST_ABORTED' }; }
        return { success: false, error: 'NETWORK_ERROR', message: error.message };
    });
};

ApiClient.prototype.cancel = function() { if (this.activeController) { this.activeController.abort(); this.activeController = null; this.logger?.debug?.('api.cancelled'); } };
ApiClient.prototype.reset = function() { this.cancel(); this.retryCount = 0; };
ApiClient.prototype.healthCheck = function() { return { moduleId: MODULE_ID, version: VERSION, panelId: this.panelId, hasActiveRequest: !!this.activeController, retryCount: this.retryCount }; };

export { ApiClient, VERSION, MODULE_ID };
export default ApiClient;
