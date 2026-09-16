import { PANEL_ID } from "./constants.js";
import { renderCharts } from "../render/sections.js";
const VERSION = "9.3.2-P2-ENTERPRISE";
const MODULE_ID = "panel-05/core/lifecycle";
let _initialized = false;
let _container = null;
const KPIS = [
  // [ref, classe semântica, rótulo]
  ["kpiReceita", "p05-bn-primary p05-bn-receita", "Receita"],
  ["kpiClientes", "p05-bn-secondary p05-bn-clientes", "Clientes ativos"],
  ["kpiConversao", "p05-bn-secondary p05-bn-conversao", "Convers\xE3o"],
  ["kpiOrcamentos", "p05-bn-tertiary p05-bn-orcamentos", "Or\xE7amentos"],
  ["kpiAReceber", "p05-bn-tertiary p05-bn-receber", "A receber"],
  ["kpiContatos", "p05-bn-info p05-bn-contatos", "Contatos"],
  ["kpiCidades", "p05-bn-info p05-bn-cidades", "Cidades"]
];
function _template() {
  const kpis = KPIS.map(([ref, cls, label]) => `
      <div class="p05-bn ${cls}">
        <div class="p05-bn-content">
          <span class="p05-bn-label">${label}</span>
          <span class="p05-bn-value" data-ref="${ref}">\u2014</span>
        </div>
      </div>`).join("");
  return `
  <div class="p05-panel" data-panel="${PANEL_ID}" data-ref="panel" style="position:relative">
    <header class="p05-header">
      <div class="p05-header-title">
        <h2 class="p05-title">Clientes 360\xB0</h2>
      </div>
      <div class="p05-header-left">
        <button type="button" class="p05-btn p05-btn-ghost p05-btn-sm" data-action="toggle-charts" title="Mostrar/ocultar gr\xE1ficos e insights (c)">Gr\xE1ficos</button>
        <button type="button" class="p05-btn p05-btn-ghost p05-btn-sm" data-action="show-date-picker" title="Per\xEDodo de cadastro">Per\xEDodo</button>
        <button type="button" class="p05-btn p05-btn-ghost p05-btn-sm" data-action="show-settings" title="Configura\xE7\xF5es (s)">Configura\xE7\xF5es</button>
      </div>
      <div class="p05-header-actions">
        <div class="p05-refresh-group">
          <span class="p05-countdown" data-ref="countdown">--</span>
          <button type="button" class="p05-btn-refresh" data-action="refresh" title="Atualizar (r)" aria-label="Atualizar">&#8635;</button>
        </div>
        <button type="button" class="p05-btn p05-btn-ghost p05-btn-sm" data-action="export-csv" title="Exportar CSV (e)">CSV</button>
        <button type="button" class="p05-btn p05-btn-ghost p05-btn-sm" data-action="export-excel" title="Exportar Excel">Excel</button>
        <button type="button" class="p05-btn p05-btn-ghost p05-btn-sm" data-action="show-keyboard-help" title="Atalhos (?)">?</button>
      </div>
    </header>

    <section class="p05-kpis" data-region="kpis" aria-label="Indicadores">${kpis}
    </section>

    <section class="p05-filters" data-region="filters" aria-label="Filtros">
      <div class="p05-filters-row">
        <div class="p05-search-box">
          <input type="text" class="p05-search-input" data-action="search" data-ref="searchInput" placeholder="Buscar cliente (nome ou raz\xE3o social)\u2026" aria-label="Buscar cliente">
        </div>
        <div class="p05-filter-group">
          <select class="p05-select" data-filter="status" data-ref="filterStatus" aria-label="Status">
            <option value="all">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
          <select class="p05-select" data-filter="uf" data-ref="filterUf" aria-label="UF">
            <option value="">Todas as UFs</option>
            ${["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"].map((uf) => `<option value="${uf}">${uf}</option>`).join("")}
          </select>
          <select class="p05-select" data-filter="porte" data-ref="filterPorte" aria-label="Porte">
            <option value="">Todos os portes</option>
          </select>
        </div>
      </div>
    </section>

    <div class="p05-content">
      <div class="p05-table-wrapper" data-region="table-wrapper">
        <div class="p05-table-host" data-ref="tableContainer"></div>
      </div>
      <div class="p05-pagination" data-region="pagination" data-ref="pagination"></div>
      <section class="p05-charts-section" data-region="charts" data-ref="chartsArea" aria-label="Gr\xE1ficos e insights"></section>
      <section class="p05-cliente360" data-ref="cliente360" style="display:none" aria-label="Cliente 360"></section>
    </div>

    <div class="p05-loading-overlay" data-ref="statusOverlay" style="display:none" role="status" aria-live="polite">
      <div class="p05-spinner" data-ref="spinner"></div>
      <p class="p05-status-message" data-ref="statusMessage"></p>
      <button type="button" class="p05-btn p05-btn-outline" data-action="retry" data-ref="retryBtn" style="display:none">Tentar novamente</button>
    </div>
  </div>`;
}
async function initLifecycle(container, options = {}) {
  if (!container || typeof container.querySelector !== "function") throw new Error(`[${PANEL_ID}] container inv\xE1lido`);
  _container = container;
  container.innerHTML = _template();
  const q = (ref) => container.querySelector(`[data-ref="${ref}"]`);
  const tableContainer = q("tableContainer");
  const refs = {
    panelId: PANEL_ID,
    options,
    container,
    // raiz da delegação de eventos (index.ts) e do toast
    panel: q("panel"),
    // regiões [data-region] (managers/cliente360-view.ts)
    cliente360: q("cliente360"),
    chartsArea: q("chartsArea"),
    tableContainer,
    // entregue ao table-engine (renderer/table.ts) — ele sobrescreve o innerHTML
    pagination: q("pagination"),
    statusOverlay: q("statusOverlay"),
    spinner: q("spinner"),
    statusMessage: q("statusMessage"),
    retryBtn: q("retryBtn"),
    countdown: q("countdown"),
    searchInput: q("searchInput"),
    filterStatus: q("filterStatus"),
    filterUf: q("filterUf"),
    filterPorte: q("filterPorte"),
    // handlers/events.ts:toggleChartsView chama refs.renderCharts(...) — antes era sempre undefined
    renderCharts: (data) => renderCharts(refs, data),
    destroy() {
      _initialized = false;
      if (_container) {
        _container.innerHTML = "";
      }
      _container = null;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "UNHEALTHY", moduleId: MODULE_ID };
    }
  };
  for (const [ref] of KPIS) refs[ref] = q(ref);
  Object.defineProperty(refs, "tbody", { enumerable: true, get: () => tableContainer.querySelector("tbody") });
  _initialized = true;
  return refs;
}
function healthCheck() {
  const checks = { initialized: _initialized, containerReady: !!_container };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, panelId: PANEL_ID, healthCheck: healthCheck() };
}
var lifecycle_default = { initLifecycle, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  lifecycle_default as default,
  healthCheck,
  info,
  initLifecycle
};
