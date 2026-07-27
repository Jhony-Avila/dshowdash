// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: lazy-loader/state
// PURPOSE: Estado centralizado do Lazy Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LOAD_STATES, DEFAULT_CONFIG from ./constants.js
// EXPORTS:
//   ModuleEntry — Construtor de entrada de módulo
//   cache, pending — Aliases para compatibilidade com loader.js
//   getModules, getModule, setModule, deleteModule, hasModule — Módulos
//   getLoadPromises, getLoadPromise, setLoadPromise, deleteLoadPromise, hasLoadPromise — Promises
//   getSubscribers — Lista de subscribers
//   getConfig, updateConfig — Configuração
//   getMetrics, incrementMetric — Métricas
//   notifySubscribers — Notificação
// @changelog v1.1.0 - Adicionado exports cache/pending para compatibilidade
// ═══════════════════════════════════════════════════════════════
/**
 * @module LazyLoaderState
 * @description Estado centralizado do lazy loader
 * @version 1.1.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { LOAD_STATES, DEFAULT_CONFIG } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.lazy-loader.state';

const state: Record<string, any> = {
    modules: new Map(),
    loadPromises: new Map(),
    subscribers: [],
    config: {
        timeout: DEFAULT_CONFIG.timeout,
        retryAttempts: DEFAULT_CONFIG.retryAttempts,
        retryDelay: DEFAULT_CONFIG.retryDelay,
        preloadOnIdle: DEFAULT_CONFIG.preloadOnIdle,
        cacheModules: DEFAULT_CONFIG.cacheModules
    },
    metrics: {
        totalLoads: 0,
        successfulLoads: 0,
        failedLoads: 0,
        cachedHits: 0,
        totalLoadTime: 0
    }
};

// ═══════════════════════════════════════════════════════════════
// ALIASES PARA COMPATIBILIDADE (loader.js espera cache e pending)
// ═══════════════════════════════════════════════════════════════
export const cache = state.modules;
export const pending = state.loadPromises;

// ═══════════════════════════════════════════════════════════════
// MODULE ENTRY CONSTRUCTOR
// ═══════════════════════════════════════════════════════════════
export function ModuleEntry(this: any, name: string, loader: DynObj, options: DynObj) {
    this.name = name;
    this.loader = loader;
    this.options = options || {};
    this.state = LOAD_STATES.PENDING;
    this.module = null;
    this.error = null;
    this.loadTime = null;
    this.loadedAt = null;
    this.attempts = 0;
}

// ═══════════════════════════════════════════════════════════════
// MODULES
// ═══════════════════════════════════════════════════════════════
export function getModules() {
    return state.modules;
}

export function getModule(name: string) {
    return state.modules.get(name);
}

export function setModule(name: string, entry: DynObj) {
    state.modules.set(name, entry);
}

export function deleteModule(name: string) {
    state.modules.delete(name);
}

export function hasModule(name: string) {
    return state.modules.has(name);
}

// ═══════════════════════════════════════════════════════════════
// LOAD PROMISES
// ═══════════════════════════════════════════════════════════════
export function getLoadPromises() {
    return state.loadPromises;
}

export function getLoadPromise(name: string) {
    return state.loadPromises.get(name);
}

export function setLoadPromise(name: string, promise: DynObj) {
    state.loadPromises.set(name, promise);
}

export function deleteLoadPromise(name: string) {
    state.loadPromises.delete(name);
}

export function hasLoadPromise(name: string) {
    return state.loadPromises.has(name);
}

// ═══════════════════════════════════════════════════════════════
// SUBSCRIBERS
// ═══════════════════════════════════════════════════════════════
export function getSubscribers() {
    return state.subscribers;
}

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
export function getConfig() {
    return state.config;
}

export function updateConfig(options: DynObj) {
    if (options.timeout !== undefined) state.config.timeout = Math.max(1000, options.timeout);
    if (options.retryAttempts !== undefined) state.config.retryAttempts = Math.max(0, options.retryAttempts);
    if (options.retryDelay !== undefined) state.config.retryDelay = Math.max(100, options.retryDelay);
    if (options.preloadOnIdle !== undefined) state.config.preloadOnIdle = !!options.preloadOnIdle;
    if (options.cacheModules !== undefined) state.config.cacheModules = !!options.cacheModules;
}

// ═══════════════════════════════════════════════════════════════
// METRICS
// ═══════════════════════════════════════════════════════════════
export function getMetrics() {
    return state.metrics;
}

export function incrementMetric(name: string, value?: DynObj) {
    if (state.metrics[name] !== undefined) {
        state.metrics[name] += (value || 1);
    }
}

// ═══════════════════════════════════════════════════════════════
// SUBSCRIBERS NOTIFICATION
// ═══════════════════════════════════════════════════════════════
export function notifySubscribers(event: DynObj) {
    for (let i = 0; i < state.subscribers.length; i++) {
        try { state.subscribers[i](event); } catch (e) {}
    }
}

export default state;
