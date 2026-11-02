// Metrics Dashboard - Template Module
// DEPENDENCY CONTRACT — UI Orchestrator module
// Templates do dashboard de métricas

'use strict';

const MODULE_ID = 'metrics-dashboard-template';
const VERSION = '1.0.1-P2-ENTERPRISE';

const createTemplate = (metrics: Record<string, unknown>) => `
    <div class="metrics-dashboard" data-module="${MODULE_ID}">
        <div class="metrics-header">
            <h3>Dashboard de Métricas</h3>
            <button class="btn-refresh" data-action="refresh">↻</button>
        </div>
        <div class="metrics-grid">
            ${createMetricCards(metrics)}
        </div>
    </div>
`;

const createMetricCards = (metrics: Record<string, unknown>) => {
    if (!metrics || Object.keys(metrics).length === 0) {
        return '<div class="metrics-empty">Sem métricas disponíveis</div>';
    }
    
    return Object.entries(metrics).map(([key, value]) => `
        <div class="metric-card" data-metric="${key}">
            <span class="metric-label">${formatLabel(key)}</span>
            <span class="metric-value">${formatValue(value)}</span>
        </div>
    `).join('');
};

const formatLabel = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());

const formatValue = (value: unknown) => {
    if (typeof value === 'number') {
        return value.toLocaleString('pt-BR');
    }
    return value;
};

export { createTemplate, createMetricCards, formatLabel, formatValue, MODULE_ID, VERSION };
