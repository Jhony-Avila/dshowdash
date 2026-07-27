// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/state
// PURPOSE: Estado compartilhado da navegação por teclado
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   _initialized, isInitialized, setInitialized
//   _enabled, isEnabled, setEnabled
//   _currentRegionIndex, getCurrentRegionIndex, setCurrentRegionIndex
//   _tabTrapRegion, getTabTrapRegion, setTabTrapRegion
//   _previousFocus, getPreviousFocus, setPreviousFocus
//   _listeners — Array de listeners
//   _metrics, incrementMetric, getMetrics, notifyListeners
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationState
 * @description Estado centralizado da navegação por teclado
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-navigation.state';

export let _initialized = false;
export function isInitialized() { return _initialized; }
export function setInitialized(val: DynObj) { _initialized = val; }

export let _enabled = true;
export function isEnabled() { return _enabled; }
export function setEnabled(val: DynObj) { _enabled = val; }

export let _currentRegionIndex = -1;
export function getCurrentRegionIndex() { return _currentRegionIndex; }
export function setCurrentRegionIndex(idx: DynObj) { _currentRegionIndex = idx; }

export let _tabTrapRegion: DynObj = null;
export function getTabTrapRegion() { return _tabTrapRegion; }
export function setTabTrapRegion(region: DynObj) { _tabTrapRegion = region; }

export let _previousFocus: DynObj = null;
export function getPreviousFocus() { return _previousFocus; }
export function setPreviousFocus(el: DynObj) { _previousFocus = el; }

export const _listeners: DynObj[] = [];

export const _metrics = {
    f6Navigations: 0,
    escapeActions: 0,
    tabTraps: 0,
    errors: 0
};

export function incrementMetric(key: string) {
    if (_metrics.hasOwnProperty(key)) (_metrics as DynObj)[key]++;
}

export function getMetrics() {
    return {
        f6Navigations: _metrics.f6Navigations,
        escapeActions: _metrics.escapeActions,
        tabTraps: _metrics.tabTraps,
        errors: _metrics.errors
    };
}

export function notifyListeners(event: string, data: DynObj) {
    for (let i = 0; i < _listeners.length; i++) {
        try {
            _listeners[i]({ type: event, data, timestamp: Date.now() });
        } catch (e) {
            _metrics.errors++;
        }
    }
}
