import { ICONS } from "./constants.js";
import { escapeHtml } from "./utils.js";
import { formatCurrency, formatDate, formatCNPJ, formatPhone } from "../../utils/dashboard-utils.js";
import { TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:table:expansion";
const ExpansionMixin = {
  _toggleRowExpand(id) {
    const wasExpanded = this._state.isExpanded(id);
    const nowExpanded = this._state.toggleExpansion(id);
    if (wasExpanded) {
      this._container.querySelector(`tr.p05-tr-expansion[data-expand-id="${id}"]`)?.remove();
      this._container.querySelector(`[data-action="toggle-expand"][data-id="${id}"]`)?.classList.remove("p05-expanded");
    } else {
      const cliente = this._state.getDisplayData().find((c) => String(c.id) === String(id));
      if (cliente) {
        const mainRow = this._container.querySelector(`tr[data-cliente-id="${id}"]`);
        if (mainRow) {
          const expRow = document.createElement("tr");
          expRow.className = "p05-tr-expansion";
          expRow.dataset.expandId = id;
          expRow.innerHTML = `<td colspan="${mainRow.children.length}">${this._renderExpansionContent(cliente)}</td>`;
          mainRow.after(expRow);
        }
      }
      this._container.querySelector(`[data-action="toggle-expand"][data-id="${id}"]`)?.classList.add("p05-expanded");
    }
    this.emit(TABLE_EVENTS.VIEW_CHANGE, { id, expanded: nowExpanded, type: "row-expand" });
  },
  _renderExpansionContent(c) {
    const waLink = c.telefone ? `https://wa.me/55${String(c.telefone).replace(/\D/g, "")}` : null;
    return `
            <div class="p05-expansion-content">
                <div class="p05-expansion-grid">
                    <div class="p05-expansion-section">
                        <h4>Dados Gerais</h4>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">CNPJ</span>
                            <span class="p05-expansion-value">${c.cnpj ? formatCNPJ(c.cnpj) : "\u2014"}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Telefone</span>
                            <span class="p05-expansion-value">${c.telefone ? formatPhone(c.telefone) : "\u2014"}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Email</span>
                            <span class="p05-expansion-value">${escapeHtml(c.email) || "\u2014"}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Porte</span>
                            <span class="p05-expansion-value">${escapeHtml(c.porte) || "\u2014"}</span>
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
                            <span class="p05-expansion-label">\xDAltima Compra</span>
                            <span class="p05-expansion-value">${c.ultimaCompra ? formatDate(c.ultimaCompra) : "\u2014"}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Risco</span>
                            <span class="p05-expansion-value">${escapeHtml(c.risco) || "\u2014"}</span>
                        </div>
                    </div>
                    <div class="p05-expansion-section">
                        <h4>Endere\xE7o</h4>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Cidade/UF</span>
                            <span class="p05-expansion-value">${escapeHtml(c.cidade) || "\u2014"}${c.uf ? `/${c.uf}` : ""}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">CEP</span>
                            <span class="p05-expansion-value">${escapeHtml(c.cep) || "\u2014"}</span>
                        </div>
                        <div class="p05-expansion-item">
                            <span class="p05-expansion-label">Bairro</span>
                            <span class="p05-expansion-value">${escapeHtml(c.bairro) || "\u2014"}</span>
                        </div>
                    </div>
                </div>
                <div class="p05-expansion-actions">
                    <button class="p05-expansion-btn p05-expansion-btn-primary" data-action="view-cliente" data-id="${c.id}">
                        ${ICONS.eye} Ver Completo
                    </button>
                    <button class="p05-expansion-btn" data-action="copy-cnpj" data-cnpj="${c.cnpj || ""}">
                        ${ICONS.copy} Copiar CNPJ
                    </button>
                    ${waLink ? `<a href="${waLink}" target="_blank" class="p05-expansion-btn">${ICONS.messageCircle} WhatsApp</a>` : ""}
                </div>
            </div>
        `;
  }
};
var expansion_default = ExpansionMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { expansionReady: true } };
}
export {
  ExpansionMixin,
  MODULE_ID,
  VERSION,
  expansion_default as default,
  healthCheck,
  info
};
