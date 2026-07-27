import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { PANEL_ID, PHASES } from "../core/contracts.js";
import { mapItemsToViewModel, mapSectionsToViewModel } from "../utils/mappers.js";
import { ICONS } from "./icons.js";
import { renderSkeleton, renderEmptyState, renderError, renderToast, renderKPIs } from "./render-helpers.js";
import { showItemFormModal, showSectionFormModal, showConfirmDialog, showLoadingOverlay } from "./modals.js";
import { renderDiagnosticTab, renderValidationResult } from "./diagnostic-renderer.js";
import { renderItemsList as renderItemsListSSOT, renderItemRow as renderItemRowSSOT } from "../renderer/items.js";
var MODULE_ID = "panel-nav-admin.ui.renderer";
var VERSION = "11.0.0-GRID-12COL";
var CONTEXT_LABELS = { sidebar: "Sidebar", navrail: "NavRail", header: "Header", footer: "Footer" };
var CONTEXT_CSS = { sidebar: "pna-ctx-sidebar", navrail: "pna-ctx-navrail", header: "pna-ctx-header", footer: "pna-ctx-footer" };
var Ports = createPanelPorts({ moduleId: MODULE_ID });
var _initPorts = function() {
  Ports.init();
};
var _getPort = function(name) {
  return Ports.get(name);
};
var injectPorts = function(p) {
  return Ports.inject(p);
};
var getPorts = function() {
  return Ports.snapshot();
};
var _log = function(level, msg, ctx) {
  if (!ctx) ctx = {};
  var logger = _getPort("logger");
  if (!logger || typeof logger[level] !== "function") return;
  ctx.component = MODULE_ID;
  logger[level](msg, ctx);
};
function renderPanel(state, diagnosticState) {
  if (!state) state = {};
  if (!diagnosticState) diagnosticState = {};
  var phase = state.phase;
  var items = state.items;
  var sections = state.sections;
  var filters = state.filters || {};
  var error = state.error;
  var activeTab = state.activeTab || "items";
  var kpis = state.kpis;
  var diagnosticData = diagnosticState.diagnosticData;
  var diagnosticLoading = diagnosticState.diagnosticLoading;
  var itemsVM = mapItemsToViewModel(items || []);
  var sectionsVM = mapSectionsToViewModel(sections || [], items || []);
  return '<div class="pna-panel" data-panel-id="' + PANEL_ID + '">' + _renderHeader() + _renderToolbar(filters, activeTab, itemsVM.length, sectionsVM.length, kpis) + '<main class="pna-content"><div class="pna-tab-content' + (activeTab === "items" ? " pna-tab-content-active" : "") + '" data-tab-content="items">' + renderItemsList(itemsVM, sectionsVM, phase) + '</div><div class="pna-tab-content' + (activeTab === "sections" ? " pna-tab-content-active" : "") + '" data-tab-content="sections">' + renderSectionsList(sectionsVM, phase) + '</div><div class="pna-tab-content' + (activeTab === "diagnostic" ? " pna-tab-content-active" : "") + '" data-tab-content="diagnostic">' + renderDiagnosticTab(diagnosticData, diagnosticLoading) + "</div></main>" + (error ? renderError(error) : "") + '<div class="pna-toast-container" data-toast-container></div></div>';
}
function _renderHeader() {
  return '<header class="pna-header"><div class="pna-header-left"><div class="pna-header-text"><h1 class="pna-title">Administra\xE7\xE3o de Navega\xE7\xE3o</h1><p class="pna-subtitle">Gerencie todos os triggers de navega\xE7\xE3o (Sidebar, NavRail, Header, Footer)</p></div></div><div class="pna-header-actions"><div class="pna-refresh-group"><span class="pna-countdown" data-ref="countdown">--</span><button type="button" class="pna-btn-refresh" data-action="refresh" title="Atualizar (R)">' + ICONS.refresh + '</button></div><button type="button" class="pna-btn pna-btn-ghost" data-action="export" title="Exportar JSON">' + ICONS.download + '</button><button type="button" class="pna-btn pna-btn-ghost pna-toolbar-btn--status" data-action="health-status" title="Status da Navega\xE7\xE3o">' + ICONS.health + '</button><button type="button" class="pna-btn pna-btn-ghost" data-action="audit-history" title="Hist\xF3rico de altera\xE7\xF5es"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></button><button type="button" class="pna-btn pna-btn-primary" data-action="create-item" title="Novo item (N)">' + ICONS.plus + " <span>Novo Item</span></button></div></header>";
}
function _renderToolbar(filters, activeTab, itemsCount, sectionsCount, kpis) {
  var filterContext = filters && filters.section || "all";
  var searchValue = filters && filters.search ? filters.search : "";
  var kpiData = kpis || {};
  var totalItems = kpiData.totalItems || itemsCount || 0;
  var totalSections = kpiData.totalSections || sectionsCount || 0;
  var activeItems = kpiData.activeItems || 0;
  var adminItems = kpiData.adminItems || 0;
  var kpisHtml = '<div class="pna-kpis"><div class="pna-kpi pna-kpi-primary"><div class="pna-kpi-icon">' + ICONS.link + '</div><div class="pna-kpi-content"><span class="pna-kpi-value" data-kpi-value="totalItems">' + totalItems + '</span><span class="pna-kpi-label">itens</span></div></div><div class="pna-kpi pna-kpi-secondary"><div class="pna-kpi-icon">' + ICONS.folder + '</div><div class="pna-kpi-content"><span class="pna-kpi-value" data-kpi-value="totalSections">' + totalSections + '</span><span class="pna-kpi-label">se\xE7\xF5es</span></div></div><div class="pna-kpi pna-kpi-tertiary"><div class="pna-kpi-icon">' + ICONS.check + '</div><div class="pna-kpi-content"><span class="pna-kpi-value" data-kpi-value="activeItems">' + activeItems + '</span><span class="pna-kpi-label">ativos</span></div></div><div class="pna-kpi pna-kpi-info"><div class="pna-kpi-icon">' + ICONS.shield + '</div><div class="pna-kpi-content"><span class="pna-kpi-value" data-kpi-value="adminItems">' + adminItems + '</span><span class="pna-kpi-label">admin</span></div></div></div><div style="width:1px;background:rgba(255,255,255,0.07);margin:0 0.75rem;align-self:stretch;flex-shrink:0;"></div>';
  return '<div class="pna-toolbar">' + kpisHtml + '<div class="pna-filters"><div class="pna-filter-group"><label class="pna-filter-label">' + ICONS.filter + ' Contexto</label><select class="pna-select" data-filter="section"><option value="all"' + (filterContext === "all" ? " selected" : "") + '>Todos os contextos</option><option value="sidebar"' + (filterContext === "sidebar" ? " selected" : "") + '>Sidebar</option><option value="navrail"' + (filterContext === "navrail" ? " selected" : "") + '>NavRail</option><option value="header"' + (filterContext === "header" ? " selected" : "") + '>Header</option><option value="footer"' + (filterContext === "footer" ? " selected" : "") + '>Footer</option></select></div><div class="pna-filter-group pna-filter-search"><label class="pna-filter-label">' + ICONS.search + ' Buscar</label><input type="text" class="pna-input" data-filter="search" placeholder="Filtrar por label, id ou rota... (/)" value="' + searchValue + '"></div><div class="pna-filter-group"><label class="pna-filter-label">Grupo</label><select class="pna-select" data-filter="group"><option value="">Todos os grupos</option></select></div><div class="pna-view-toggles" style="margin-left:auto;flex-shrink:0;display:flex;align-items:center;gap:0.25rem;"><button type="button" class="pna-btn pna-btn-ghost pna-btn--sm pna-btn-icon-only" data-action="toggle-group-view" title="Agrupar por se\xE7\xE3o"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></button><button type="button" class="pna-btn pna-btn-ghost pna-btn--sm pna-btn-icon-only" data-action="toggle-compact-mode" title="Modo compacto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button></div></div><div class="pna-tabs"><button type="button" class="pna-tab' + (activeTab === "items" ? " pna-tab-active" : "") + '" data-tab="items">Itens (' + itemsCount + ')</button><button type="button" class="pna-tab' + (activeTab === "sections" ? " pna-tab-active" : "") + '" data-tab="sections">Grupos (' + sectionsCount + ')</button><button type="button" class="pna-tab' + (activeTab === "diagnostic" ? " pna-tab-active" : "") + '" data-tab="diagnostic">' + ICONS.health + " Diagn\xF3stico</button></div></div>";
}
function renderItemsList(items, sections, phase) {
  if (phase === PHASES.LOADING) return renderSkeleton(6);
  if (!items || items.length === 0) return renderEmptyState("Nenhum item de navega\xE7\xE3o encontrado", 'Clique em "Novo Item" para criar o primeiro.');
  return '<div class="pna-items-list">' + renderItemsListSSOT(items, { searchTerm: "" }) + "</div>";
}
function renderItemRow(item, index) {
  return renderItemRowSSOT(item, index);
}
function renderSectionsList(sections, phase) {
  if (phase === PHASES.LOADING) return renderSkeleton(3);
  var cardsHtml = "";
  for (var i = 0; i < sections.length; i++) {
    cardsHtml += renderSectionCard(sections[i]);
  }
  return '<div class="pna-sections-list"><div class="pna-sections-header"><h3 class="pna-sections-title">Grupos de Navega\xE7\xE3o</h3><button type="button" class="pna-btn pna-btn-secondary" data-action="create-section">' + ICONS.plus + ' Novo Grupo</button></div><div class="pna-sections-grid">' + cardsHtml + "</div></div>";
}
function renderSectionCard(section) {
  var context = section.context || "sidebar";
  var contextLabel = CONTEXT_LABELS[context] || context;
  var contextCss = CONTEXT_CSS[context] || "";
  return '<div class="pna-section-card" data-section-key="' + section.key + '"><div class="pna-section-header"><span class="pna-section-icon">' + ICONS.folder + '</span><div class="pna-section-info"><h4 class="pna-section-name">' + section.displayLabel + '</h4><span class="pna-section-key">key: ' + section.key + '</span></div><span class="pna-badge pna-badge-context ' + contextCss + '" style="font-size:0.65rem;padding:1px 6px;">' + contextLabel + '</span><span class="pna-section-order">Ordem: ' + section.order + '</span></div><div class="pna-section-stats"><span class="pna-section-count">' + section.itemCount + " " + (section.itemCount === 1 ? "item" : "itens") + '</span></div><div class="pna-section-actions"><button type="button" class="pna-btn-icon" data-action="edit-section" data-section-key="' + section.key + '" title="Editar grupo">' + ICONS.edit + "</button>" + (section.key !== "main" && section.key !== "sidebar.main" ? '<button type="button" class="pna-btn-icon pna-btn-danger" data-action="delete-section" data-section-key="' + section.key + '" title="Excluir grupo">' + ICONS.trash + "</button>" : "") + "</div></div>";
}
function renderItemForm() {
  _log("warn", "renderItemForm deprecated, use showItemFormModal");
  return "";
}
function renderSectionForm() {
  _log("warn", "renderSectionForm deprecated, use showSectionFormModal");
  return "";
}
function renderConfirmModal() {
  _log("warn", "renderConfirmModal deprecated, use showConfirmDialog");
  return "";
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      iconsCount: Object.keys(ICONS).length,
      portsReady: !!Ports
    }
  };
}
var ui = {
  renderPanel,
  renderKPIs,
  renderItemsList,
  renderItemRow,
  renderSectionsList,
  renderSectionCard,
  showItemFormModal,
  showSectionFormModal,
  showConfirmDialog,
  showLoadingOverlay,
  renderSkeleton,
  renderEmptyState,
  renderError,
  renderToast,
  renderDiagnosticTab,
  renderValidationResult,
  ICONS,
  injectPorts,
  getPorts,
  info,
  healthCheck
};
var renderer_default = ui;
export {
  ICONS,
  MODULE_ID,
  VERSION,
  renderer_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  renderConfirmModal,
  renderDiagnosticTab,
  renderEmptyState,
  renderError,
  renderItemForm,
  renderItemRow,
  renderItemsList,
  renderKPIs,
  renderPanel,
  renderSectionCard,
  renderSectionForm,
  renderSectionsList,
  renderSkeleton,
  renderToast,
  renderValidationResult,
  showConfirmDialog,
  showItemFormModal,
  showLoadingOverlay,
  showSectionFormModal,
  ui
};
