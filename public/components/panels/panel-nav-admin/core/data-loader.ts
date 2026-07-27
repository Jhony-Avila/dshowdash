// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.5.0-REFS-SORTABLE-FALLBACK)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-data-loader
// PURPOSE: Panel Nav Admin - Data Loader Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   store from ../state/store.js
//   tracker from ../telemetry/tracker.js
//   mapItemsToViewModel, mapSectionsToViewModel from ../utils/mappers.js
//   calculateKPIs from ../utils/kpi-calculator.js
//   updateItems, showEmptyState from ../renderer/items.js
//   updateSections, updateFilterOptions from ../renderer/sections.js
//   updateLoading, updateError, hideStatus from ../renderer/status.js
//   animateCountUp, animateProgressRing, updateKPITrend, updateKPIStatus, updateS...
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   updateStatusIndicator() — exported function
//   updateKPIsWithAnimations() — exported function
//   resetPreviousKPIs() — exported function
//   getPreviousKPIs() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// @changelog v9.5.0-REFS-SORTABLE-FALLBACK: _ensureItemsRef now searches for
//   .pna-list[data-sortable] as additional fallback. The ui/renderer.js creates
//   the list with <ul class="pna-list" data-sortable="items"> but may NOT wrap
//   it in .pna-items-list (when render happens with empty state then items are
//   injected later). This fix ensures updateItems() finds the <ul> container.
//   Also added .pna-content as last-resort fallback for both items and KPIs.
// @changelog v9.4.0-REFS-FALLBACK: updateItems/showEmptyState now receive an
//   enhanced refs object with DOM-queried containers when refs are null.
// @changelog v9.3.0-P2-ENTERPRISE: Previous version
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

import { store } from '../state/store.js';
import { tracker } from '../telemetry/tracker.js';
import * as navAdapter from './nav-adapter.js';
import { mapItemsToViewModel, mapSectionsToViewModel } from '../utils/mappers.js';
import { calculateKPIs } from '../utils/kpi-calculator.js';
import { updateItems, showEmptyState } from '../renderer/items.js';
import { updateSections, updateFilterOptions, updateGroupFilterOptions } from '../renderer/sections.js';
import { updateLoading, updateError, hideStatus } from '../renderer/status.js';
import { animateCountUp, animateProgressRing, updateKPITrend, updateKPIStatus, updateSyncTime } from '../renderer/effects.js';

export const MODULE_ID = 'panel-nav-admin-data-loader';
export const VERSION = '9.5.0-REFS-SORTABLE-FALLBACK';

let _previousKPIs: { totalItems: number; totalSections: number; activeItems: number; coverage: number } | null = null;

// v9.5.0-REFS-SORTABLE-FALLBACK: Ensure refs has a valid items container.
// Search order:
//   1. refs.itemsContainer / refs.itemsList / refs.tableBody (original refs)
//   2. .pna-items-list (wrapper div from ui/renderer.js renderItemsList)
//   3. .pna-list[data-sortable] (the <ul> itself — always present when items rendered)
//   4. [data-items-list] / .pna-items / [data-items] (generic data-attribute fallbacks)
//   5. .pna-tab-content[data-tab-content="items"] (tab content fallback)
//   6. .pna-content (last resort — main content area)
function _ensureItemsRef(refs: Record<string, unknown>, container: HTMLElement | null) {
  if (refs && (refs.itemsContainer || refs.itemsList || refs.tableBody)) {
    return refs;
  }
  // Fallback: build a minimal patched refs with the items container found in DOM
  var panelEl: HTMLElement | null = container || (refs && refs.container as HTMLElement | null) || null;
  if (!panelEl && typeof document !== 'undefined') {
    panelEl = document.querySelector('.pna-panel');
  }
  if (!panelEl) return refs || {};

  // v9.5.0: Extended search order — .pna-list[data-sortable] is the <ul> that
  // ui/renderer.js always creates, even when .pna-items-list wrapper is absent
  var itemsList = panelEl.querySelector('.pna-items-list')
    || panelEl.querySelector('.pna-list[data-sortable]')
    || panelEl.querySelector('[data-items-list]');

  var itemsContainer = panelEl.querySelector('.pna-items')
    || panelEl.querySelector('[data-items]');

  // v9.4.0: If there's a .pna-content with a tab, items go into the items tab
  // v9.6.0-HEADER-FIX: Never use tabContent/mainContent as itemsContainer directly —
  // always search for the <ul> inside to avoid innerHTML wiping the sticky header
  if (!itemsList && !itemsContainer) {
    var tabContent = panelEl.querySelector('.pna-tab-content[data-tab-content="items"]');
    if (tabContent) {
      var ulInTab = tabContent.querySelector('.pna-list[data-sortable]');
      if (ulInTab) {
        itemsList = ulInTab;
      } else {
        // No ul yet — use tabContent only as itemsContainer (updateItems will create the ul)
        itemsContainer = tabContent;
      }
    }
  }

  // v9.5.0: Last resort — use .pna-content
  if (!itemsList && !itemsContainer) {
    var mainContent = panelEl.querySelector('.pna-content');
    if (mainContent) {
      var ulInMain = mainContent.querySelector('.pna-list[data-sortable]');
      if (ulInMain) {
        itemsList = ulInMain;
      } else {
        itemsContainer = mainContent;
      }
    }
  }

  if (!itemsList && !itemsContainer) return refs || {};

  // Return a patched refs that merges found elements with existing refs
  return Object.assign({}, refs || {}, {
    itemsList: itemsList || (refs && refs.itemsList) || null,
    itemsContainer: itemsContainer || (refs && refs.itemsContainer) || null
  });
}

