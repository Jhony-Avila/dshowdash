
// UI Orchestrator - ManifestSync Module
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 2.0.0-PORTSFACTORY
// @changelog v2.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.0.0-ENTERPRISE - Sincronização em tempo real do manifest com o banco de dados
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '2.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.ui-orchestrator.core.manifest-sync';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const CONFIG = {
    enabled: true,
    checkOnBoot: true,
    pollingInterval: 60000,
    pollingEnabled: true,
    versionEndpoint: '/api/ui/orchestrator-version.php',
    diffEndpoint: '/api/ui/orchestrator-diff.php',
    fullEndpoint: '/api/ui/orchestrator-manifest.php',
    maxRetries: 3,
    retryDelay: 5000,
    debugMode: false
};

const _state: {
    initialized: boolean;
    localHash: string | null;
    localTimestamp: string | null;
    remoteHash: string | null;
    remoteTimestamp: string | null;
    lastSyncAt: string | null;
    lastError: string | null;
    syncCount: number;
    updateCount: number;
    pollingTimer: ReturnType<typeof setInterval> | null;
    abortController: AbortController | null;
    listeners: ((...args: unknown[]) => void)[];
} = {
    initialized: false,
    localHash: null,
    localTimestamp: null,
    remoteHash: null,
    remoteTimestamp: null,
    lastSyncAt: null,
    lastError: null,
    syncCount: 0,
    updateCount: 0,
    pollingTimer: null,
    abortController: null,
    listeners: []
};

const _log = (level: string, msg: string, data?: unknown) => {
    if (!CONFIG.debugMode && level === 'debug') return;
    const logger = _getPort('logger') as Record<string, ((...a: unknown[]) => void) | undefined> | null;
    const fn = logger?.[level];
    if (typeof fn === 'function') fn(`[${MODULE_ID}] ${msg}`, data || {});
};

const _emit = (eventName: string, data: unknown) => {
    _state.listeners.forEach((cb: (...args: unknown[]) => void) => {
        try { cb(eventName, data); } catch (e) { _log('error', 'Listener error', { error: (e as Error).message }); }
    });
    const eb = _getPort('eventBus') as { emit?: (event: string, data: unknown) => void } | null;
    if (eb?.emit) eb.emit(eventName, data);
};

const _fetchWithRetry = async (url: string, retries: number = CONFIG.maxRetries) => {
    const fetchOpts: RequestInit = { cache: 'no-store' };
    if (_state.abortController) fetchOpts.signal = _state.abortController.signal;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, fetchOpts);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (e) {
            const err = e as Error & { name?: string };
            if (err.name === 'AbortError') throw e;
            _log('warn', `Fetch attempt ${i + 1} failed`, { url, error: err.message });
            if (i < retries - 1) await new Promise(r => { setTimeout(r, CONFIG.retryDelay); });
        }
    }
    throw new Error(`All fetch attempts failed for ${url}`);
};

export async function checkVersion() {
    try {
        const data = await _fetchWithRetry(CONFIG.versionEndpoint, 1) as Record<string, unknown>;
        if (data.success) {
            const d = data.data as Record<string, unknown>;
            _state.remoteHash = (d?.hash as string) || null;
            _state.remoteTimestamp = (d?.lastUpdated as string) || null;
            return {
                hasChanges: _state.localHash !== _state.remoteHash,
                localHash: _state.localHash,
                remoteHash: _state.remoteHash,
                counts: d?.counts
            };
        }
        return { hasChanges: false, error: 'API returned success=false' };
    } catch (e) {
        _state.lastError = (e as Error).message;
        return { hasChanges: false, error: (e as Error).message };
    }
}

export async function fetchDiff(since: string) {
    try {
        const url = `${CONFIG.diffEndpoint}?since=${encodeURIComponent(since)}`;
        const data = await _fetchWithRetry(url, 2);
        return data;
    } catch (e) {
        _state.lastError = (e as Error).message;
        return { success: false, error: (e as Error).message };
    }
}

export async function fetchFull() {
    try {
        const data = await _fetchWithRetry(CONFIG.fullEndpoint, 2);
        return data;
    } catch (e) {
        _state.lastError = (e as Error).message;
        return { success: false, error: (e as Error).message };
    }
}

const _applyUpdates = (data: unknown, source: string) => {
    if (!window.ManifestState) {
        _log('warn', 'ManifestState not available');
        return false;
    }

    try {
        const d = data as Record<string, unknown>;
        if (source === 'full' && d.data) {
            const fullData = d.data as Record<string, unknown>;
            window.ManifestState.replaceAll(fullData);
            _state.localHash = (fullData.hash as string) || _state.remoteHash;
        } else if (source === 'diff' && d.diff) {
            window.ManifestState.applyDiff(d.diff as Record<string, unknown>);
            const cv = d.currentVersion as Record<string, unknown> | undefined;
            _state.localHash = cv ? (cv.hash as string) : _state.remoteHash;
        }

        _state.localTimestamp = new Date().toISOString();
        _state.updateCount++;
        _log('info', 'Updates applied', { source, newHash: _state.localHash });
        return true;
    } catch (e) {
        _log('error', 'Failed to apply updates', { error: (e as Error).message });
        return false;
    }
};

