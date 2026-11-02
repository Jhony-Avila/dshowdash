// Timeline Panel - State Module
// DEPENDENCY CONTRACT — UI Orchestrator module
// Gerenciamento de estado do painel de timeline

'use strict';

const MODULE_ID = 'timeline-panel-state';
const VERSION = '1.0.1-P2-ENTERPRISE';

let state: { events: unknown[]; currentFilter: string; isVisible: boolean; maxEvents: number } = {
    events: [],
    currentFilter: 'all',
    isVisible: false,
    maxEvents: 100
};

const getState = () => ({ ...state });

const updateState = (newState: Partial<typeof state>) => {
    state = { ...state, ...newState };
    return getState();
};

const resetState = () => {
    state = {
        events: [],
        currentFilter: 'all',
        isVisible: false,
        maxEvents: 100
    };
    return getState();
};

export { getState, updateState, resetState, MODULE_ID, VERSION };