// v9.5.0: Ensure KPI refs are valid. When refs from _buildRefs are null,
// query the DOM for KPI elements directly.
function _ensureKpiRefs(refs: Record<string, unknown>, container: HTMLElement | null) {
  if (refs && refs.kpiTotalItems) return refs;

  var panelEl: HTMLElement | null = container || (refs && refs.container as HTMLElement | null) || null;
  if (!panelEl && typeof document !== 'undefined') {
    panelEl = document.querySelector('.pna-panel');
  }
  if (!panelEl) return refs || {};

  var kpiCards = panelEl.querySelectorAll('.pna-kpi-card');
  if (kpiCards.length === 0) return refs || {};

  // KPI cards are rendered in order: totalItems, totalSections, activeItems, admin
  var kpiValues = panelEl.querySelectorAll('.pna-kpi-value');
  var patched = Object.assign({}, refs || {});

  if (kpiValues.length >= 1) patched.kpiTotalItems = kpiValues[0];
  if (kpiValues.length >= 2) patched.kpiTotalSections = kpiValues[1];
  if (kpiValues.length >= 3) patched.kpiActiveItems = kpiValues[2];
  if (kpiValues.length >= 4) patched.kpiAdminItems = kpiValues[3];

  // Trend elements
  var kpiTrends = panelEl.querySelectorAll('.pna-kpi-trend');
  if (kpiTrends.length >= 1) patched.kpiTotalItemsTrend = kpiTrends[0];
  if (kpiTrends.length >= 2) patched.kpiTotalSectionsTrend = kpiTrends[1];
  if (kpiTrends.length >= 3) patched.kpiActiveItemsTrend = kpiTrends[2];

  return patched;
}

export function updateStatusIndicator(refs: Record<string, unknown>, status: string) {
  if (!refs || !refs.statusDot) return;
  (refs.statusDot as HTMLElement).classList.remove('pna-status-dot--healthy', 'pna-status-dot--warning', 'pna-status-dot--error', 'pna-status-dot--loading');
  (refs.statusDot as HTMLElement).classList.add(`pna-status-dot--${status}`);
  const titles: Record<string, string> = { healthy: 'Sistema operacional', warning: 'Atenção necessária', error: 'Erro no sistema', loading: 'Carregando...' };
  (refs.statusDot as HTMLElement).title = titles[status] || '';
}

export function updateKPIsWithAnimations(refs: Record<string, unknown>, container: HTMLElement | null, kpis: Record<string, number>) {
  // v9.5.0: Ensure KPI refs are patched from DOM if null
  var effectiveRefs = _ensureKpiRefs(refs, container);
  if (!effectiveRefs) return;


  animateCountUp(effectiveRefs.kpiTotalItems as HTMLElement, kpis.totalItems, 600);
  animateCountUp(effectiveRefs.kpiTotalSections as HTMLElement, kpis.totalSections, 600);
  animateCountUp(effectiveRefs.kpiActiveItems as HTMLElement, kpis.activeItems, 600);
  if (effectiveRefs.kpiAdminItems) animateCountUp(effectiveRefs.kpiAdminItems as HTMLElement, kpis.adminItems || 0, 600);
  if (_previousKPIs) {
    updateKPITrend(effectiveRefs.kpiTotalItemsTrend as HTMLElement, kpis.totalItems, _previousKPIs.totalItems);
    updateKPITrend(effectiveRefs.kpiTotalSectionsTrend as HTMLElement, kpis.totalSections, _previousKPIs.totalSections);
    updateKPITrend(effectiveRefs.kpiActiveItemsTrend as HTMLElement, kpis.activeItems, _previousKPIs.activeItems);
  }
  if (effectiveRefs.kpiCoverage) (effectiveRefs.kpiCoverage as HTMLElement).textContent = `${kpis.coverage}%`;
  if (effectiveRefs.coverageRingFill) animateProgressRing(effectiveRefs.coverageRingFill as SVGCircleElement, kpis.coverage);
  if (container) {
    const kpiEls = container.querySelectorAll('[data-kpi]');
    for (let i = 0; i < kpiEls.length; i++) {
      const el = kpiEls[i] as HTMLElement;
      const kpiType = el.dataset.kpi;
      let value = 75;
      if (kpiType === 'coverage') value = kpis.coverage;
      else if (kpiType === 'activeItems' && kpis.totalItems > 0) value = (kpis.activeItems / kpis.totalItems) * 100;
      else if (kpiType === 'totalItems') value = kpis.totalItems > 10 ? 100 : kpis.totalItems * 10;
      updateKPIStatus(el as HTMLElement, value, { excellent: 90, good: 70, warning: 50 });
    }
  }
  _previousKPIs = { totalItems: kpis.totalItems, totalSections: kpis.totalSections, activeItems: kpis.activeItems, coverage: kpis.coverage };
}

