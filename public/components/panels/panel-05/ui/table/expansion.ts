// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:expansion
// PURPOSE: Panel-05 Table Expansion
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ./constants.js
//   escapeHtml from ./utils.js
//   formatCurrency, formatDate, formatCNPJ, formatPhone from ../../utils/dashboar...
//   TABLE_EVENTS from /core/runtime/events/catalog/table.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ExpansionMixin — exported value
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   TABLE_EVENTS.VIEW_CHANGE
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ICONS } from './constants.js';
import { escapeHtml } from './utils.js';
import { formatCurrency, formatDate, formatCNPJ, formatPhone } from '../../utils/dashboard-utils.js';
import { TABLE_EVENTS } from '/core/runtime/events/catalog/table.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:table:expansion';

export const ExpansionMixin = {
    _toggleRowExpand(id: string) {
        // @ts-expect-error strict migration — TS2339
        const wasExpanded = this._state.isExpanded(id);
        // @ts-expect-error strict migration — TS2339
        const nowExpanded = this._state.toggleExpansion(id);
        
        if (wasExpanded) {
            // @ts-expect-error strict migration — TS2339
            this._container.querySelector(`tr.p05-tr-expansion[data-expand-id="${id}"]`)?.remove();
            // @ts-expect-error strict migration — TS2339
            this._container.querySelector(`[data-action="toggle-expand"][data-id="${id}"]`)?.classList.remove('p05-expanded');
        } else {
            // @ts-expect-error strict migration — TS2339
            const cliente = this._state.getDisplayData().find((c: Record<string, unknown>) => String(c.id) === String(id));
            if (cliente) {
                // @ts-expect-error strict migration — TS2339
                const mainRow = this._container.querySelector(`tr[data-cliente-id="${id}"]`);
                if (mainRow) {
                    const expRow = document.createElement('tr');
                    expRow.className = 'p05-tr-expansion';
                    expRow.dataset.expandId = id;
                    expRow.innerHTML = `<td colspan="${mainRow.children.length}">${this._renderExpansionContent(cliente)}</td>`;
                    mainRow.after(expRow);
                }
            }
            // @ts-expect-error strict migration — TS2339
            this._container.querySelector(`[data-action="toggle-expand"][data-id="${id}"]`)?.classList.add('p05-expanded');
        }
        
        // @ts-expect-error strict migration — TS2339
        this.emit(TABLE_EVENTS.VIEW_CHANGE, { id, expanded: nowExpanded, type: 'row-expand' });
    },

    _renderExpansionContent(c: Record<string, unknown>) {
        const waLink = c.telefone
            ? `https://wa.me/55${String(c.telefone).replace(/\D/g, '')}`
            : null;
        
        return `
            <div class="p05-expansion-content">
                <div class="p05-expansion-grid">
                    <div class="p05-expansion-section">
                        <h4>Dados Gerais</h4>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">CNPJ</span>
                            <span class="p05-expansion-value">${c.cnpj ? formatCNPJ(c.cnpj) : '—'}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Telefone</span>
                            <span class="p05-expansion-value">${c.telefone ? formatPhone(c.telefone) : '—'}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Email</span>
                            <span class="p05-expansion-value">${escapeHtml(c.email) || '—'}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Porte</span>
                            <span class="p05-expansion-value">${escapeHtml(c.porte) || '—'}</span>
                        </div>
                    </div>
                    <div class="p05-expansion-section">
                        <h4>Financeiro</h4>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Receita</span>
                            <span class="p05-expansion-value">${formatCurrency(c.receita)}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">A Receber</span>
                            <span class="p05-expansion-value">${formatCurrency(c.aReceber || 0)}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Última Compra</span>
                            <span class="p05-expansion-value">${c.ultimaCompra ? formatDate(c.ultimaCompra) : '—'}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Risco</span>
                            <span class="p05-expansion-value">${escapeHtml(c.risco) || '—'}</span>
                        </div>
                    </div>
                    <div class="p05-expansion-section">
                        <h4>Endereço</h4>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Cidade/UF</span>
                            <span class="p05-expansion-value">${escapeHtml(c.cidade) || '—'}${c.uf ? `/${c.uf}` : ''}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">CEP</span>
                            <span class="p05-expansion-value">${escapeHtml(c.cep) || '—'}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Bairro</span>
                            <span class="p05-expansion-value">${escapeHtml(c.bairro) || '—'}</span>
                        </div>
                    </div>
                </div>
                <div class="p05-expansion-actions">
                    <button class="p05-expansion-btn p05-expansion-btn-primary" data-action="view-cliente" data-id="${c.id}">
                        ${ICONS.eye} Ver Completo
                    </button>
                    <button class="p05-expansion-btn" data-action="copy-cnpj" data-cnpj="${c.cnpj || ''}">
                        ${ICONS.copy} Copiar CNPJ
                    </button>
                    ${waLink ? `<a href="${waLink}" target="_blank" class="p05-expansion-btn">${ICONS.messageCircle} WhatsApp</a>` : ''}
                </div>
            </div>
        `;
    }
};

export default ExpansionMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { expansionReady: true } }; }
