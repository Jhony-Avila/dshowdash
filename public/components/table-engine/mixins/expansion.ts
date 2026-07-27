// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:expansion
// PURPOSE: Table Engine - Expansion Mixin
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ExpansionMixin — exported value
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:expansion';

export const ExpansionMixin = {
  _toggleRowExpand(id: string) {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    const wasExpanded = this._state.getExpanded().has(id);
    // @ts-expect-error strict migration — TS2339
    wasExpanded ? this._state.collapse(id) : this._state.expand(id);
    const nowExpanded = !wasExpanded;

    if (wasExpanded) {
      // @ts-expect-error strict migration — TS2339
      this._container.querySelector(`tr.${p}tr-expansion[data-expand-id="${id}"]`)?.remove();
      // @ts-expect-error strict migration — TS2339
      this._container.querySelector(`[data-action="toggle-expand"][data-id="${id}"]`)?.classList.remove(`${p}expanded`);
    } else {
      // @ts-expect-error strict migration — TS2339
      const data = this._state.getFilteredData();
      const item = data.find((c: Record<string, unknown>) => String(c.id) === String(id));
      if (item) {
        // @ts-expect-error strict migration — TS2339
        const mainRow = this._container.querySelector(`tr[data-row-id="${id}"]`);
        if (mainRow) {
          const expRow = document.createElement('tr');
          expRow.className = `${p}tr-expansion`;
          expRow.dataset.expandId = id;
          expRow.innerHTML = `<td colspan="${mainRow.children.length}">${this._renderExpansionContent(item)}</td>`;
          mainRow.after(expRow);
        }
      }
      // @ts-expect-error strict migration — TS2339
      this._container.querySelector(`[data-action="toggle-expand"][data-id="${id}"]`)?.classList.add(`${p}expanded`);
    }
    // @ts-expect-error strict migration — TS2339
    this.emit(nowExpanded ? 'row-expanded' : 'row-collapsed', { id });
  },

  // @ts-expect-error strict migration — TS7023
  _renderExpansionContent(item: Record<string, unknown>) {
    // @ts-expect-error strict migration — TS7022, TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS7022, TS2339
    const fmt = this._formatters || {};
    const esc = fmt.escapeHtml || ((v: unknown) => v);
    const fmtCurrency = fmt.formatCurrency || ((v: unknown) => v);
    const fmtDate = fmt.formatDate || ((v: unknown) => v);
    const fmtCNPJ = fmt.formatCNPJ || ((v: unknown) => v);
    const fmtPhone = fmt.formatPhone || ((v: unknown) => v);

    // Template customizável via options
    // @ts-expect-error strict migration — TS2339
    if (this._options.renderExpansion && typeof this._options.renderExpansion === 'function') {
      // @ts-expect-error strict migration — TS2339
      return this._options.renderExpansion(item, { formatters: fmt, cssPrefix: p });
    }

    // Template padrão genérico
    const fields = Object.entries(item).filter(([k]) => !['id', '_meta'].includes(k)).slice(0, 12);
    return `
      <div class="${p}expansion-content">
        <div class="${p}expansion-grid">
          ${fields.map(([key, val]) => `
            <div class="${p}expansion-item">
              <span class="${p}expansion-label">${esc(key)}</span>
              <span class="${p}expansion-value">${esc(String(val ?? '-'))}</span>
            </div>
          `).join('')}
        </div>
        <div class="${p}expansion-actions">
          <button class="${p}expansion-btn" data-action="view-detail" data-id="${item.id}">Ver Detalhes</button>
          <button class="${p}expansion-btn" data-action="copy-id" data-id="${item.id}">Copiar ID</button>
        </div>
      </div>
    `;
  },

  // @ts-expect-error strict migration — TS2339
  expand(id: string) { if (!this._state.getExpanded().has(id)) this._toggleRowExpand(id); },
  // @ts-expect-error strict migration — TS2339
  collapse(id: string) { if (this._state.getExpanded().has(id)) this._toggleRowExpand(id); },
  collapseAll() {
    // @ts-expect-error strict migration — TS2339
    const p = this._cssPrefix;
    // @ts-expect-error strict migration — TS2339
    this._state.get('expanded').forEach((id: string) => {
      // @ts-expect-error strict migration — TS2339
      this._container.querySelector(`tr.${p}tr-expansion[data-expand-id="${id}"]`)?.remove();
      // @ts-expect-error strict migration — TS2339
      this._container.querySelector(`[data-action="toggle-expand"][data-id="${id}"]`)?.classList.remove(`${p}expanded`);
    });
    // @ts-expect-error strict migration — TS2339
    this._state.set('expanded', new Set());
  }
};

export default ExpansionMixin;
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
