

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/core/template
// PURPOSE: Panel-01 - HTML Template Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_ID from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderStructure() — exported function
//   updateStatusBadges() — exported function
//   updateTimestamp() — exported function
//   updateFooterStats() — exported function
//   updateFilterCount() — exported function
//   updateCountdown() — exported function
//   setAutoRefreshState() — exported function
//   updateRefreshBtn() — exported function
//   updateBulkActions() — exported function
//   populateFilterOptions() — exported function
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

import { PANEL_ID } from './constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/core/template';

export function renderStructure(container: HTMLElement) {
  container.innerHTML = `
    <div class="p01-wrapper" role="region" aria-label="Gestão de Requisições">
      
      <!-- HEADER: IDENTIDADE + KPIs MINI + AÇÕES -->
      <header class="p01-header">
        <div class="p01-identity">
          <div class="p01-identity-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M16 13H8M16 17H8M10 9H8"/>
            </svg>
          </div>
          <h2 class="p01-title">Gestão de Requisições</h2>
        </div>

        <div class="p01-health-summary" data-status-badges>
          <span class="p01-health-item p01-health-item--pendente" data-badge="pendente" data-tooltip="Pendente Lançamento">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span class="p01-health-count">--</span>
            <span>Pendente</span>
          </span>
          <span class="p01-health-item p01-health-item--pagamento" data-badge="pagamento" data-tooltip="Aguardando Pagamento">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <span class="p01-health-count">--</span>
            <span>Pagamento</span>
          </span>
          <span class="p01-health-item p01-health-item--pago" data-badge="pago" data-tooltip="Pagas">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            <span class="p01-health-count">--</span>
            <span>Pagas</span>
          </span>
          <span class="p01-health-item p01-health-item--total" data-badge="total" data-tooltip="Total Requisições">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
            <span class="p01-health-count">--</span>
            <span>Total</span>
          </span>
        </div>

        <div class="p01-actions">
          <div class="p01-auto-refresh" data-tooltip="Auto-refresh">
            <button class="p01-auto-toggle active" data-action="toggle-auto-refresh" type="button" aria-label="Toggle auto-refresh"></button>
            <span class="p01-countdown active" data-countdown>30</span>
          </div>
          
          <div class="p01-actions-cluster">
            <button class="p01-action-btn p01-action-btn--refresh" data-action="refresh" data-tooltip="Atualizar" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
            <button class="p01-action-btn p01-action-btn--export" data-action="export" data-tooltip="Exportar CSV" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
            <button class="p01-action-btn p01-action-btn--print" data-action="print" data-tooltip="Imprimir" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
            </button>
          </div>
          
          <span class="p01-timestamp" data-last-update data-tooltip="Última atualização">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span>--:--:--</span>
          </span>
        </div>
      </header>

      <!-- KPIs EXPANDIDOS -->
      <section class="p01-kpis" data-kpis></section>

      <!-- FILTROS -->
      <div class="p01-filters" data-filters>
        <div class="p01-filter-chips">
          <div class="p01-filter-chip" data-filter-chip="situacao">
            <svg class="p01-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            <select data-filter="situacao">
              <option value="">Situação</option>
            </select>
            <svg class="p01-chip-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          
          <div class="p01-filter-chip" data-filter-chip="centro">
            <svg class="p01-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
            <select data-filter="centro">
              <option value="">Centro Custo</option>
            </select>
            <svg class="p01-chip-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>

          <div class="p01-filter-chip p01-filter-chip--date" data-filter-chip="data">
            <svg class="p01-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <input type="date" data-filter="dataInicio" placeholder="De">
            <span class="p01-date-separator">→</span>
            <input type="date" data-filter="dataFim" placeholder="Até">
          </div>
        </div>

        <div class="p01-search">
          <svg class="p01-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" class="p01-search-input" data-filter="q" placeholder="Buscar por descrição, fornecedor..." autocomplete="off">
          <span class="p01-search-shortcut">/</span>
        </div>

        <button class="p01-filter-clear" data-action="clear-filters" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          Limpar
        </button>

        <div class="p01-filter-spacer"></div>

        <div class="p01-grid-controls">
          <div class="p01-density-cluster" data-tooltip="Densidade">
            <button class="p01-density-btn" data-density="compact" type="button" aria-label="Compacto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <button class="p01-density-btn active" data-density="normal" type="button" aria-label="Normal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="5" x2="21" y2="5"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="19" x2="21" y2="19"/></svg>
            </button>
            <button class="p01-density-btn" data-density="comfortable" type="button" aria-label="Confortável">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="4" x2="21" y2="4"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="20" x2="21" y2="20"/></svg>
            </button>
          </div>

          <select class="p01-group-select" data-action="group-by" data-tooltip="Agrupar">
            <option value="">Sem grupo</option>
            <option value="situacao">Por Situação</option>
            <option value="centro">Por Centro</option>
          </select>

          <div class="p01-control-cluster">
            <div class="p01-columns-dropdown">
              <button class="p01-control-btn" data-action="toggle-columns" type="button" data-tooltip="Colunas">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              </button>
              <div class="p01-columns-menu" data-dropdown="columns">
                <div class="p01-columns-menu-header">Colunas Visíveis</div>
              </div>
            </div>
          </div>
        </div>

        <span class="p01-filter-counter" data-filter-count>
          <strong data-visible-count>--</strong> de <strong data-total-count>--</strong>
        </span>
      </div>

      <!-- BULK ACTIONS (seleção múltipla) -->
      <div class="p01-bulk-actions" data-bulk-actions hidden>
        <span class="p01-bulk-count"><strong data-selected-count>0</strong> selecionados</span>
        <div class="p01-bulk-buttons">
          <button class="p01-bulk-btn" data-bulk-action="export" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar
          </button>
          <button class="p01-bulk-btn p01-bulk-btn--danger" data-bulk-action="cancel" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
            Cancelar
          </button>
        </div>
        <button class="p01-bulk-clear" data-action="clear-selection" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- CONTENT AREA -->
      <main id="${PANEL_ID}-content" class="p01-content" aria-busy="true"></main>

      <!-- FOOTER -->
      <footer class="p01-footer">
        <div class="p01-footer-left">
          <span class="p01-footer-stat" data-stat="total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
            Total: <strong>--</strong>
          </span>
          <span class="p01-footer-stat" data-stat="valor">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            Valor: <strong>--</strong>
          </span>
        </div>
        <div class="p01-footer-center" data-pagination></div>
        <div class="p01-footer-right">
          <span class="p01-footer-info" data-refresh-interval>Auto-refresh: 30s</span>
        </div>
      </footer>
    </div>
  `;
}

