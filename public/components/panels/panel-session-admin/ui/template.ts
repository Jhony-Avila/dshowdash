

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-session-admin-ui-template
// PURPOSE: Panel Session Admin - UI Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   renderMain() — exported function
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

export const MODULE_ID = 'panel-session-admin-ui-template';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const ICONS = {
  refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
  terminate: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  expand: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
  collapse: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>',
  details: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
  export: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  columns: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
  filter: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  fullscreen: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>',
  current: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  print: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>'
};

const STATUS_LABELS = {
  active: 'Ativa',
  idle: 'Inativa',
  expired: 'Expirada'
};

const STATUS_CLASSES = {
  active: 'psa__status--active',
  idle: 'psa__status--idle',
  expired: 'psa__status--expired'
};

// ══════════════════════════════════════════════════════════════
// MAIN TEMPLATE
// ══════════════════════════════════════════════════════════════

export function renderMain(state: Record<string, unknown>, config: Record<string, unknown> = {}) {
  const sessions = (state.sessions || []) as Record<string, unknown>[];
  const isLoading = state.isLoading;
  const error = state.error as string | null | undefined;
  const currentSessionToken = state.currentSessionToken;
  const filters = (state.filters || {}) as Record<string, string>;
  const columns = (state.columns || {}) as Record<string, unknown>;
  const autoRefresh = state.autoRefresh;
  const expandedRows = (state.expandedRows || new Set()) as Set<unknown>;
  const selectedRows = (state.selectedRows || new Set()) as Set<unknown>;
  const isFullscreen = state.isFullscreen;
  const i18n = (config.i18n || {}) as Record<string, string>;

  if (error) return renderError(error, i18n);
  if (isLoading && sessions.length === 0) return renderLoading(i18n);

  return `
    <div class="psa ${isFullscreen ? 'psa--fullscreen' : ''}" data-panel="session-admin">
      ${renderHeader(state, i18n)}
      ${renderToolbar(state, i18n)}
      ${renderSelectionBar(selectedRows.size, i18n)}
      ${renderTable(sessions, { currentSessionToken, columns, expandedRows, selectedRows, i18n })}
      ${renderFooter(sessions.length, i18n)}
      <div class="psa__live-region" role="status" aria-live="polite"></div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════════════

function renderHeader(state: Record<string, unknown>, i18n: Record<string, string>) {
  const { autoRefresh } = state;
  return `
    <header class="psa__header">
      <div class="psa__title">
        <h2>${i18n.title || 'Gerenciador de Sessões'}</h2>
        <span class="psa__subtitle">${i18n.subtitle || 'Monitoramento de sessões ativas'}</span>
      </div>
      <div class="psa__actions">
        <button class="psa__btn psa__btn--icon ${autoRefresh ? 'psa__btn--active' : ''}" data-action="toggle-auto-refresh" title="${autoRefresh ? 'Desativar' : 'Ativar'} auto-refresh">
          ${ICONS.refresh}
        </button>
        <button class="psa__btn psa__btn--icon" data-action="refresh" title="${i18n.refresh || 'Atualizar'}">
          ${ICONS.refresh}
        </button>
        <button class="psa__btn psa__btn--danger" data-action="terminate-others" title="${i18n.terminateOthers || 'Encerrar outras sessões'}">
          ${ICONS.terminate} ${i18n.terminateOthers || 'Encerrar Outras'}
        </button>
      </div>
    </header>
  `;
}

// ══════════════════════════════════════════════════════════════
// TOOLBAR
// ══════════════════════════════════════════════════════════════

function renderToolbar(state: Record<string, unknown>, i18n: Record<string, string>) {
  const filters = (state.filters || {}) as Record<string, string>;
  const showInlineFilters = state.showInlineFilters;
  return `
    <div class="psa__toolbar">
      <div class="psa__search">
        <input type="text" class="psa__input" placeholder="${i18n.searchPlaceholder || 'Buscar por usuário, IP...'}" value="${filters.search || ''}" data-filter="search">
      </div>
      <div class="psa__filters">
        <select class="psa__select" data-filter="status">
          <option value="">${i18n.allStatus || 'Todos os status'}</option>
          <option value="active" ${filters.status === 'active' ? 'selected' : ''}>${STATUS_LABELS.active}</option>
          <option value="idle" ${filters.status === 'idle' ? 'selected' : ''}>${STATUS_LABELS.idle}</option>
          <option value="expired" ${filters.status === 'expired' ? 'selected' : ''}>${STATUS_LABELS.expired}</option>
        </select>
        <button class="psa__btn psa__btn--icon ${showInlineFilters ? 'psa__btn--active' : ''}" data-action="toggle-inline-filters" title="${i18n.inlineFilters || 'Filtros inline'}">
          ${ICONS.filter}
        </button>
      </div>
      <div class="psa__toolbar-actions">
        ${renderExportDropdown(i18n)}
        ${renderColumnsDropdown(state, i18n)}
        <button class="psa__btn psa__btn--icon" data-action="toggle-fullscreen" title="${i18n.fullscreen || 'Tela cheia'}">
          ${ICONS.fullscreen}
        </button>
      </div>
    </div>
  `;
}

function renderExportDropdown(i18n: Record<string, string>) {
  return `
    <div class="psa__dropdown" data-dropdown="export">
      <button class="psa__btn psa__btn--icon" data-action="toggle-export-menu" title="${i18n.export || 'Exportar'}">
        ${ICONS.export}
      </button>
      <div class="psa__export-menu" data-export-menu role="menu">
        <button class="psa__export-menu-item" data-action="export-csv" role="menuitem">${ICONS.export} ${i18n.exportCsv || 'Exportar CSV'}</button>
        <button class="psa__export-menu-item" data-action="export-json" role="menuitem">${ICONS.export} ${i18n.exportJson || 'Exportar JSON'}</button>
        <button class="psa__export-menu-item" data-action="copy-clipboard" role="menuitem">${ICONS.copy} ${i18n.copyClipboard || 'Copiar para área de transferência'}</button>
        <div class="psa__export-menu-divider"></div>
        <button class="psa__export-menu-item" data-action="print" role="menuitem">${ICONS.print} ${i18n.print || 'Imprimir'}</button>
      </div>
    </div>
  `;
}

function renderColumnsDropdown(state: Record<string, unknown>, i18n: Record<string, string>) {
  const columns = (state.columns || {}) as Record<string, unknown>;
  const allCols = ['user', 'ip', 'device', 'browser', 'location', 'started', 'lastActivity', 'status'];
  let items = '';
  for (const col of allCols) {
    const checked = columns[col] !== false ? 'checked' : '';
    items += `<label class="psa__dropdown-item"><input type="checkbox" data-action="toggle-column" data-column="${col}" ${checked}> ${i18n[col] || col}</label>`;
  }
  return `
    <div class="psa__dropdown" data-dropdown="columns">
      <button class="psa__btn psa__btn--icon" data-action="toggle-columns-menu" title="${i18n.columns || 'Colunas'}">
        ${ICONS.columns}
      </button>
      <div class="psa__dropdown-menu psa__columns-menu" data-columns-menu>
        ${items}
        <hr class="psa__dropdown-divider">
        <button class="psa__dropdown-item" data-action="show-all-columns">${i18n.showAll || 'Mostrar todas'}</button>
        <button class="psa__dropdown-item" data-action="reset-columns">${i18n.resetColumns || 'Resetar'}</button>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
// SELECTION BAR
// ══════════════════════════════════════════════════════════════

function renderSelectionBar(count: number, i18n: Record<string, string>) {
  if (count === 0) return '';
  return `
    <div class="psa__selection-bar">
      <span>${count} ${i18n.selected || 'selecionada(s)'}</span>
      <button class="psa__btn psa__btn--sm" data-action="deselect-all">${i18n.deselectAll || 'Limpar seleção'}</button>
      <button class="psa__btn psa__btn--sm psa__btn--danger" data-action="terminate-selected">${i18n.terminateSelected || 'Encerrar selecionadas'}</button>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
// TABLE
// ══════════════════════════════════════════════════════════════

function renderTable(sessions: Record<string, unknown>[], options: Record<string, unknown>) {
  const currentSessionToken = options.currentSessionToken;
  const columns = (options.columns || {}) as Record<string, unknown>;
  const expandedRows = (options.expandedRows || new Set()) as Set<unknown>;
  const selectedRows = (options.selectedRows || new Set()) as Set<unknown>;
  const i18n = (options.i18n || {}) as Record<string, string>;
  if (sessions.length === 0) return renderEmpty(i18n);

  let rows = '';
  let _dataIdx = 0;
  for (const session of sessions) {
    const isCurrent = session.session_token === currentSessionToken;
    const isExpanded = expandedRows.has(session.session_token);
    const isSelected = selectedRows.has(session.session_token);
    const even = _dataIdx % 2 === 1;
    rows += renderRow(session, { isCurrent, isExpanded, isSelected, columns, i18n, even });
    if (isExpanded) rows += renderExpandedRow(session, columns, i18n);
    _dataIdx++;
  }

  return `
    <div class="psa__table-wrapper">
      <table class="psa__table">
        <thead>
          <tr>
            <th class="psa__th psa__th--checkbox"><input type="checkbox" data-action="select-all"></th>
            <th class="psa__th psa__th--expand"></th>
            ${columns.user !== false ? `<th class="psa__th">${i18n.user || 'Usuário'}</th>` : ''}
            ${columns.ip !== false ? `<th class="psa__th">${i18n.ip || 'IP'}</th>` : ''}
            ${columns.device !== false ? `<th class="psa__th">${i18n.device || 'Dispositivo'}</th>` : ''}
            ${columns.browser !== false ? `<th class="psa__th">${i18n.browser || 'Navegador'}</th>` : ''}
            ${columns.location !== false ? `<th class="psa__th">${i18n.location || 'Localização'}</th>` : ''}
            ${columns.started !== false ? `<th class="psa__th">${i18n.started || 'Início'}</th>` : ''}
            ${columns.lastActivity !== false ? `<th class="psa__th">${i18n.lastActivity || 'Última Atividade'}</th>` : ''}
            ${columns.status !== false ? `<th class="psa__th">${i18n.status || 'Status'}</th>` : ''}
            <th class="psa__th psa__th--actions">${i18n.actions || 'Ações'}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderRow(session: Record<string, unknown>, options: Record<string, unknown>) {
  const isCurrent = options.isCurrent;
  const isExpanded = options.isExpanded;
  const isSelected = options.isSelected;
  const columns = (options.columns || {}) as Record<string, unknown>;
  const i18n = (options.i18n || {}) as Record<string, string>;
  const statusKey = session.status as string;
  const statusClass = (STATUS_CLASSES as Record<string, string>)[statusKey] || '';
  const statusLabel = (STATUS_LABELS as Record<string, string>)[statusKey] || session.status;

  return `
    <tr class="psa__row ${options.even ? 'psa__row--even' : ''} ${isCurrent ? 'psa__row--current' : ''} ${isSelected ? 'psa__row--selected' : ''}" data-session-token="${session.session_token}">
      <td class="psa__td psa__td--checkbox"><input type="checkbox" data-action="select-row" data-session-token="${session.session_token}" ${isSelected ? 'checked' : ''} ${isCurrent ? 'disabled' : ''}></td>
      <td class="psa__td psa__td--expand"><button class="psa__btn psa__btn--icon psa__btn--sm" data-action="toggle-expand" data-session-token="${session.session_token}">${isExpanded ? ICONS.collapse : ICONS.expand}</button></td>
      ${columns.user !== false ? `<td class="psa__td">${session.user_name || '-'}${isCurrent ? ` <span class="psa__badge psa__badge--current">${ICONS.current} ${i18n.currentSession || 'Atual'}</span>` : ''}</td>` : ''}
      ${columns.ip !== false ? `<td class="psa__td"><code>${session.ip_address || '-'}</code></td>` : ''}
      ${columns.device !== false ? `<td class="psa__td">${session.device || '-'}</td>` : ''}
      ${columns.browser !== false ? `<td class="psa__td">${session.browser || '-'}</td>` : ''}
      ${columns.location !== false ? `<td class="psa__td">${session.location || '-'}</td>` : ''}
      ${columns.started !== false ? `<td class="psa__td">${formatDate(String(session.created_at || ''))}</td>` : ''}
      ${columns.lastActivity !== false ? `<td class="psa__td">${formatDate(String(session.last_activity || ''))}</td>` : ''}
      ${columns.status !== false ? `<td class="psa__td"><span class="psa__status ${statusClass}">${statusLabel}</span></td>` : ''}
      <td class="psa__td psa__td--actions">
        <button class="psa__btn psa__btn--icon psa__btn--sm" data-action="show-details" data-session-token="${session.session_token}" title="${i18n.details || 'Detalhes'}">${ICONS.details}</button>
        <button class="psa__btn psa__btn--icon psa__btn--sm" data-action="copy-session" data-session-token="${session.session_token}" title="${i18n.copyToken || 'Copiar token'}">${ICONS.copy}</button>
      </td>
    </tr>
  `;
}

function renderExpandedRow(session: Record<string, unknown>, columns: Record<string, unknown>, i18n: Record<string, string>) {
  const colCount = Object.values(columns).filter(v => v !== false).length + 3;
  return `
    <tr class="psa__row psa__row--expanded">
      <td colspan="${colCount}" class="psa__td psa__td--expanded">
        <div class="psa__expanded-content">
          <div class="psa__detail"><strong>${i18n.userAgent || 'User Agent'}:</strong> ${session.user_agent || '-'}</div>
          <div class="psa__detail"><strong>${i18n.sessionToken || 'Token'}:</strong> <code>${session.session_token}</code></div>
          <div class="psa__detail"><strong>${i18n.createdAt || 'Criado em'}:</strong> ${formatDateTime(String(session.created_at || ''))}</div>
          <div class="psa__detail"><strong>${i18n.expiresAt || 'Expira em'}:</strong> ${formatDateTime(String(session.expires_at || ''))}</div>
        </div>
      </td>
    </tr>
  `;
}

// ══════════════════════════════════════════════════════════════
// STATES
// ══════════════════════════════════════════════════════════════

function renderLoading(i18n: Record<string, string>) {
  return `<div class="psa__loading"><div class="psa__spinner"></div><span>${i18n?.loading || 'Carregando sessões...'}</span></div>`;
}

function renderError(error: string, i18n: Record<string, string>) {
  return `<div class="psa__error"><span class="psa__error-icon">⚠️</span><p>${error}</p><button class="psa__btn" data-action="refresh">${i18n?.retry || 'Tentar novamente'}</button></div>`;
}

function renderEmpty(i18n: Record<string, string>) {
  return `<div class="psa__empty"><p>${i18n?.noSessions || 'Nenhuma sessão encontrada'}</p></div>`;
}

function renderFooter(count: number, i18n: Record<string, string>) {
  return `<footer class="psa__footer"><span>${count} ${i18n?.sessionsCount || 'sessão(ões)'}</span></footer>`;
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR');
}

// ══════════════════════════════════════════════════════════════
// INFO / HEALTH
// ══════════════════════════════════════════════════════════════

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

const _ALL_COLUMNS = ['user', 'ip', 'device', 'browser', 'location', 'started', 'lastActivity', 'status'];
// Adapter (2026-07-08): mapeia o modelo canônico do Store para a forma que renderMain consome e
// injeta no container. Corrige o contrato quebrado (lifecycle chamava Template.render inexistente).
export function render(container: HTMLElement | null, state: Record<string, unknown>, config: Record<string, unknown> = {}): void {
  if (!container) return;
  const s = (state || {}) as Record<string, any>;
  const hidden: string[] = Array.isArray(s.hiddenColumns) ? s.hiddenColumns : [];
  const columns: Record<string, boolean> = {};
  for (const c of _ALL_COLUMNS) columns[c] = !hidden.includes(c);
  const sessionList = Array.isArray(s.filteredSessions) ? s.filteredSessions : s.sessions || [];
  const currentTok = s.currentSessionToken || (sessionList.find((x: any) => x && x.is_current) || {}).session_token || null;
  const mapped = {
    sessions: sessionList,
    isLoading: !!s.loading,
    error: s.error || null,
    filters: s.filter || {},
    columns,
    expandedRows: new Set(s.expandedIds || []),
    selectedRows: new Set(s.selectedIds || []),
    currentSessionToken: currentTok,
    autoRefresh: !!s.autoRefresh,
    isFullscreen: !!s.isFullscreen,
    showInlineFilters: !!s.showInlineFilters
  };
  container.innerHTML = renderMain(mapped, config);
}

export default {
  MODULE_ID,
  VERSION,
  render,
  renderMain,
  info,
  healthCheck
};
