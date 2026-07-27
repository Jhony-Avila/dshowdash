

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-SPLIT-COLUMNS)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.renderer
// PURPOSE: Main UI Renderer — Unified SSOT (sidebar+navrail+header+footer)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_ID, PHASES from ../core/contracts.js
//   mapItemsToViewModel, mapSectionsToViewModel from ../utils/mappers.js
//   ICONS from ./icons.js
//   renderSkeleton, renderEmptyState, renderError, renderToast, renderKPIs from ./render-helpers.js
//   showItemFormModal, showSectionFormModal, showConfirmDialog, showLoadingOverlay from ./modals.js
//   renderDiagnosticTab, renderValidationResult from ./diagnostic-renderer.js
//
// PROVIDES:
//   MODULE_ID, VERSION, injectPorts, getPorts, renderPanel, renderItemsList,
//   renderItemRow, renderSectionsList, renderSectionCard, renderItemForm,
//   renderSectionForm, renderConfirmModal, info, healthCheck, ui
//
// @changelog
//   10.2.0-SPLIT-COLUMNS: Split "Item" column into "Item" (label) + "ID" (technical id).
//     Table now has 8 columns: #, Item, ID, Rota/Painel, Contexto, Grupo, Nível, Ações.
//     renderItemRow outputs pna-col-label (label only) and pna-col-id (id only).
//   10.1.0-HEADER-SSOT: FIX — renderItemsList no longer generates .pna-list-header.
//   10.0.0-UNIFIED-SSOT: MAJOR — Unified rendering for all 4 navigation contexts.
//   9.3.0-P2-ENTERPRISE: Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { PANEL_ID, PHASES } from '../core/contracts.js';
import { mapItemsToViewModel, mapSectionsToViewModel } from '../utils/mappers.js';

import { ICONS } from './icons.js';
import { renderSkeleton, renderEmptyState, renderError, renderToast, renderKPIs } from './render-helpers.js';
import { showItemFormModal, showSectionFormModal, showConfirmDialog, showLoadingOverlay } from './modals.js';
import { renderDiagnosticTab, renderValidationResult } from './diagnostic-renderer.js';
// v11.0.0-GRID-12COL: Delegate the items list (header + rows) to the 12-column SSOT
// renderer (renderer/items.ts). This eliminates the divergent legacy 8-column header
// that caused header/cell misalignment when updateItems() replaced only the rows.
import { renderItemsList as renderItemsListSSOT, renderItemRow as renderItemRowSSOT } from '../renderer/items.js';

export { renderDiagnosticTab, renderValidationResult };
export { renderSkeleton, renderEmptyState, renderError, renderToast, renderKPIs };
export { showItemFormModal, showSectionFormModal, showConfirmDialog, showLoadingOverlay };
export { ICONS };

export var MODULE_ID = 'panel-nav-admin.ui.renderer';
export var VERSION = '11.0.0-GRID-12COL';

var CONTEXT_LABELS = { sidebar: 'Sidebar', navrail: 'NavRail', header: 'Header', footer: 'Footer' };
var CONTEXT_CSS = { sidebar: 'pna-ctx-sidebar', navrail: 'pna-ctx-navrail', header: 'pna-ctx-header', footer: 'pna-ctx-footer' };

// ═══════════════════════════════════════════════════════════════
// PORTS
// ═══════════════════════════════════════════════════════════════

var Ports = createPanelPorts({ moduleId: MODULE_ID });

var _initPorts = function() { Ports.init(); };
var _getPort = function(name: string) { return Ports.get(name); };

export var injectPorts = function(p: unknown) { return Ports.inject(p); };
export var getPorts = function() { return Ports.snapshot(); };

var _log = function(level: string, msg: string, ctx?: Record<string, unknown>) {
    if (!ctx) ctx = {};
    var logger = _getPort('logger');
    if (!logger || typeof logger[level] !== 'function') return;
    ctx.component = MODULE_ID;
    logger[level](msg, ctx);
};

// ═══════════════════════════════════════════════════════════════
// MAIN PANEL RENDER
// ═══════════════════════════════════════════════════════════════

