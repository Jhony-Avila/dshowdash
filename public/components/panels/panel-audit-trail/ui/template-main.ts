// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-audit-trail-ui-template-main
// PURPOSE: Panel Audit Trail - Template Main
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CSS_PREFIX, TABS, TIME_PRESETS from ./template-constants.js
//
// PROVIDES:
//   buildTemplate() — exported function
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

import { CSS_PREFIX, TABS, TIME_PRESETS } from './template-constants.js';

export function buildTemplate() {
  return `
    <div class="${CSS_PREFIX}-container" data-panel="audit-trail" role="region" aria-label="Auditoria e Logs">
      <header class="${CSS_PREFIX}-header">
        <div class="${CSS_PREFIX}-identity">
          <div class="${CSS_PREFIX}-identity-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg></div>
          <h2 class="${CSS_PREFIX}-title">Auditoria e Logs</h2>
        </div>
        <div class="${CSS_PREFIX}-health-summary" data-health-summary>
          <span class="${CSS_PREFIX}-health-item ${CSS_PREFIX}-health-item--error" data-health="error" data-tooltip="Eventos críticos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg><span class="${CSS_PREFIX}-health-count" data-count="error">0</span><span>Erros</span></span>
          <span class="${CSS_PREFIX}-health-item ${CSS_PREFIX}-health-item--warning" data-health="warning" data-tooltip="Alertas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span class="${CSS_PREFIX}-health-count" data-count="warning">0</span><span>Alertas</span></span>
          <span class="${CSS_PREFIX}-health-item ${CSS_PREFIX}-health-item--info" data-health="info" data-tooltip="Informações"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><span class="${CSS_PREFIX}-health-count" data-count="info">0</span><span>Info</span></span>
          <span class="${CSS_PREFIX}-health-item ${CSS_PREFIX}-health-item--security" data-health="security" data-tooltip="Segurança"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span class="${CSS_PREFIX}-health-count" data-count="security">0</span><span>Segurança</span></span>
        </div>
        <div class="${CSS_PREFIX}-actions">
          <div class="${CSS_PREFIX}-auto-refresh" data-tooltip="Auto-refresh (a)"><button class="${CSS_PREFIX}-auto-toggle active" data-action="toggle-auto-refresh" type="button" aria-label="Toggle auto-refresh"></button><span class="${CSS_PREFIX}-countdown active" data-countdown>30</span></div>
          <div class="${CSS_PREFIX}-actions-cluster">
            <button class="${CSS_PREFIX}-action-btn ${CSS_PREFIX}-action-btn--refresh" data-action="refresh" data-tooltip="Atualizar (r)" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button>
            <div class="${CSS_PREFIX}-export-dropdown">
              <button class="${CSS_PREFIX}-action-btn ${CSS_PREFIX}-action-btn--export" data-action="toggle-export-menu" data-tooltip="Exportar (e)" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
              <div class="${CSS_PREFIX}-export-menu" data-export-menu>
                <div class="${CSS_PREFIX}-export-menu-header">Exportar Como</div>
                <div class="${CSS_PREFIX}-export-item ${CSS_PREFIX}-export-item--csv" data-action="export-csv"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg><div><div class="${CSS_PREFIX}-export-item-label">CSV</div><div class="${CSS_PREFIX}-export-item-desc">Planilha separada por vírgulas</div></div></div>
                <div class="${CSS_PREFIX}-export-item ${CSS_PREFIX}-export-item--json" data-action="export-json"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h.01"/><path d="M12 13h.01"/><path d="M16 13h.01"/></svg><div><div class="${CSS_PREFIX}-export-item-label">JSON</div><div class="${CSS_PREFIX}-export-item-desc">Formato estruturado</div></div></div>
                <div class="${CSS_PREFIX}-export-separator"></div>
                <div class="${CSS_PREFIX}-export-item" data-action="export-clipboard"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg><div><div class="${CSS_PREFIX}-export-item-label">Copiar</div><div class="${CSS_PREFIX}-export-item-desc">Copiar para área de transferência</div></div></div>
              </div>
            </div>
            <button class="${CSS_PREFIX}-action-btn ${CSS_PREFIX}-action-btn--print" data-action="print" data-tooltip="Imprimir (p)" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></button>
            <button class="${CSS_PREFIX}-fullscreen-btn" data-action="fullscreen" data-tooltip="Tela cheia (f)" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg></button>
          </div>
          <span class="${CSS_PREFIX}-timestamp" data-last-update data-tooltip="Última atualização"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>--:--:--</span></span>
        </div>
      </header>
      <div class="${CSS_PREFIX}-bulk-actions" data-bulk-actions><span class="${CSS_PREFIX}-bulk-count"><span data-selected-count>0</span> selecionados</span><span class="${CSS_PREFIX}-bulk-separator"></span><button class="${CSS_PREFIX}-bulk-btn" data-action="bulk-export" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Exportar</button><button class="${CSS_PREFIX}-bulk-btn" data-action="bulk-copy" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copiar</button><button class="${CSS_PREFIX}-bulk-clear" data-action="bulk-clear" type="button">Limpar seleção</button></div>
      <div class="${CSS_PREFIX}-filters" data-filters>
        <div class="${CSS_PREFIX}-tabs"><button class="${CSS_PREFIX}-tab ${CSS_PREFIX}-tab-active" data-tab="${TABS.AUDIT}" type="button">Audit Trail</button><button class="${CSS_PREFIX}-tab" data-tab="${TABS.PERMISSIONS}" type="button">Permissões</button><button class="${CSS_PREFIX}-tab" data-tab="${TABS.FRONTEND}" type="button">Frontend</button><button class="${CSS_PREFIX}-tab" data-tab="${TABS.SECURITY}" type="button">Segurança</button></div>
        <div class="${CSS_PREFIX}-time-presets">${Object.entries(TIME_PRESETS).map(([key, preset]) => `<button class="${CSS_PREFIX}-preset-btn${key === 'LAST_30_DAYS' ? ` ${CSS_PREFIX}-preset-active` : ''}" data-preset="${key}" type="button">${preset.label}</button>`).join('')}</div>
        <div class="${CSS_PREFIX}-search"><svg class="${CSS_PREFIX}-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" class="${CSS_PREFIX}-search-input" data-filter="search" placeholder="Buscar..." autocomplete="off"><span class="${CSS_PREFIX}-search-shortcut">/</span></div>
        <button class="${CSS_PREFIX}-filter-clear" data-action="clear-filters" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>Limpar</button>
        <div class="${CSS_PREFIX}-filter-spacer"></div>
        <div class="${CSS_PREFIX}-grid-controls">
          <select class="${CSS_PREFIX}-group-select" data-action="group-by" data-tooltip="Agrupar"><option value="">Sem grupo</option><option value="action_type">Por Ação</option><option value="module">Por Módulo</option><option value="severity">Por Severidade</option><option value="username">Por Usuário</option></select>
          <div class="${CSS_PREFIX}-density-cluster" data-tooltip="Densidade (1/2/3)"><button class="${CSS_PREFIX}-density-btn" data-density="compact" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button><button class="${CSS_PREFIX}-density-btn active" data-density="normal" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="5" x2="21" y2="5"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="19" x2="21" y2="19"/></svg></button><button class="${CSS_PREFIX}-density-btn" data-density="comfortable" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="4" x2="21" y2="4"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="20" x2="21" y2="20"/></svg></button></div>
          <div class="${CSS_PREFIX}-columns-dropdown"><button class="${CSS_PREFIX}-columns-btn" data-action="toggle-columns" type="button" data-tooltip="Colunas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></button><div class="${CSS_PREFIX}-columns-menu" data-columns-menu><div class="${CSS_PREFIX}-columns-menu-header">Colunas Visíveis</div></div></div>
          <button class="${CSS_PREFIX}-inline-toggle" data-action="toggle-inline-filters" data-tooltip="Filtros inline (i)" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg></button>
        </div>
        <span class="${CSS_PREFIX}-filter-counter" data-filter-count><strong data-pagination-info>0 - 0</strong> de <strong data-total-count>0</strong></span>
      </div>
      <div class="${CSS_PREFIX}-content"><div class="${CSS_PREFIX}-table-wrapper"><table class="${CSS_PREFIX}-table" data-density="normal"><thead data-table-head></thead><tbody data-table-body></tbody></table></div><div class="${CSS_PREFIX}-loading" data-loading style="display:none;"><div class="${CSS_PREFIX}-loading-spinner"></div><span>Carregando...</span></div><div class="${CSS_PREFIX}-error" data-error style="display:none;"></div></div>
      <footer class="${CSS_PREFIX}-footer"><div class="${CSS_PREFIX}-footer-left"><span class="${CSS_PREFIX}-footer-stat" data-stat="total"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>Total: <strong data-total-count-footer>0</strong></span><span class="${CSS_PREFIX}-footer-stat" data-stat="filtered"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>Filtrados: <strong data-filtered-count>0</strong></span></div><div class="${CSS_PREFIX}-pagination"><span class="${CSS_PREFIX}-pagination-info" data-pagination-text>0 - 0 de 0</span><div class="${CSS_PREFIX}-page-btns"><button class="${CSS_PREFIX}-btn-sm" data-action="prev" disabled type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button><button class="${CSS_PREFIX}-btn-sm" data-action="next" disabled type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button></div></div><div class="${CSS_PREFIX}-footer-info"><span data-auto-refresh-status>Auto-refresh: 30s</span></div></footer>
      <div class="${CSS_PREFIX}-toast-container" data-toast-container></div>
      <div class="${CSS_PREFIX}-tooltip" data-tooltip-container></div>
    </div>`;
}

export default { buildTemplate };

export const MODULE_ID = 'panels-panel-audit-trail-ui-template-main';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { templateMainReady: true } }; }
