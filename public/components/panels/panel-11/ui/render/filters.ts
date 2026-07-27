// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-ui-render-filters
// PURPOSE: Panel-11 Render Filters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ../../core/constants.js
//
// PROVIDES:
//   renderFilters() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

import { ICONS } from '../../core/constants.js';

const PERIODS = [
  { value: '7d', label: '7 dias' },
  { value: '15d', label: '15 dias' },
  { value: '30d', label: '30 dias' },
  { value: '60d', label: '60 dias' }
];

export function renderFilters(filters: Record<string, unknown>) {
  return `
    <div class="p11-filters">
      <span class="p11-filters-label">Filtros:</span>
      
      <div class="p11-period-selector">
        ${PERIODS.map(p => `
          <button class="p11-period-btn ${filters.period === p.value ? 'active' : ''}" 
                  data-period="${p.value}" type="button">
            ${p.label}
          </button>
        `).join('')}
      </div>
      
      <div class="p11-filter-chips">
        <button class="p11-filter-chip ${!filters.status ? 'active' : ''}" data-filter="status" data-value="" type="button">
          ${ICONS.activity} Todos
        </button>
        <button class="p11-filter-chip ${filters.status === 'success' ? 'active' : ''}" data-filter="status" data-value="success" type="button">
          ${ICONS.check} Sucesso
        </button>
        <button class="p11-filter-chip ${filters.status === 'error' ? 'active' : ''}" data-filter="status" data-value="error" type="button">
          ${ICONS.x} Erros
        </button>
      </div>
      
      <div class="p11-search">
        <span class="p11-search-icon">${ICONS.search || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`}</span>
        <input type="text" class="p11-search-input" placeholder="Buscar job..." data-search aria-label="Buscar job">
      </div>
    </div>
  `;
}

export default { renderFilters };

export const MODULE_ID = 'panels-ui-render-filters';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { filtersReady: true } }; }
