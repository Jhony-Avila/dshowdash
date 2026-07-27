// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-shortcuts/state
// PURPOSE: Estado centralizado do sistema de shortcuts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SHORTCUT_SCOPES, DEFAULT_CONFIG from ./constants.js
// EXPORTS:
//   getShortcuts, getGroups — Mapas de dados
//   getActiveScope, setActiveScope, getScopeStack — Escopos
//   isEnabled, setEnabled — Estado habilitado
//   getSubscribers — Lista de subscribers
//   getLastCombo, setLastCombo — Último combo
//   isHelpPanelOpen, setHelpPanelOpen — Painel de ajuda
//   getConfig, updateConfig — Configuração
//   getMetrics, incrementMetric — Métricas
//   resetState — Reset completo
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardShortcutsState
 * @description Estado centralizado de shortcuts
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { SHORTCUT_SCOPES, DEFAULT_CONFIG } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-shortcuts.state';

const state: Record<string, any> = {
    shortcuts: new Map(),
    groups: new Map(),
    activeScope: SHORTCUT_SCOPES.GLOBAL,
    scopeStack: [],
    enabled: true,
    subscribers: [],
    pressedKeys: new Set(),
    lastCombo: null,
    helpPanelOpen: false,
    
    config: {
        preventDefault: DEFAULT_CONFIG.preventDefault,
        stopPropagation: DEFAULT_CONFIG.stopPropagation,
        allowInInputs: DEFAULT_CONFIG.allowInInputs,
        debounceMs: DEFAULT_CONFIG.debounceMs,
        showHelp: DEFAULT_CONFIG.showHelp,
        helpKey: DEFAULT_CONFIG.helpKey
    },
    
    metrics: {
        triggered: 0,
        blocked: 0,
        registered: 0
    }
};

export function getShortcuts() {
    return state.shortcuts;
}

export function getGroups() {
    return state.groups;
}

export function getActiveScope() {
    return state.activeScope;
}

export function setActiveScope(scope: DynObj) {
    state.activeScope = scope;
}

export function getScopeStack() {
    return state.scopeStack;
}

export function isEnabled() {
    return state.enabled;
}

export function setEnabled(value: DynObj) {
    state.enabled = !!value;
}

export function getSubscribers() {
    return state.subscribers;
}

export function getLastCombo() {
    return state.lastCombo;
}

export function setLastCombo(combo: DynObj) {
    state.lastCombo = combo;
}

export function isHelpPanelOpen() {
    return state.helpPanelOpen;
}

export function setHelpPanelOpen(value: DynObj) {
    state.helpPanelOpen = !!value;
}

export function getConfig() {
    return state.config;
}

export function updateConfig(options: DynObj) {
    if (options.preventDefault !== undefined) state.config.preventDefault = !!options.preventDefault;
    if (options.stopPropagation !== undefined) state.config.stopPropagation = !!options.stopPropagation;
    if (options.allowInInputs !== undefined) state.config.allowInInputs = !!options.allowInInputs;
    if (options.debounceMs !== undefined) state.config.debounceMs = Math.max(0, options.debounceMs);
    if (options.showHelp !== undefined) state.config.showHelp = !!options.showHelp;
    if (options.helpKey !== undefined) state.config.helpKey = options.helpKey;
}

export function getMetrics() {
    return state.metrics;
}

export function incrementMetric(name: string) {
    if (state.metrics[name] !== undefined) {
        state.metrics[name]++;
    }
}

export function resetState() {
    state.shortcuts.clear();
    state.groups.clear();
    state.scopeStack.length = 0;
    state.subscribers.length = 0;
    state.activeScope = SHORTCUT_SCOPES.GLOBAL;
    state.enabled = true;
    state.lastCombo = null;
    state.helpPanelOpen = false;
}

export default state;
