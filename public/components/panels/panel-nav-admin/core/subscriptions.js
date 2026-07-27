import { store } from "../state/store.js";
import { TABS } from "./constants.js";
import { mapItemsToViewModel, mapSectionsToViewModel } from "../utils/mappers.js";
import { updateItems, showEmptyState } from "../renderer/items.js";
import { updateSections, updateFilterOptions } from "../renderer/sections.js";
import { updateError } from "../renderer/status.js";
import { switchTab } from "../renderer/tabs.js";
const MODULE_ID = "panel-nav-admin-subscriptions";
const VERSION = "9.3.0-P2-ENTERPRISE";
function setupSubscriptions(deps) {
  const refs = deps.refs;
  const scheduler = deps.scheduler;
  const filterChipsHandlers = deps.filterChipsHandlers;
  const showToast = deps.showToast;
  const loadDiagnostic = deps.loadDiagnostic;
  const renderDiagnostic = deps.renderDiagnostic;
  const updateKPIsWithAnimations = deps.updateKPIsWithAnimations;
  const unsubscribes = [];
  unsubscribes.push(
    store.subscribe("items", (items) => {
      const filters = store.get("filters");
      const searchTerm = filters && filters.search ? filters.search : "";
      const itemsVM = mapItemsToViewModel(items || []);
      if (itemsVM.length === 0) {
        showEmptyState(refs);
      } else {
        updateItems(refs, itemsVM, searchTerm);
      }
      if (filterChipsHandlers) filterChipsHandlers.updateFilterCounter(itemsVM.length, (items || []).length);
    })
  );
  unsubscribes.push(
    store.subscribe("sections", (sections) => {
      const items = store.get("items") || [];
      const sectionsVM = mapSectionsToViewModel(sections || [], items);
      updateSections(refs, sectionsVM);
      updateFilterOptions(refs, sectionsVM);
    })
  );
  unsubscribes.push(store.subscribe("kpis", (kpis) => {
    try {
      const panel = document.querySelector(".pna-panel");
      if (!panel) return;
      const kpisData = kpis;
      const fields = ["totalItems", "totalSections", "activeItems", "adminItems"];
      fields.forEach(function(field) {
        const el = panel.querySelector('[data-kpi-value="' + field + '"]');
        if (el && kpisData[field] !== void 0) el.textContent = String(kpisData[field]);
      });
    } catch (e) {
    }
  }));
  unsubscribes.push(
    store.subscribe("activeTab", (tab) => {
      try {
        switchTab(refs, tab);
        if (tab === TABS.DIAGNOSTIC) {
          if (scheduler?.pause) scheduler.pause();
          if (loadDiagnostic) loadDiagnostic();
        } else {
          if (scheduler?.resume) scheduler.resume();
        }
      } catch (e) {
      }
    })
  );
  unsubscribes.push(
    store.subscribe("error", (error) => {
      updateError(refs, error);
      if (error) showToast(error, "error");
    })
  );
  unsubscribes.push(store.subscribe("diagnosticData", (data) => {
    renderDiagnostic(data, false);
  }));
  unsubscribes.push(store.subscribe("diagnosticLoading", (loading) => {
    if (loading) renderDiagnostic(null, true);
  }));
  return unsubscribes;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var subscriptions_default = { MODULE_ID, VERSION, setupSubscriptions, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  subscriptions_default as default,
  healthCheck,
  info,
  setupSubscriptions
};
