import { store } from "../state/store.js";
import { tracker } from "../telemetry/tracker.js";
import * as navAdapter from "./nav-adapter.js";
import { mapItemsToViewModel, mapSectionsToViewModel } from "../utils/mappers.js";
import { calculateKPIs } from "../utils/kpi-calculator.js";
import { updateItems, showEmptyState } from "../renderer/items.js";
import { updateSections, updateFilterOptions, updateGroupFilterOptions } from "../renderer/sections.js";
import { updateLoading, updateError, hideStatus } from "../renderer/status.js";
import { animateCountUp, animateProgressRing, updateKPITrend, updateKPIStatus, updateSyncTime } from "../renderer/effects.js";
const MODULE_ID = "panel-nav-admin-data-loader";
const VERSION = "9.5.0-REFS-SORTABLE-FALLBACK";
let _previousKPIs = null;
function _ensureItemsRef(refs, container) {
  if (refs && (refs.itemsContainer || refs.itemsList || refs.tableBody)) {
    return refs;
  }
  var panelEl = container || refs && refs.container || null;
  if (!panelEl && typeof document !== "undefined") {
    panelEl = document.querySelector(".pna-panel");
  }
  if (!panelEl) return refs || {};
  var itemsList = panelEl.querySelector(".pna-items-list") || panelEl.querySelector(".pna-list[data-sortable]") || panelEl.querySelector("[data-items-list]");
  var itemsContainer = panelEl.querySelector(".pna-items") || panelEl.querySelector("[data-items]");
  if (!itemsList && !itemsContainer) {
    var tabContent = panelEl.querySelector('.pna-tab-content[data-tab-content="items"]');
    if (tabContent) {
      var ulInTab = tabContent.querySelector(".pna-list[data-sortable]");
      if (ulInTab) {
        itemsList = ulInTab;
      } else {
        itemsContainer = tabContent;
      }
    }
  }
  if (!itemsList && !itemsContainer) {
    var mainContent = panelEl.querySelector(".pna-content");
    if (mainContent) {
      var ulInMain = mainContent.querySelector(".pna-list[data-sortable]");
      if (ulInMain) {
        itemsList = ulInMain;
      } else {
        itemsContainer = mainContent;
      }
    }
  }
  if (!itemsList && !itemsContainer) return refs || {};
  return Object.assign({}, refs || {}, {
    itemsList: itemsList || refs && refs.itemsList || null,
    itemsContainer: itemsContainer || refs && refs.itemsContainer || null
  });
}
function _ensureKpiRefs(refs, container) {
  if (refs && refs.kpiTotalItems) return refs;
  var panelEl = container || refs && refs.container || null;
  if (!panelEl && typeof document !== "undefined") {
    panelEl = document.querySelector(".pna-panel");
  }
  if (!panelEl) return refs || {};
  var kpiCards = panelEl.querySelectorAll(".pna-kpi-card");
  if (kpiCards.length === 0) return refs || {};
  var kpiValues = panelEl.querySelectorAll(".pna-kpi-value");
  var patched = Object.assign({}, refs || {});
  if (kpiValues.length >= 1) patched.kpiTotalItems = kpiValues[0];
  if (kpiValues.length >= 2) patched.kpiTotalSections = kpiValues[1];
  if (kpiValues.length >= 3) patched.kpiActiveItems = kpiValues[2];
  if (kpiValues.length >= 4) patched.kpiAdminItems = kpiValues[3];
  var kpiTrends = panelEl.querySelectorAll(".pna-kpi-trend");
  if (kpiTrends.length >= 1) patched.kpiTotalItemsTrend = kpiTrends[0];
  if (kpiTrends.length >= 2) patched.kpiTotalSectionsTrend = kpiTrends[1];
  if (kpiTrends.length >= 3) patched.kpiActiveItemsTrend = kpiTrends[2];
  return patched;
}
function updateStatusIndicator(refs, status) {
  if (!refs || !refs.statusDot) return;
  refs.statusDot.classList.remove("pna-status-dot--healthy", "pna-status-dot--warning", "pna-status-dot--error", "pna-status-dot--loading");
  refs.statusDot.classList.add(`pna-status-dot--${status}`);
  const titles = { healthy: "Sistema operacional", warning: "Aten\xE7\xE3o necess\xE1ria", error: "Erro no sistema", loading: "Carregando..." };
  refs.statusDot.title = titles[status] || "";
}
function updateKPIsWithAnimations(refs, container, kpis) {
  var effectiveRefs = _ensureKpiRefs(refs, container);
  if (!effectiveRefs) return;
  animateCountUp(effectiveRefs.kpiTotalItems, kpis.totalItems, 600);
  animateCountUp(effectiveRefs.kpiTotalSections, kpis.totalSections, 600);
  animateCountUp(effectiveRefs.kpiActiveItems, kpis.activeItems, 600);
  if (effectiveRefs.kpiAdminItems) animateCountUp(effectiveRefs.kpiAdminItems, kpis.adminItems || 0, 600);
  if (_previousKPIs) {
    updateKPITrend(effectiveRefs.kpiTotalItemsTrend, kpis.totalItems, _previousKPIs.totalItems);
    updateKPITrend(effectiveRefs.kpiTotalSectionsTrend, kpis.totalSections, _previousKPIs.totalSections);
    updateKPITrend(effectiveRefs.kpiActiveItemsTrend, kpis.activeItems, _previousKPIs.activeItems);
  }
  if (effectiveRefs.kpiCoverage) effectiveRefs.kpiCoverage.textContent = `${kpis.coverage}%`;
  if (effectiveRefs.coverageRingFill) animateProgressRing(effectiveRefs.coverageRingFill, kpis.coverage);
  if (container) {
    const kpiEls = container.querySelectorAll("[data-kpi]");
    for (let i = 0; i < kpiEls.length; i++) {
      const el = kpiEls[i];
      const kpiType = el.dataset.kpi;
      let value = 75;
      if (kpiType === "coverage") value = kpis.coverage;
      else if (kpiType === "activeItems" && kpis.totalItems > 0) value = kpis.activeItems / kpis.totalItems * 100;
      else if (kpiType === "totalItems") value = kpis.totalItems > 10 ? 100 : kpis.totalItems * 10;
      updateKPIStatus(el, value, { excellent: 90, good: 70, warning: 50 });
    }
  }
  _previousKPIs = { totalItems: kpis.totalItems, totalSections: kpis.totalSections, activeItems: kpis.activeItems, coverage: kpis.coverage };
}
async function loadData(refs, container, filterChipsHandlers, metrics) {
  store.markLoading();
  var _loadingTimer = setTimeout(function() {
    updateLoading(refs, true);
    updateStatusIndicator(refs, "loading");
  }, 300);
  tracker.trackLoadStart();
  try {
    const results = await Promise.all([navAdapter.getItems(), navAdapter.getSections(), navAdapter.getIcons()]);
    const items = results[0];
    const sections = results[1];
    const icons = results[2];
    store.setItems(items);
    store.setSections(sections);
    if (typeof window !== "undefined") window.__pnaSections = sections;
    store.setIcons(icons);
    const kpis = calculateKPIs(items, sections);
    updateKPIsWithAnimations(refs, container, kpis);
    store.setKPIs(kpis);
    const filters = store.get("filters") || {};
    const searchTerm = filters.search || "";
    const itemsVM = mapItemsToViewModel(items || []);
    var effectiveRefs = _ensureItemsRef(refs, container);
    if (itemsVM.length === 0) {
      showEmptyState(effectiveRefs);
    } else {
      updateItems(effectiveRefs, itemsVM, searchTerm);
    }
    const sectionsVM = mapSectionsToViewModel(sections || [], itemsVM || []);
    updateSections(refs, sectionsVM);
    updateFilterOptions(refs, sectionsVM);
    var panelContainer = refs && refs.container;
    if (!panelContainer && typeof document !== "undefined") panelContainer = document.querySelector(".pna-panel");
    updateGroupFilterOptions(panelContainer, sectionsVM);
    if (filterChipsHandlers && filterChipsHandlers.updateFilterCounter) {
      filterChipsHandlers.updateFilterCounter(itemsVM.length, items.length);
    }
    clearTimeout(_loadingTimer);
    store.markReady();
    hideStatus(refs);
    updateLoading(refs, false);
    updateStatusIndicator(refs, "healthy");
    if (refs && refs.syncTime) updateSyncTime(refs.syncTime);
    metrics.loadCount++;
    tracker.trackLoadSuccess({ itemCount: items.length, sectionCount: Object.keys(sections).length });
    return { success: true, items, sections };
  } catch (error) {
    metrics.errorCount++;
    store.setError(error.message || "Erro ao carregar dados");
    updateError(refs, error);
    clearTimeout(_loadingTimer);
    updateLoading(refs, false);
    updateStatusIndicator(refs, "error");
    tracker.trackLoadError(error);
    return { success: false, error };
  }
}
function resetPreviousKPIs() {
  _previousKPIs = null;
}
function getPreviousKPIs() {
  return _previousKPIs ? { totalItems: _previousKPIs.totalItems, totalSections: _previousKPIs.totalSections, activeItems: _previousKPIs.activeItems, coverage: _previousKPIs.coverage } : null;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var data_loader_default = { MODULE_ID, VERSION, updateStatusIndicator, updateKPIsWithAnimations, loadData, resetPreviousKPIs, getPreviousKPIs, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  data_loader_default as default,
  getPreviousKPIs,
  healthCheck,
  info,
  loadData,
  resetPreviousKPIs,
  updateKPIsWithAnimations,
  updateStatusIndicator
};