export function updateStatusBadges(container: HTMLElement, stats: Record<string, number>) {
  if (!container || !stats) return;
  const badges = container.querySelector('[data-status-badges]');
  if (!badges) return;
  
  const pendente = badges.querySelector('[data-badge="pendente"] .p01-health-count');
  const pagamento = badges.querySelector('[data-badge="pagamento"] .p01-health-count');
  const pago = badges.querySelector('[data-badge="pago"] .p01-health-count');
  const total = badges.querySelector('[data-badge="total"] .p01-health-count');
  
  if (pendente) pendente.textContent = String(stats.pendente ?? 0);
  if (pagamento) pagamento.textContent = String(stats.pagamento ?? 0);
  if (pago) pago.textContent = String(stats.pago ?? 0);
  if (total) total.textContent = String(stats.total ?? 0);
}

export function updateTimestamp(container: HTMLElement | null | undefined, timestamp: number | string) {
  const el = container?.querySelector('[data-last-update] span');
  if (!el || !timestamp) return;
  const time = new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  el.textContent = time;
}

export function updateFooterStats(container: HTMLElement, stats: Record<string, unknown>) {
  if (!container || !stats) return;
  const total = container.querySelector('[data-stat="total"] strong');
  const valor = container.querySelector('[data-stat="valor"] strong');
  if (total) total.textContent = String(stats.total ?? '--');
  if (valor) valor.textContent = String(stats.valor ?? '--');
}

export function updateFilterCount(container: HTMLElement, visible: number | string, total: number | string) {
  if (!container) return;
  const visibleEl = container.querySelector('[data-visible-count]');
  const totalEl = container.querySelector('[data-total-count]');
  if (visibleEl) visibleEl.textContent = String(visible ?? '--');
  if (totalEl) totalEl.textContent = String(total ?? '--');
}

export function updateCountdown(container: HTMLElement | null | undefined, seconds: number | string) {
  const el = container?.querySelector('[data-countdown]');
  if (el) el.textContent = String(seconds);
}

export function setAutoRefreshState(container: HTMLElement, active: boolean) {
  if (!container) return;
  const toggle = container.querySelector('[data-action="toggle-auto-refresh"]');
  const countdown = container.querySelector('[data-countdown]');
  if (toggle) toggle.classList.toggle('active', active);
  if (countdown) countdown.classList.toggle('active', active);
}

export function updateRefreshBtn(container: HTMLElement | null | undefined, loading: boolean) {
  const btn = container?.querySelector('[data-action="refresh"]');
  if (!btn) return;
  if (loading) {
    btn.classList.add('p01-action-btn--loading');
    btn.setAttribute('disabled', 'true');
  } else {
    btn.classList.remove('p01-action-btn--loading');
    btn.removeAttribute('disabled');
  }
}

export function updateBulkActions(container: HTMLElement | null | undefined, count: number) {
  const bulk = container?.querySelector('[data-bulk-actions]');
  const countEl = bulk?.querySelector('[data-selected-count]');
  if (bulk) (bulk as HTMLElement).hidden = count === 0;
  if (countEl) countEl.textContent = String(count);
}

export function populateFilterOptions(container: HTMLElement, options: { situacoes?: Array<{id: string | number; nome: string; qtd: number}>; centros?: Array<{id: string | number; nome: string; qtd: number}> }) {
  if (!container || !options) return;

  const situacaoSelect = container.querySelector('[data-filter="situacao"]') as HTMLSelectElement | null;
  if (situacaoSelect && options.situacoes) {
    const current = situacaoSelect.value;
    situacaoSelect.innerHTML = `<option value="">Situação</option>${options.situacoes.map((s: {id: string | number; nome: string; qtd: number}) => `<option value="${s.id}">${s.nome} (${s.qtd})</option>`).join('')}`;
    situacaoSelect.value = current;
  }

  const centroSelect = container.querySelector('[data-filter="centro"]') as HTMLSelectElement | null;
  if (centroSelect && options.centros) {
    const current = centroSelect.value;
    centroSelect.innerHTML = `<option value="">Centro Custo</option>${options.centros.map((c: {id: string | number; nome: string; qtd: number}) => `<option value="${c.id}">${c.nome} (${c.qtd})</option>`).join('')}`;
    centroSelect.value = current;
  }
}

export default {
  renderStructure, updateStatusBadges, updateTimestamp, updateFooterStats,
  updateFilterCount, updateCountdown, setAutoRefreshState, updateRefreshBtn,
  updateBulkActions, populateFilterOptions
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
