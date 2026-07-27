

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-SPLIT-COLUMNS)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin:renderer:items
// PURPOSE: Panel Nav Admin - Items Renderer (Unified SSOT — sidebar+navrail+header+footer)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   ICONS from ../ui/icons.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   renderItemsList() — exported function
//   renderItem() — exported function
//   renderItemForm() — exported function
//   renderUarpsBadge() — exported function
//   updateItems() — exported function
//   showEmptyState() — exported function
//   showSkeleton() — exported function
//   clear() — exported function
//   getSelectedIds() — exported function
//   selectRow() — exported function
//   selectAllRows() — exported function
//   setDragging() — exported function
//   setDropTarget() — exported function
//   startInlineEdit() — exported function
//   endInlineEdit() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// @changelog
//   10.4.0-ICON-POPOVER: Icon column cells are clickable (pna-icon-editable, data-icon-col)
//     for inline popover editing. Added data-icon-name, data-source-table, data-source-id attrs.
//   10.3.0-ICON-COLUMN: Added dedicated icon column with IconRegistry resolution.
//   10.2.0-SPLIT-COLUMNS: Split "Item" column into two: "Item" (label only) + "ID" (technical id).
//     Table now has 8 columns: #, Item, ID, Rota/Painel, Contexto, Grupo, Nível, Ações.
//     renderItemRow updated to output pna-col-label (label only) and pna-col-id (id only).
//     renderItemsList header updated with 8 columns.
//   10.0.1-HEADER-DEDUP: FIX — updateItems checks for existing pna-list-header.
//   10.0.0-UNIFIED-SSOT: MAJOR — Unified table rendering for all 4 contexts.
//   9.7.1-WARN-FIX: updateItems/showEmptyState warn→debug
//   9.7.0-TABLE-LAYOUT-FIX: updateItems renders table layout with SEÇÃO and NÍVEL columns
//   9.6.0-P18EC: selectRow, selectAllRows, setDragging, setDropTarget, startInlineEdit, endInlineEdit
//   9.5.0-P18EC: showSkeleton(), clear(), getSelectedIds()
//   9.4.0-P18EC: updateItems() and showEmptyState()
//   4.1.0-STRICT-MODE: NR-FULL strict mode migration
// ═══════════════════════════════════════════════════════════════

'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { ICONS } from '../ui/icons.js';
import { IconRegistry } from '/components/icon-registry/index.js';

var MODULE_ID = 'panel-nav-admin:renderer:items';
var VERSION = '15.2.0-GROUP-ICON-REORDER';

var Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

var CONTEXT_LABELS = { sidebar: 'Sidebar', navrail: 'NavRail', header: 'Header', footer: 'Footer' };
var CONTEXT_CSS = { sidebar: 'pna-ctx-sidebar', navrail: 'pna-ctx-navrail', header: 'pna-ctx-header', footer: 'pna-ctx-footer' };

var LOCAL_ICONS = {
  drag: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>',
  empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>'
};

function _icon(name: string) {
  return (ICONS as Record<string, string>)[name] || (LOCAL_ICONS as Record<string, string>)[name] || '';
}

function _resolveNavIcon(iconName: unknown): string {
  if (!iconName || iconName === 'default') return '<span class="pna-icon-empty" title="Sem icone">—</span>';

  var name = String(iconName);
  var namespaces = ['ui', 'system', 'business', 'charts', 'extended'];
  for (var i = 0; i < namespaces.length; i++) {
    var svg = IconRegistry.get(namespaces[i] + ':' + name);
    if (svg) return svg;
  }

  // Fallback: nome textual em badge
  return '<code class="pna-icon-name" title="Icone nao encontrado: ' + escapeHtml(name) + '">' + escapeHtml(name) + '</code>';
}

function _getLogger() {
  var lg = _getPort('logger');
  if (lg) return lg;
  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var wab = window.Core.windowAdapter.get('Logger');
    if (wab) return wab;
  }
  return null;
}

function log(level: string, msg: string, data?: unknown) {
  var logger = _getLogger();
  if (logger && logger[level]) logger[level]('[' + MODULE_ID + ']', msg, data);
}

function escapeHtml(str: unknown) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ═══════════════════════════════════════════════════════════════
// v10.2.0-SPLIT-COLUMNS: 8-column table layout
// #, Item (label), ID (technical), Rota/Painel, Contexto, Grupo, Nível, Ações
// ═══════════════════════════════════════════════════════════════

var LOCAL_TOGGLE_ICONS = {
  eyeOn: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
};

// ═══ MELHORIA 5: Resolve group icon from sections data ═══
function _resolveGroupIcon(groupKey: string): string {
  if (!groupKey || groupKey === '_none') return '';
  // Try window.__pnaSections (set by data-loader)
  var sections = (typeof window !== 'undefined' && (window as any).__pnaSections) as Record<string, unknown>[] | null;
  if (!sections || !Array.isArray(sections)) return '';
  for (var i = 0; i < sections.length; i++) {
    var s = sections[i];
    var sKey = String(s.key || s.group_key || s.item_key || '');
    if (sKey === groupKey) {
      var iconName = String(s.icon_name || s.icon || '');
      if (iconName) return _resolveNavIcon(iconName);
    }
  }
  return '';
}

