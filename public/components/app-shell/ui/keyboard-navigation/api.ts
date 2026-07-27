// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/api
// PURPOSE: API pública de navegação por teclado
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, NAVIGATION_ORDER from ./constants.js
//   isInitialized, setInitialized, isEnabled, setEnabled, _listeners, getMetrics, notifyListeners from ./state.js
//   globalKeyHandler from ./handlers/global.js
//   getCurrentRegion, getVisibleRegions from ./helpers/regions.js
//   navigateToRegion, navigateNext, navigatePrevious, navigateToMain from ./navigation/core.js
//   setTabTrap, releaseTabTrap, isTabTrapped, getTabTrapRegion from ./trap/manager.js
// EXPORTS:
//   init, destroy — Lifecycle
//   enable, disable, isEnabled — Estado
//   getNavigationOrder, setNavigationOrder — Ordem de navegação
//   subscribe — Eventos
//   healthCheck, info — Diagnósticos
//   navigateToRegion, navigateNext, navigatePrevious, navigateToMain — Navegação
//   setTabTrap, releaseTabTrap, isTabTrapped, getTabTrapRegion — Tab trap
//   getCurrentRegion, getMetrics — Consultas
// BROWSER APIs: document.addEventListener, document.removeEventListener
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationAPI
 * @description API pública de navegação
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { VERSION, MODULE_ID, NAVIGATION_ORDER } from './constants.js';
import {
    isInitialized, setInitialized,
    isEnabled as _isEnabled, setEnabled,
    _listeners, getMetrics, notifyListeners
} from './state.js';
import { globalKeyHandler } from './handlers/global.js';
import { getCurrentRegion, getVisibleRegions } from './helpers/regions.js';
import { navigateToRegion, navigateNext, navigatePrevious, navigateToMain } from './navigation/core.js';
import { setTabTrap, releaseTabTrap, isTabTrapped, getTabTrapRegion } from './trap/manager.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export function init() {
    if (isInitialized()) return true;
    if (typeof document === 'undefined') return false;
    
    document.addEventListener('keydown', globalKeyHandler);
    setInitialized(true);
    
    notifyListeners('initialized', null);
    return true;
}

export function destroy() {
    if (!isInitialized()) return true;
    
    document.removeEventListener('keydown', globalKeyHandler);
    setInitialized(false);
    
    notifyListeners('destroyed', null);
    return true;
}

export function enable() {
    setEnabled(true);
    notifyListeners('enabled', null);
}

export function disable() {
    setEnabled(false);
    notifyListeners('disabled', null);
}

export function isEnabled() {
    return _isEnabled();
}

export function getNavigationOrder() {
    return NAVIGATION_ORDER.slice();
}

export function setNavigationOrder(order: DynObj) {
    if (Array.isArray(order) && order.length > 0) {
        NAVIGATION_ORDER.length = 0;
        for (let i = 0; i < order.length; i++) {
            NAVIGATION_ORDER.push(order[i]);
        }
        notifyListeners('navigation-order-changed', { order });
    }
}

export function subscribe(callback: DynObj) {
    if (typeof callback !== 'function') return () => {};
    
    _listeners.push(callback);
    
    return () => {
        const idx = _listeners.indexOf(callback);
        if (idx >= 0) _listeners.splice(idx, 1);
    };
}

export function healthCheck() {
    const checks = {
        initialized: isInitialized(),
        enabled: _isEnabled(),
        noErrors: getMetrics().errors === 0
    };
    
    const checkKeys = Object.keys(checks);
    let passed = 0;
    for (let i = 0; i < checkKeys.length; i++) {
        if ((checks as DynObj)[checkKeys[i]]) passed++;
    }
    const total = checkKeys.length;
    
    return {
        status: passed === total ? 'HEALTHY' : (passed >= 1 ? 'DEGRADED' : 'UNHEALTHY'),
        score: `${passed}/${total}`,
        checks,
        currentRegion: getCurrentRegion(),
        tabTrapActive: isTabTrapped(),
        tabTrapRegion: getTabTrapRegion(),
        metrics: getMetrics(),
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
    };
}

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        initialized: isInitialized(),
        enabled: _isEnabled(),
        currentRegion: getCurrentRegion(),
        navigationOrder: getNavigationOrder(),
        visibleRegions: getVisibleRegions(),
        tabTrapActive: isTabTrapped(),
        tabTrapRegion: getTabTrapRegion(),
        listenerCount: _listeners.length,
        metrics: getMetrics(),
        shortcuts: {
            'F6': 'Navigate to next region',
            'Shift+F6': 'Navigate to previous region',
            'Escape': 'Return to main region / release tab trap'
        },
        timestamp: Date.now()
    };
}

// Re-exports
export { navigateToRegion, navigateNext, navigatePrevious, navigateToMain };
export { setTabTrap, releaseTabTrap, isTabTrapped, getTabTrapRegion };
export { getCurrentRegion };
export { getMetrics };

