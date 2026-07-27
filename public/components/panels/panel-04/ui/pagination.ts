// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-04-ui-pagination
// PURPOSE: Panel-04 UI - Pagination
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   renderPagination() — exported function
//   clearPagination() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'mouseenter'
//   'mouseleave'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-04-ui-pagination';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export function renderPagination(container: HTMLElement, options: { totalItems?: number; currentPage?: number; pageSize?: number; viewMode?: string; onPageChange?: (page: number) => void } = {}) {
  if (!container) return;

  const { totalItems = 0, currentPage = 1, pageSize = 30, viewMode = 'table', onPageChange } = options || {};
  
  const paginationEl = container.querySelector('[data-pagination]') as HTMLElement | null;
  if (!paginationEl) return;

  // Não mostrar paginação em modo agrupado
  if (viewMode !== 'table') {
    paginationEl.innerHTML = '';
    paginationEl.style.display = 'none';
    return;
  }

  const totalPages = Math.ceil(totalItems / pageSize);

  // Sem paginação necessária
  if (totalPages <= 1) {
    paginationEl.innerHTML = '';
    paginationEl.style.display = 'none';
    return;
  }

  paginationEl.style.display = 'flex';

  // Gerar array de páginas com ellipsis
  const pages = generatePageNumbers(currentPage, totalPages);

  // Calcular range de itens
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const html = `
    <div class="p04-pagination-info" style="font-size:10px;color:#606070;margin-right:auto;">
      ${startItem}-${endItem} de ${totalItems}
    </div>
    
    <button data-page="first" 
            ${currentPage === 1 ? 'disabled' : ''} 
            class="p04-page-btn"
            style="padding:6px 10px;background:#12121a;border:1px solid #2a2a3a;border-radius:4px;color:${currentPage === 1 ? '#404050' : '#a0a0b0'};font-size:11px;cursor:${currentPage === 1 ? 'not-allowed' : 'pointer'};opacity:${currentPage === 1 ? '0.5' : '1'};"
            title="Primeira página"
            aria-label="Primeira página">
      ««
    </button>
    
    <button data-page="prev" 
            ${currentPage === 1 ? 'disabled' : ''} 
            class="p04-page-btn"
            style="padding:6px 10px;background:#12121a;border:1px solid #2a2a3a;border-radius:4px;color:${currentPage === 1 ? '#404050' : '#a0a0b0'};font-size:11px;cursor:${currentPage === 1 ? 'not-allowed' : 'pointer'};opacity:${currentPage === 1 ? '0.5' : '1'};"
            title="Página anterior"
            aria-label="Página anterior">
      ‹
    </button>
    
    ${pages.map(p => {
      if (p === '...') {
        return '<span style="color:#606070;font-size:11px;padding:0 4px;">...</span>';
      }
      const isActive = p === currentPage;
      return `
        <button data-page="${p}" 
                class="p04-page-btn ${isActive ? 'active' : ''}"
                style="padding:6px 12px;background:${isActive ? '#6366f1' : '#12121a'};border:1px solid ${isActive ? '#6366f1' : '#2a2a3a'};border-radius:4px;color:${isActive ? '#fff' : '#a0a0b0'};font-size:11px;cursor:pointer;font-weight:${isActive ? '600' : '400'};transition:all 0.15s ease;"
                ${isActive ? 'aria-current="page"' : ''}
                aria-label="Página ${p}">
          ${p}
        </button>
      `;
    }).join('')}
    
    <button data-page="next" 
            ${currentPage === totalPages ? 'disabled' : ''} 
            class="p04-page-btn"
            style="padding:6px 10px;background:#12121a;border:1px solid #2a2a3a;border-radius:4px;color:${currentPage === totalPages ? '#404050' : '#a0a0b0'};font-size:11px;cursor:${currentPage === totalPages ? 'not-allowed' : 'pointer'};opacity:${currentPage === totalPages ? '0.5' : '1'};"
            title="Próxima página"
            aria-label="Próxima página">
      ›
    </button>
    
    <button data-page="last" 
            ${currentPage === totalPages ? 'disabled' : ''} 
            class="p04-page-btn"
            style="padding:6px 10px;background:#12121a;border:1px solid #2a2a3a;border-radius:4px;color:${currentPage === totalPages ? '#404050' : '#a0a0b0'};font-size:11px;cursor:${currentPage === totalPages ? 'not-allowed' : 'pointer'};opacity:${currentPage === totalPages ? '0.5' : '1'};"
            title="Última página"
            aria-label="Última página">
      »»
    </button>
  `;

  paginationEl.innerHTML = html;

  // Bind eventos
  if (onPageChange) {
    paginationEl.querySelectorAll('[data-page]').forEach((el: Element) => {
      const btn = el as HTMLButtonElement;
      if (btn.disabled) return;

      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        let newPage = currentPage;

        switch (page) {
          case 'first': newPage = 1; break;
          case 'prev': newPage = Math.max(1, currentPage - 1); break;
          case 'next': newPage = Math.min(totalPages, currentPage + 1); break;
          case 'last': newPage = totalPages; break;
          default: newPage = parseInt(page ?? '');
        }

        if (newPage !== currentPage && !isNaN(newPage)) {
          onPageChange!(newPage);
        }
      });

      // Hover effect (não para botões ativos ou desabilitados)
      if (!btn.classList.contains('active') && !btn.disabled) {
        btn.addEventListener('mouseenter', () => {
          btn.style.background = '#1a1a24';
          btn.style.borderColor = '#3a3a4a';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.background = '#12121a';
          btn.style.borderColor = '#2a2a3a';
        });
      }
    });
  }
}

function generatePageNumbers(current: number, total: number) {
  const pages = [];
  const delta = 2;

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 || 
      i === total || 
      (i >= current - delta && i <= current + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return pages;
}

export function clearPagination(container: HTMLElement) {
  if (!container) return;
  const paginationEl = container.querySelector('[data-pagination]') as HTMLElement | null;
  if (paginationEl) {
    paginationEl.innerHTML = '';
    paginationEl.style.display = 'none';
  }
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION
  };
}

export default { renderPagination, clearPagination };
