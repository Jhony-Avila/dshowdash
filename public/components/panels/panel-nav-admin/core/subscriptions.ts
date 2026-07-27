// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-subscriptions
// PURPOSE: Panel Nav Admin - Subscriptions Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   store from ../state/store.js
//   TABS from ./constants.js
//   mapItemsToViewModel, mapSectionsToViewModel from ../utils/mappers.js
//   updateItems, showEmptyState from ../renderer/items.js
//   updateSections, updateFilterOptions from ../renderer/sections.js
//   updateError from ../renderer/status.js
//   switchTab from ../renderer/tabs.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   setupSubscriptions() — exported function
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

import { store } from '../state/store.js';
import { TABS } from './constants.js';
import { mapItemsToViewModel, mapSectionsToViewModel } from '../utils/mappers.js';
import { updateItems, showEmptyState } from '../renderer/items.js';
import { updateSections, updateFilterOptions } from '../renderer/sections.js';
import { updateError } from '../renderer/status.js';
import { switchTab } from '../renderer/tabs.js';

export const MODULE_ID = 'panel-nav-admin-subscriptions';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export function setupSubscriptions(deps: Record<string, unknown>) {
  const refs = deps.refs as Record<string, HTMLElement>;
  const scheduler = deps.scheduler as { pause: () => void; resume: () => void };
  const filterChipsHandlers = deps.filterChipsHandlers as { updateFilterCounter: (filtered: number, total: number) => void } | null;
  const showToast = deps.showToast as (msg: string, type: string) => void;
  const loadDiagnostic = deps.loadDiagnostic as () => void;
  const renderDiagnostic = deps.renderDiagnostic as (data: unknown, loading: boolean) => void;
  const updateKPIsWithAnimations = deps.updateKPIsWithAnimations as (kpis: unknown) => void;
  const unsubscribes: (() => void)[] = [];

  unsubscribes.push(
    store.subscribe('items', (items: unknown) => {
      const filters = store.get('filters') as Record<string, unknown> | null;
      const searchTerm = (filters && filters.search) ? (filters.search as string) : '';
      const itemsVM = mapItemsToViewModel((items as Record<string, unknown>[]) || []);
      if (itemsVM.length === 0) { showEmptyState(refs); } else { updateItems(refs, itemsVM, searchTerm); }
      if (filterChipsHandlers) filterChipsHandlers.updateFilterCounter(itemsVM.length, ((items as unknown[]) || []).length);
    }) as unknown as () => void
  );

  unsubscribes.push(
    store.subscribe('sections', (sections: unknown) => {
      const items = (store.get('items') as Record<string, unknown>[]) || [];
      const sectionsVM = mapSectionsToViewModel((sections as Record<string, unknown>[]) || [], items);
      updateSections(refs, sectionsVM);
      updateFilterOptions(refs, sectionsVM);
    }) as unknown as () => void
  );

  unsubscribes.push(store.subscribe('kpis', (kpis: unknown) => {
    // Anti-flicker: atualizar KPIs diretamente via data-kpi-value — refs podem estar desatualizados
    try {
      const panel = document.querySelector('.pna-panel');
      if (!panel) return;
      const kpisData = kpis as Record<string, number>;
      const fields = ['totalItems', 'totalSections', 'activeItems', 'adminItems'];
      fields.forEach(function(field) {
        const el = panel.querySelector('[data-kpi-value="' + field + '"]') as HTMLElement;
        if (el && kpisData[field] !== undefined) el.textContent = String(kpisData[field]);
      });
    } catch(e) {}
  }) as unknown as () => void);

  unsubscribes.push(
    store.subscribe('activeTab', (tab: unknown) => {
      try {
        switchTab(refs, tab as string);
        if (tab === TABS.DIAGNOSTIC) {
          if (scheduler?.pause) scheduler.pause();
          if (loadDiagnostic) loadDiagnostic();
        } else {
          if (scheduler?.resume) scheduler.resume();
        }
      } catch(e) {}
    }) as unknown as () => void
  );

  unsubscribes.push(
    store.subscribe('error', (error: unknown) => {
      updateError(refs, error as string | null);
      if (error) showToast(error as string, 'error');
    }) as unknown as () => void
  );

  unsubscribes.push(store.subscribe('diagnosticData', (data: unknown) => { renderDiagnostic(data, false); }) as unknown as () => void);
  unsubscribes.push(store.subscribe('diagnosticLoading', (loading: unknown) => { if (loading) renderDiagnostic(null, true); }) as unknown as () => void);

  return unsubscribes;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID, VERSION, setupSubscriptions, info, healthCheck };