export function renderPanel(state: Record<string, unknown>, diagnosticState: Record<string, unknown>) {
    if (!state) state = {};
    if (!diagnosticState) diagnosticState = {};

    var phase = state.phase as string;
    var items = state.items;
    var sections = state.sections;
    var filters = (state.filters || {}) as Record<string, unknown>;
    var error = state.error;
    var activeTab = (state.activeTab || 'items') as string;
    var kpis = state.kpis;
    var diagnosticData = diagnosticState.diagnosticData;
    var diagnosticLoading = diagnosticState.diagnosticLoading;
    var itemsVM = mapItemsToViewModel((items as Record<string, unknown>[]) || []);
    var sectionsVM = mapSectionsToViewModel((sections as Record<string, unknown>[]) || [], (items as Record<string, unknown>[]) || []);

    return '<div class="pna-panel" data-panel-id="' + PANEL_ID + '">'
        + _renderHeader()
        + _renderToolbar(filters, activeTab, itemsVM.length, sectionsVM.length, kpis as Record<string, unknown>)
        + '<main class="pna-content">'
        + '<div class="pna-tab-content' + (activeTab === 'items' ? ' pna-tab-content-active' : '') + '" data-tab-content="items">'
        + renderItemsList(itemsVM, sectionsVM, phase)
        + '</div>'
        + '<div class="pna-tab-content' + (activeTab === 'sections' ? ' pna-tab-content-active' : '') + '" data-tab-content="sections">'
        + renderSectionsList(sectionsVM, phase)
        + '</div>'
        + '<div class="pna-tab-content' + (activeTab === 'diagnostic' ? ' pna-tab-content-active' : '') + '" data-tab-content="diagnostic">'
        + (renderDiagnosticTab as unknown as (data: Record<string, unknown>, loading: boolean) => string)(diagnosticData as Record<string, unknown>, diagnosticLoading as boolean)
        + '</div>'
        + '</main>'
        + (error ? renderError(error as Error | string) : '')
        + '<div class="pna-toast-container" data-toast-container></div>'
        + '</div>';
}

// ═══════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════

function _renderHeader() {
    return '<header class="pna-header">'
        + '<div class="pna-header-left">'
        + '<div class="pna-header-text">'
        + '<h1 class="pna-title">Administração de Navegação</h1>'
        + '<p class="pna-subtitle">Gerencie todos os triggers de navegação (Sidebar, NavRail, Header, Footer)</p>'
        + '</div>'
        + '</div>'
        + '<div class="pna-header-actions">'
        + '<div class="pna-refresh-group">'
        + '<span class="pna-countdown" data-ref="countdown">--</span>'
        + '<button type="button" class="pna-btn-refresh" data-action="refresh" title="Atualizar (R)">' + ICONS.refresh + '</button>'
        + '</div>'
        + '<button type="button" class="pna-btn pna-btn-ghost" data-action="export" title="Exportar JSON">' + ICONS.download + '</button>'
        + '<button type="button" class="pna-btn pna-btn-ghost pna-toolbar-btn--status" data-action="health-status" title="Status da Navegação">' + ICONS.health + '</button>'
        + '<button type="button" class="pna-btn pna-btn-ghost" data-action="audit-history" title="Histórico de alterações"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></button>'
        + '<button type="button" class="pna-btn pna-btn-primary" data-action="create-item" title="Novo item (N)">' + ICONS.plus + ' <span>Novo Item</span></button>'
        + '</div>'
        + '</header>';
}

// ═══════════════════════════════════════════════════════════════
// TOOLBAR
// ═══════════════════════════════════════════════════════════════

