import { highlightText } from "./effects.js";
import { selectRow } from "./items.js";
const MODULE_ID = "panel-nav-admin-renderer-autocomplete";
const VERSION = "9.3.0-P2-ENTERPRISE";
function createAutocompleteRenderer(deps) {
  const refs = deps.refs;
  const store = deps.store;
  const container = deps.container;
  function updateAutocomplete(term) {
    if (!refs || !refs.searchAutocomplete || !refs.searchWrapper) return;
    if (!term || term.length < 2) {
      hideAutocomplete();
      return;
    }
    const items = store.get("items") || [];
    const matches = findMatches(items, term, 5);
    if (matches.length === 0) {
      showEmptyAutocomplete();
      return;
    }
    renderMatches(matches, term);
    showAutocomplete();
    attachClickHandlers();
  }
  function findMatches(items, term, limit) {
    limit = limit || 5;
    const lowerTerm = term.toLowerCase();
    return items.filter((item) => item.label && item.label.toLowerCase().indexOf(lowerTerm) !== -1 || item.id && item.id.toLowerCase().indexOf(lowerTerm) !== -1 || item.href && item.href.toLowerCase().indexOf(lowerTerm) !== -1).slice(0, limit);
  }
  function renderMatches(matches, term) {
    refs.searchAutocomplete.innerHTML = matches.map((item) => `<div class="pna-autocomplete-item" data-item-id="${item.id}"><span class="pna-autocomplete-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/></svg></span><div class="pna-autocomplete-content"><span class="pna-autocomplete-label">${highlightText(item.label || "", term)}</span><span class="pna-autocomplete-meta">${item.section || "root"} \u2022 ${item.href || ""}</span></div></div>`).join("");
  }
  function showEmptyAutocomplete() {
    refs.searchAutocomplete.innerHTML = '<div class="pna-autocomplete-empty">Nenhum resultado</div>';
    refs.searchWrapper.classList.add("has-results");
  }
  function showAutocomplete() {
    refs.searchWrapper.classList.add("has-results");
  }
  function hideAutocomplete() {
    refs.searchWrapper.classList.remove("has-results");
    refs.searchAutocomplete.innerHTML = "";
  }
  function attachClickHandlers() {
    refs.searchAutocomplete.querySelectorAll(".pna-autocomplete-item").forEach((el) => {
      el.addEventListener("click", () => {
        const itemId = el.dataset.itemId;
        refs.filterSearch.value = "";
        hideAutocomplete();
        store.setFilter("search", "");
        scrollToItem(itemId);
      });
    });
  }
  function scrollToItem(itemId) {
    const row = container ? container.querySelector(`[data-item-id="${itemId}"]`) : null;
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      selectRow(itemId, true);
      setTimeout(() => {
        selectRow(itemId, false);
      }, 2e3);
    }
  }
  return { updateAutocomplete, hideAutocomplete, scrollToItem };
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
  createAutocompleteRenderer,
  healthCheck,
  info
};
