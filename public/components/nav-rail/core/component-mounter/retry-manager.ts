// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-core-component-mounter-retry-manager
// PURPOSE: NavRail Component Mounter - Retry Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   componentState, metrics, MOUNTER_EVENTS from ./constants.js
//   track from ./error-boundary.js
//
// PROVIDES:
//   setDependencies() — exported function
//   retryComponent() — exported function
//   retryFailed() — exported function
//   getFailedComponents() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { componentState, metrics, MOUNTER_EVENTS } from './constants.js';
import { track } from './error-boundary.js';

export const VERSION = '5.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'nav-rail.core.component-mounter.retry-manager';

let _log: (level: string, msg: string, data?: unknown) => void = () => {};
let _mountFn: ((id: string, hostEl: HTMLElement, props: Record<string, unknown>) => Promise<unknown>) | null = null;

export function setDependencies(logFn: (level: string, msg: string, data?: unknown) => void, mountFn: (id: string, hostEl: HTMLElement, props: Record<string, unknown>) => Promise<unknown>) {
    _log = logFn;
    _mountFn = mountFn;
}

export function retryComponent(id: string) {
    let failedInfo = componentState.failed.get(id);
    if (!failedInfo) {
        _log('warn', 'Component not in failed list', { id });

        const host = document.querySelector(`[data-host-id="${id}"]`);
        if (!host) {
            _log('error', 'Host not found for retry', { id });
            return Promise.resolve(false);
        }
        failedInfo = { host, props: {}, attempts: 0 };
    }

    failedInfo.attempts++;
    metrics.totalRetries++;

    _log('info', 'Retrying component', { id, attempt: failedInfo.attempts });
    track(MOUNTER_EVENTS.COMPONENT_RETRY, { id, attempt: failedInfo.attempts });

    if (failedInfo.host) {
        failedInfo.host.innerHTML = `<div class="navrail-loading" data-loading-for="${id}"><div class="navrail-loading__spinner"></div></div>`;
    }

    if (!_mountFn) {
        return Promise.resolve(false);
    }

    return _mountFn(id, failedInfo.host, failedInfo.props || {}).then(instance => {
        if (instance) {
            _log('info', 'Retry successful', { id });
            return true;
        }
        return false;
    });
}

export function retryFailed() {
    const failedIds = Array.from(componentState.failed.keys());

    if (failedIds.length === 0) {
        _log('info', 'No failed components to retry');
        return Promise.resolve({ success: 0, failed: 0, total: 0 });
    }

    _log('info', 'Retrying all failed components', { count: failedIds.length });

    const promises = failedIds.map(id => retryComponent(id).then(success => ({
        id,
        success
    })));

    return Promise.all(promises).then(results => {
        const success = results.filter(r => r.success).length;
        const failed = results.length - success;

        _log('info', 'Retry all complete', { success, failed });

        return { success, failed, total: results.length };
    });
}

export function getFailedComponents() {
    return Array.from(componentState.failed.entries()).map(entry => ({
        id: entry[0],
        error: entry[1].error,
        attempts: entry[1].attempts,
        lastAttempt: entry[1].lastAttempt
    }));
}

export default {
    retryComponent,
    retryFailed,
    getFailedComponents,
    setDependencies
};
