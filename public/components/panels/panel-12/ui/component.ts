// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: component
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   initComponent() — exported function
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

export const MODULE_ID = 'panel-12.ui.component';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 12 - Main Component
 * @module panel-12/ui/component
 * @version 1.1.0-AAA
 */

export function initComponent(container: HTMLElement, config: Record<string, unknown> = {}) {
    if (!container) {
        console.error('[panel-12] Container not found');
        return null;
    }
    
    const state: { initialized: boolean; loading: boolean; data: unknown; error: string | null } = {
        initialized: false,
        loading: false,
        data: null,
        error: null
    };
    
    const render = () => {
        if (state.loading) {
            container.innerHTML = '<div class="panel-loading"><i class="fas fa-spinner fa-spin"></i></div>';
        } else if (state.error) {
            container.innerHTML = `<div class="panel-error">${state.error}</div>`;
        } else if (state.data) {
            container.innerHTML = `<div class="panel-12-content">${renderData(state.data)}</div>`;
        } else {
            container.innerHTML = '<div class="panel-empty">Sem dados</div>';
        }
    };
    
    const renderData = (data: unknown) => `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    
    state.initialized = true;
    render();
    
    return {
        setData: (d: unknown) => { state.data = d; render(); },
        setLoading: (l: boolean) => { state.loading = l; render(); },
        setError: (e: string | null) => { state.error = e; render(); },
        refresh: () => render()
    };
}

export default { initComponent };
