// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-12.core.header-template
// PURPOSE: Panel-12 Header Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderHeader() — exported function
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
export const MODULE_ID = 'panel-12.core.header-template';

export function renderHeader(panelId: string) {
  return `
    <div class="painel-12-header">
      <div class="painel-12-header-row-1">
        <div class="painel-12-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Gerenciamento de Jobs</span>
        </div>
        <div class="painel-12-header-actions">
          <div class="painel-12-search-container">
            <svg class="painel-12-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" id="search-input-${panelId}" class="painel-12-search-input" placeholder="Buscar jobs... (atalho: /)" aria-label="Buscar jobs por nome ou tipo" maxlength="200"/>
            <button class="painel-12-search-clear" id="search-clear-${panelId}" aria-label="Limpar busca">×</button>
            <div class="painel-12-search-results" id="search-results-${panelId}" role="status" aria-live="polite"></div>
          </div>
          <button id="btn-density-${panelId}" class="painel-12-btn-density" aria-label="Alternar densidade da tabela" title="Densidade">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <button id="btn-columns-${panelId}" class="painel-12-btn-columns" title="Selecionar colunas" aria-label="Selecionar colunas visíveis">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <span>Colunas</span>
          </button>
          <button id="btn-add-job-${panelId}" class="painel-12-btn-add" aria-label="Adicionar novo job">+ Adicionar Job</button>
        </div>
      </div>
      <div class="painel-12-header-row-2">
        <div class="painel-12-filter-group">
          <button class="painel-12-filter-btn active" data-filter-type="status" data-filter-value="" aria-pressed="true">
            <span class="painel-12-filter-btn-text">Todos</span>
            <span class="painel-12-filter-btn-count" data-count-type="all">0</span>
          </button>
          <button class="painel-12-filter-btn" data-filter-type="status" data-filter-value="1" aria-pressed="false">
            <span class="painel-12-filter-btn-text">Ativos</span>
            <span class="painel-12-filter-btn-count" data-count-type="active">0</span>
          </button>
          <button class="painel-12-filter-btn" data-filter-type="status" data-filter-value="0" aria-pressed="false">
            <span class="painel-12-filter-btn-text">Inativos</span>
            <span class="painel-12-filter-btn-count" data-count-type="inactive">0</span>
          </button>
        </div>
        <div class="painel-12-filter-separator"></div>
        <div class="painel-12-filter-group">
          <button class="painel-12-filter-btn active" data-filter-type="type" data-filter-value="" aria-pressed="true">
            <span class="painel-12-filter-btn-text">Todos</span>
            <span class="painel-12-filter-btn-count" data-count-type="all-types">0</span>
          </button>
          <button class="painel-12-filter-btn" data-filter-type="type" data-filter-value="PHP" aria-pressed="false">
            <span class="painel-12-filter-btn-text">PHP</span>
            <span class="painel-12-filter-btn-count" data-count-type="php">0</span>
          </button>
          <button class="painel-12-filter-btn" data-filter-type="type" data-filter-value="Python" aria-pressed="false">
            <span class="painel-12-filter-btn-text">Python</span>
            <span class="painel-12-filter-btn-count" data-count-type="python">0</span>
          </button>
          <button class="painel-12-filter-btn" data-filter-type="type" data-filter-value="Shell" aria-pressed="false">
            <span class="painel-12-filter-btn-text">Shell</span>
            <span class="painel-12-filter-btn-count" data-count-type="shell">0</span>
          </button>
          <button class="painel-12-filter-btn" data-filter-type="type" data-filter-value="API" aria-pressed="false">
            <span class="painel-12-filter-btn-text">API</span>
            <span class="painel-12-filter-btn-count" data-count-type="api">0</span>
          </button>
        </div>
      </div>
    </div>
    <div class="painel-12-content">
      <div id="jobs-content-${panelId}"></div>
    </div>
  `;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
