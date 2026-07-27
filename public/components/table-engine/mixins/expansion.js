const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "table-engine:expansion";
const ExpansionMixin = {
  _toggleRowExpand(id) {
    const p = this._cssPrefix;
    const wasExpanded = this._state.getExpanded().has(id);
    wasExpanded ? this._state.collapse(id) : this._state.expand(id);
    const nowExpanded = !wasExpanded;
    if (wasExpanded) {
      this._container.querySelector(`tr.${p}tr-expansion[data-expand-id="${id}"]`)?.remove();
      this._container.querySelector(`[data-action="toggle-expand"][data-id="${id}"]`)?.classList.remove(`${p}expanded`);
    } else {
      const data = this._state.getFilteredData();
      const item = data.find((c) => String(c.id) === String(id));
      if (item) {
        const mainRow = this._container.querySelector(`tr[data-row-id="${id}"]`);
        if (mainRow) {
          const expRow = document.createElement("tr");
          expRow.className = `${p}tr-expansion`;
          expRow.dataset.expandId = id;
          expRow.innerHTML = `<td colspan="${mainRow.children.length}">${this._renderExpansionContent(item)}</td>`;
          mainRow.after(expRow);
        }
      }
      this._container.querySelector(`[data-action="toggle-expand"][data-id="${id}"]`)?.classList.add(`${p}expanded`);
    }
    this.emit(nowExpanded ? "row-expanded" : "row-collapsed", { id });
  },
  // @ts-expect-error strict migration — TS7023
  _renderExpansionContent(item) {
    const p = this._cssPrefix;
    const fmt = this._formatters || {};
    const esc = fmt.escapeHtml || ((v) => v);
    const fmtCurrency = fmt.formatCurrency || ((v) => v);
    const fmtDate = fmt.formatDate || ((v) => v);
    const fmtCNPJ = fmt.formatCNPJ || ((v) => v);
    const fmtPhone = fmt.formatPhone || ((v) => v);
    if (this._options.renderExpansion && typeof this._options.renderExpansion === "function") {
      return this._options.renderExpansion(item, { formatters: fmt, cssPrefix: p });
    }
    const fields = Object.entries(item).filter(([k]) => !["id", "_meta"].includes(k)).slice(0, 12);
    return `
      <div class="${p}expansion-content">
        <div class="${p}expansion-grid">
          ${fields.map(([key, val]) => `
            <div class="${p}expansion-item">
              <span class="${p}expansion-label">${esc(key)}</span>
              <span class="${p}expansion-value">${esc(String(val ?? "-"))}</span>
            </div>
          `).join("")}
        </div>
        <div class="${p}expansion-actions">
          <button class="${p}expansion-btn" data-action="view-detail" data-id="${item.id}">Ver Detalhes</button>
          <button class="${p}expansion-btn" data-action="copy-id" data-id="${item.id}">Copiar ID</button>
        </div>
      </div>
    `;
  },
  // @ts-expect-error strict migration — TS2339
  expand(id) {
    if (!this._state.getExpanded().has(id)) this._toggleRowExpand(id);
  },
  // @ts-expect-error strict migration — TS2339
  collapse(id) {
    if (this._state.getExpanded().has(id)) this._toggleRowExpand(id);
  },
  collapseAll() {
    const p = this._cssPrefix;
    this._state.get("expanded").forEach((id) => {
      this._container.querySelector(`tr.${p}tr-expansion[data-expand-id="${id}"]`)?.remove();
      this._container.querySelector(`[data-action="toggle-expand"][data-id="${id}"]`)?.classList.remove(`${p}expanded`);
    });
    this._state.set("expanded", /* @__PURE__ */ new Set());
  }
};
var expansion_default = ExpansionMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
export {
  ExpansionMixin,
  MODULE_ID,
  VERSION,
  expansion_default as default,
  healthCheck,
  info
};
