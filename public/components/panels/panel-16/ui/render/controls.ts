// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: controls
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   renderControls() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-16.ui.render.controls';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 16 - Controls Renderer
 * @module panel-16/ui/render/controls
 * @version 1.1.0-AAA
 */

export function renderControls(container: HTMLElement, options: Record<string, unknown> = {}) {
    const { onRefresh, onExport, onFilter } = options;
    
    const html = `
        <div class="panel-controls">
            <button class="btn btn-sm btn-refresh" title="Atualizar">
                <i class="fas fa-sync-alt"></i>
            </button>
            <button class="btn btn-sm btn-export" title="Exportar">
                <i class="fas fa-download"></i>
            </button>
            <button class="btn btn-sm btn-filter" title="Filtrar">
                <i class="fas fa-filter"></i>
            </button>
        </div>
    `;
    
    container.innerHTML = html;
    
    if (onRefresh) container.querySelector('.btn-refresh')?.addEventListener('click', onRefresh as EventListener);
    if (onExport) container.querySelector('.btn-export')?.addEventListener('click', onExport as EventListener);
    if (onFilter) container.querySelector('.btn-filter')?.addEventListener('click', onFilter as EventListener);
}

export default { renderControls };
