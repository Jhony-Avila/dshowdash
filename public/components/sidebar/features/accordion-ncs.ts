// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.4.0-KERNEL-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: accordion-ncs
// PURPOSE: Sidebar Feature - Accordion NCS (Navigation Configuration System)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION as MODULE_ID, state, initPorts, injectPorts, getPorts, log from ./accordion-ncs/constants.js
//   isEnabled, setFeatureFlag from ./accordion-ncs/feature-flags.js
//   loadAccordion, unloadAccordion from ./accordion-ncs/loader.js
//   healthCheck, info from ./accordion-ncs/health.js
//   NavigationModelLoader from ../integration/navigation-model-loader.js
//
// PROVIDES:
//   VERSION — module constant
//   init() — exported function
//   enable() — exported function
//   disable() — exported function
//   toggle() — exported function
//   getAccordion() — exported function
//   cleanup() — exported function
//   destroy() — exported function
//   getNavigationModel() — exported function
//   getNavigationSnapshot() — exported function
//   invalidateNavigationCache() — exported function
//   MODULE_ID — module constant
//   isEnabled — exported value
//   healthCheck — exported value
//   info — exported value
//   injectPorts — exported value
//   getPorts — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).AccordionNCS
// ═══════════════════════════════════════════════════════════════
'use strict';

import NavigationModelLoader from '../integration/navigation-model-loader.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


// Core modules (extracted)
import { VERSION as MODULE_ID, state, initPorts, injectPorts, getPorts, log } from './accordion-ncs/constants.js';
import { isEnabled, setFeatureFlag } from './accordion-ncs/feature-flags.js';
import { loadAccordion, unloadAccordion } from './accordion-ncs/loader.js';
import { healthCheck, info } from './accordion-ncs/health.js';

export const VERSION = '3.4.0-KERNEL-CTX';
export { MODULE_ID };


// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

// Fixed: Accept Kernel context { ports, eventBus } or direct eventBus
export function init(ctx: DynObj) {
    if (state.initialized) {
        return { ok: true, message: 'Already initialized' };
    }

    // Handle both ctx object and direct eventBus
    const eventBus = ctx?.eventBus || ctx;
    const ports = ctx?.ports;

    state.eventBus = eventBus;
    state.initialized = true;

    if (ports) {
        injectPorts(ports);
    }

    initPorts();

    if (isEnabled()) {
        setTimeout(() => {
            loadAccordion();
        }, 500);
    }

    log('info', `Initialized (enabled: ${isEnabled()})`);
    return { ok: true, enabled: isEnabled() };
}

export function enable() {
    setFeatureFlag('sidebar.accordion.ncs.enabled', (true as DynObj));
    if (state.initialized && !state.enabled) {
        loadAccordion();
    }
    return { ok: true, message: 'Accordion NCS enabled. Reload for full effect.' };
}

export function disable() {
    setFeatureFlag('sidebar.accordion.ncs.enabled', (false as DynObj));
    if (state.enabled) {
        unloadAccordion();
    }
    return { ok: true, message: 'Accordion NCS disabled.' };
}

export function toggle() {
    if (isEnabled()) {
        return disable();
    } else {
        return enable();
    }
}

export { isEnabled };

export function getAccordion() {
    return state.accordion;
}

export async function reload(force = false) {
    if (state.enabled) {
        unloadAccordion();
    }

    if (force && NavigationModelLoader.reload) {
        await NavigationModelLoader.reload();
    }

    if (isEnabled()) {
        return loadAccordion();
    }
    return Promise.resolve({ ok: false, message: 'Feature flag not enabled' });
}

export function cleanup() {
    unloadAccordion();
    if (NavigationModelLoader.abort) {
        NavigationModelLoader.abort();
    }
    state.initialized = false;
    state.eventBus = null;
    state.modelLoaderReady = false;
}

export function destroy() { cleanup(); }

// ─────────────────────────────────────────────────────────────
// MODEL ACCESS (via NavigationModelLoader)
// ─────────────────────────────────────────────────────────────

export function getNavigationModel() {
    return NavigationModelLoader.getModel();
}

export function getNavigationSnapshot() {
    return NavigationModelLoader.info ? NavigationModelLoader.info() : null;
}

export function invalidateNavigationCache() {
    return NavigationModelLoader.reload ? NavigationModelLoader.reload() : null;
}

// ─────────────────────────────────────────────────────────────
// RE-EXPORTS
// ─────────────────────────────────────────────────────────────

export { healthCheck, info, injectPorts, getPorts };

// ─────────────────────────────────────────────────────────────
// WINDOW API (DevTools access)
// ─────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
    (window as any).AccordionNCS = {
        VERSION,
        enable,
        disable,
        toggle,
        isEnabled,
        reload,
        getAccordion,
        getNavigationModel,
        getNavigationSnapshot,
        invalidateNavigationCache,
        healthCheck,
        info
    };
}

// ─────────────────────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────────────────────

export default {
    VERSION,
    MODULE_ID,
    init,
    cleanup,
    enable,
    disable,
    toggle,
    isEnabled,
    reload,
    getAccordion,
    getNavigationModel,
    getNavigationSnapshot,
    invalidateNavigationCache,
    destroy,
    healthCheck,
    info,
    injectPorts,
    getPorts
};
