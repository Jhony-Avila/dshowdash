// Timeline Panel - Styles Module
// DEPENDENCY CONTRACT — UI Orchestrator module
// Estilos do painel de timeline

'use strict';

const MODULE_ID = 'timeline-panel-styles';
const VERSION = '1.0.1-P2-ENTERPRISE';

const STYLE_ID = 'timeline-panel-styles';

const styles = `
    .timeline-panel { padding: 16px; background: var(--bg-secondary, #1a1a2e); border-radius: 8px; }
    .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .timeline-header h3 { margin: 0; font-size: 14px; color: var(--text-primary, #fff); }
    .timeline-count { font-size: 12px; color: var(--text-secondary, #888); }
    .timeline-body { max-height: 300px; overflow-y: auto; }
    .timeline-event { display: flex; gap: 12px; padding: 8px; border-bottom: 1px solid var(--border-color, #333); }
    .timeline-empty { text-align: center; padding: 24px; color: var(--text-secondary, #888); }
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