export async function loadData(refs: Record<string, unknown>, container: HTMLElement | null, filterChipsHandlers: Record<string, unknown>, metrics: Record<string, number>) {
  store.markLoading();
  // Anti-flicker: só mostrar loading indicator após 300ms (evita piscar em cargas rápidas)
  var _loadingTimer = setTimeout(function() {
    updateLoading(refs as Record<string, HTMLElement>, true);
    updateStatusIndicator(refs, 'loading');
  }, 300);

  tracker.trackLoadStart();
  try {

    const results = await Promise.all([navAdapter.getItems(), navAdapter.getSections(), navAdapter.getIcons()]);
    const items = results[0] as Record<string, unknown>[];
    const sections = results[1] as unknown as Record<string, unknown>[];
    const icons = results[2] as unknown[];
    store.setItems(items);
    store.setSections(sections);
    // MELHORIA 5: Expose sections globally for renderer group icon resolution
    if (typeof window !== 'undefined') (window as any).__pnaSections = sections;
    store.setIcons(icons);
    const kpis = calculateKPIs(items, sections);
    updateKPIsWithAnimations(refs, container, kpis);
    store.setKPIs(kpis);
    const filters = (store.get('filters') || {}) as Record<string, unknown>;
    const searchTerm = (filters.search as string) || '';
    const itemsVM = mapItemsToViewModel(items || []);

    // v9.5.0-REFS-SORTABLE-FALLBACK: Ensure refs has a valid items container before rendering
    var effectiveRefs = _ensureItemsRef(refs, container);

    if (itemsVM.length === 0) {
      showEmptyState(effectiveRefs);
    } else {
      updateItems(effectiveRefs, itemsVM, searchTerm);
    }
    // v9.6.0-SECTIONS-FIX: pass itemsVM (camelCase) not items (snake_case) so parentKey resolves correctly
    const sectionsVM = mapSectionsToViewModel(sections as Record<string, unknown>[] || [], itemsVM || []);
    updateSections(refs, sectionsVM);
    updateFilterOptions(refs, sectionsVM);
    // MELHORIA 3: Populate group filter dropdown
    var panelContainer = (refs && refs.container) as HTMLElement | null;
    if (!panelContainer && typeof document !== 'undefined') panelContainer = document.querySelector('.pna-panel');
    updateGroupFilterOptions(panelContainer, sectionsVM);
    if (filterChipsHandlers && (filterChipsHandlers as Record<string, unknown>).updateFilterCounter) {
      (filterChipsHandlers.updateFilterCounter as (a: number, b: number) => void)(itemsVM.length, items.length);
    }
    clearTimeout(_loadingTimer);
    store.markReady();
    hideStatus(refs as Record<string, HTMLElement>);
    updateLoading(refs as Record<string, HTMLElement>, false);
    updateStatusIndicator(refs, 'healthy');
    if (refs && refs.syncTime) updateSyncTime(refs.syncTime as HTMLElement);
    metrics.loadCount++;
    tracker.trackLoadSuccess({ itemCount: items.length, sectionCount: Object.keys(sections).length });
    return { success: true, items, sections };
  } catch (error) {
    metrics.errorCount++;
    store.setError((error as Error).message || 'Erro ao carregar dados');
    updateError(refs as Record<string, HTMLElement>, error as Error);
    clearTimeout(_loadingTimer);
    updateLoading(refs as Record<string, HTMLElement>, false);
    updateStatusIndicator(refs, 'error');

    tracker.trackLoadError(error);
    return { success: false, error };
  }
}

export function resetPreviousKPIs() { _previousKPIs = null; }
export function getPreviousKPIs() { return _previousKPIs ? { totalItems: _previousKPIs.totalItems, totalSections: _previousKPIs.totalSections, activeItems: _previousKPIs.activeItems, coverage: _previousKPIs.coverage } : null; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID, VERSION, updateStatusIndicator, updateKPIsWithAnimations, loadData, resetPreviousKPIs, getPreviousKPIs, info, healthCheck };
