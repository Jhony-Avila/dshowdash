const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:cliente360:render";
function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]);
}
function formatCurrency(v) {
  if (v == null || isNaN(Number(v))) return "\u2014";
  return `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}
function formatDate(d) {
  if (!d) return "\u2014";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return "\u2014";
  }
}
function formatCNPJ(cnpj) {
  if (!cnpj) return "\u2014";
  const c = String(cnpj).replace(/\D/g, "");
  if (c.length !== 14) return cnpj;
  return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}
function formatPhone(phone) {
  if (!phone) return "\u2014";
  const p = String(phone).replace(/\D/g, "");
  if (p.length === 11) return p.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (p.length === 10) return p.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return phone;
}
function render(data, ICONS, activeTab = "geral") {
  const waLink = data.telefone ? `https://wa.me/55${String(data.telefone).replace(/\D/g, "")}` : null;
  const mailLink = data.email ? `mailto:${data.email}` : null;
  return `
        <div class="p05-cliente360">
            ${renderHeader(data, ICONS, waLink, mailLink)}
            ${renderQuickActions(data, ICONS, waLink, mailLink)}
            ${renderTabs(activeTab)}
            ${renderTabContent(data, ICONS, activeTab)}
        </div>
    `;
}
function renderHeader(data, ICONS, waLink, mailLink) {
  const statusClass = `p05-status-${data.status || "unknown"}`;
  return `
        <div class="p05-360-header">
            <button class="p05-btn p05-btn-ghost" data-action="back" aria-label="Voltar">
                ${ICONS.arrowLeft} Voltar
            </button>
            <div class="p05-360-header-info">
                <h3>${escapeHtml(data.nome)}</h3>
                <div class="p05-360-header-meta">
                    <span class="p05-360-cnpj" data-action="copy" data-value="${data.cnpj}" title="Clique para copiar">
                        ${formatCNPJ(data.cnpj)}
                    </span>
                    <span class="p05-badge ${statusClass}">${data.status || "\u2014"}</span>
                </div>
            </div>
            <div class="p05-360-header-actions">
                <button class="p05-btn p05-btn-icon" data-action="toggle-fav" title="Favoritar">
                    ${ICONS.star}
                </button>
            </div>
        </div>
    `;
}
function renderQuickActions(data, ICONS, waLink, mailLink) {
  return `
        <div class="p05-quick-actions">
            ${waLink ? `<a href="${waLink}" target="_blank" class="p05-quick-btn p05-whatsapp">${ICONS.messageCircle} WhatsApp</a>` : ""}
            ${mailLink ? `<a href="${mailLink}" class="p05-quick-btn p05-email">${ICONS.mail} Email</a>` : ""}
            ${data.telefone ? `<a href="tel:${data.telefone}" class="p05-quick-btn">${ICONS.phone} Ligar</a>` : ""}
        </div>
    `;
}
function renderTabs(activeTab) {
  const tabs = [
    { id: "geral", label: "Geral" },
    { id: "financeiro", label: "Financeiro" },
    { id: "orcamentos", label: "Or\xE7amentos" },
    { id: "contatos", label: "Contatos" },
    { id: "historico", label: "Hist\xF3rico" }
  ];
  return `
        <div class="p05-360-tabs" role="tablist">
            ${tabs.map((t) => `
                <button class="p05-360-tab ${activeTab === t.id ? "p05-active" : ""}" 
                        data-action="tab" data-tab="${t.id}" 
                        role="tab" aria-selected="${activeTab === t.id}">
                    ${t.label}
                </button>
            `).join("")}
        </div>
    `;
}
function renderTabContent(data, ICONS, activeTab) {
  return `
        <div class="p05-360-content">
            <div data-tab-content="geral" style="display: ${activeTab === "geral" ? "block" : "none"}">
                ${renderGeralTab(data, ICONS)}
            </div>
            <div data-tab-content="financeiro" style="display: ${activeTab === "financeiro" ? "block" : "none"}">
                ${renderFinanceiroTab(data, ICONS)}
            </div>
            <div data-tab-content="orcamentos" style="display: ${activeTab === "orcamentos" ? "block" : "none"}">
                ${renderOrcamentosTab(data, ICONS)}
            </div>
            <div data-tab-content="contatos" style="display: ${activeTab === "contatos" ? "block" : "none"}">
                ${renderContatosTab(data, ICONS)}
            </div>
            <div data-tab-content="historico" style="display: ${activeTab === "historico" ? "block" : "none"}">
                ${renderHistoricoTab(data, ICONS)}
            </div>
        </div>
    `;
}
function renderGeralTab(data, ICONS) {
  return `
        <div class="p05-360-grid">
            <div class="p05-360-section">
                <h4>${ICONS.building} Dados da Empresa</h4>
                <div class="p05-360-fields">
                    <div class="p05-field"><label>Raz\xE3o Social</label><span>${escapeHtml(data.nome)}</span></div>
                    <div class="p05-field"><label>CNPJ</label><span>${formatCNPJ(data.cnpj)}</span></div>
                    <div class="p05-field"><label>Porte</label><span>${escapeHtml(data.porte) || "\u2014"}</span></div>
                    <div class="p05-field"><label>Setor</label><span>${escapeHtml(data.setor) || "\u2014"}</span></div>
                    <div class="p05-field"><label>Status</label><span class="p05-badge p05-status-${data.status}">${data.status}</span></div>
                    <div class="p05-field"><label>Cliente desde</label><span>${formatDate(data.dataCadastro)}</span></div>
                </div>
            </div>
            
            <div class="p05-360-section">
                <h4>${ICONS.mapPin} Localiza\xE7\xE3o</h4>
                <div class="p05-360-fields">
                    <div class="p05-field"><label>Endere\xE7o</label><span>${escapeHtml(data.endereco) || "\u2014"}</span></div>
                    <div class="p05-field"><label>Bairro</label><span>${escapeHtml(data.bairro) || "\u2014"}</span></div>
                    <div class="p05-field"><label>Cidade/UF</label><span>${escapeHtml(data.cidade)}/${escapeHtml(data.uf)}</span></div>
                    <div class="p05-field"><label>CEP</label><span>${escapeHtml(data.cep) || "\u2014"}</span></div>
                </div>
            </div>

            <div class="p05-360-section">
                <h4>${ICONS.phone} Contato Principal</h4>
                <div class="p05-360-fields">
                    <div class="p05-field"><label>Telefone</label><span>${formatPhone(data.telefone)}</span></div>
                    <div class="p05-field"><label>Email</label><span>${escapeHtml(data.email) || "\u2014"}</span></div>
                </div>
            </div>

            ${data.risco ? `
            <div class="p05-360-section">
                <h4>${ICONS.alertTriangle} An\xE1lise de Risco</h4>
                <div class="p05-churn-indicator p05-churn-${data.risco.nivel || "baixo"}">
                    <span class="p05-churn-label">Risco de Churn</span>
                    <span class="p05-churn-value">${data.risco.nivel || "Baixo"}</span>
                    ${data.risco.score ? `<span class="p05-churn-score">${data.risco.score}%</span>` : ""}
                </div>
            </div>
            ` : ""}
        </div>
    `;
}
function renderFinanceiroTab(data, ICONS) {
  return `
        <div class="p05-360-grid">
            <div class="p05-360-section p05-section-wide">
                <h4>${ICONS.dollarSign} Resumo Financeiro</h4>
                <div class="p05-360-kpis-grid">
                    <div class="p05-360-kpi">
                        <span class="p05-360-kpi-label">Receita Total</span>
                        <strong class="p05-360-kpi-value p05-text-success">${formatCurrency(data.receita)}</strong>
                    </div>
                    <div class="p05-360-kpi">
                        <span class="p05-360-kpi-label">A Receber</span>
                        <strong class="p05-360-kpi-value ${data.aReceber > 0 ? "p05-text-warning" : ""}">${formatCurrency(data.aReceber)}</strong>
                    </div>
                    <div class="p05-360-kpi">
                        <span class="p05-360-kpi-label">\xDAltima Compra</span>
                        <strong class="p05-360-kpi-value">${formatDate(data.ultimaCompra)}</strong>
                    </div>
                    <div class="p05-360-kpi">
                        <span class="p05-360-kpi-label">Ticket M\xE9dio</span>
                        <strong class="p05-360-kpi-value">${formatCurrency(data.metricas?.ticketMedio)}</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
}
function renderOrcamentosTab(data, ICONS) {
  const orcamentos = data.orcamentos;
  if (!orcamentos?.length) {
    return `<div class="p05-360-empty">${ICONS.fileText}<span>Nenhum or\xE7amento encontrado</span></div>`;
  }
  return `
        <div class="p05-360-section">
            <h4>${ICONS.fileText} Or\xE7amentos (${orcamentos.length})</h4>
            <div class="p05-360-orcamentos-list">
                ${orcamentos.map((o) => `
                    <div class="p05-360-orcamento">
                        <div class="p05-360-orcamento-header">
                            <span class="p05-360-orcamento-id">#${o.id || o.numero}</span>
                            <span class="p05-badge p05-status-${o.status || "pendente"}">${o.status || "Pendente"}</span>
                        </div>
                        <div class="p05-360-orcamento-body">
                            <span class="p05-360-orcamento-valor">${formatCurrency(o.valor)}</span>
                            <span class="p05-360-orcamento-data">${formatDate(o.data)}</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}
function renderContatosTab(data, ICONS) {
  const contatos = data.contatos;
  if (!contatos?.length) {
    return `<div class="p05-360-empty">${ICONS.users}<span>Nenhum contato cadastrado</span></div>`;
  }
  return `
        <div class="p05-360-section">
            <h4>${ICONS.users} Contatos (${contatos.length})</h4>
            <div class="p05-360-contatos-list">
                ${contatos.map((c) => `
                    <div class="p05-360-contato">
                        <div class="p05-360-contato-avatar">${String(c.nome || "C")[0].toUpperCase()}</div>
                        <div class="p05-360-contato-info">
                            <span class="p05-360-contato-nome">${escapeHtml(c.nome)}</span>
                            <span class="p05-360-contato-cargo">${escapeHtml(c.cargo) || "\u2014"}</span>
                        </div>
                        <div class="p05-360-contato-actions">
                            ${c.telefone ? `<a href="tel:${c.telefone}" title="${formatPhone(c.telefone)}">${ICONS.phone}</a>` : ""}
                            ${c.email ? `<a href="mailto:${c.email}" title="${c.email}">${ICONS.mail}</a>` : ""}
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}
function renderHistoricoTab(data, ICONS) {
  const historico = data.historico;
  if (!historico?.length) {
    return `<div class="p05-360-empty">${ICONS.activity}<span>Nenhum hist\xF3rico dispon\xEDvel</span></div>`;
  }
  return `
        <div class="p05-360-section">
            <h4>${ICONS.activity} Hist\xF3rico de Atividades</h4>
            <div class="p05-360-timeline">
                ${historico.map((h) => `
                    <div class="p05-360-timeline-item">
                        <div class="p05-360-timeline-dot"></div>
                        <div class="p05-360-timeline-content">
                            <span class="p05-360-timeline-title">${escapeHtml(h.titulo || h.tipo)}</span>
                            <span class="p05-360-timeline-desc">${escapeHtml(h.descricao) || ""}</span>
                            <span class="p05-360-timeline-date">${formatDate(h.data)}</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { renderReady: true } };
}
var render_default = render;
export {
  MODULE_ID,
  VERSION,
  render_default as default,
  healthCheck,
  info,
  render
};
