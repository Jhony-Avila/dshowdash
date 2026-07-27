import { logger } from "../state/state.js";
const MODULE_ID = "panels-panel-06-ui-events";
const VERSION = "9.3.0-P2-ENTERPRISE";
let _abortController = null;
let _listenerCount = 0;
function setupEventHandlers(container, state, handlers) {
  teardownEventHandlers();
  _abortController = new AbortController();
  const signal = _abortController.signal;
  _listenerCount = 0;
  container.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeCategory = btn.dataset.category;
      state.searchTerm = "";
      handlers.render();
      logger.info("Category changed:", { category: state.activeCategory });
    }, { signal });
    _listenerCount++;
  });
  const searchInput = container.querySelector('[data-input="search"]');
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchTerm = e.target.value;
      handlers.render();
    }, { signal });
    _listenerCount++;
  }
  const clearSearchBtn = container.querySelector('[data-action="clear-search"]');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      state.searchTerm = "";
      handlers.render();
    }, { signal });
    _listenerCount++;
  }
  container.querySelectorAll("[data-setting]").forEach((input) => {
    const inputEl = input;
    const key = inputEl.dataset.setting;
    const type = inputEl.dataset.type;
    const handleChange = () => {
      let value;
      if (type === "boolean") {
        value = inputEl.checked;
      } else if (type === "number") {
        value = parseInt(inputEl.value, 10);
      } else if (type === "json") {
        try {
          value = JSON.parse(inputEl.value);
        } catch (e) {
          logger.warn("Invalid JSON for " + key);
          return;
        }
      } else {
        value = inputEl.value;
      }
      state.changes[key] = value;
      handlers.render();
      logger.info("Setting changed: " + key);
    };
    inputEl.addEventListener("change", handleChange, { signal });
    _listenerCount++;
    if (inputEl.type !== "checkbox") {
      inputEl.addEventListener("blur", handleChange, { signal });
      _listenerCount++;
    }
  });
  const saveBtn = container.querySelector('[data-action="save-all"]');
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      if (Object.keys(state.changes).length === 0) return;
      await handlers.saveAll();
    }, { signal });
    _listenerCount++;
  }
  const discardBtn = container.querySelector('[data-action="discard"]');
  if (discardBtn) {
    discardBtn.addEventListener("click", () => {
      state.changes = {};
      handlers.render();
      logger.info("Changes discarded");
    }, { signal });
    _listenerCount++;
  }
}
function teardownEventHandlers() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    _listenerCount = 0;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, listenersBound: _listenerCount, hasAbortController: _abortController !== null };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true, cleanupAvailable: typeof teardownEventHandlers === "function", listenersTracked: _abortController !== null || _listenerCount === 0 } };
}
export {
  MODULE_ID,
  VERSION,
  healthCheck,
  info,
  setupEventHandlers,
  teardownEventHandlers
};
