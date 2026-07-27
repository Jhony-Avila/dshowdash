// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: navigation-model-loader/core/state.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STATES from ./contracts.js
//
// PROVIDES:
//   getState() — exported function
//   getStatus() — exported function
//   getModel() — exported function
//   setStatus() — exported function
//   setModel() — exported function
//   setError() — exported function
//   resetState() — exported function
//   isLoaded() — exported function
//   isLoading() — exported function
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

import { STATES } from './contracts.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.integration.navigation-model-loader.core.state';

const state = {
    status: STATES.IDLE,
    model: null as HTMLElement | null,
    lastLoad: null as DynObj,
    lastError: null as DynObj,
    source: null as DynObj,
    loadCount: 0
};

export const getState = () => ({ ...state });

export const getStatus = () => state.status;

export const getModel = () => state.model;

export const setStatus = (status: string) => {
    state.status = status;
};

export const setModel = (model: DynObj, source = 'unknown') => {
    state.model = model;
    state.source = source;
    state.lastLoad = Date.now();
    state.loadCount++;
};

export const setError = (error: Error) => {
    state.lastError = {
        message: error?.message || String(error),
        timestamp: Date.now()
    };
};

export const resetState = () => {
    state.status = STATES.IDLE;
    state.model = null;
    state.lastLoad = null;
    state.lastError = null;
    state.source = null;
};

export const isLoaded = () => state.status === STATES.LOADED;

export const isLoading = () => state.status === STATES.LOADING;
