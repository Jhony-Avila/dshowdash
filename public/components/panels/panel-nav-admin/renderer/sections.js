var MODULE_ID = "panel-nav-admin-renderer-sections";
var VERSION = "10.0.0-GROUP-INLINE-EDIT";
var ICONS = {
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
  plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  grip: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>',
  chevronDown: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
  chevronRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
  eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
  copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
  folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
  link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>'
};
var _S = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
var _E = "</svg>";
var GROUP_ICONS = {
  // ── Sidebar groups ──────────────────────────────────────────
  "sidebar.grp-favoritos": _S + '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' + _E,
  "sidebar.grp-comercial": _S + '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' + _E,
  "sidebar.grp-compras": _S + '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>' + _E,
  "sidebar.grp-recebimento": _S + '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="9 12 11 14 15 10"/>' + _E,
  "sidebar.grp-contratos": _S + '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' + _E,
  "sidebar.grp-clientes": _S + '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' + _E,
  "sidebar.grp-empresas": _S + '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>' + _E,
  "sidebar.grp-fornecedores": _S + '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>' + _E,
  "sidebar.grp-colaboradores": _S + '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>' + _E,
  "sidebar.grp-contabil": _S + '<rect x="2" y="2" width="20" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="12" x2="16" y2="18"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="8" y1="12" x2="8" y2="14"/><line x1="8" y1="17" x2="8" y2="18"/>' + _E,
  "sidebar.grp-financeiro": _S + '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' + _E,
  "sidebar.grp-centros-custo": _S + '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>' + _E,
  "sidebar.grp-importacao": _S + '<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>' + _E,
  "sidebar.grp-logistica": _S + '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' + _E,
  "sidebar.grp-locacoes": _S + '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>' + _E,
  "sidebar.grp-operacional": _S + '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>' + _E,
  "sidebar.grp-produtos": _S + '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>' + _E,
  "sidebar.grp-suporte": _S + '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>' + _E,
  "sidebar.grp-automacoes": _S + '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' + _E,
  "sidebar.grp-dashboards": _S + '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' + _E,
  "sidebar.grp-admin": _S + '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' + _E,
  "sidebar.main": _S + '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' + _E,
  "sidebar.operacional": _S + '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' + _E,
  // ── Header / NavRail / other contexts ───────────────────────
  "operations": _S + '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' + _E,
  "analytics": _S + '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' + _E,
  "data": _S + '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>' + _E,
  "integrations": _S + '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' + _E,
  "admin": _S + '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' + _E,
  "system": _S + '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>' + _E,
  "brand": _S + '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>' + _E,
  "status-indicators": _S + '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' + _E,
  "currencies": _S + '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' + _E,
  "environment": _S + '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' + _E,
  "panels": _S + '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' + _E,
  "weather": _S + '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>' + _E,
  "actions": _S + '<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/>' + _E,
  "user": _S + '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' + _E
};
var _ICON_FOLDER_24 = _S + '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>' + _E;
function _groupIcon(key) {
  return GROUP_ICONS[key] || _ICON_FOLDER_24;
}
function renderItemsList(items, options = {}) {
  options = options || {};
  var expandedGroups = options.expandedGroups || /* @__PURE__ */ new Set();
  var selectedId = options.selectedId || null;
  var showActions = options.showActions !== void 0 ? options.showActions : true;
  var draggable = options.draggable !== void 0 ? options.draggable : true;
  if (!items || !items.length) {
    return '<div class="pna-empty">Nenhum item cadastrado</div>';
  }
  var grouped = _groupItems(items);
  var html = '<div class="pna-items-list">';
  var groupNames = Object.keys(grouped);
  for (var g = 0; g < groupNames.length; g++) {
    var groupName = groupNames[g];
    var groupItems = grouped[groupName];
    var expandedGroupsSet = expandedGroups;
    var isExpanded = expandedGroupsSet.has ? expandedGroupsSet.has(groupName) : false;
    var groupId = _slugify(groupName);
    html += '<div class="pna-group ' + (isExpanded ? "pna-group--expanded" : "") + '" data-group="' + groupId + '">';
    html += '<div class="pna-group__header" data-action="toggle-group" data-group="' + groupId + '">';
    html += '<span class="pna-group__icon">' + (isExpanded ? ICONS.chevronDown : ICONS.chevronRight) + "</span>";
    html += '<span class="pna-group__name">' + ICONS.folder + " " + _escapeHtml(groupName) + "</span>";
    html += '<span class="pna-group__count">' + groupItems.length + "</span>";
    html += "</div>";
    html += '<div class="pna-group__items"' + (!isExpanded ? ' style="display:none"' : "") + ">";
    for (var i = 0; i < groupItems.length; i++) {
      html += renderItem(groupItems[i], { selectedId, showActions, draggable });
    }
    html += "</div></div>";
  }
  html += "</div>";
  return html;
}
function renderItem(item, options = {}) {
  options = options || {};
  var selectedId = options.selectedId || null;
  var showActions = options.showActions !== void 0 ? options.showActions : true;
  var draggable = options.draggable !== void 0 ? options.draggable : true;
  var isSelected = item.id === selectedId;
  var isActive = item.is_active !== 0;
  var html = '<div class="pna-item ' + (isSelected ? "pna-item--selected" : "") + " " + (!isActive ? "pna-item--inactive" : "") + '" data-item-id="' + item.id + '" ' + (draggable ? 'draggable="true"' : "") + ">";
  if (draggable) html += '<span class="pna-item__grip">' + ICONS.grip + "</span>";
  html += '<span class="pna-item__icon">';
  html += item.icon ? '<i data-feather="' + item.icon + '"></i>' : "\u{1F4C4}";
  html += "</span>";
  html += '<div class="pna-item__content">';
  html += '<span class="pna-item__label">' + _escapeHtml(item.label || item.title || "Sem t\xEDtulo") + "</span>";
  html += '<span class="pna-item__meta">';
  if (item.route) html += "<code>" + _escapeHtml(item.route) + "</code>";
  if (item.uarps_trigger_id) html += '<span class="pna-badge">UARPS: ' + item.uarps_trigger_id + "</span>";
  html += "</span></div>";
  if (showActions) {
    html += '<div class="pna-item__actions">';
    html += '<button class="pna-btn pna-btn--icon pna-btn--xs" data-action="toggle-active" data-item-id="' + item.id + '" title="' + (isActive ? "Ocultar" : "Mostrar") + '">' + (isActive ? ICONS.eye : ICONS.eyeOff) + "</button>";
    html += '<button class="pna-btn pna-btn--icon pna-btn--xs" data-action="edit" data-item-id="' + item.id + '" title="Editar">' + ICONS.edit + "</button>";
    html += '<button class="pna-btn pna-btn--icon pna-btn--xs" data-action="duplicate-item" data-item-id="' + item.id + '" title="Duplicar">' + ICONS.copy + "</button>";
    html += '<button class="pna-btn pna-btn--icon pna-btn--xs pna-btn--danger" data-action="delete-item" data-item-id="' + item.id + '" title="Excluir">' + ICONS.trash + "</button>";
    html += "</div>";
  }
  html += "</div>";
  return html;
}
function renderGroupsList(groups, options = {}) {
  options = options || {};
  var showActions = options.showActions !== void 0 ? options.showActions : true;
  if (!groups || !groups.length) {
    return '<div class="pna-empty">Nenhum grupo cadastrado</div>';
  }
  var CTX_LABELS = { sidebar: "Sidebar", navrail: "NavRail", header: "Header", footer: "Footer" };
  var CTX_CSS = { sidebar: "pna-ctx-sidebar", navrail: "pna-ctx-navrail", header: "pna-ctx-header", footer: "pna-ctx-footer" };
  var CTX_ICON_CSS = { sidebar: "pna-section-icon--sidebar", navrail: "pna-section-icon--navrail", header: "pna-section-icon--header", footer: "pna-section-icon--footer" };
  var ctxOrder = [];
  var ctxCards = {};
  var cardIndex = 0;
  for (var i = 0; i < groups.length; i++) {
    var group = groups[i];
    var key = group.key || group.group_key || group.id || "";
    var label = group.displayLabel || group.label || group.name || key;
    var itemCount = group.itemCount !== void 0 ? group.itemCount : group.items_count || group.item_count || 0;
    var context = group.context || group.display_context || "sidebar";
    var contextLabel = CTX_LABELS[context] || context;
    var contextCss = CTX_CSS[context] || "";
    var iconContextCss = CTX_ICON_CSS[context] || "";
    var isEmpty = itemCount === 0;
    if (!ctxCards[context]) {
      ctxCards[context] = [];
      ctxOrder.push(context);
    }
    var animStyle = cardIndex < 20 ? ' style="animation-delay:' + (cardIndex * 0.03).toFixed(2) + 's"' : "";
    cardIndex++;
    var countClass = "pna-count--zero";
    if (itemCount >= 16) countClass = "pna-count--high";
    else if (itemCount >= 6) countClass = "pna-count--mid";
    else if (itemCount >= 1) countClass = "pna-count--low";
    var cardHtml = '<div class="pna-section-card' + (isEmpty ? " pna-section-card--empty" : "") + '" data-section-key="' + _escapeHtml(key) + '" data-key="' + _escapeHtml(key) + '"' + animStyle + ">";
    cardHtml += '<span class="pna-badge pna-badge-context ' + contextCss + ' pna-section-ctx-badge">' + contextLabel + "</span>";
    cardHtml += '<div class="pna-section-body">';
    cardHtml += '<span class="pna-section-icon ' + iconContextCss + (isEmpty ? " pna-section-icon--empty" : "") + '">' + _groupIcon(key) + "</span>";
    cardHtml += '<div class="pna-section-info">';
    var sourceTable = group.source_table || group.sourceTable || "ui_nav_items";
    var sourceId = group.source_id || group.sourceId || group.id || "";
    cardHtml += '<h4 class="pna-section-name pna-section-name--editable" data-action="inline-edit-group-label" data-section-key="' + _escapeHtml(key) + '" data-source-table="' + _escapeHtml(sourceTable) + '" data-source-id="' + _escapeHtml(String(sourceId)) + '" title="Clique para editar o nome do grupo" style="cursor:text;border-bottom:1px dashed rgba(255,255,255,0.15);padding-bottom:1px;">' + _escapeHtml(label) + "</h4>";
    cardHtml += '<div class="pna-section-stats">';
    cardHtml += '<span class="pna-section-count ' + countClass + '">' + itemCount + "</span>";
    cardHtml += '<span class="pna-section-count-label">' + (itemCount === 1 ? "item" : "itens") + "</span>";
    if (isEmpty) cardHtml += '<span class="pna-section-empty-label">Grupo vazio</span>';
    cardHtml += "</div>";
    cardHtml += "</div>";
    cardHtml += "</div>";
    if (showActions) {
      cardHtml += '<div class="pna-section-actions">';
      cardHtml += '<button type="button" class="pna-btn-icon" data-action="edit-section" data-section-key="' + _escapeHtml(key) + '" title="Editar grupo">' + ICONS.edit + "</button>";
      cardHtml += "</div>";
    }
    cardHtml += "</div>";
    ctxCards[context].push(cardHtml);
  }
  var PLACEHOLDER = '<div class="pna-section-card pna-section-card--placeholder" aria-hidden="true"></div>';
  var html = "";
  for (var c = 0; c < ctxOrder.length; c++) {
    var ctx = ctxOrder[c];
    if (c > 0) {
      html += '<div class="pna-context-divider"><span class="pna-context-divider__label">' + (CTX_LABELS[ctx] || ctx).toUpperCase() + "</span></div>";
    }
    html += '<div class="pna-sections-grid">';
    for (var j = 0; j < ctxCards[ctx].length; j++) {
      html += ctxCards[ctx][j];
    }
    html += PLACEHOLDER + PLACEHOLDER + PLACEHOLDER + PLACEHOLDER;
    html += "</div>";
  }
  return html;
}
function renderStats(stats) {
  if (!stats) return "";
  var items = [
    { label: "Total Itens", value: stats.total_items || 0 },
    { label: "Ativos", value: stats.active_items || 0, type: "success" },
    { label: "Inativos", value: stats.inactive_items || 0, type: "warning" },
    { label: "Grupos", value: stats.total_groups || 0 }
  ];
  var html = '<div class="pna-stats">';
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    html += '<div class="pna-stat ' + (item.type ? "pna-stat--" + item.type : "") + '">';
    html += '<span class="pna-stat__value">' + item.value + "</span>";
    html += '<span class="pna-stat__label">' + item.label + "</span>";
    html += "</div>";
  }
  html += "</div>";
  return html;
}
function renderBreadcrumb(path) {
  if (!path || !path.length) return "";
  var html = '<nav class="pna-breadcrumb">';
  for (var i = 0; i < path.length; i++) {
    var item = path[i];
    var isLast = i === path.length - 1;
    if (isLast) {
      html += '<span class="pna-breadcrumb__current">' + _escapeHtml(item.label) + "</span>";
    } else {
      html += '<a class="pna-breadcrumb__link" href="#" data-action="navigate" data-path="' + item.id + '">' + _escapeHtml(item.label) + "</a>";
      html += '<span class="pna-breadcrumb__sep">/</span>';
    }
  }
  html += "</nav>";
  return html;
}
function renderQuickActions(options = {}) {
  options = options || {};
  var canCreate = options.canCreate !== void 0 ? options.canCreate : true;
  var canImport = options.canImport !== void 0 ? options.canImport : true;
  var canExport = options.canExport !== void 0 ? options.canExport : true;
  var html = '<div class="pna-quick-actions">';
  if (canCreate) {
    html += '<button class="pna-btn pna-btn--primary" data-action="create-item">' + ICONS.plus + " Novo Item</button>";
    html += '<button class="pna-btn" data-action="create-section">' + ICONS.folder + " Novo Grupo</button>";
  }
  if (canImport) html += '<button class="pna-btn" data-action="import">Importar</button>';
  if (canExport) html += '<button class="pna-btn" data-action="export">Exportar</button>';
  html += "</div>";
  return html;
}
function renderEmptyState(type, i18n) {
  type = type || "items";
  i18n = i18n || {};
  const configs = {
    items: { icon: "\u{1F4C4}", title: i18n.noItems || "Nenhum item cadastrado", desc: i18n.noItemsDesc || 'Clique em "Novo Item" para come\xE7ar' },
    groups: { icon: "\u{1F4C1}", title: i18n.noGroups || "Nenhum grupo cadastrado", desc: i18n.noGroupsDesc || 'Clique em "Novo Grupo" para organizar seus itens' },
    search: { icon: "\u{1F50D}", title: i18n.noResults || "Nenhum resultado", desc: i18n.noResultsDesc || "Tente buscar com outros termos" }
  };
  var config = configs[type] || configs.items;
  return '<div class="pna-empty-state"><span class="pna-empty-state__icon">' + config.icon + '</span><h3 class="pna-empty-state__title">' + config.title + '</h3><p class="pna-empty-state__desc">' + config.desc + "</p></div>";
}
function renderPagination(pagination) {
  if (!pagination) return "";
  var page = pagination.page || 1;
  var totalPages = pagination.totalPages || 1;
  var total = pagination.total || 0;
  if (totalPages <= 1) return "";
  var pagesHtml = "";
  var start = Math.max(1, page - 2);
  var end = Math.min(totalPages, page + 2);
  for (var i = start; i <= end; i++) {
    pagesHtml += '<button class="pna-pagination__page ' + (i === page ? "pna-pagination__page--active" : "") + '" data-action="goto-page" data-page="' + i + '">' + i + "</button>";
  }
  return '<div class="pna-pagination"><button class="pna-pagination__btn" data-action="prev-page" ' + (page <= 1 ? "disabled" : "") + '>Anterior</button><div class="pna-pagination__pages">' + pagesHtml + '</div><button class="pna-pagination__btn" data-action="next-page" ' + (page >= totalPages ? "disabled" : "") + '>Pr\xF3ximo</button><span class="pna-pagination__info">' + total + " registro(s)</span></div>";
}
function updateSections(refs, sectionsVM) {
  if (!refs) return;
  var container = refs.sectionsContainer || refs.sectionsList || refs.groupsContainer;
  if (!container) return;
  if (!sectionsVM || sectionsVM.length === 0) {
    container.innerHTML = renderEmptyState("groups");
    return;
  }
  var html = renderGroupsList(sectionsVM, { showActions: true });
  container.innerHTML = html;
}
function updateFilterOptions(refs, sectionsVM) {
  if (!refs) return;
  var filterEl = refs.filterSelect || refs.filterDropdown || refs.filterChips;
  if (!filterEl) return;
  if (filterEl.tagName === "SELECT") {
    var optionsHtml = '<option value="">Todas as se\xE7\xF5es</option>';
    if (sectionsVM && sectionsVM.length > 0) {
      for (var i = 0; i < sectionsVM.length; i++) {
        var section = sectionsVM[i];
        var sId = section.id || section.section_key || i;
        var sLabel = _escapeHtml(section.label || section.name || section.section_key || "Se\xE7\xE3o " + (i + 1));
        optionsHtml += '<option value="' + sId + '">' + sLabel + "</option>";
      }
    }
    filterEl.innerHTML = optionsHtml;
  } else {
    var chipsHtml = '<button class="pna-chip pna-chip--active" data-filter="all">Todos</button>';
    if (sectionsVM && sectionsVM.length > 0) {
      for (var j = 0; j < sectionsVM.length; j++) {
        var sec = sectionsVM[j];
        var secId = sec.id || sec.section_key || j;
        var secLabel = _escapeHtml(sec.label || sec.name || sec.section_key || "Se\xE7\xE3o " + (j + 1));
        chipsHtml += '<button class="pna-chip" data-filter="' + secId + '">' + secLabel + "</button>";
      }
    }
    filterEl.innerHTML = chipsHtml;
  }
}
function updateGroupFilterOptions(container, sectionsVM) {
  if (!container) return;
  var groupSelect = container.querySelector('[data-filter="group"]');
  if (!groupSelect) return;
  var currentVal = groupSelect.value || "";
  var optionsHtml = '<option value="">Todos os grupos</option>';
  if (sectionsVM && sectionsVM.length > 0) {
    for (var i = 0; i < sectionsVM.length; i++) {
      var section = sectionsVM[i];
      var sKey = section.key || section.group_key || section.item_key || "";
      var sLabel = _escapeHtml(section.label || section.displayLabel || sKey);
      var sCtx = section.context || section.display_context || "";
      var sel = sKey === currentVal ? " selected" : "";
      optionsHtml += '<option value="' + _escapeHtml(sKey) + '"' + sel + ">" + sLabel + (sCtx ? " (" + sCtx + ")" : "") + "</option>";
    }
  }
  groupSelect.innerHTML = optionsHtml;
}
function flipCard(sectionKey) {
  if (!sectionKey) return;
  var card = document.querySelector('.pna-group-card[data-group-id="' + sectionKey + '"]');
  if (!card) card = document.querySelector('.pna-group[data-group="' + sectionKey + '"]');
  if (!card) card = document.querySelector('[data-section-key="' + sectionKey + '"]');
  if (!card) return;
  card.classList.toggle("pna-group-card--flipped");
}
function toggleCollapse(sectionKey) {
  if (!sectionKey) return;
  var group = document.querySelector('.pna-group[data-group="' + sectionKey + '"]');
  if (!group) group = document.querySelector('[data-section-key="' + sectionKey + '"]');
  if (!group) return;
  var items = group.querySelector(".pna-group__items");
  var isExpanded = group.classList.contains("pna-group--expanded");
  if (isExpanded) {
    group.classList.remove("pna-group--expanded");
    if (items) items.style.display = "none";
  } else {
    group.classList.add("pna-group--expanded");
    if (items) items.style.display = "";
  }
}
function clear(refs) {
  if (!refs) return;
  var container = refs.sectionsContainer || refs.sectionsList || refs.groupsContainer;
  if (container) container.innerHTML = "";
}
function _groupItems(items) {
  var groups = {};
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var groupName = item.group_name || item.category || "Sem grupo";
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(item);
  }
  return groups;
}
function _slugify(str) {
  if (!str) return "";
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");
}
function _escapeHtml(str) {
  if (!str) return "";
  var div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var sections_default = {
  MODULE_ID,
  VERSION,
  renderItemsList,
  renderItem,
  renderGroupsList,
  renderStats,
  renderBreadcrumb,
  renderQuickActions,
  renderEmptyState,
  renderPagination,
  updateSections,
  updateFilterOptions,
  flipCard,
  toggleCollapse,
  clear,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  clear,
  sections_default as default,
  flipCard,
  healthCheck,
  info,
  renderBreadcrumb,
  renderEmptyState,
  renderGroupsList,
  renderItem,
  renderItemsList,
  renderPagination,
  renderQuickActions,
  renderStats,
  toggleCollapse,
  updateFilterOptions,
  updateGroupFilterOptions,
  updateSections
};