export async function sync(options: Record<string, unknown> = {}) {
    const force = options.force || false;

    _emit('manifest:sync:start', { force });
    _state.syncCount++;

    try {
        const versionCheck = await checkVersion();

        if (!versionCheck.hasChanges && !force) {
            _state.lastSyncAt = new Date().toISOString();
            _emit('manifest:sync:no-change', { hash: _state.localHash });
            _log('debug', 'No changes detected');
            return { success: true, updated: false, hash: _state.localHash };
        }

        _emit('manifest:sync:updating', { localHash: _state.localHash, remoteHash: _state.remoteHash });

        let updated = false;
        if (_state.localTimestamp && !force) {
            const diffResult = await fetchDiff(_state.localTimestamp) as Record<string, unknown>;
            if (diffResult.success && diffResult.hasChanges) {
                updated = _applyUpdates(diffResult, 'diff');
            }
        }

        if (!updated) {
            const fullResult = await fetchFull() as Record<string, unknown>;
            if (fullResult.success) {
                updated = _applyUpdates(fullResult, 'full');
            }
        }

        _state.lastSyncAt = new Date().toISOString();
        _state.lastError = null;

        if (updated) {
            _emit('manifest:sync:updated', { hash: _state.localHash, updateCount: _state.updateCount });
            _log('info', 'Sync completed with updates');
        }

        return { success: true, updated, hash: _state.localHash };

    } catch (e) {
        _state.lastError = (e as Error).message;
        _emit('manifest:sync:error', { error: (e as Error).message });
        _log('error', 'Sync failed', { error: (e as Error).message });
        return { success: false, error: (e as Error).message };
    }
}

export function startPolling(interval?: number) {
    if (_state.pollingTimer) stopPolling();

    const pollInterval = interval || CONFIG.pollingInterval;
    _state.pollingTimer = setInterval(() => {
        if (document.hidden) return;
        sync().catch((e: unknown) => { _log('error', 'Polling sync error', { error: (e as Error).message }); });
    }, pollInterval);

    _log('info', 'Polling started', { interval: pollInterval });
}

export function stopPolling() {
    if (_state.pollingTimer) {
        clearInterval(_state.pollingTimer);
        _state.pollingTimer = null;
    }
    if (_state.abortController) {
        _state.abortController.abort();
        _state.abortController = new AbortController();
    }
    _log('info', 'Polling stopped');
}

export function pause() {
    stopPolling();
    CONFIG.enabled = false;
    if (_state.abortController) {
        _state.abortController.abort();
        _state.abortController = null;
    }
}

export function resume() {
    CONFIG.enabled = true;
    if (!_state.abortController) _state.abortController = new AbortController();
    if (CONFIG.pollingEnabled) startPolling();
}

export function onUpdate(callback: (...args: unknown[]) => void) {
    if (typeof callback === 'function') {
        _state.listeners.push(callback);
    }
}

export function offUpdate(callback: (...args: unknown[]) => void) {
    _state.listeners = _state.listeners.filter((cb: (...args: unknown[]) => void) => cb !== callback);
}

export async function init(options?: Record<string, unknown>) {
    if (_state.initialized) return { success: true, alreadyInitialized: true };

    _initPorts();

    if (options) {
        if (options.pollingInterval) CONFIG.pollingInterval = options.pollingInterval as number;
        if (options.pollingEnabled !== undefined) CONFIG.pollingEnabled = options.pollingEnabled as boolean;
        if (options.debugMode !== undefined) CONFIG.debugMode = options.debugMode as boolean;
        if (options.checkOnBoot !== undefined) CONFIG.checkOnBoot = options.checkOnBoot as boolean;
    }

    if (window.ManifestState) {
        const info = window.ManifestState.info() as Record<string, unknown>;
        _state.localHash = (info.hash || info.MANIFEST_HASH || null) as string | null;
        _state.localTimestamp = (info.generatedAt || info.GENERATED_AT || null) as string | null;
    }

    _state.abortController = new AbortController();
    _state.initialized = true;
    _log('info', 'ManifestSync initialized', { localHash: _state.localHash, pollingEnabled: CONFIG.pollingEnabled });

    if (CONFIG.checkOnBoot) {
        setTimeout(() => { sync(); }, 1000);
    }

    if (CONFIG.pollingEnabled) {
        startPolling();
    }

    return { success: true };
}

export function healthCheck() {
    return {
        status: _state.initialized ? (_state.lastError ? 'DEGRADED' : 'HEALTHY') : 'NOT_INITIALIZED',
        moduleId: MODULE_ID,
        version: VERSION,
        initialized: _state.initialized,
        localHash: _state.localHash,
        remoteHash: _state.remoteHash,
        inSync: _state.localHash === _state.remoteHash,
        lastSyncAt: _state.lastSyncAt,
        lastError: _state.lastError,
        syncCount: _state.syncCount,
        updateCount: _state.updateCount,
        pollingActive: _state.pollingTimer !== null,
        portsInitialized: Ports.isInitialized()
    };
}

export function info() {
    return {
        version: VERSION,
        moduleId: MODULE_ID,
        config: {
            pollingInterval: CONFIG.pollingInterval,
            pollingEnabled: CONFIG.pollingEnabled,
            checkOnBoot: CONFIG.checkOnBoot
        },
        state: {
            initialized: _state.initialized,
            localHash: _state.localHash,
            remoteHash: _state.remoteHash,
            syncCount: _state.syncCount,
            updateCount: _state.updateCount
        },
        portsInitialized: Ports.isInitialized()
    };
}

export function configure(options: Record<string, unknown>) {
    Object.assign(CONFIG, options);
    _log('info', 'Configuration updated', options);
}

export function getStatus() { return healthCheck(); }

export default Object.freeze({
    VERSION,
    MODULE_ID,
    init,
    sync,
    checkVersion,
    fetchDiff,
    fetchFull,
    startPolling,
    stopPolling,
    pause,
    resume,
    onUpdate,
    offUpdate,
    configure,
    healthCheck,
    getStatus,
    info,
    injectPorts,
    getPorts
});
