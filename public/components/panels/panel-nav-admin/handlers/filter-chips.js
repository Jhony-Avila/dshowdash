const MODULE_ID = "panel-nav-admin-handlers-filter-chips";
const VERSION = "9.3.0-P2-ENTERPRISE";
function createFilterChipsHandlers(deps) {
  const { refs, store, container, applyFilters } = deps;
  function addFilterChip(filter, value, label) {
    if (!refs?.filterChips) return;
    const existing = refs.filterChips.querySelector(`[data-filter="${filter}"]`);
    if (existing) existing.remove();
    if (!value) return;
    const chip = document.createElement("div");
    chip.className = "pna-filter-chip";
    chip.dataset.filter = filter;
    chip.innerHTML = `<span class="pna-filter-chip-label">${label || filter}: ${value}</span><button type="button" class="pna-filter-chip-remove" data-action="remove-filter-chip" data-filter="${filter}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
    refs.filterChips.appendChild(chip);
  }
  function removeFilterChip(filter) {
    if (!filter) return;
    const chip = refs?.filterChips?.querySelector(`[data-filter="${filter}"]`);
    if (chip) chip.remove();
    store.setFilter(filter, "");
    const input = container?.querySelector(`[data-filter="${filter}"]`);
    if (input) {
      if (input.tagName === "SELECT") {
        input.value = input.options[0]?.value || "";
      } else {
        input.value = "";
      }
    }
    applyFilters();
  }
  function clearAllChips() {
    if (refs?.filterChips) refs.filterChips.innerHTML = "";
  }
  function updateFilterCounter(showing, total) {
    if (refs?.filterShowing) refs.filterShowing.textContent = String(showing);
    if (refs?.filterTotal) refs.filterTotal.textContent = String(total);
  }
  function toggleAdvancedFilters() {
    if (refs?.advancedFilters) refs.advancedFilters.classList.toggle("expanded");
    const toggle = container?.querySelector(".pna-advanced-filters-toggle");
    if (toggle) toggle.classList.toggle("active");
  }
  function clearSearch() {
    if (refs?.filterSearch) {
      refs.filterSearch.value = "";
      store.setFilter("search", "");
      removeFilterChip("search");
      applyFilters();
    }
  }
  return { addFilterChip, removeFilterChip, clearAllChips, updateFilterCounter, toggleAdvancedFilters, clearSearch };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  MODULE_ID,
  VERSION,
  createFilterChipsHandlers,
  healthCheck,
  info
};
