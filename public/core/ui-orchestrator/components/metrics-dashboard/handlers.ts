// Metrics Dashboard - Handlers Module
// DEPENDENCY CONTRACT — UI Orchestrator module
// Manipuladores de eventos do dashboard de métricas

'use strict';

const MODULE_ID = 'metrics-dashboard-handlers';
const VERSION = '1.0.1-P2-ENTERPRISE';

import { render } from './render.js';
import { clearMetrics } from './collector.js';

const handleRefresh = (container: HTMLElement) => {
    render(container);
};

const handleClear = (container: HTMLElement) => {
    clearMetrics();
    render(container);
};

const handleMetricClick = (metricKey: string, callback: (key: string) => void) => {
    if (typeof callback === 'function') {
        callback(metricKey);
    }
};

const setupHandlers = (container: HTMLElement) => {
    if (!container) return;

    container.addEventListener('click', (e: MouseEvent) => {
        const action = (e.target as HTMLElement).dataset.action;
        if (action === 'refresh') {
            handleRefresh(container);
        } else if (action === 'clear') {
            handleClear(container);
        }
    });
};

export { handleRefresh, handleClear, handleMetricClick, setupHandlers, MODULE_ID, VERSION };
