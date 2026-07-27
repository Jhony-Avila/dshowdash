// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: modals
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   showModal() — exported function
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

export const MODULE_ID = 'panel-16.ui.render.modals';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 16 - Modal Renderer
 * @module panel-16/ui/render/modals
 * @version 1.1.0-AAA
 */

export function showModal(options: Record<string, any> = {}) {
    const { title, content, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar' } = options;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-header"><h5>${title}</h5></div>
            <div class="modal-body">${content}</div>
            <div class="modal-footer">
                <button class="btn btn-secondary btn-cancel">${cancelText}</button>
                <button class="btn btn-primary btn-confirm">${confirmText}</button>
            </div>
        </div>
    `;
    
    const close = () => modal.remove();
    // @ts-expect-error strict migration — TS2531
    modal.querySelector('.btn-cancel').addEventListener('click', () => { close(); onCancel?.(); });
    // @ts-expect-error strict migration — TS2531
    modal.querySelector('.btn-confirm').addEventListener('click', () => { close(); onConfirm?.(); });
    
    document.body.appendChild(modal);
    return { close };
}

export function renderDetailPanel(fornecedor: Record<string, any>, favorites?: Set<string> | Record<string, any>): string {
    if (!fornecedor) return '';
    const name = fornecedor.nome || fornecedor.razao_social || 'Fornecedor';
    return `
        <aside class="p16-detail-panel" role="complementary" aria-label="Detalhes do fornecedor">
            <div class="p16-detail-header">
                <h3>${name}</h3>
                <button class="p16-detail-close" aria-label="Fechar detalhes">&times;</button>
            </div>
            <div class="p16-detail-body">
                <p>CNPJ: ${fornecedor.cnpj || '-'}</p>
            </div>
        </aside>
    `;
}

export function renderBulkActions(selectedRows: Set<string> | Record<string, any>): string {
    const count = selectedRows instanceof Set ? selectedRows.size : Object.keys(selectedRows).length;
    return `
        <div class="p16-bulk-actions">
            <span>${count} selecionado(s)</span>
            <button class="btn btn-sm btn-bulk-export">Exportar seleção</button>
        </div>
    `;
}

export function renderAdvancedFiltersModal(filters: Record<string, any>): string {
    return `
        <div class="p16-modal-overlay p16-advanced-filters-modal">
            <div class="p16-modal-dialog">
                <div class="p16-modal-header"><h5>Filtros Avançados</h5></div>
                <div class="p16-modal-body">Filtros avançados</div>
                <div class="p16-modal-footer">
                    <button class="btn btn-secondary p16-modal-cancel">Cancelar</button>
                    <button class="btn btn-primary p16-modal-apply">Aplicar</button>
                </div>
            </div>
        </div>
    `;
}

export function renderExportProgress(): string {
    return `
        <div class="p16-export-progress">
            <div class="p16-export-spinner"><i class="fas fa-spinner fa-spin"></i></div>
            <span>Exportando dados...</span>
        </div>
    `;
}

export function renderKeyboardHint(focusedRowIndex: number | null): string {
    if (focusedRowIndex == null || focusedRowIndex < 0) return '';
    return `<div class="p16-keyboard-hint" aria-live="polite">Linha ${Number(focusedRowIndex) + 1} focada. Use setas para navegar.</div>`;
}

// ── Alias exports (compatibility layer) ──────────────────────────────────────
export function renderContextMenu(options: {
    x: number;
    y: number;
    items?: Array<{ label: string; action?: () => void; disabled?: boolean }>;
} = { x: 0, y: 0 }): HTMLElement {
    const menu = document.createElement('ul');
    menu.className = 'p16-context-menu';
    menu.style.cssText = `position:fixed;left:${options.x}px;top:${options.y}px;z-index:9999;`;

    const items = options.items ?? [];
    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'p16-context-menu-item' + (item.disabled ? ' disabled' : '');
        li.textContent = item.label;
        if (item.action && !item.disabled) {
            li.addEventListener('click', () => {
                item.action!();
                menu.remove();
            });
        }
        menu.appendChild(li);
    });

    const dismiss = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
            menu.remove();
            document.removeEventListener('click', dismiss, true);
        }
    };
    document.addEventListener('click', dismiss, true);
    document.body.appendChild(menu);
    return menu;
}

export default { showModal, renderDetailPanel, renderBulkActions, renderAdvancedFiltersModal, renderExportProgress, renderKeyboardHint, renderContextMenu };
