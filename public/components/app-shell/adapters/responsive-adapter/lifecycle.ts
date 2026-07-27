// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: responsive-adapter/lifecycle
// PURPOSE: Lifecycle e inicialização do adapter responsivo
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   BREAKPOINTS from ./constants.js
//   currentBreakpoint, initialized, enabled, autoApplyPolicies, resizeTimeout, mediaQueries, metrics from ./state.js
//   notifyListeners, detectBreakpoint from ./helpers.js
//   applyLayoutPolicy from ./policies.js
//   handleBreakpointChange from ./breakpoints.js
// EXPORTS:
//   init — Inicializa o adapter
//   destroy — Destroi o adapter
//   enable — Habilita o adapter
//   disable — Desabilita o adapter
//   isEnabled — Verifica se está habilitado
// BROWSER APIs: window.addEventListener, window.matchMedia, setTimeout, clearTimeout
// ═══════════════════════════════════════════════════════════════
/**
 * @module ResponsiveAdapterLifecycle
 * @description Lifecycle do adapter responsivo
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'app-shell.adapters.responsive-adapter.lifecycle';

import { BREAKPOINTS } from './constants.js';
import { currentBreakpoint, initialized, enabled, autoApplyPolicies, resizeTimeout, mediaQueries, metrics } from './state.js';
import { notifyListeners, detectBreakpoint } from './helpers.js';
import { applyLayoutPolicy } from './policies.js';
import { handleBreakpointChange } from './breakpoints.js';


function handleResize() {
    if (!enabled.value) return;
    
    metrics.resizeEvents++;
    const newBreakpoint = detectBreakpoint();

    // @ts-expect-error TS migration - TS2554
    handleBreakpointChange(newBreakpoint);
}

function debouncedResize() {
    if (resizeTimeout.value) clearTimeout(resizeTimeout.value);
    resizeTimeout.value = setTimeout(handleResize, 100);
}

export function init(options?: DynObj) {
    if (initialized.value) return true;
    if (typeof window === 'undefined') return false;
    
    options = options || {};
    autoApplyPolicies.value = options.autoApply !== false;
    
    currentBreakpoint.value = detectBreakpoint();
    
    applyLayoutPolicy(currentBreakpoint.value, { animate: false });
    
    window.addEventListener('resize', debouncedResize, { passive: true });
    
    const bpKeys = Object.keys(BREAKPOINTS);
    for (let i = 0; i < bpKeys.length; i++) {
        const key = bpKeys[i];
        const bp = (BREAKPOINTS as DynObj)[key];
        let query = `(min-width: ${bp.min}px)`;
        if (bp.max !== Infinity) {
            query += ` and (max-width: ${bp.max}px)`;
        }
        
        const mq = window.matchMedia(query);
        (mediaQueries as DynObj)[key] = mq;
        
        if (mq.addEventListener) {
            mq.addEventListener('change', handleResize);
        } else if (mq.addListener) {
            mq.addListener(handleResize);
        }
    }
    
    initialized.value = true;
    notifyListeners('initialized', { breakpoint: currentBreakpoint.value });
    
    return true;
}

export function destroy() {
    if (!initialized.value) return true;
    if (typeof window === 'undefined') return true;
    
    window.removeEventListener('resize', debouncedResize);
    
    const keys = Object.keys(mediaQueries);
    for (let i = 0; i < keys.length; i++) {
        const mq = (mediaQueries as DynObj)[keys[i]];
        if (mq.removeEventListener) {
            mq.removeEventListener('change', handleResize);
        } else if (mq.removeListener) {
            mq.removeListener(handleResize);
        }
    }
    
    for (const k in mediaQueries) {
        if (mediaQueries.hasOwnProperty(k)) {
            delete (mediaQueries as DynObj)[k];
        }
    }
    
    if (resizeTimeout.value) {
        clearTimeout(resizeTimeout.value);
        resizeTimeout.value = null;
    }
    
    initialized.value = false;
    notifyListeners('destroyed', null);
    
    return true;
}

export function enable() {
    enabled.value = true;
    handleResize();
    notifyListeners('enabled', null);
}

export function disable() {
    enabled.value = false;
    notifyListeners('disabled', null);
}

export function isEnabled() {
    return enabled.value;
}
