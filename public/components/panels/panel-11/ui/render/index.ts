// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   renderPanel() — exported function
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

export const MODULE_ID = 'panel-11.ui.render';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 11 - Render Module Index
 * @module panel-11/ui/render
 * @version 1.1.0-AAA
 */

export function renderPanel(container: HTMLElement, state: Record<string, unknown>) {
    if (!container) return;
    
    const { loading, error, data } = state;
    
    if (loading) {
        container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>';
        return;
    }
    
    if (error) {
        container.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i> ${error}</div>`;
        return;
    }
    
    if (!data || (Array.isArray(data) && (data as unknown[]).length === 0)) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i> Nenhum dado disponível</div>';
        return;
    }
    
    container.innerHTML = `<div class="panel-11-data">${renderData(data)}</div>`;
}

function renderData(data: unknown) {
    return Array.isArray(data) 
        ? data.map(item => `<div class="data-item">${JSON.stringify(item)}</div>`).join('')
        : JSON.stringify(data);
}

// Alias exports for renderConsole and renderError
export const renderConsole = renderPanel;
export const renderError = renderPanel;

export default { renderPanel, renderConsole, renderError };