function _renderToolbar(filters: Record<string, unknown>, activeTab: string, itemsCount: number, sectionsCount: number, kpis?: Record<string, unknown>) {
    var filterContext = (filters && filters.section) || 'all';
    var searchValue = (filters && filters.search) ? filters.search : '';
    var kpiData = kpis || {};
    var totalItems = (kpiData.totalItems as number) || itemsCount || 0;
    var totalSections = (kpiData.totalSections as number) || sectionsCount || 0;
    var activeItems = (kpiData.activeItems as number) || 0;
    var adminItems = (kpiData.adminItems as number) || 0;

    var kpisHtml = '<div class="pna-kpis">'
        + '<div class="pna-kpi pna-kpi-primary"><div class="pna-kpi-icon">' + ICONS.link + '</div><div class="pna-kpi-content"><span class="pna-kpi-value" data-kpi-value="totalItems">' + totalItems + '</span><span class="pna-kpi-label">itens</span></div></div>'
        + '<div class="pna-kpi pna-kpi-secondary"><div class="pna-kpi-icon">' + ICONS.folder + '</div><div class="pna-kpi-content"><span class="pna-kpi-value" data-kpi-value="totalSections">' + totalSections + '</span><span class="pna-kpi-label">seções</span></div></div>'
        + '<div class="pna-kpi pna-kpi-tertiary"><div class="pna-kpi-icon">' + ICONS.check + '</div><div class="pna-kpi-content"><span class="pna-kpi-value" data-kpi-value="activeItems">' + activeItems + '</span><span class="pna-kpi-label">ativos</span></div></div>'
        + '<div class="pna-kpi pna-kpi-info"><div class="pna-kpi-icon">' + ICONS.shield + '</div><div class="pna-kpi-content"><span class="pna-kpi-value" data-kpi-value="adminItems">' + adminItems + '</span><span class="pna-kpi-label">admin</span></div></div>'
        + '</div>'
        + '<div style="width:1px;background:rgba(255,255,255,0.07);margin:0 0.75rem;align-self:stretch;flex-shrink:0;"></div>';

    return '<div class="pna-toolbar">'
        + kpisHtml
        + '<div class="pna-filters">'
        + '<div class="pna-filter-group">'
        + '<label class="pna-filter-label">' + ICONS.filter + ' Contexto</label>'
        + '<select class="pna-select" data-filter="section">'
        + '<option value="all"' + (filterContext === 'all' ? ' selected' : '') + '>Todos os contextos</option>'
        + '<option value="sidebar"' + (filterContext === 'sidebar' ? ' selected' : '') + '>Sidebar</option>'
        + '<option value="navrail"' + (filterContext === 'navrail' ? ' selected' : '') + '>NavRail</option>'
        + '<option value="header"' + (filterContext === 'header' ? ' selected' : '') + '>Header</option>'
        + '<option value="footer"' + (filterContext === 'footer' ? ' selected' : '') + '>Footer</option>'
        + '</select>'
        + '</div>'
        + '<div class="pna-filter-group pna-filter-search">'
        + '<label class="pna-filter-label">' + ICONS.search + ' Buscar</label>'
        + '<input type="text" class="pna-input" data-filter="search" placeholder="Filtrar por label, id ou rota... (/)" value="' + searchValue + '">'
        + '</div>'
        + '<div class="pna-filter-group">'
        + '<label class="pna-filter-label">Grupo</label>'
        + '<select class="pna-select" data-filter="group">'
        + '<option value="">Todos os grupos</option>'
        + '</select>'
        + '</div>'
        + '<div class="pna-view-toggles" style="margin-left:auto;flex-shrink:0;display:flex;align-items:center;gap:0.25rem;">'
        + '<button type="button" class="pna-btn pna-btn-ghost pna-btn--sm pna-btn-icon-only" data-action="toggle-group-view" title="Agrupar por seção"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></button>'
        + '<button type="button" class="pna-btn pna-btn-ghost pna-btn--sm pna-btn-icon-only" data-action="toggle-compact-mode" title="Modo compacto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>'
        + '</div>'
        + '</div>'
        + '<div class="pna-tabs">'
        + '<button type="button" class="pna-tab' + (activeTab === 'items' ? ' pna-tab-active' : '') + '" data-tab="items">Itens (' + itemsCount + ')</button>'
        + '<button type="button" class="pna-tab' + (activeTab === 'sections' ? ' pna-tab-active' : '') + '" data-tab="sections">Grupos (' + sectionsCount + ')</button>'
        + '<button type="button" class="pna-tab' + (activeTab === 'diagnostic' ? ' pna-tab-active' : '') + '" data-tab="diagnostic">' + ICONS.health + ' Diagnóstico</button>'
        + '</div>'
        + '</div>';
}

// ═══════════════════════════════════════════════════════════════
// ITEMS LIST — No header here. Header is SSOT from renderer/items.js.
// ═══════════════════════════════════════════════════════════════

// v11.0.0-GRID-12COL: Delegate to the 12-column SSOT renderer (renderer/items.ts).
// Previously this emitted a divergent 8-column header/rows; when updateItems() later
// replaced only the <ul> rows with the 12-column SSOT rows, the stale 8-column header
// stayed on top → the header/cell misalignment reported on screen. Now header AND rows
// come from a single source, so they are always 1:1 aligned (12 columns).
export function renderItemsList(items: Record<string, unknown>[], sections: Record<string, unknown>[], phase: string) {
    if (phase === PHASES.LOADING) return renderSkeleton(6);
    if (!items || items.length === 0) return renderEmptyState('Nenhum item de navegação encontrado', 'Clique em "Novo Item" para criar o primeiro.');

    // Wrapper preserved (.pna-items-list) so container/ref detection stays identical.
    return '<div class="pna-items-list">'
        + renderItemsListSSOT(items, { searchTerm: '' })
        + '</div>';
}

