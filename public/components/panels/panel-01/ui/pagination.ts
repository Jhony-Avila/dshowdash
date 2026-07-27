// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/pagination
// PURPOSE: Panel-01 Pagination Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/pagination';

export class PaginationComponent {
  [key: string]: any;
  constructor(container: HTMLElement, options: Record<string, unknown> = {}) {
    this.container = container;
    this.onPageChange = options.onPageChange || (() => {});
    this.onLimitChange = options.onLimitChange || (() => {});
  }

  render(pagination: Record<string, number>) {
    if (!this.container || !pagination) return;
    const { page, totalPages, total, limit } = pagination;
    if (totalPages <= 1) { this.container.innerHTML = ''; return; }

    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    this.container.innerHTML = `
      <div class="p01-pagination">
        <span class="p01-pagination-info">
          ${start.toLocaleString('pt-BR')}-${end.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')}
        </span>
        <div class="p01-pagination-controls">
          <button class="p01-page-btn" data-page="1" ${page <= 1 ? 'disabled' : ''} title="Primeira">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
          </button>
          <button class="p01-page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} title="Anterior">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="p01-pagination-current">${page} / ${totalPages}</span>
          <button class="p01-page-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''} title="Próxima">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button class="p01-page-btn" data-page="${totalPages}" ${page >= totalPages ? 'disabled' : ''} title="Última">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
          </button>
        </div>
        <select class="p01-pagination-limit" data-action="limit">
          ${[10, 25, 50, 100].map(l => `<option value="${l}" ${limit === l ? 'selected' : ''}>${l}/página</option>`).join('')}
        </select>
      </div>
    `;

    this.container.querySelectorAll('[data-page]').forEach((btn: Element) => {
      const btnEl = btn as HTMLButtonElement;
      btnEl.addEventListener('click', () => {
        if (!btnEl.disabled) this.onPageChange(parseInt(btnEl.dataset.page as string));
      });
    });

    this.container.querySelector('[data-action="limit"]')?.addEventListener('change', (e: Event) => {
      this.onLimitChange(parseInt((e.target as HTMLSelectElement).value));
    });
  }

  destroy() { if (this.container) this.container.innerHTML = ''; }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default PaginationComponent;
