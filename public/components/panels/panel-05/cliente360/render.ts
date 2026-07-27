

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:cliente360:render
// PURPOSE: Panel-05 Cliente360 Render
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   render() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:cliente360:render';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function escapeHtml(s: unknown) {
    if (!s) return '';
    // @ts-expect-error strict migration — TS2769
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function formatCurrency(v: unknown) {
    if (v == null || isNaN(Number(v))) return '—';
    return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDate(d: unknown) {
    if (!d) return '—';
    try {
        return new Date(d as string | number | Date).toLocaleDateString('pt-BR');
    } catch { return '—'; }
}

function formatCNPJ(cnpj: unknown) {
    if (!cnpj) return '—';
    const c = String(cnpj).replace(/\D/g, '');
    if (c.length !== 14) return cnpj;
    return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatPhone(phone: unknown) {
    if (!phone) return '—';
    const p = String(phone).replace(/\D/g, '');
    if (p.length === 11) return p.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (p.length === 10) return p.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return phone;
}

// ═══════════════════════════════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════════════════════════════
export function render(data: Record<string, unknown>, ICONS: Record<string, string>, activeTab = 'geral') {
    const waLink = data.telefone ? `https://wa.me/55${String(data.telefone).replace(/\D/g, '')}` : null;
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

// ═══════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════
function renderHeader(data: Record<string, unknown>, ICONS: Record<string, string>, waLink: string | null, mailLink: string | null) {
    const statusClass = `p05-status-${data.status || 'unknown'}`;
    
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
                    <span class="p05-badge ${statusClass}">${data.status || '—'}</span>
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

// ═══════════════════════════════════════════════════════════════
// QUICK ACTIONS
// ═══════════════════════════════════════════════════════════════
function renderQuickActions(data: Record<string, unknown>, ICONS: Record<string, string>, waLink: string | null, mailLink: string | null) {
    return `
        <div class="p05-quick-actions">
            ${waLink ? `<a href="${waLink}" target="_blank" class="p05-quick-btn p05-whatsapp">${ICONS.messageCircle} WhatsApp</a>` : ''}
            ${mailLink ? `<a href="${mailLink}" class="p05-quick-btn p05-email">${ICONS.mail} Email</a>` : ''}
            ${data.telefone ? `<a href="tel:${data.telefone}" class="p05-quick-btn">${ICONS.phone} Ligar</a>` : ''}
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════
function renderTabs(activeTab: string) {
    const tabs = [
        { id: 'geral', label: 'Geral' },
        { id: 'financeiro', label: 'Financeiro' },
        { id: 'orcamentos', label: 'Orçamentos' },
        { id: 'contatos', label: 'Contatos' },
        { id: 'historico', label: 'Histórico' }
    ];

    return `
        <div class="p05-360-tabs" role="tablist">
            ${tabs.map(t => `
                <button class="p05-360-tab ${activeTab === t.id ? 'p05-active' : ''}" 
                        data-action="tab" data-tab="${t.id}" 
                        role="tab" aria-selected="${activeTab === t.id}">
                    ${t.label}
                </button>
            `).join('')}
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// TAB CONTENT
// ═══════════════════════════════════════════════════════════════
function renderTabContent(data: Record<string, unknown>, ICONS: Record<string, string>, activeTab: string) {
    return `
        <div class="p05-360-content">
            <div data-tab-content="geral" style="display: ${activeTab === 'geral' ? 'block' : 'none'}">
                ${renderGeralTab(data, ICONS)}
            </div>
            <div data-tab-content="financeiro" style="display: ${activeTab === 'financeiro' ? 'block' : 'none'}">
                ${renderFinanceiroTab(data, ICONS)}
            </div>
            <div data-tab-content="orcamentos" style="display: ${activeTab === 'orcamentos' ? 'block' : 'none'}">
                ${renderOrcamentosTab(data, ICONS)}
            </div>
            <div data-tab-content="contatos" style="display: ${activeTab === 'contatos' ? 'block' : 'none'}">
                ${renderContatosTab(data, ICONS)}
            </div>
            <div data-tab-content="historico" style="display: ${activeTab === 'historico' ? 'block' : 'none'}">
                ${renderHistoricoTab(data, ICONS)}
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// TAB: GERAL
// ═══════════════════════════════════════════════════════════════
function renderGeralTab(data: Record<string, unknown>, ICONS: Record<string, string>) {
    return `
        <div class="p05-360-grid">
            <div class="p05-360-section">
                <h4>${ICONS.building} Dados da Empresa</h4>
                <div class="p05-360-fields">
                    <div class="p05-field"><label>Razão Social</label><span>${escapeHtml(data.nome)}</span></div>
                    <div class="p05-field"><label>CNPJ</label><span>${formatCNPJ(data.cnpj)}</span></div>
                    <div class="p05-field"><label>Porte</label><span>${escapeHtml(data.porte) || '—'}</span></div>
                    <div class="p05-field"><label>Setor</label><span>${escapeHtml(data.setor) || '—'}</span></div>
                    <div class="p05-field"><label>Status</label><span class="p05-badge p05-status-${data.status}">${data.status}</span></div>
                    <div class="p05-field"><label>Cliente desde</label><span>${formatDate(data.dataCadastro)}</span></div>
                </div>
            </div>
            
            <div class="p05-360-section">
                <h4>${ICONS.mapPin} Localização</h4>
                <div class="p05-360-fields">
                    <div class="p05-field"><label>Endereço</label><span>${escapeHtml(data.endereco) || '—'}</span></div>
                    <div class="p05-field"><label>Bairro</label><span>${escapeHtml(data.bairro) || '—'}</span></div>
                    <div class="p05-field"><label>Cidade/UF</label><span>${escapeHtml(data.cidade)}/${escapeHtml(data.uf)}</span></div>
                    <div class="p05-field"><label>CEP</label><span>${escapeHtml(data.cep) || '—'}</span></div>
                </div>
            </div>

            <div class="p05-360-section">
                <h4>${ICONS.phone} Contato Principal</h4>
                <div class="p05-360-fields">
                    <div class="p05-field"><label>Telefone</label><span>${formatPhone(data.telefone)}</span></div>
                    <div class="p05-field"><label>Email</label><span>${escapeHtml(data.email) || '—'}</span></div>
                </div>
            </div>

            ${data.risco ? `
            <div class="p05-360-section">
                <h4>${ICONS.alertTriangle} Análise de Risco</h4>
                <div class="p05-churn-indicator p05-churn-${(data.risco as Record<string, unknown>).nivel || 'baixo'}">
                    <span class="p05-churn-label">Risco de Churn</span>
                    <span class="p05-churn-value">${(data.risco as Record<string, unknown>).nivel || 'Baixo'}</span>
                    ${(data.risco as Record<string, unknown>).score ? `<span class="p05-churn-score">${(data.risco as Record<string, unknown>).score}%</span>` : ''}
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// TAB: FINANCEIRO
// ═══════════════════════════════════════════════════════════════
function renderFinanceiroTab(data: Record<string, unknown>, ICONS: Record<string, string>) {
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
                        <strong class="p05-360-kpi-value ${(data.aReceber as number) > 0 ? 'p05-text-warning' : ''}">${formatCurrency(data.aReceber)}</strong>
                    </div>
                    <div class="p05-360-kpi">
                        <span class="p05-360-kpi-label">Última Compra</span>
                        <strong class="p05-360-kpi-value">${formatDate(data.ultimaCompra)}</strong>
                    </div>
                    <div class="p05-360-kpi">
                        <span class="p05-360-kpi-label">Ticket Médio</span>
                        <strong class="p05-360-kpi-value">${formatCurrency((data.metricas as Record<string, unknown> | null)?.ticketMedio)}</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// TAB: ORÇAMENTOS
// ═══════════════════════════════════════════════════════════════
function renderOrcamentosTab(data: Record<string, unknown>, ICONS: Record<string, string>) {
    const orcamentos = data.orcamentos as Array<Record<string, unknown>> | null;
    if (!orcamentos?.length) {
        return `<div class="p05-360-empty">${ICONS.fileText}<span>Nenhum orçamento encontrado</span></div>`;
    }

    return `
        <div class="p05-360-section">
            <h4>${ICONS.fileText} Orçamentos (${orcamentos.length})</h4>
            <div class="p05-360-orcamentos-list">
                ${orcamentos.map(o => `
                    <div class="p05-360-orcamento">
                        <div class="p05-360-orcamento-header">
                            <span class="p05-360-orcamento-id">#${o.id || o.numero}</span>
                            <span class="p05-badge p05-status-${o.status || 'pendente'}">${o.status || 'Pendente'}</span>
                        </div>
                        <div class="p05-360-orcamento-body">
                            <span class="p05-360-orcamento-valor">${formatCurrency(o.valor)}</span>
                            <span class="p05-360-orcamento-data">${formatDate(o.data)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// TAB: CONTATOS
// ═══════════════════════════════════════════════════════════════
function renderContatosTab(data: Record<string, unknown>, ICONS: Record<string, string>) {
    const contatos = data.contatos as Array<Record<string, unknown>> | null;
    if (!contatos?.length) {
        return `<div class="p05-360-empty">${ICONS.users}<span>Nenhum contato cadastrado</span></div>`;
    }

    return `
        <div class="p05-360-section">
            <h4>${ICONS.users} Contatos (${contatos.length})</h4>
            <div class="p05-360-contatos-list">
                ${contatos.map(c => `
                    <div class="p05-360-contato">
                        <div class="p05-360-contato-avatar">${String(c.nome || 'C')[0].toUpperCase()}</div>
                        <div class="p05-360-contato-info">
                            <span class="p05-360-contato-nome">${escapeHtml(c.nome)}</span>
                            <span class="p05-360-contato-cargo">${escapeHtml(c.cargo) || '—'}</span>
                        </div>
                        <div class="p05-360-contato-actions">
                            ${c.telefone ? `<a href="tel:${c.telefone}" title="${formatPhone(c.telefone)}">${ICONS.phone}</a>` : ''}
                            ${c.email ? `<a href="mailto:${c.email}" title="${c.email}">${ICONS.mail}</a>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// TAB: HISTÓRICO
// ═══════════════════════════════════════════════════════════════
function renderHistoricoTab(data: Record<string, unknown>, ICONS: Record<string, string>) {
    const historico = data.historico as Array<Record<string, unknown>> | null;
    if (!historico?.length) {
        return `<div class="p05-360-empty">${ICONS.activity}<span>Nenhum histórico disponível</span></div>`;
    }

    return `
        <div class="p05-360-section">
            <h4>${ICONS.activity} Histórico de Atividades</h4>
            <div class="p05-360-timeline">
                ${historico.map(h => `
                    <div class="p05-360-timeline-item">
                        <div class="p05-360-timeline-dot"></div>
                        <div class="p05-360-timeline-content">
                            <span class="p05-360-timeline-title">${escapeHtml(h.titulo || h.tipo)}</span>
                            <span class="p05-360-timeline-desc">${escapeHtml(h.descricao) || ''}</span>
                            <span class="p05-360-timeline-date">${formatDate(h.data)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { renderReady: true } }; }

export default render;