// v11.0.0-GRID-12COL: kept for backward-compat of the `ui` export object; delegates to
// the 12-column SSOT row renderer so any direct caller also gets aligned 12-column rows.
export function renderItemRow(item: Record<string, unknown>, index: number) {
    return renderItemRowSSOT(item, index);
}

// ═══════════════════════════════════════════════════════════════
// SECTIONS LIST
// ═══════════════════════════════════════════════════════════════

export function renderSectionsList(sections: Record<string, unknown>[], phase: string) {
    if (phase === PHASES.LOADING) return renderSkeleton(3);

    var cardsHtml = '';
    for (var i = 0; i < sections.length; i++) {
        cardsHtml += renderSectionCard(sections[i]);
    }

    return '<div class="pna-sections-list">'
        + '<div class="pna-sections-header">'
        + '<h3 class="pna-sections-title">Grupos de Navegação</h3>'
        + '<button type="button" class="pna-btn pna-btn-secondary" data-action="create-section">' + ICONS.plus + ' Novo Grupo</button>'
        + '</div>'
        + '<div class="pna-sections-grid">'
        + cardsHtml
        + '</div>'
        + '</div>';
}

export function renderSectionCard(section: Record<string, unknown>) {
    var context = (section.context || 'sidebar') as string;
    var contextLabel = (CONTEXT_LABELS as Record<string, string>)[context] || context;
    var contextCss = (CONTEXT_CSS as Record<string, string>)[context] || '';

    return '<div class="pna-section-card" data-section-key="' + section.key + '">'
        + '<div class="pna-section-header">'
        + '<span class="pna-section-icon">' + ICONS.folder + '</span>'
        + '<div class="pna-section-info">'
        + '<h4 class="pna-section-name">' + section.displayLabel + '</h4>'
        + '<span class="pna-section-key">key: ' + section.key + '</span>'
        + '</div>'
        + '<span class="pna-badge pna-badge-context ' + contextCss + '" style="font-size:0.65rem;padding:1px 6px;">' + contextLabel + '</span>'
        + '<span class="pna-section-order">Ordem: ' + section.order + '</span>'
        + '</div>'
        + '<div class="pna-section-stats">'
        + '<span class="pna-section-count">' + section.itemCount + ' ' + (section.itemCount === 1 ? 'item' : 'itens') + '</span>'
        + '</div>'
        + '<div class="pna-section-actions">'
        + '<button type="button" class="pna-btn-icon" data-action="edit-section" data-section-key="' + section.key + '" title="Editar grupo">' + ICONS.edit + '</button>'
        + (section.key !== 'main' && section.key !== 'sidebar.main'
            ? '<button type="button" class="pna-btn-icon pna-btn-danger" data-action="delete-section" data-section-key="' + section.key + '" title="Excluir grupo">' + ICONS.trash + '</button>'
            : '')
        + '</div>'
        + '</div>';
}

// ═══════════════════════════════════════════════════════════════
// DEPRECATED
// ═══════════════════════════════════════════════════════════════

export function renderItemForm() { _log('warn', 'renderItemForm deprecated, use showItemFormModal'); return ''; }
export function renderSectionForm() { _log('warn', 'renderSectionForm deprecated, use showSectionFormModal'); return ''; }
export function renderConfirmModal() { _log('warn', 'renderConfirmModal deprecated, use showConfirmDialog'); return ''; }

// ═══════════════════════════════════════════════════════════════
// INFO / HEALTH
// ═══════════════════════════════════════════════════════════════

export function info() {
    return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
    return {
        status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
        moduleId: MODULE_ID,
        version: VERSION,
        checks: {
            iconsCount: Object.keys(ICONS).length,
            portsReady: !!Ports
        }
    };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export var ui = {
    renderPanel: renderPanel,
    renderKPIs: renderKPIs,
    renderItemsList: renderItemsList,
    renderItemRow: renderItemRow,
    renderSectionsList: renderSectionsList,
    renderSectionCard: renderSectionCard,
    showItemFormModal: showItemFormModal,
    showSectionFormModal: showSectionFormModal,
    showConfirmDialog: showConfirmDialog,
    showLoadingOverlay: showLoadingOverlay,
    renderSkeleton: renderSkeleton,
    renderEmptyState: renderEmptyState,
    renderError: renderError,
    renderToast: renderToast,
    renderDiagnosticTab: renderDiagnosticTab,
    renderValidationResult: renderValidationResult,
    ICONS: ICONS,
    injectPorts: injectPorts,
    getPorts: getPorts,
    info: info,
    healthCheck: healthCheck
};

export default ui;