// ═══ MELHORIA 2: Extract human-readable label from group_key ═══
function _humanizeGroupKey(groupKey: string): string {
  if (!groupKey || groupKey === '-') return '-';
  // Strip prefixes like "sidebar.grp-", "sidebar.", "nr_grp_", "hdr_grp_"
  var label = groupKey
    .replace(/^sidebar\.grp-/, '')
    .replace(/^sidebar\./, '')
    .replace(/^nr_grp_/, '')
    .replace(/^hdr_grp_/, '')
    .replace(/[-_]/g, ' ')
    .trim();
  if (!label) return groupKey;
  // Capitalize first letter of each word
  return label.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

// ═══ Resolve group display label: parentLabel > humanized parentKey > fallback ═══
function _resolveGroupLabel(item: Record<string, unknown>): string {
  // parentLabel from API JOIN (already human-readable)
  var pl = item.parentLabel || item.parent_label;
  if (pl && String(pl).trim() !== '') return String(pl);
  // Fallback: humanize the parentKey
  var pk = item.parentKey || item.parent_key;
  if (pk && String(pk).trim() !== '') return _humanizeGroupKey(String(pk));
  return '-';
}

// ═══ MELHORIA 3: Group color by hash ═══
function _getGroupColor(groupName: string): string {
  if (!groupName || groupName === '-') return 'hsl(0, 0%, 50%)';
  var hash = 0;
  for (var i = 0; i < groupName.length; i++) {
    hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
  }
  var hue = Math.abs(hash) % 360;
  return 'hsl(' + hue + ', 65%, 65%)';
}

function _getGroupBgColor(groupName: string): string {
  if (!groupName || groupName === '-') return 'rgba(255,255,255,0.06)';
  var hash = 0;
  for (var i = 0; i < groupName.length; i++) {
    hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
  }
  var hue = Math.abs(hash) % 360;
  return 'hsla(' + hue + ', 65%, 65%, 0.15)';
}

function _getGroupBorderColor(groupName: string): string {
  if (!groupName || groupName === '-') return 'rgba(255,255,255,0.1)';
  var hash = 0;
  for (var i = 0; i < groupName.length; i++) {
    hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
  }
  var hue = Math.abs(hash) % 360;
  return 'hsla(' + hue + ', 65%, 65%, 0.35)';
}

// ═══ MELHORIA 5: Route syntax highlight class ═══
function _getRouteClass(href: unknown): string {
  var s = String(href || '');
  if (s.indexOf('#') === 0 || s.indexOf('#/') !== -1) return 'pna-route-hash';
  if (s.indexOf('panel-') === 0 || s.indexOf('panel-') !== -1) return 'pna-route-panel';
  return 'pna-route-other';
}

function renderItemRowWithZebra(item: Record<string, unknown>, index: number, zebraBg: string) {
  return renderItemRow(item, index, zebraBg);
}

function renderItemRow(item: Record<string, unknown>, index: number, zebraBg?: string) {
  var isDividerClass = item.isDivider ? ' pna-item-divider' : '';
  var isAdminClass = item.isAdmin ? ' pna-item-admin' : '';
  var isActive = item.isActive !== false;
  var inactiveClass = !isActive ? ' pna-item-inactive' : '';
  var context = (item.section as string) || 'sidebar';
  var contextLabel = item.contextLabel || (CONTEXT_LABELS as Record<string, string>)[context] || context;
  var contextCss = (CONTEXT_CSS as Record<string, string>)[context] || '';
  var parentLabel = _resolveGroupLabel(item);
  var minLevel = item.minLevel != null ? item.minLevel : 0;
  var minLevelDesc = item.minLevelDescription || '';
  var levelAdminClass = (minLevel as number) >= 80 ? ' pna-badge-admin' : '';
  var levelLabels: Record<number, string> = { 0: 'Público', 1: 'Usuário', 2: 'Moderador', 3: 'Admin' };
  var levelChipClass = ' pna-level-' + minLevel;
  var levelLabel = (levelLabels as Record<number, string>)[minLevel as number] || ('Nível ' + minLevel);
  var displayHref = item.displayHref || item.href || item.panelId || '-';
  var iconHtml = item.isDivider ? _icon('divider') : _icon('link');
  var id = item.id || '';
  var label = escapeHtml(item.label || 'Sem título');
  var displayTitle = escapeHtml(item.displayTitle || '');
  var hasDisplayTitle = !!(item.displayTitle && String(item.displayTitle).trim() !== '');
  var hasCustomTitle = !!(hasDisplayTitle && String(item.displayTitle).trim() !== String(item.label || '').trim());
  var displayTitleText = displayTitle || '';
  var titleTooltip = escapeHtml(displayTitle || String(item.label || ''));
  var sourceTable = item.sourceTable || '';
  var sourceId = item.sourceId || '';
  var toggleIcon = isActive ? LOCAL_TOGGLE_ICONS.eyeOn : LOCAL_TOGGLE_ICONS.eyeOff;
  var toggleTitle = isActive ? 'Desativar item' : 'Ativar item';
  var toggleCss = isActive ? 'pna-btn-icon pna-btn-toggle-active' : 'pna-btn-icon pna-btn-toggle-inactive';

  // MELHORIA 1: animation delay per row (30ms cascade)
  var animDelay = (index * 30) + 'ms';
  // MELHORIA 3: group color
  var groupColorStr = _getGroupColor(String(parentLabel));
  var groupBgColorStr = _getGroupBgColor(String(parentLabel));
  // MELHORIA 5: route class
  var routeClass = _getRouteClass(displayHref);

  var zebraStyle = zebraBg ? 'background:' + zebraBg + ';' : '';
  return '<li class="pna-list-item' + isDividerClass + isAdminClass + inactiveClass + '" data-item-id="' + escapeHtml(id) + '" data-section="' + escapeHtml(context) + '" data-group-key="' + escapeHtml(String(item.parentKey || item.parent_key || '')) + '" data-source-table="' + escapeHtml(sourceTable) + '" data-source-id="' + escapeHtml(String(sourceId)) + '" data-active="' + (isActive ? 'true' : 'false') + '" style="' + zebraStyle + 'animation-delay:' + animDelay + ';">'
    + '<span class="pna-list-col pna-col-bulk" data-col="bulk"><label class="pna-checkbox pna-checkbox--bulk"><input type="checkbox" class="pna-checkbox__input pna-bulk-checkbox" title="Selecionar item"><span class="pna-checkbox__box"><svg class="pna-checkbox__check" viewBox="0 0 14 14" fill="none"><path class="pna-checkbox__path" d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><svg class="pna-checkbox__dash" viewBox="0 0 14 14" fill="none"><path d="M3 7H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="pna-checkbox__ripple"></span></span></label></span>'
    + '<span class="pna-list-col pna-col-order" data-col="order"><span class="pna-drag-handle" title="Arrastar para reordenar">' + _icon('move') + '</span><span class="pna-order-num" title="order_index: ' + (item.order || index + 1) + '">' + (item.order || index + 1) + '</span></span>'
    + '<span class="pna-list-col pna-col-icon pna-icon-editable" data-col="icon" data-icon-col data-item-id="' + escapeHtml(id) + '" data-icon-name="' + escapeHtml(item.icon || '') + '" data-source-table="' + escapeHtml(sourceTable) + '" data-source-id="' + escapeHtml(String(sourceId)) + '" title="Clique para alterar icone"><span class="pna-icon-preview">' + _resolveNavIcon(item.icon) + '</span></span>'
    + '<span class="pna-list-col pna-col-label" data-col="label"><span class="pna-item-icon">' + iconHtml + '</span><span class="pna-item-label">' + label + '</span></span>'
    + '<span class="pna-list-col pna-col-display-title" data-col="display-title">'
    + '<span class="pna-display-title' + (hasCustomTitle ? ' pna-display-title--custom' : '') + '"'
    + ' title="Preview no header: ' + titleTooltip + '"'
    + ' data-tooltip-preview="Preview no header: ' + titleTooltip + '">'
    + (hasCustomTitle ? '<span class="pna-title-custom-dot" title="Titulo customizado (diferente do label)"></span>' : '')
    + (displayTitleText ? displayTitleText : '<span class="pna-title-placeholder">Mesmo Item</span>')
    + '</span>'
    + (hasDisplayTitle ? '<button type="button" class="pna-display-title-reset" data-action="reset-display-title" data-item-id="' + escapeHtml(id) + '" data-source-table="' + escapeHtml(sourceTable) + '" data-source-id="' + escapeHtml(String(sourceId)) + '" title="Resetar titulo (usar label)">&times;</button>' : '')
    + '</span>'
    + '<span class="pna-list-col pna-col-status" data-col="status"><span class="' + (isActive ? 'pna-badge pna-badge-status pna-badge-status--active' : 'pna-badge pna-badge-status pna-badge-status--inactive') + '">' + (isActive ? 'Ativo' : 'Inativo') + '</span></span>'
    + '<span class="pna-list-col pna-col-id" data-col="id"><code class="pna-item-id">' + escapeHtml(id) + '</code></span>'
    + '<span class="pna-list-col pna-col-href" data-col="href"><code class="pna-item-href ' + routeClass + '">' + escapeHtml(displayHref) + '</code></span>'
    + '<span class="pna-list-col pna-col-context" data-col="context"><span class="pna-badge pna-badge-context ' + contextCss + '">' + escapeHtml(contextLabel) + '</span></span>'
    + '<span class="pna-list-col pna-col-group" data-col="group"><span class="pna-badge pna-badge-group" title="' + escapeHtml(item.parentKey || '') + '" style="background:' + groupBgColorStr + ';color:' + groupColorStr + ';border:1px solid ' + _getGroupBorderColor(String(parentLabel)) + ';">' + escapeHtml(parentLabel) + '</span></span>'
    + '<span class="pna-list-col pna-col-level" data-col="level"><span class="pna-badge pna-badge-level' + levelAdminClass + levelChipClass + '" data-level="' + minLevel + '" title="' + escapeHtml(minLevelDesc) + '">' + _icon('shield') + ' ' + levelLabel + '</span></span>'
    + '<span class="pna-list-col pna-col-actions" data-col="actions"><button type="button" class="pna-btn-icon pna-btn-duplicate" data-action="duplicate-item" data-item-id="' + escapeHtml(id) + '" title="Duplicar item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button><button type="button" class="' + toggleCss + '" data-action="toggle-active" data-item-id="' + escapeHtml(id) + '" title="' + toggleTitle + '">' + toggleIcon + '</button><button type="button" class="pna-btn-icon pna-btn-danger" data-action="delete-item" data-item-id="' + escapeHtml(id) + '" title="Excluir">' + _icon('trash') + '</button></span>'
    + '</li>';
}

function renderItemsList(items: Record<string, unknown>[], options: Record<string, unknown> = {}) {
  options = options || {};
  if (!items || items.length === 0) {
    return '<div class="pna-empty" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:280px;padding:2.5rem;text-align:center;color:rgba(255,255,255,0.5);"><div style="width:64px;height:64px;margin-bottom:1rem;opacity:0.25;color:rgba(255,255,255,0.4);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round"/></svg></div><p style="margin:0;font-size:1.1rem;font-weight:600;color:rgba(255,255,255,0.7);">Nenhum item encontrado</p><p style="margin:0.75rem 0 0;font-size:0.85rem;opacity:0.6;max-width:300px;">Tente ajustar os filtros ou limpar a busca para ver todos os itens.</p><button type="button" class="pna-btn" data-action="clear-filters" style="margin-top:1.25rem;padding:0.5rem 1.25rem;font-size:0.8rem;background:rgba(99,102,241,0.15);color:#818cf8;border:1px solid rgba(99,102,241,0.3);border-radius:0.5rem;cursor:pointer;">Limpar filtros</button></div>';
  }
  var html = '<div class="pna-list-header" data-grid-header>'
    + '<span class="pna-list-col pna-col-bulk" data-col="bulk"><label class="pna-checkbox pna-checkbox--bulk"><input type="checkbox" class="pna-checkbox__input pna-bulk-select-all" title="Selecionar todos"><span class="pna-checkbox__box"><svg class="pna-checkbox__check" viewBox="0 0 14 14" fill="none"><path class="pna-checkbox__path" d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><svg class="pna-checkbox__dash" viewBox="0 0 14 14" fill="none"><path d="M3 7H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="pna-checkbox__ripple"></span></span></label></span>'
    + '<span class="pna-list-col pna-col-order" data-col="order">Ordem</span>'
    + '<span class="pna-list-col pna-col-icon" data-col="icon">Icone</span>'
    + '<span class="pna-list-col pna-col-label pna-col-sortable" data-col="label" data-sort="label">Item <span class="pna-sort-icon"></span></span>'
    + '<span class="pna-list-col pna-col-display-title" data-col="display-title">Título</span>'
    + '<span class="pna-list-col pna-col-status pna-col-sortable" data-col="status" data-sort="status">Status <span class="pna-sort-icon"></span></span>'
    + '<span class="pna-list-col pna-col-id pna-col-sortable" data-col="id" data-sort="id">ID <span class="pna-sort-icon"></span></span>'
    + '<span class="pna-list-col pna-col-href pna-col-sortable" data-col="href" data-sort="href">Rota / Painel <span class="pna-sort-icon"></span></span>'
    + '<span class="pna-list-col pna-col-context pna-col-sortable" data-col="context" data-sort="context">Contexto <span class="pna-sort-icon"></span></span>'
    + '<span class="pna-list-col pna-col-group pna-col-sortable" data-col="group" data-sort="group">Grupo <span class="pna-sort-icon"></span></span>'
    + '<span class="pna-list-col pna-col-level pna-col-sortable" data-col="level" data-sort="level">Nível <span class="pna-sort-icon"></span></span>'
    + '<span class="pna-list-col pna-col-actions" data-col="actions">Ações</span>'
    + '</div>';
  html += '<ul class="pna-list" data-sortable="items">';
  // ═══ v15.0.0: Zebra striping + group separators with collapse/expand + counter ═══
  // Pre-compute group item counts
  var groupItemCounts: Record<string, number> = {};
  for (var ci = 0; ci < items.length; ci++) {
    var ck = String(items[ci].parentKey || items[ci].parent_key || '_none');
    groupItemCounts[ck] = (groupItemCounts[ck] || 0) + 1;
  }
  // Load collapsed state from localStorage
  var collapsedFlatGroups: Set<string>;
  try { var rawC = localStorage.getItem('pna-flat-collapsed-groups'); collapsedFlatGroups = rawC ? new Set(JSON.parse(rawC) as string[]) : new Set(); } catch (_e) { collapsedFlatGroups = new Set(); }

  var lastGroupKey = '';
  var groupColorIndex = 0;
  var groupColorMap: Record<string, number> = {};
  for (var i = 0; i < items.length; i++) {
    var itemGroupKey = String(items[i].parentKey || items[i].parent_key || '_none');
    // Group separator header when group changes
    if (itemGroupKey !== lastGroupKey) {
      var groupDisplayLabel = _resolveGroupLabel(items[i]);
      if (!(itemGroupKey in groupColorMap)) {
        groupColorMap[itemGroupKey] = groupColorIndex++;
      }
      var sepColor = _getGroupColor(itemGroupKey);
      var isCollapsed = collapsedFlatGroups.has(itemGroupKey);
      var arrowIcon = isCollapsed ? '&#9654;' : '&#9660;';
      var itemCount = groupItemCounts[itemGroupKey] || 0;
      // v15.2.0: MELHORIA 3 — drag handle for group reorder + MELHORIA 5 — group icon from sections
      var groupIconHtml = _resolveGroupIcon(itemGroupKey);
      var groupIconSpan = groupIconHtml ? '<span class="pna-group-sep-icon" style="display:inline-flex;width:14px;height:14px;opacity:0.7;">' + groupIconHtml + '</span>' : '';
      html += '<li class="pna-list-group-separator" draggable="true" data-group-drag="true" data-group-separator="' + escapeHtml(itemGroupKey) + '" data-action="toggle-flat-group-collapse" data-group-key="' + escapeHtml(itemGroupKey) + '" style="display:flex;align-items:center;gap:0.5rem;padding:0.35rem 0.75rem;margin:0;border:none;background:transparent;list-style:none;cursor:pointer;user-select:none;transition:background 0.15s;" title="Clique para colapsar/expandir">'
        + '<span class="pna-group-drag-handle" draggable="true" style="cursor:grab;opacity:0.35;display:flex;align-items:center;padding:0 0.15rem;" title="Arrastar para reordenar grupo">'
        + '<svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg></span>'
        + '<span class="pna-flat-group-arrow" style="font-size:0.6rem;opacity:0.6;transition:transform 0.2s;">' + arrowIcon + '</span>'
        + groupIconSpan
        + '<span style="flex:0 0 auto;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:' + sepColor + ';opacity:0.85;">' + escapeHtml(groupDisplayLabel) + '</span>'
        + '<span class="pna-group-item-count" style="font-size:0.65rem;opacity:0.5;background:rgba(255,255,255,0.08);padding:0.05rem 0.35rem;border-radius:0.5rem;color:' + sepColor + ';">' + itemCount + ' ite' + (itemCount === 1 ? 'm' : 'ns') + '</span>'
        + '<span style="flex:1;height:1px;background:linear-gradient(90deg,' + sepColor + ' 0%, transparent 100%);opacity:0.3;"></span>'
        + '</li>';
      lastGroupKey = itemGroupKey;
    }
    // Zebra striping — alternate background by group
    var zebraIdx = groupColorMap[itemGroupKey] || 0;
    var zebraHue = Math.abs(itemGroupKey.split('').reduce(function(h, c) { return c.charCodeAt(0) + ((h << 5) - h); }, 0)) % 360;
    var zebraBg = (zebraIdx % 2 === 0) ? 'hsla(' + zebraHue + ', 30%, 50%, 0.04)' : 'hsla(' + zebraHue + ', 30%, 50%, 0.08)';
    // If group is collapsed, hide items via inline style
    var rowHtml = renderItemRowWithZebra(items[i], i, zebraBg);
    if (collapsedFlatGroups.has(itemGroupKey)) {
      rowHtml = rowHtml.replace('class="pna-list-item', 'class="pna-list-item pna-flat-group-hidden');
    }
    html += rowHtml;
  }
  html += '</ul>';
  return html;
}

function renderItem(item: Record<string, unknown>, index: number, options?: Record<string, unknown>) {
  return renderItemRow(item, index);
}

function renderUarpsBadge(triggerId: string) {
  if (!triggerId) return '';
  var parts = triggerId.split(':');
  var label = parts[parts.length - 1] || 'protegido';
  var badgeClass = 'pna-badge pna-badge--uarps';
  var icon = _icon('shield');
  var title = 'Protegido por UARPS: ' + triggerId;
  if (triggerId.indexOf('admin') !== -1) {
    badgeClass += ' pna-badge--admin';
    icon = _icon('lock');
    title = 'Requer permissão admin: ' + triggerId;
  }
  return '<span class="' + badgeClass + '" title="' + escapeHtml(title) + '">' + icon + '<span>' + escapeHtml(label) + '</span></span>';
}

function renderItemForm(item: Record<string, unknown>, sections: Record<string, unknown>[] | unknown, triggers: Record<string, unknown>[] | unknown) {
  item = item || {}; sections = sections || []; triggers = triggers || [];
  var isNew = !item.id && !item.dbId;
  var html = '<form class="pna-form" data-form="item">';

  html += '<input type="hidden" name="source_table" value="' + escapeHtml(item.sourceTable || '') + '">';
  html += '<input type="hidden" name="source_id" value="' + escapeHtml(String(item.sourceId || '')) + '">';

  html += '<div class="pna-form__field"><label>ID/Key *</label><input type="text" name="item_key" value="' + escapeHtml(item.id || '') + '" ' + (isNew ? '' : 'readonly') + ' required placeholder="ex: sidebar.dashboard"></div>';
  html += '<div class="pna-form__field"><label>Label *</label><input type="text" name="label" value="' + escapeHtml(item.label || '') + '" required placeholder="ex: Dashboard"></div>';
  html += '<div class="pna-form__field"><label>Ícone</label><input type="text" name="icon_name" value="' + escapeHtml(item.icon || '') + '" placeholder="ex: home, grid, users"></div>';

  html += '<div class="pna-form__field"><label>Contexto (onde aparece) *</label><select name="display_context">';
  var contexts = ['sidebar', 'navrail', 'header', 'footer'];
  for (var ci = 0; ci < contexts.length; ci++) {
    var ctx = contexts[ci];
    var ctxSelected = (item.section === ctx) ? ' selected' : '';
    html += '<option value="' + ctx + '"' + ctxSelected + '>' + ((CONTEXT_LABELS as Record<string, string>)[ctx] || ctx) + '</option>';
  }
  html += '</select></div>';

  html += '<div class="pna-form__field"><label>Grupo</label><select name="parent_key"><option value="">Sem grupo</option>';
  if (Array.isArray(sections)) {
    sections.forEach(function(s) {
      var sKey = s.key || s.group_key || s.item_key || '';
      var sLabel = s.label || s.displayLabel || sKey;
      var sCtx = s.context || s.display_context || '';
      var selected = (item.parentKey === sKey) ? ' selected' : '';
      html += '<option value="' + escapeHtml(sKey) + '"' + selected + '>' + escapeHtml(sLabel) + (sCtx ? ' (' + sCtx + ')' : '') + '</option>';
    });
  }
  html += '</select></div>';

  html += '<div class="pna-form__field"><label>Panel ID</label><input type="text" name="panel_id" value="' + escapeHtml(item.panelId || '') + '" placeholder="ex: panel-dashboard"></div>';
  html += '<div class="pna-form__field"><label>Rota/URL</label><input type="text" name="route_path" value="' + escapeHtml(item.href || '') + '" placeholder="ex: #/dashboard"></div>';
  html += '<div class="pna-form__field"><label>Ordem</label><input type="number" name="order_index" value="' + (item.order || 0) + '" min="0"></div>';
  html += '<div class="pna-form__field"><label>Nível mínimo de acesso</label><input type="number" name="min_level" value="' + (item.minLevel || 0) + '" min="0" max="100"></div>';

  html += '<div class="pna-form__field"><label>UARPS Trigger (Permissão)</label><select name="uarps_trigger_id"><option value="">Público (sem restrição)</option>';
  if (Array.isArray(triggers)) {
    triggers.forEach(function(t) {
      var selected = (item.uarpsTrigger === t.trigger_id) ? ' selected' : '';
      html += '<option value="' + escapeHtml(t.trigger_id) + '"' + selected + '>' + escapeHtml(t.label || t.trigger_id) + '</option>';
    });
  }
  html += '</select><small class="pna-form__help">Define quem pode ver este item de navegação</small></div>';

  html += '<div class="pna-form__field"><label>Descrição</label><input type="text" name="description" value="' + escapeHtml(item.description || '') + '" placeholder="Descrição opcional"></div>';

  html += '<div class="pna-form__checkboxes">';
  html += '<label class="pna-checkbox"><input type="checkbox" class="pna-checkbox__input" name="is_active" ' + (item.isActive !== false ? 'checked' : '') + '><span class="pna-checkbox__box"><svg class="pna-checkbox__check" viewBox="0 0 14 14" fill="none"><path class="pna-checkbox__path" d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><svg class="pna-checkbox__dash" viewBox="0 0 14 14" fill="none"><path d="M3 7H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="pna-checkbox__ripple"></span></span><span class="pna-checkbox__label">Ativo</span></label>';
  html += '<label class="pna-checkbox"><input type="checkbox" class="pna-checkbox__input" name="is_visible" ' + (item.isVisible !== false ? 'checked' : '') + '><span class="pna-checkbox__box"><svg class="pna-checkbox__check" viewBox="0 0 14 14" fill="none"><path class="pna-checkbox__path" d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><svg class="pna-checkbox__dash" viewBox="0 0 14 14" fill="none"><path d="M3 7H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="pna-checkbox__ripple"></span></span><span class="pna-checkbox__label">Visível</span></label>';
  html += '<label class="pna-checkbox"><input type="checkbox" class="pna-checkbox__input" name="is_divider" ' + (item.isDivider ? 'checked' : '') + '><span class="pna-checkbox__box"><svg class="pna-checkbox__check" viewBox="0 0 14 14" fill="none"><path class="pna-checkbox__path" d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><svg class="pna-checkbox__dash" viewBox="0 0 14 14" fill="none"><path d="M3 7H11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="pna-checkbox__ripple"></span></span><span class="pna-checkbox__label">É divisor</span></label>';
  html += '</div>';

  html += '<div class="pna-form__actions"><button type="button" class="pna-btn" data-action="close-modal">Cancelar</button><button type="submit" class="pna-btn pna-btn--primary">Salvar</button></div>';
  html += '</form>';
  return html;
}

function updateItems(refs: Record<string, unknown>, items: Record<string, unknown>[], searchTerm: string) {
  if (!refs) { return; }
  var container = (refs.itemsContainer || refs.itemsList || refs.tableBody) as HTMLElement | null;
  if (!container) { log('debug', 'updateItems: no container ref found (pre-mount)'); return; }
  if (!items || items.length === 0) { showEmptyState(refs); return; }
  // v9.7.0-HEADER-DEDUP: Nunca fazer innerHTML completo se header já existe em qualquer ancestral
  var rowsHtml = '';
  for (var i = 0; i < items.length; i++) { rowsHtml += renderItemRow(items[i], i); }

  // Verificar se já existe uma <ul> dentro do container
  var existingUl = container.querySelector('ul.pna-list');
  if (existingUl) {
    // Apenas atualizar as linhas
    existingUl.innerHTML = rowsHtml;
    return;
  }

  // Não tem <ul> — verificar se header já existe no container OU em qualquer ancestral
  var headerInContainer = container.querySelector('.pna-list-header');
  var headerInAncestor = !headerInContainer && (function() {
    var el = container.parentElement;
    while (el) {
      if (el.querySelector('.pna-list-header')) return true;
      el = el.parentElement;
    }
    return false;
  })();

  if (headerInContainer || headerInAncestor) {
    // Header já existe — criar apenas a <ul>
    var ul = document.createElement('ul');
    ul.className = 'pna-list';
    ul.setAttribute('data-sortable', 'items');
    ul.innerHTML = rowsHtml;
    container.appendChild(ul);
  } else {
    // Nenhum header em lugar algum — renderizar tudo incluindo header
    var html = renderItemsList(items, { searchTerm: searchTerm || '' });
    container.innerHTML = html;
  }
  log('debug', 'updateItems', { count: items.length, searchTerm: searchTerm || '' });
}

function showEmptyState(refs: Record<string, unknown>) {
  if (!refs) return;
  var container = (refs.itemsContainer || refs.itemsList || refs.tableBody) as HTMLElement | null;
  if (!container) { log('debug', 'showEmptyState: no container ref found (pre-mount)'); return; }
  container.innerHTML = '<div class="pna-empty" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:280px;padding:2.5rem;text-align:center;color:rgba(255,255,255,0.5);"><div style="width:64px;height:64px;margin-bottom:1rem;opacity:0.25;color:rgba(255,255,255,0.4);">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round"/></svg>' + '</div><p style="margin:0;font-size:1.1rem;font-weight:600;color:rgba(255,255,255,0.7);">Nenhum item encontrado</p><p style="margin:0.75rem 0 0;font-size:0.85rem;opacity:0.6;max-width:300px;">Tente ajustar os filtros ou limpar a busca para ver todos os itens.</p><button type="button" class="pna-btn" data-action="clear-filters" style="margin-top:1.25rem;padding:0.5rem 1.25rem;font-size:0.8rem;background:rgba(99,102,241,0.15);color:#818cf8;border:1px solid rgba(99,102,241,0.3);border-radius:0.5rem;cursor:pointer;">Limpar filtros</button></div>';
  log('debug', 'showEmptyState rendered');
}

function showSkeleton(refs: Record<string, unknown>, rows?: number) {
  if (!refs) return;
  var container = (refs.itemsContainer || refs.itemsList || refs.tableBody) as HTMLElement | null;
  if (!container) return;
  rows = rows || 5;
  // MELHORIA 8: Skeleton proporcional as colunas reais com shimmer suave
  var shimmerBg = 'linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%)';
  var shimmerStyle = 'background:' + shimmerBg + ';background-size:200% 100%;animation:pna-shimmer 2s ease-in-out infinite;';
  var html = '<div class="pna-skeleton-wrapper">';
  for (var i = 0; i < rows; i++) {
    var delay = (i * 80) + 'ms';
    html += '<div class="pna-skeleton-row" style="display:grid;grid-template-columns:36px 50px 44px 1.4fr 1fr 72px 1.2fr 1fr 90px 110px 70px 80px;gap:0.75rem;padding:0.6rem 0.75rem;border-bottom:1px solid rgba(255,255,255,0.04);align-items:center;">';
    // Bulk (checkbox placeholder)
    html += '<div style="width:18px;height:18px;border-radius:3px;' + shimmerStyle + 'animation-delay:' + delay + ';"></div>';
    // Order
    html += '<div style="width:28px;height:14px;border-radius:3px;' + shimmerStyle + 'animation-delay:' + delay + ';"></div>';
    // Icon
    html += '<div style="width:32px;height:32px;border-radius:6px;' + shimmerStyle + 'animation-delay:' + delay + ';"></div>';
    // Label
    html += '<div style="width:' + (55 + Math.random() * 30) + '%;height:14px;border-radius:3px;' + shimmerStyle + 'animation-delay:' + delay + ';"></div>';
    // Display Title
    html += '<div style="width:' + (40 + Math.random() * 30) + '%;height:12px;border-radius:3px;' + shimmerStyle + 'animation-delay:' + delay + ';"></div>';
    // Status badge
    html += '<div style="width:44px;height:20px;border-radius:10px;' + shimmerStyle + 'animation-delay:' + delay + ';"></div>';
    // ID
    html += '<div style="width:' + (50 + Math.random() * 30) + '%;height:12px;border-radius:3px;' + shimmerStyle + 'animation-delay:' + delay + ';"></div>';
    // Rota
    html += '<div style="width:' + (45 + Math.random() * 35) + '%;height:12px;border-radius:3px;' + shimmerStyle + 'animation-delay:' + delay + ';"></div>';
    // Contexto badge
    html += '<div style="width:56px;height:20px;border-radius:10px;' + shimmerStyle + 'animation-delay:' + delay + ';"></div>';
    // Grupo badge
    html += '<div style="width:68px;height:20px;border-radius:10px;' + shimmerStyle + 'animation-delay:' + delay + ';"></div>';
    // Level badge
    html += '<div style="width:48px;height:20px;border-radius:10px;' + shimmerStyle + 'animation-delay:' + delay + ';"></div>';
    // Actions
    html += '<div style="width:48px;height:16px;border-radius:3px;' + shimmerStyle + 'animation-delay:' + delay + ';"></div>';
    html += '</div>';
  }
  html += '</div>';
  html += '<style>@keyframes pna-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}</style>';
  container.innerHTML = html;
  log('debug', 'showSkeleton rendered', { rows: rows });
}

function clear(refs: Record<string, unknown>) {
  if (!refs) return;
  var container = (refs.itemsContainer || refs.itemsList || refs.tableBody) as HTMLElement | null;
  if (container) container.innerHTML = '';
  log('debug', 'items cleared');
}

function getSelectedIds(refs: Record<string, unknown>) {
  if (!refs) return [];
  var container = (refs.itemsContainer || refs.itemsList || refs.tableBody) as HTMLElement | null;
  if (!container) return [];
  var selected = container.querySelectorAll('.pna-list-item--selected, .pna-list-item[data-selected="true"], .pna-item--selected, .pna-item[data-selected="true"], input[type="checkbox"]:checked');
  var ids = [];
  for (var i = 0; i < selected.length; i++) {
    var el = selected[i];
    var itemEl = el.closest('.pna-list-item') || el.closest('.pna-item') || el;
    var id = itemEl.getAttribute('data-item-id');
    if (id) ids.push(id);
  }
  return ids;
}

function selectRow(itemId: string, highlight: boolean) {
  if (!itemId) return;
  var el = document.querySelector('.pna-list-item[data-item-id="' + itemId + '"], .pna-item[data-item-id="' + itemId + '"]');
  if (!el) return;
  if (highlight === false) {
    el.classList.remove('pna-list-item--selected', 'pna-item--selected', 'pna-item--highlight');
    el.removeAttribute('data-selected');
    return;
  }
  var prev = document.querySelectorAll('.pna-list-item--selected, .pna-item--selected');
  for (var i = 0; i < prev.length; i++) {
    prev[i].classList.remove('pna-list-item--selected', 'pna-item--selected');
    prev[i].removeAttribute('data-selected');
  }
  el.classList.add('pna-list-item--selected');
  el.setAttribute('data-selected', 'true');
  if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  log('debug', 'selectRow', { itemId: itemId, highlight: highlight });
}

function selectAllRows(refs: Record<string, unknown>, selected: boolean) {
  if (!refs) return;
  var container = (refs.itemsContainer || refs.itemsList || refs.tableBody) as HTMLElement | null;
  if (!container) return;
  var items = container.querySelectorAll('.pna-list-item, .pna-item');
  for (var i = 0; i < items.length; i++) {
    if (selected) {
      items[i].classList.add('pna-list-item--selected');
      items[i].setAttribute('data-selected', 'true');
    } else {
      items[i].classList.remove('pna-list-item--selected');
      items[i].removeAttribute('data-selected');
    }
  }
  log('debug', 'selectAllRows', { selected: selected, count: items.length });
}

function setDragging(itemId: string, isDragging: boolean) {
  if (!itemId) return;
  var el = document.querySelector('.pna-list-item[data-item-id="' + itemId + '"], .pna-item[data-item-id="' + itemId + '"]') as HTMLElement;
  if (!el) return;
  if (isDragging) {
    el.classList.add('dragging');
  } else {
    el.classList.remove('dragging');
  }
}

function setDropTarget(itemId: string | null, isAbove: boolean | null) {
  // Limpar todos os drop targets anteriores
  var prev = document.querySelectorAll('.pna-list-item.drop-above, .pna-list-item.drop-below');
  for (var i = 0; i < prev.length; i++) {
    prev[i].classList.remove('drop-above', 'drop-below');
  }
  if (!itemId) return;
  var el = document.querySelector('.pna-list-item[data-item-id="' + itemId + '"], .pna-item[data-item-id="' + itemId + '"]');
  if (!el) return;
  if (isAbove === null) return;
  el.classList.add(isAbove ? 'drop-above' : 'drop-below');
}

function startInlineEdit(itemId: string, field: string) {
  if (!itemId || !field) return null;
  var el = document.querySelector('.pna-list-item[data-item-id="' + itemId + '"], .pna-item[data-item-id="' + itemId + '"]');
  if (!el) return null;
  var fieldEl = el.querySelector('.pna-item-' + field) || el.querySelector('.pna-item__' + field) || el.querySelector('[data-field="' + field + '"]');
  if (!fieldEl) fieldEl = el.querySelector('.pna-item-label') || el.querySelector('.pna-item__label');
  var originalValue = fieldEl ? fieldEl.textContent : '';
  if (fieldEl) {
    fieldEl.setAttribute('contenteditable', 'true');
    fieldEl.classList.add('pna-item__field--editing');
    (fieldEl as HTMLElement).focus();
    if (window.getSelection && document.createRange) {
      var range = document.createRange();
      range.selectNodeContents(fieldEl);
      var sel = window.getSelection();
      sel!.removeAllRanges();
      sel!.addRange(range);
    }
  }
  el.classList.add('pna-list-item--editing');
  log('debug', 'startInlineEdit', { itemId: itemId, field: field });
  return { itemId: itemId, field: field, originalValue: originalValue, element: fieldEl };
}

function endInlineEdit(itemId: string) {
  if (!itemId) return;
  var el = document.querySelector('.pna-list-item[data-item-id="' + itemId + '"], .pna-item[data-item-id="' + itemId + '"]');
  if (!el) return;
  var editingFields = el.querySelectorAll('[contenteditable="true"]');
  for (var i = 0; i < editingFields.length; i++) {
    editingFields[i].removeAttribute('contenteditable');
    editingFields[i].classList.remove('pna-item__field--editing');
  }
  el.classList.remove('pna-list-item--editing');
  log('debug', 'endInlineEdit', { itemId: itemId });
}

// v12.3.0: Improved grouped list with icon, alphabetical sort, collapsible headers (MELHORIA 3)
function renderGroupedItemsList(groups: Record<string, Record<string, unknown>[]>, sections: Record<string, Record<string, unknown>>, collapsedGroups: Set<string>) {
  if (!groups || Object.keys(groups).length === 0) {
    return '<div class="pna-empty" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:200px;padding:2rem;text-align:center;color:rgba(255,255,255,0.5);"><p style="margin:0;font-size:0.9rem;">Nenhum item de navegação encontrado</p></div>';
  }
  var html = '';
  // MELHORIA 3e: Grupos ordenados alfabeticamente
  var sectionKeys = Object.keys(groups).sort(function(a, b) {
    var metaA = (sections && sections[a]) || {};
    var metaB = (sections && sections[b]) || {};
    var labelA = ((metaA.label as string) || (metaA.displayLabel as string) || a).toLowerCase();
    var labelB = ((metaB.label as string) || (metaB.displayLabel as string) || b).toLowerCase();
    return labelA < labelB ? -1 : labelA > labelB ? 1 : 0;
  });
  for (var s = 0; s < sectionKeys.length; s++) {
    var sectionKey = sectionKeys[s];
    var sectionItems = groups[sectionKey];
    var sectionMeta = (sections && sections[sectionKey]) || {};
    var sectionLabel = (sectionMeta.label as string) || (sectionMeta.displayLabel as string) || sectionKey;
    var isCollapsed = collapsedGroups.has(sectionKey);
    var chevron = isCollapsed ? '&#9654;' : '&#9660;';
    // MELHORIA 3a: Icone do grupo no cabecalho
    var sectionIcon = (sectionMeta.icon as string) || '';
    var iconHtml = sectionIcon ? '<span class="pna-group-icon" style="display:inline-flex;width:18px;height:18px;opacity:0.7;">' + _resolveNavIcon(sectionIcon) + '</span>' : '<span class="pna-group-icon" style="display:inline-flex;width:18px;height:18px;opacity:0.4;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg></span>';
    // MELHORIA 3a: contador ex: Administração (20)
    html += '<div class="pna-group-section' + (isCollapsed ? ' pna-group-section--collapsed' : '') + '" data-group-key="' + escapeHtml(sectionKey) + '">'
      + '<div class="pna-group-header" data-action="toggle-group-collapse" data-group-key="' + escapeHtml(sectionKey) + '" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;background:rgba(255,255,255,0.06);border-radius:0.375rem;margin:0.5rem 0 0.25rem;cursor:pointer;user-select:none;transition:background 0.15s;">'
      + '<span class="pna-group-chevron" style="font-size:0.7rem;opacity:0.6;transition:transform 0.2s;">' + chevron + '</span>'
      + iconHtml
      + '<span class="pna-group-label" style="font-weight:600;font-size:0.85rem;">' + escapeHtml(sectionLabel) + '</span>'
      + '<span class="pna-group-count" style="opacity:0.5;font-size:0.75rem;background:rgba(255,255,255,0.08);padding:0.1rem 0.4rem;border-radius:0.75rem;">(' + sectionItems.length + ')</span>'
      + '</div>';
    if (!isCollapsed) {
      // MELHORIA 3f: Itens mantendo ordem original (sem re-sort)
      html += '<ul class="pna-list pna-list--grouped" data-sortable="items" data-group="' + escapeHtml(sectionKey) + '">';
      for (var i = 0; i < sectionItems.length; i++) {
        html += renderItemRow(sectionItems[i], i);
      }
      html += '</ul>';
    }
    html += '</div>';
  }
  return html;
}

export { renderItemsList, renderItem, renderItemRow, renderItemRowWithZebra, renderItemForm, renderUarpsBadge, renderGroupedItemsList, updateItems, showEmptyState, showSkeleton, clear, getSelectedIds, selectRow, selectAllRows, setDragging, setDropTarget, startInlineEdit, endInlineEdit, _resolveGroupLabel, _humanizeGroupKey, VERSION, MODULE_ID };
