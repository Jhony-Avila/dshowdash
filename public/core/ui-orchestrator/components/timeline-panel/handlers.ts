// Timeline Panel - Handlers Module
// DEPENDENCY CONTRACT — UI Orchestrator module
// Manipuladores de eventos do painel de timeline

'use strict';

const MODULE_ID = 'timeline-panel-handlers';
const VERSION = '1.0.1-P2-ENTERPRISE';

import { getState, updateState } from './state.js';
import { generateEventId, formatTimestamp } from './helpers.js';
import { render } from './render.js';

const handleAddEvent = (eventData: Record<string, unknown>, container: HTMLElement | null) => {
    const state = getState();
    const newEvent = {
        id: generateEventId(),
        timestamp: formatTimestamp(new Date()),
        type: eventData.type || 'info',
        message: eventData.message || 'Evento sem descrição'
    };

    updateState({
        events: [newEvent, ...state.events].slice(0, 100)
    });

    if (container) render(container);
    return newEvent;
};

const handleClearEvents = (container: HTMLElement | null) => {
    updateState({ events: [] });
    if (container) render(container);
};

const handleFilterChange = (filterType: string, container: HTMLElement | null) => {
    updateState({ currentFilter: filterType });
    if (container) render(container);
};

const handleExport = () => {
    const state = getState();
    return JSON.stringify(state.events, null, 2);
};

export { handleAddEvent, handleClearEvents, handleFilterChange, handleExport, MODULE_ID, VERSION };
