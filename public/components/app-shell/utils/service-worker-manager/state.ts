// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: service-worker-manager/state
// PURPOSE: Estado compartilhado do Service Worker Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SW_STATES, UPDATE_STRATEGIES from ./constants.js
// EXPORTS:
//   _state — Estado do SW
//   _config — Configurações
//   getConfig, setConfigValue — Helpers de config
//   _subscribers — Array de subscribers
//   _checkIntervalId, getCheckIntervalId, setCheckIntervalId — Interval ref
//   _metrics, incrementMetric, getMetrics — Métricas
// ═══════════════════════════════════════════════════════════════
/**
 * @module ServiceWorkerManagerState
 * @description Estado centralizado do SW Manager
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { SW_STATES, UPDATE_STRATEGIES } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.service-worker-manager.state';

export const _state = {
    supported: false,
    registration: null as DynObj,
    state: SW_STATES.NOT_REGISTERED,
    updateAvailable: false,
    waitingWorker: null as DynObj,
    error: null as DynObj
};

export const _config = {
    swPath: '/sw.js',
    scope: '/',
    updateStrategy: UPDATE_STRATEGIES.PROMPT,
    checkInterval: 3600000,
    autoRegister: false
};

export function getConfig() {
    return _config;
}

export function setConfigValue(key: string, value: DynObj) {
    (_config as DynObj)[key] = value;
}

export const _subscribers: DynObj[] = [];

export let _checkIntervalId: DynObj = null;

export function getCheckIntervalId() {
    return _checkIntervalId;
}

export function setCheckIntervalId(id: DynObj) {
    _checkIntervalId = id;
}

export const _metrics = {
    registrations: 0,
    updates: 0,
    errors: 0,
    messagesSent: 0,
    messagesReceived: 0
};

export function incrementMetric(key: string) {
    if (_metrics.hasOwnProperty(key)) (_metrics as DynObj)[key]++;
}

export function getMetrics() {
    return {
        registrations: _metrics.registrations,
        updates: _metrics.updates,
        errors: _metrics.errors,
        messagesSent: _metrics.messagesSent,
        messagesReceived: _metrics.messagesReceived
    };
}
