import { exportCSV, exportJSON } from "./export.js";
const MODULE_ID = "panels-panel-09-ui-events";
const VERSION = "9.3.0-P2-ENTERPRISE";
let _abortController = null;
let _listenerCount = 0;
function _ensureAbortController() {
  if (!_abortController) {
    _abortController = new AbortController();
  }
  return _abortController.signal;
}
function bindEvents(container, state, handlers) {
  const signal = _ensureAbortController();
  container.querySelectorAll("[data-tab]").forEach((tab) => {
    const tabEl = tab;
    tabEl.addEventListener("click", () => {
      state.activeTab = tabEl.dataset.tab;
      handlers.updateTabsUI();
      handlers.renderComparison();
      handlers.renderBarChart();
    }, { signal });
    _listenerCount++;
  });
  const csvBtn = container.querySelector('[data-export="csv"]');
  if (csvBtn) {
    csvBtn.addEventListener("click", () => exportCSV(state.data), { signal });
    _listenerCount++;
  }
  const jsonBtn = container.querySelector('[data-export="json"]');
  if (jsonBtn) {
    jsonBtn.addEventListener("click", () => exportJSON(state.data), { signal });
    _listenerCount++;
  }
}
function updateTabsUI(container, activeTab) {
  container.querySelectorAll("[data-tab]").forEach((tab) => {
    const tabEl = tab;
    if (tabEl.dataset.tab === activeTab) {
      tabEl.style.background = "#6366f1";
      tabEl.style.color = "#fff";
      tabEl.style.border = "none";
    } else {
      tabEl.style.background = "#16161f";
      tabEl.style.color = "#a0a0b0";
      tabEl.style.border = "1px solid #2a2a3a";
    }
  });
}
function bindSummaryCardClicks(container, state, handlers) {
  const signal = _ensureAbortController();
  container.querySelectorAll("[data-tab-click]").forEach((card) => {
    const cardEl = card;
    cardEl.addEventListener("click", () => {
      state.activeTab = cardEl.dataset.tabClick;
      handlers.updateTabsUI();
      handlers.renderSummaryCards();
      handlers.renderComparison();
      handlers.renderBarChart();
    }, { signal });
    _listenerCount++;
  });
}
function bindTooltips(container) {
  const signal = _ensureAbortController();
  container.querySelectorAll("[data-tooltip-trigger]").forEach((el) => {
    el.addEventListener("mouseenter", (e) => {
      const tooltip = container.querySelector("[data-tooltip]");
      if (tooltip) {
        const target = e.target;
        const me = e;
        tooltip.innerHTML = `<strong>${target.dataset.date}</strong><br>Total: ${target.dataset.value}<br>Taxa: ${target.dataset.rate}`;
        tooltip.style.left = `${me.pageX + 10}px`;
        tooltip.style.top = `${me.pageY - 40}px`;
        tooltip.classList.add("visible");
      }
    }, { signal });
    _listenerCount++;
    el.addEventListener("mouseleave", () => {
      const tooltip = container.querySelector("[data-tooltip]");
      if (tooltip) tooltip.classList.remove("visible");
    }, { signal });
    _listenerCount++;
  });
}
function unbindEvents() {
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
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true, cleanupAvailable: typeof unbindEvents === "function", listenersTracked: _abortController !== null || _listenerCount === 0 } };
}
var events_default = { bindEvents, unbindEvents, updateTabsUI, bindSummaryCardClicks, bindTooltips };
export {
  MODULE_ID,
  VERSION,
  bindEvents,
  bindSummaryCardClicks,
  bindTooltips,
  events_default as default,
  healthCheck,
  info,
  unbindEvents,
  updateTabsUI
};
