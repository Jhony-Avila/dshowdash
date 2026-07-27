const MODULE_ID = "panel-session-admin-ui-template";
const VERSION = "9.3.0-P2-ENTERPRISE";
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
  active: "Ativa",
  idle: "Inativa",
  expired: "Expirada"
};
const STATUS_CLASSES = {
  active: "psa__status--active",
  idle: "psa__status--idle",
  expired: "psa__status--expired"
};
function renderMain(state, config = {}) {
  const sessions = state.sessions || [];
  const isLoading = state.isLoading;
  const error = state.error;
  const currentSessionToken = state.currentSessionToken;
  const filters = state.filters || {};
  const columns = state.columns || {};
  const autoRefresh = state.autoRefresh;
  const expandedRows = state.expandedRows || /* @__PURE__ */ new Set();
  const selectedRows = state.selectedRows || /* @__PURE__ */ new Set();
  const isFullscreen = state.isFullscreen;
  const sort = Array.isArray(state.sort) ? state.sort : [];
  const showInlineFilters = state.showInlineFilters;
  const inlineFilters = state.inlineFilters || {};
  const i18n = config.i18n || {};
  if (error) return renderError(error, i18n);
  if (isLoading && sessions.length === 0) return renderLoading(i18n);
  return `
    <div class="psa ${isFullscreen ? "psa--fullscreen" : ""}" data-panel="session-admin">
      ${renderHeader(state, i18n)}
      ${renderToolbar(state, i18n)}
      ${renderSelectionBar(selectedRows.size, i18n)}
      ${renderTable(sessions, { currentSessionToken, columns, expandedRows, selectedRows, i18n, sort, showInlineFilters, inlineFilters, search: filters.search })}
      ${renderFooter(sessions.length, i18n)}
      <div class="psa__live-region" role="status" aria-live="polite"></div>
    </div>
  `;
}
function renderHeader(state, i18n) {
  const { autoRefresh } = state;
  return `
    <header class="psa__header">
      <div class="psa__title">
        <h2>${i18n.title || "Gerenciador de Sess\xF5es"}</h2>
        <span class="psa__subtitle">${i18n.subtitle || "Monitoramento de sess\xF5es ativas"}</span>
      </div>
      <div class="psa__actions">
        <button class="psa__btn psa__btn--icon ${autoRefresh ? "psa__btn--active" : ""}" data-action="toggle-auto-refresh" title="${autoRefresh ? "Desativar" : "Ativar"} auto-refresh">
          ${ICONS.refresh}
        </button>
        <button class="psa__btn psa__btn--icon" data-action="refresh" title="${i18n.refresh || "Atualizar"}">
          ${ICONS.refresh}
        </button>
        <button class="psa__btn psa__btn--danger" data-action="terminate-others" title="${i18n.terminateOthers || "Encerrar outras sess\xF5es"}">
          ${ICONS.terminate} ${i18n.terminateOthers || "Encerrar Outras"}
        </button>
      </div>
    </header>
  `;
}
function renderToolbar(state, i18n) {
  const filters = state.filters || {};
  const showInlineFilters = state.showInlineFilters;
  return `
    <div class="psa__toolbar">
      <div class="psa__search">
        <input type="text" class="psa__input" placeholder="${i18n.searchPlaceholder || "Buscar por usu\xE1rio, IP..."}" value="${filters.search || ""}" data-filter="search">
      </div>
      <div class="psa__filters">
        <select class="psa__select" data-filter="status">
          <option value="">${i18n.allStatus || "Todos os status"}</option>
          <option value="active" ${filters.status === "active" ? "selected" : ""}>${STATUS_LABELS.active}</option>
          <option value="idle" ${filters.status === "idle" ? "selected" : ""}>${STATUS_LABELS.idle}</option>
          <option value="expired" ${filters.status === "expired" ? "selected" : ""}>${STATUS_LABELS.expired}</option>
        </select>
        <button class="psa__btn psa__btn--icon ${showInlineFilters ? "psa__btn--active" : ""}" data-action="toggle-inline-filters" title="${i18n.inlineFilters || "Filtros inline"}">
          ${ICONS.filter}
        </button>
      </div>
      <div class="psa__toolbar-actions">
        ${renderExportDropdown(i18n)}
        ${renderColumnsDropdown(state, i18n)}
        <button class="psa__btn psa__btn--icon" data-action="toggle-fullscreen" title="${i18n.fullscreen || "Tela cheia"}">
          ${ICONS.fullscreen}
        </button>
      </div>
    </div>
  `;
}
function renderExportDropdown(i18n) {
  return `
    <div class="psa__dropdown" data-dropdown="export">
      <button class="psa__btn psa__btn--icon" data-action="toggle-export-menu" title="${i18n.export || "Exportar"}">
        ${ICONS.export}
      </button>
      <div class="psa__export-menu" data-export-menu role="menu">
        <button class="psa__export-menu-item" data-action="export-csv" role="menuitem">${ICONS.export} ${i18n.exportCsv || "Exportar CSV"}</button>
        <button class="psa__export-menu-item" data-action="export-json" role="menuitem">${ICONS.export} ${i18n.exportJson || "Exportar JSON"}</button>
        <button class="psa__export-menu-item" data-action="copy-clipboard" role="menuitem">${ICONS.copy} ${i18n.copyClipboard || "Copiar para \xE1rea de transfer\xEAncia"}</button>
        <div class="psa__export-menu-divider"></div>
        <button class="psa__export-menu-item" data-action="print" role="menuitem">${ICONS.print} ${i18n.print || "Imprimir"}</button>
      </div>
    </div>
  `;
}
function renderColumnsDropdown(state, i18n) {
  const columns = state.columns || {};
  const allCols = ["user", "ip", "device", "browser", "location", "started", "lastActivity", "status"];
  let items = "";
  for (const col of allCols) {
    const checked = columns[col] !== false ? "checked" : "";
    items += `<label class="psa__dropdown-item"><input type="checkbox" data-action="toggle-column" data-column="${col}" ${checked}> ${i18n[col] || col}</label>`;
  }
  return `
    <div class="psa__dropdown" data-dropdown="columns">
      <button class="psa__btn psa__btn--icon" data-action="toggle-columns-menu" title="${i18n.columns || "Colunas"}">
        ${ICONS.columns}
      </button>
      <div class="psa__dropdown-menu psa__columns-menu" data-columns-menu>
        ${items}
        <hr class="psa__dropdown-divider">
        <button class="psa__dropdown-item" data-action="show-all-columns">${i18n.showAll || "Mostrar todas"}</button>
        <button class="psa__dropdown-item" data-action="reset-columns">${i18n.resetColumns || "Resetar"}</button>
      </div>
    </div>
  `;
}
function renderSelectionBar(count, i18n) {
  if (count === 0) return "";
  return `
    <div class="psa__selection-bar">
      <span>${count} ${i18n.selected || "selecionada(s)"}</span>
      <button class="psa__btn psa__btn--sm" data-action="deselect-all">${i18n.deselectAll || "Limpar sele\xE7\xE3o"}</button>
      <button class="psa__btn psa__btn--sm psa__btn--danger" data-action="terminate-selected">${i18n.terminateSelected || "Encerrar selecionadas"}</button>
    </div>
  `;
}
function _sortIndicator(field, sort) {
  const i = (sort || []).findIndex((s) => s.field === field);
  if (i < 0) return '<span class="psa__sort-ind"></span>';
  const dir = sort[i].dir === "asc" ? "▲" : "▼";
  const pos = sort.length > 1 ? `<sup class="psa__sort-pos">${i + 1}</sup>` : "";
  return `<span class="psa__sort-ind psa__sort-ind--active">${dir}${pos}</span>`;
}
function _th(field, label, sort) {
  return `<th class="psa__th psa__th--sortable" data-sort="${field}" role="button" tabindex="0" aria-label="${label}" title="Ordenar (Shift+clique = m\xFAltiplas colunas)">${label} ${_sortIndicator(field, sort)}</th>`;
}
function renderFilterRow(sessions, columns, inlineFilters, i18n) {
  const f = inlineFilters || {};
  const distinct = (field) => [...new Set(sessions.map((s) => s[field]).filter((v) => v != null && v !== ""))].sort();
  const txt = (field, ph) => `<input type="text" class="psa__inline-input" data-inline-filter="${field}" value="${escapeHtml(f[field] || "")}" placeholder="${escapeHtml(ph)}" aria-label="${escapeHtml(ph)}">`;
  const sel = (field, opts) => `<select class="psa__inline-input" data-inline-filter="${field}" aria-label="${field}"><option value="">${i18n.all || "Todos"}</option>${opts.map((o) => `<option value="${escapeHtml(o.v)}" ${String(f[field] || "") === o.v ? "selected" : ""}>${escapeHtml(o.l)}</option>`).join("")}</select>`;
  const range = (field) => `<div class="psa__inline-range"><input type="datetime-local" class="psa__inline-input" data-inline-filter="${field}__from" value="${escapeHtml(f[field + "__from"] || "")}" title="De" aria-label="De"><input type="datetime-local" class="psa__inline-input" data-inline-filter="${field}__to" value="${escapeHtml(f[field + "__to"] || "")}" title="At\xE9" aria-label="At\xE9"></div>`;
  const cell = (vis, content, cls) => vis !== false ? `<th class="psa__th psa__th--filter ${cls || ""}">${content}</th>` : "";
  return `
    <tr class="psa__filter-row">
      <th class="psa__th psa__th--checkbox"></th>
      <th class="psa__th psa__th--expand"></th>
      ${cell(columns.user, txt("user_name", i18n.user || "Usu\xE1rio"), "psa__th--user")}
      ${cell(columns.ip, txt("ip_address", "IP"))}
      ${cell(columns.device, sel("device", distinct("device").map((v) => ({ v, l: v }))))}
      ${cell(columns.browser, sel("browser", distinct("browser").map((v) => ({ v, l: v }))))}
      ${cell(columns.location, txt("location", i18n.location || "Local"))}
      ${cell(columns.started, range("created_at"))}
      ${cell(columns.lastActivity, range("last_activity"))}
      ${cell(columns.status, sel("status", [{ v: "active", l: STATUS_LABELS.active }, { v: "idle", l: STATUS_LABELS.idle }, { v: "expired", l: STATUS_LABELS.expired }]))}
      <th class="psa__th psa__th--actions"></th>
    </tr>`;
}
function renderTable(sessions, options) {
  const currentSessionToken = options.currentSessionToken;
  const columns = options.columns || {};
  const expandedRows = options.expandedRows || /* @__PURE__ */ new Set();
  const selectedRows = options.selectedRows || /* @__PURE__ */ new Set();
  const i18n = options.i18n || {};
  const sort = options.sort || [];
  const showInlineFilters = options.showInlineFilters;
  const inlineFilters = options.inlineFilters || {};
  const search = options.search || "";
  if (sessions.length === 0) return renderEmpty(i18n);
  let rows = "";
  let _dataIdx = 0;
  for (const session of sessions) {
    const isCurrent = session.session_token === currentSessionToken;
    const isExpanded = expandedRows.has(session.session_token);
    const isSelected = selectedRows.has(session.session_token);
    const even = _dataIdx % 2 === 1;
    rows += renderRow(session, { isCurrent, isExpanded, isSelected, columns, i18n, even, search });
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
            ${columns.user !== false ? _th("user_name", i18n.user || "Usu\xE1rio", sort) : ""}
            ${columns.ip !== false ? _th("ip_address", i18n.ip || "IP", sort) : ""}
            ${columns.device !== false ? _th("device", i18n.device || "Dispositivo", sort) : ""}
            ${columns.browser !== false ? _th("browser", i18n.browser || "Navegador", sort) : ""}
            ${columns.location !== false ? _th("location", i18n.location || "Localiza\xE7\xE3o", sort) : ""}
            ${columns.started !== false ? _th("created_at", i18n.started || "In\xEDcio", sort) : ""}
            ${columns.lastActivity !== false ? _th("last_activity", i18n.lastActivity || "\xDAltima Atividade", sort) : ""}
            ${columns.status !== false ? _th("status", i18n.status || "Status", sort) : ""}
            <th class="psa__th psa__th--actions">${i18n.actions || "A\xE7\xF5es"}</th>
          </tr>
          ${showInlineFilters ? renderFilterRow(sessions, columns, inlineFilters, i18n) : ""}
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
function renderRow(session, options) {
  const isCurrent = options.isCurrent;
  const isExpanded = options.isExpanded;
  const isSelected = options.isSelected;
  const columns = options.columns || {};
  const i18n = options.i18n || {};
  const search = options.search || "";
  const statusKey = session.status;
  const statusClass = STATUS_CLASSES[statusKey] || "";
  const statusLabel = STATUS_LABELS[statusKey] || session.status;
  return `
    <tr class="psa__row ${options.even ? "psa__row--even" : ""} ${isCurrent ? "psa__row--current" : ""} ${isSelected ? "psa__row--selected" : ""}" data-session-token="${session.session_token}">
      <td class="psa__td psa__td--checkbox"><input type="checkbox" data-action="select-row" data-session-token="${session.session_token}" ${isSelected ? "checked" : ""} ${isCurrent ? "disabled" : ""}></td>
      <td class="psa__td psa__td--expand"><button class="psa__btn psa__btn--icon psa__btn--sm" data-action="toggle-expand" data-session-token="${session.session_token}">${isExpanded ? ICONS.collapse : ICONS.expand}</button></td>
      ${columns.user !== false ? `<td class="psa__td psa__td--user">${session.user_name ? highlight(session.user_name, search) : "-"}${isCurrent ? ` <span class="psa__badge psa__badge--current">${ICONS.current} ${i18n.currentSession || "Atual"}</span>` : ""}</td>` : ""}
      ${columns.ip !== false ? `<td class="psa__td"><code>${session.ip_address ? highlight(session.ip_address, search) : "-"}</code></td>` : ""}
      ${columns.device !== false ? `<td class="psa__td">${escapeHtml(session.device || "-")}</td>` : ""}
      ${columns.browser !== false ? `<td class="psa__td">${escapeHtml(session.browser || "-")}</td>` : ""}
      ${columns.location !== false ? `<td class="psa__td">${escapeHtml(session.location || "-")}</td>` : ""}
      ${columns.started !== false ? `<td class="psa__td">${formatDateTime(String(session.created_at || ""))}</td>` : ""}
      ${columns.lastActivity !== false ? `<td class="psa__td"><span title="${formatDateTime(String(session.last_activity || ""))}">${formatRelative(String(session.last_activity || ""))}</span></td>` : ""}
      ${columns.status !== false ? `<td class="psa__td"><span class="psa__status ${statusClass}">${escapeHtml(statusLabel)}</span></td>` : ""}
      <td class="psa__td psa__td--actions">
        <button class="psa__btn psa__btn--icon psa__btn--sm" data-action="show-details" data-session-token="${session.session_token}" title="${i18n.details || "Detalhes"}">${ICONS.details}</button>
        <button class="psa__btn psa__btn--icon psa__btn--sm" data-action="copy-session" data-session-token="${session.session_token}" title="${i18n.copyToken || "Copiar token"}">${ICONS.copy}</button>
        ${!isCurrent ? `<button class="psa__btn psa__btn--icon psa__btn--sm psa__btn--danger" data-action="terminate" data-session-token="${session.session_token}" title="${i18n.terminate || "Encerrar sess\xE3o"}">${ICONS.terminate}</button>` : ""}
      </td>
    </tr>
  `;
}
function renderExpandedRow(session, columns, i18n) {
  const colCount = Object.values(columns).filter((v) => v !== false).length + 3;
  const st = STATUS_LABELS[session.status] || session.status || "-";
  const item = (label, val, mono) => `<div class="psa__expanded-item"><span class="psa__expanded-label">${label}</span><span class="psa__expanded-value ${mono ? "psa__expanded-value--mono" : ""}">${val}</span></div>`;
  return `
    <tr class="psa__row psa__row--expanded">
      <td colspan="${colCount}" class="psa__td psa__td--expanded">
        <div class="psa__expanded-content">
          <div class="psa__expanded-grid">
            ${item(i18n.user || "Usu\xE1rio", escapeHtml(session.user_name || "-"))}
            ${session.user_email ? item("E-mail", escapeHtml(session.user_email)) : ""}
            ${item(i18n.ip || "IP", escapeHtml(session.ip_address || "-"), true)}
            ${item(i18n.device || "Dispositivo", escapeHtml(session.device || "-"))}
            ${item("SO", escapeHtml(session.os || "-"))}
            ${item(i18n.browser || "Navegador", escapeHtml(session.browser || "-"))}
            ${item(i18n.location || "Localiza\xE7\xE3o", escapeHtml(session.location || "-"))}
            ${item(i18n.status || "Status", escapeHtml(st))}
            ${item(i18n.sessionToken || "Token", escapeHtml(session.token_preview || "-"), true)}
            ${item(i18n.createdAt || "Criado em", formatDateTime(String(session.created_at || "")))}
            ${item(i18n.lastActivity || "\xDAltima atividade", formatDateTime(String(session.last_activity || "")))}
            ${item(i18n.expiresAt || "Expira em", formatDateTime(String(session.expires_at || "")))}
            ${item(i18n.userAgent || "User Agent", escapeHtml(session.user_agent || "-"))}
          </div>
        </div>
      </td>
    </tr>
  `;
}
function renderLoading(i18n) {
  return `<div class="psa__loading"><div class="psa__spinner"></div><span>${i18n?.loading || "Carregando sess\xF5es..."}</span></div>`;
}
function renderError(error, i18n) {
  return `<div class="psa__error"><span class="psa__error-icon">\u26A0\uFE0F</span><p>${error}</p><button class="psa__btn" data-action="refresh">${i18n?.retry || "Tentar novamente"}</button></div>`;
}
function renderEmpty(i18n) {
  return `<div class="psa__empty"><p>${i18n?.noSessions || "Nenhuma sess\xE3o encontrada"}</p></div>`;
}
function renderFooter(count, i18n) {
  return `<footer class="psa__footer"><span>${count} ${i18n?.sessionsCount || "sess\xE3o(\xF5es)"}</span></footer>`;
}
function _parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(String(dateStr).replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}
function formatDate(dateStr) {
  const d = _parseDate(dateStr);
  return d ? d.toLocaleDateString("pt-BR") : "-";
}
function formatDateTime(dateStr) {
  const d = _parseDate(dateStr);
  if (!d) return "-";
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function formatRelative(dateStr) {
  const d = _parseDate(dateStr);
  if (!d) return "-";
  const s = Math.round((Date.now() - d.getTime()) / 1e3);
  if (s < 0) return formatDateTime(dateStr);
  if (s < 60) return "agora";
  const m = Math.round(s / 60);
  if (m < 60) return `h\xE1 ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `h\xE1 ${h} h`;
  const dias = Math.round(h / 24);
  if (dias < 30) return `h\xE1 ${dias} d`;
  return formatDate(dateStr);
}
function escapeHtml(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function highlight(text, term) {
  const t = escapeHtml(text);
  const q = String(term == null ? "" : term).trim();
  if (!q) return t;
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return t.replace(new RegExp("(" + esc + ")", "gi"), '<mark class="psa__hl">$1</mark>');
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
const _ALL_COLUMNS = ["user", "ip", "device", "browser", "location", "started", "lastActivity", "status"];
// Adapter (2026-07-08): mapeia o modelo canônico do Store (loading/filteredSessions/selectedIds/
// expandedIds/hiddenColumns/filter) para a forma que renderMain consome (isLoading/sessions/
// selectedRows(Set)/expandedRows(Set)/columns(map)/filters) e injeta no container. Corrige o
// contrato quebrado: lifecycle chamava Template.render (export inexistente) com modelo incompatível.
function render(container, state, config = {}) {
  if (!container) return;
  const s = state || {};
  const hidden = Array.isArray(s.hiddenColumns) ? s.hiddenColumns : [];
  const columns = {};
  for (const c of _ALL_COLUMNS) columns[c] = !hidden.includes(c);
  const sessionList = Array.isArray(s.filteredSessions) ? s.filteredSessions : s.sessions || [];
  // o backend marca a sessão atual via is_current; a "atual" recebe badge, checkbox desabilitado e
  // sem botão de encerrar (backend também recusa revogar a própria).
  const currentTok = s.currentSessionToken || (sessionList.find((x) => x && x.is_current) || {}).session_token || null;
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
    showInlineFilters: !!s.showInlineFilters,
    sort: Array.isArray(s.sort) ? s.sort : [],
    inlineFilters: s.inlineFilters || {}
  };
  container.innerHTML = renderMain(mapped, config);
}
var template_default = {
  MODULE_ID,
  VERSION,
  render,
  renderMain,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  template_default as default,
  healthCheck,
  info,
  render,
  renderMain
};
