// Timeline Panel - Render Module
// DEPENDENCY CONTRACT — UI Orchestrator module
// Renderização do painel de timeline

'use strict';

const MODULE_ID = 'timeline-panel-render';
const VERSION = '1.0.1-P2-ENTERPRISE';

import { getState } from './state.js';
import { injectStyles } from './styles.js';

const render = (container: HTMLElement) => {
    if (!container) return false;
    
    injectStyles();
    const state = getState();
    
    container.innerHTML = `
        <div class="timeline-panel" data-module="${MODULE_ID}">
            <div class="timeline-header">
                <h3>Timeline de Eventos</h3>
                <span class="timeline-count">${state.events.length} eventos</span>
            </div>
            <div class="timeline-body">
                ${renderEvents(state.events)}
            </div>
        </div>
    `;
    
    return true;
};

const renderEvents = (events: unknown[]) => {
    if (!events || events.length === 0) {
        return '<div class="timeline-empty">Nenhum evento registrado</div>';
    }

    return events.map((event: unknown) => `
        <div class="timeline-event" data-id="${(event as Record<string, unknown>).id}">
            <span class="event-time">${(event as Record<string, unknown>).timestamp}</span>
            <span class="event-type">${(event as Record<string, unknown>).type}</span>
            <span class="event-message">${(event as Record<string, unknown>).message}</span>
        </div>
    `).join('');
};

export { render, renderEvents, MODULE_ID, VERSION };
