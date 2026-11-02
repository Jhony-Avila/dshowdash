// Metrics Dashboard - Render Module
// DEPENDENCY CONTRACT — UI Orchestrator module
// Renderização do dashboard de métricas

'use strict';

const MODULE_ID = 'metrics-dashboard-render';
const VERSION = '1.0.1-P2-ENTERPRISE';

import { createTemplate } from './template.js';
import { getMetrics } from './collector.js';
import { injectStyles } from './styles.js';

const render = (container: HTMLElement) => {
    if (!container) return false;
    
    injectStyles();
    const metrics = getMetrics();
    container.innerHTML = createTemplate(metrics);
    
    return true;
};

const refresh = (container: HTMLElement) => render(container);

export { render, refresh, MODULE_ID, VERSION };
