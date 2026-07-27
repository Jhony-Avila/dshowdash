// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: navigation-model-loader/index.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID, VERSION from ./core/constants.js
//   STATES from ./core/contracts.js
//   loadFromAPI from ./api/loader.js
//   getFallbackModel, isFallbackModel from ./api/fallback.js
//   track, trackLoad from ./telemetry/tracker.js
//   isValidModel, normalizeModel from ./utils/helpers.js
//
// PROVIDES:
//   load — exported value
//   reload — exported value
//   abort() — exported function
//   getModel() — exported function
//   getStatus() — exported function
//   isReady() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

import { MODULE_ID, VERSION } from './core/constants.js';
import { STATES } from './core/contracts.js';
import * as State from './core/state.js';
import * as Cache from './cache/cache-manager.js';
import { loadFromAPI } from './api/loader.js';
import { getFallbackModel, isFallbackModel } from './api/fallback.js';
import { track, trackLoad } from './telemetry/tracker.js';
import * as Events from './events/bindings.js';
import { isValidModel, normalizeModel } from './utils/helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


let abortController: AbortController | null = null;

const load = async (options: { force?: boolean; skipCache?: boolean } = {}) => {
    const { force = false, skipCache = false } = options;
    const startTime = Date.now();

    if (State.isLoading()) {
        track('load:already-loading');
        return { success: false, reason: 'already-loading' };
    }

    if (!force && State.isLoaded()) {
        const model = State.getModel();
        if (model && !isFallbackModel(model)) {
            track('load:already-loaded');
            return { success: true, model, source: 'memory' };
        }
    }

    State.setStatus(STATES.LOADING);
    Events.emitLoadStart();

    // 1. Tentar cache (se não skipCache)
    if (!skipCache && !force) {
        const cached = Cache.getCached();
        if (cached && isValidModel(cached.data)) {
            const model = normalizeModel(cached.data);
            State.setModel(model, cached.source);
            State.setStatus(STATES.LOADED);
            Events.emitCacheHit(cached.source);
            Events.emitLoadSuccess(model, cached.source);
            Events.emitModelReady(model);
            trackLoad(cached.source, Date.now() - startTime);
            return { success: true, model, source: cached.source };
        }
        Events.emitCacheMiss();
    }

    // 2. Tentar API
    abortController = new AbortController();
    const apiResult = await loadFromAPI({ signal: abortController.signal });
    abortController = null;

    if (apiResult.success && isValidModel(apiResult.data)) {
        const model = normalizeModel(apiResult.data);
        State.setModel(model, 'api');
        State.setStatus(STATES.LOADED);
        Cache.saveToCache(model);
        Events.emitLoadSuccess(model, 'api');
        Events.emitModelReady(model);
        trackLoad('api', Date.now() - startTime);
        return { success: true, model, source: 'api' };
    }

    // 3. Auth required - não usar fallback, apenas sinalizar
    if (apiResult.authRequired) {
        State.setStatus(STATES.ERROR);
        State.setError({ message: 'Auth required' } as DynObj);
        Events.emitLoadError({ type: 'auth', status: apiResult.status } as DynObj);
        track('load:auth-required');
        return { success: false, authRequired: true, status: apiResult.status };
    }

    // 4. Fallback
    track('load:using-fallback', { reason: apiResult.error });
    const fallback = getFallbackModel(apiResult.error || 'api-error');
    State.setModel(fallback, 'fallback');
    State.setStatus(STATES.FALLBACK);
    // @ts-expect-error strict migration — TS2345
    Events.emitLoadFallback(apiResult.error);
    Events.emitModelReady(fallback);
    trackLoad('fallback', Date.now() - startTime, false);

    return { success: true, model: fallback, source: 'fallback', degraded: true };
};

const reload = async (force?: boolean) => {
    Cache.invalidateAll();
    Events.emitCacheInvalidate();
    State.resetState();
    return load({ force: true, skipCache: true });
};

const abort = () => {
    if (abortController) {
        abortController.abort();
        abortController = null;
        track('load:aborted');
    }
};

const getModel = () => State.getModel();

const getStatus = () => State.getStatus();

const isReady = () => State.isLoaded();

const info = () => ({
    moduleId: MODULE_ID,
    version: VERSION,
    state: State.getState(),
    hasModel: !!State.getModel(),
    isFallback: isFallbackModel(State.getModel())
});

const healthCheck = () => {
    const state = State.getState();
    return {
        healthy: state.status === STATES.LOADED && !!state.model,
        status: state.status,
        lastLoad: state.lastLoad,
        source: state.source,
        isFallback: isFallbackModel(state.model)
    };
};

// API pública
export {
    load,
    reload,
    abort,
    getModel,
    getStatus,
    isReady,
    info,
    healthCheck,
    MODULE_ID,
    VERSION
};

// Default export para compatibilidade
export default {
    load,
    reload,
    abort,
    getModel,
    getStatus,
    isReady,
    info,
    healthCheck,
    MODULE_ID,
    VERSION
};
