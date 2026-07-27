// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-feature-accordion-ncs
// PURPOSE: Accordion NCS - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   FEATURE_FLAG_KEY — exported value
//   CONTAINER_ID — exported value
//   UARPS_REGION — exported value
//   initPorts() — exported function
//   getPort() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   isPortsInitialized() — exported function
//   log() — exported function
//   state — exported value
//   resetState() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '3.4.0-ES6';
export const MODULE_ID = 'sidebar-feature-accordion-ncs';
export const FEATURE_FLAG_KEY = 'sidebar.accordion.ncs.enabled';
export const CONTAINER_ID = 'sidebar-accordion-root';
export const UARPS_REGION = 'region:app:accordion-ncs';

const _ports = createUiPorts({ moduleId: MODULE_ID });

export function initPorts() {
    _ports.init();
}

export function getPort(name: string) {
    return _ports.get(name);
}

export function injectPorts(p: DynObj) {
    return _ports.inject(p);
}

export function getPorts() {
    return _ports.snapshot();
}

export function isPortsInitialized() {
    return _ports.isInitialized();
}

export function log(level: string, msg: string, data?: DynObj) {
    const logger = getPort('logger');
    if (logger && logger[level]) {
        logger[level](`[${MODULE_ID}] ${msg}`, data || '');
    }
}

export const state = {
    initialized: false,
    enabled: false,
    accordion: null as DynObj,
    container: null as HTMLElement | null,
    eventBus: null as DynObj,
    modelLoaderReady: false,
    cleanups: [] as DynObj[]
};

export function resetState() {
    state.initialized = false;
    state.enabled = false;
    state.accordion = null;
    state.container = null;
    state.eventBus = null;
    state.modelLoaderReady = false;
    state.cleanups = [];
}

export default {
    VERSION,
    MODULE_ID,
    FEATURE_FLAG_KEY,
    CONTAINER_ID,
    UARPS_REGION,
    state,
    resetState,
    initPorts,
    getPort,
    injectPorts,
    getPorts,
    isPortsInitialized,
    log
};
