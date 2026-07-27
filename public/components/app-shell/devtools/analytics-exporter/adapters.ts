// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: analytics-exporter/adapters
// PURPOSE: Adapters built-in e gerenciamento de adapters
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   registerAdapter — Registra adapter
//   unregisterAdapter — Remove adapter
//   enableAdapter, disableAdapter — Habilita/desabilita
//   getAdapters — Lista adapters
//   useBuiltInAdapter — Usa adapter built-in
// BROWSER APIs: console, localStorage, navigator.sendBeacon, fetch
// ═══════════════════════════════════════════════════════════════
/**
 * @module AnalyticsExporterAdapters
 * @description Adapters de analytics
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.analytics-exporter.adapters';

const BUILT_IN_ADAPTERS = {
    console: {
        name: 'console',
        send(events: DynObj) {
            console.group(`[Analytics Export] ${events.length} events`);
            for (let i = 0; i < events.length; i++) {
                console.log(events[i]);
            }
            console.groupEnd();
            return Promise.resolve({ success: true, count: events.length });
        }
    },

    localStorage: {
        name: 'localStorage',
        send(events: DynObj) {
            try {
                const existing = JSON.parse(localStorage.getItem('app-shell-analytics') || '[]');
                let combined = existing.concat(events);
                if (combined.length > 500) {
                    combined = combined.slice(-500);
                }
                localStorage.setItem('app-shell-analytics', JSON.stringify(combined));
                return Promise.resolve({ success: true, count: events.length, stored: combined.length });
            } catch (e) {
                return Promise.reject(e);
            }
        }
    },

    beacon: {
        name: 'beacon',
        endpoint: null as DynObj,
        send(events: DynObj) {
            const endpoint = this.endpoint;
            if (!endpoint) return Promise.reject(new Error('Beacon endpoint not configured'));

            const data = JSON.stringify({ events, timestamp: Date.now() });
            const success = navigator.sendBeacon(endpoint, data);

            if (success) return Promise.resolve({ success: true, count: events.length });
            return Promise.reject(new Error('Beacon failed'));
        }
    },

    fetch: {
        name: 'fetch',
        endpoint: null as DynObj,
        headers: {},
        send(events: DynObj) {
            const endpoint = this.endpoint;
            if (!endpoint) return Promise.reject(new Error('Fetch endpoint not configured'));

            const headers = Object.assign({ 'Content-Type': 'application/json' }, this.headers);

            return fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({ events, timestamp: Date.now() })
            }).then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return { success: true, count: events.length };
            });
        }
    }
};

export function registerAdapter(name: string, adapter: DynObj, adaptersMap: DynObj) {
    if (!adapter || typeof adapter.send !== 'function') return false;

    adaptersMap.set(name, {
        name,
        adapter,
        enabled: true,
        sentCount: 0,
        errorCount: 0,
        lastSent: null,
        lastError: null
    });

    return true;
}

export function unregisterAdapter(name: string, adaptersMap: DynObj) {
    return adaptersMap.delete(name);
}

export function enableAdapter(name: string, adaptersMap: DynObj) {
    const entry = adaptersMap.get(name);
    if (entry) { entry.enabled = true; return true; }
    return false;
}

export function disableAdapter(name: string, adaptersMap: DynObj) {
    const entry = adaptersMap.get(name);
    if (entry) { entry.enabled = false; return true; }
    return false;
}

export function getAdapters(adaptersMap: DynObj) {
    const result: DynObj[] = [];
    adaptersMap.forEach((entry: DynObj) => {
        result.push({
            name: entry.name,
            enabled: entry.enabled,
            sentCount: entry.sentCount,
            errorCount: entry.errorCount,
            lastSent: entry.lastSent,
            lastError: entry.lastError
        });
    });
    return result;
}

export function useBuiltInAdapter(name: string, options: DynObj, adaptersMap: DynObj) {
    const builtin = (BUILT_IN_ADAPTERS as DynObj)[name];
    if (!builtin) return false;

    const adapter = Object.assign({}, builtin);
    if (options) Object.assign(adapter, options);

    return registerAdapter(name, adapter, adaptersMap);
}
