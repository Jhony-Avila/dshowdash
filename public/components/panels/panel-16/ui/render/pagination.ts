// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: pagination
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   renderPagination() — exported function
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

export const MODULE_ID = 'panel-16.ui.render.pagination';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 16 - Pagination Renderer
 * @module panel-16/ui/render/pagination
 * @version 1.1.0-AAA
 */

export function renderPagination(container: HTMLElement, opts: Record<string, unknown> = {}) {
    const { currentPage, totalPages, onPageChange } = opts;
    const nav = document.createElement('nav');
    nav.className = 'pagination-nav';
    nav.setAttribute('aria-label', 'Navegação de páginas');

    const prevDisabled = Number(currentPage) <= 1;
    const nextDisabled = Number(currentPage) >= Number(totalPages);

    nav.innerHTML = `
        <button class="pagination-btn prev" ${prevDisabled ? 'disabled' : ''} data-page="${Number(currentPage) - 1}">
            <i class="fas fa-chevron-left"></i> Anterior
        </button>
        <span class="pagination-info">Página ${currentPage} de ${totalPages}</span>
        <button class="pagination-btn next" ${nextDisabled ? 'disabled' : ''} data-page="${Number(currentPage) + 1}">
            Próxima <i class="fas fa-chevron-right"></i>
        </button>
    `;

    nav.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt((btn as any).dataset.page, 10);
            if (!isNaN(page) && typeof onPageChange === 'function') {
                onPageChange(page);
            }
        });
    });

    container.innerHTML = '';
    container.appendChild(nav);
}
