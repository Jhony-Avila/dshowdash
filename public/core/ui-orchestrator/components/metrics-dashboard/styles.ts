// Metrics Dashboard - Styles Module
// DEPENDENCY CONTRACT — UI Orchestrator module
// Estilos do dashboard de métricas

'use strict';

const MODULE_ID = 'metrics-dashboard-styles';
const VERSION = '1.0.1-P2-ENTERPRISE';

const STYLE_ID = 'metrics-dashboard-styles';

const styles = `
    .metrics-dashboard { padding: 16px; background: var(--bg-secondary, #1a1a2e); border-radius: 8px; }
    .metrics-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .metrics-header h3 { margin: 0; font-size: 14px; color: var(--text-primary, #fff); }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }
    .metric-card { padding: 12px; background: var(--bg-tertiary, #252540); border-radius: 6px; text-align: center; }
    .metric-label { display: block; font-size: 11px; color: var(--text-secondary, #888); margin-bottom: 4px; }
    .metric-value { display: block; font-size: 18px; font-weight: 600; color: var(--text-primary, #fff); }
    .btn-refresh { background: none; border: 1px solid var(--border-color, #444); color: var(--text-primary, #fff); padding: 4px 8px; border-radius: 4px; cursor: pointer; }
`;

const injectStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
};

const removeStyles = () => {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
};

export { injectStyles, removeStyles, styles, MODULE_ID, VERSION };
