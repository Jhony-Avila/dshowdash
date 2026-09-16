// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.3.1-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05/core/lifecycle
// PURPOSE: Constrói o DOM do painel 05 e devolve o objeto `refs` que TODOS os renderers/handlers consomem
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_ID from ./constants.js
//   renderCharts from ../render/sections.js (só para expor refs.renderCharts — handlers/events.ts:toggleChartsView)
//
// PROVIDES:
//   initLifecycle(container, options) — monta o DOM e devolve refs (+ destroy())
//   healthCheck(), info()
//
// HISTÓRICO:
//   2026-09-16 (rodada frontend 05/16): até aqui este módulo era um STUB que devolvia { container, panelId, options }
//   e NUNCA construía o DOM — os renderers esperavam refs.kpiReceita, refs.tableContainer, refs.chartsArea… que não
//   existiam, e o painel montava em branco. O contrato de refs abaixo foi levantado arquivo:linha em todos os
//   consumidores (renderer/*, render/sections, handlers/events, managers/cliente360-view, cliente360/index,
//   renderer/status.updateCountdown). Nada no painel consulta por id: o contrato é refs + data-action/data-filter/
//   data-region. Classes = as que existem em styles/ (main.css e imports).
// ═══════════════════════════════════════════════════════════════
'use strict';
import { PANEL_ID } from './constants.js';
import { renderCharts } from '../render/sections.js';

export const VERSION = '9.3.2-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05/core/lifecycle';

let _initialized = false;
let _container: HTMLElement | null = null;

const KPIS: Array<[string, string, string]> = [
  // [ref, classe semântica, rótulo]
  ['kpiReceita', 'p05-bn-primary p05-bn-receita', 'Receita'],
  ['kpiClientes', 'p05-bn-secondary p05-bn-clientes', 'Clientes ativos'],
  ['kpiConversao', 'p05-bn-secondary p05-bn-conversao', 'Conversão'],
  ['kpiOrcamentos', 'p05-bn-tertiary p05-bn-orcamentos', 'Orçamentos'],
  ['kpiAReceber', 'p05-bn-tertiary p05-bn-receber', 'A receber'],
  ['kpiContatos', 'p05-bn-info p05-bn-contatos', 'Contatos'],
  ['kpiCidades', 'p05-bn-info p05-bn-cidades', 'Cidades'],
];

function _template(): string {
  const kpis = KPIS.map(([ref, cls, label]) => `
      <div class="p05-bn ${cls}">
        <div class="p05-bn-content">
          <span class="p05-bn-label">${label}</span>
          <span class="p05-bn-value" data-ref="${ref}">—</span>
        </div>
      </div>`).join('');
  // .p05-loading-overlay é position:absolute (styles/_interactions.loading.css) → a raiz precisa de position:relative.
  return `
  <div class="p05-panel" data-panel="${PANEL_ID}" data-ref="panel" style="position:relative">
    <header class="p05-header">
      <div class="p05-header-title">
        <h2 class="p05-title">Clientes 360°</h2>
      </div>
      <div class="p05-header-left">
        <button type="button" class="p05-btn p05-btn-ghost p05-btn-sm" data-action="toggle-charts" title="Mostrar/ocultar gráficos e insights (c)">Gráficos</button>
        <button type="button" class="p05-btn p05-btn-ghost p05-btn-sm" data-action="show-date-picker" title="Período de cadastro">Período</button>
        <button type="button" class="p05-btn p05-btn-ghost p05-btn-sm" data-action="show-settings" title="Configurações (s)">Configurações</button>
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
          <input type="text" class="p05-search-input" data-action="search" data-ref="searchInput" placeholder="Buscar cliente (nome ou razão social)…" aria-label="Buscar cliente">
        </div>
        <div class="p05-filter-group">
          <select class="p05-select" data-filter="status" data-ref="filterStatus" aria-label="Status">
            <option value="all">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
          <select class="p05-select" data-filter="uf" data-ref="filterUf" aria-label="UF">
            <option value="">Todas as UFs</option>
            ${['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map((uf) => `<option value="${uf}">${uf}</option>`).join('')}
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
      <section class="p05-charts-section" data-region="charts" data-ref="chartsArea" aria-label="Gráficos e insights"></section>
      <section class="p05-cliente360" data-ref="cliente360" style="display:none" aria-label="Cliente 360"></section>
    </div>

    <div class="p05-loading-overlay" data-ref="statusOverlay" style="display:none" role="status" aria-live="polite">
      <div class="p05-spinner" data-ref="spinner"></div>
      <p class="p05-status-message" data-ref="statusMessage"></p>
      <button type="button" class="p05-btn p05-btn-outline" data-action="retry" data-ref="retryBtn" style="display:none">Tentar novamente</button>
    </div>
  </div>`;
}

export async function initLifecycle(container: HTMLElement, options: Record<string, unknown> = {}) {
  if (!container || typeof container.querySelector !== 'function') throw new Error(`[${PANEL_ID}] container inválido`);
  _container = container;
  container.innerHTML = _template();
  const q = (ref: string) => container.querySelector(`[data-ref="${ref}"]`) as HTMLElement | null;
  const tableContainer = q('tableContainer') as HTMLElement;
  const refs: Record<string, unknown> = {
    panelId: PANEL_ID,
    options,
    container,                        // raiz da delegação de eventos (index.ts) e do toast
    panel: q('panel'),                // regiões [data-region] (managers/cliente360-view.ts)
    cliente360: q('cliente360'),
    chartsArea: q('chartsArea'),
    tableContainer,                   // entregue ao table-engine (renderer/table.ts) — ele sobrescreve o innerHTML
    pagination: q('pagination'),
    statusOverlay: q('statusOverlay'),
    spinner: q('spinner'),
    statusMessage: q('statusMessage'),
    retryBtn: q('retryBtn'),
    countdown: q('countdown'),
    searchInput: q('searchInput'),
    filterStatus: q('filterStatus'),
    filterUf: q('filterUf'),
    filterPorte: q('filterPorte'),
    // handlers/events.ts:toggleChartsView chama refs.renderCharts(...) — antes era sempre undefined
    renderCharts: (data: unknown) => renderCharts(refs, data as Record<string, unknown> | null),
    destroy() {
      _initialized = false;
      if (_container) { _container.innerHTML = ''; }   // sem isto, unmount().then(doMount) duplicava o painel
      _container = null;
    },
    healthCheck() {
      return { status: _initialized ? 'HEALTHY' : 'UNHEALTHY', moduleId: MODULE_ID };
    },
  };
  for (const [ref] of KPIS) refs[ref] = q(ref);
  // <tbody> é criado (e recriado) pelo table-engine dentro de tableContainer → getter, nunca captura estática
  Object.defineProperty(refs, 'tbody', { enumerable: true, get: () => tableContainer.querySelector('tbody') });
  _initialized = true;
  return refs;
}

export function healthCheck() {
  const checks = { initialized: _initialized, containerReady: !!_container };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID };
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, panelId: PANEL_ID, healthCheck: healthCheck() };
}

export default { initLifecycle, healthCheck, info, VERSION, MODULE_ID };
