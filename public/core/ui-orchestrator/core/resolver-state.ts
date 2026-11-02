// UI Orchestrator - Resolver State
// DEPENDENCY CONTRACT — UI Orchestrator module
// Gerenciamento de estado do resolver

'use strict';

const MODULE_ID = 'resolver-state';
const VERSION = '1.0.1-P2-ENTERPRISE';

interface ResolverState {
    currentRoute: string | null;
    previousRoute: string | null;
    params: Record<string, unknown>;
    query: Record<string, unknown>;
    isResolving: boolean;
    lastResolved: number | null;
    history: { route: string | null; params: Record<string, unknown>; query: Record<string, unknown>; timestamp: number }[];
}

let state: ResolverState = {
    currentRoute: null,
    previousRoute: null,
    params: {},
    query: {},
    isResolving: false,
    lastResolved: null,
    history: []
};

const getState = () => ({ ...state });

const setState = (newState: Partial<ResolverState>) => {
    state = { ...state, ...newState };
    return getState();
};

const setRoute = (route: string | null, params: Record<string, unknown> = {}, query: Record<string, unknown> = {}) => {
    state.previousRoute = state.currentRoute;
    state.currentRoute = route;
    state.params = params;
    state.query = query;
    state.lastResolved = Date.now();

    if (state.history.length >= 50) {
        state.history.shift();
    }
    state.history.push({
        route,
        params,
        query,
        timestamp: state.lastResolved
    });

    return getState();
};

const getRoute = () => state.currentRoute;

const getPreviousRoute = () => state.previousRoute;

const getParams = () => ({ ...state.params });

const getQuery = () => ({ ...state.query });

const getHistory = () => [...state.history];

const setResolving = (isResolving: boolean) => {
    state.isResolving = isResolving;
    return getState();
};

const isResolving = () => state.isResolving;

const reset = () => {
    state = {
        currentRoute: null,
        previousRoute: null,
        params: {},
        query: {},
        isResolving: false,
        lastResolved: null,
        history: []
    };
    return getState();
};

const healthCheck = () => ({
    healthy: true,
    hasRoute: !!state.currentRoute,
    isResolving: state.isResolving,
    historyCount: state.history.length
});

const info = () => ({
    moduleId: MODULE_ID,
    version: VERSION,
    state: getState()
});

export {
    getState,
    setState,
    setRoute,
    getRoute,
    getPreviousRoute,
    getParams,
    getQuery,
    getHistory,
    setResolving,
    isResolving,
    reset,
    healthCheck,
    info,
    MODULE_ID,
    VERSION
};
