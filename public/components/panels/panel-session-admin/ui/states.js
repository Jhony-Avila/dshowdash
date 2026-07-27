import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels-panel-session-admin-ui-states";
let _container = null;
function _getToast() {
  if (typeof window === "undefined") return null;
  const strictMode = isStrict();
  if (window.Core?.windowAdapter?.get) {
    const wt = window.Core.windowAdapter.get("Toast");
    if (wt) return wt;
  }
  if (strictMode) return null;
  if (window.Toast) {
    recordViolation("WINDOW_TOAST_FALLBACK", { module: MODULE_ID });
    return window.Toast;
  }
  return null;
}
function init(container) {
  _container = container;
}
function destroy() {
  _container = null;
}
function showLoading() {
  if (!_container) return;
  const content = _container.querySelector(".psa__content");
  if (content) content.classList.add("psa__content--loading");
  const spinner = _container.querySelector(".psa__loading");
  if (spinner) spinner.style.display = "flex";
}
function hideLoading() {
  if (!_container) return;
  const content = _container.querySelector(".psa__content");
  if (content) content.classList.remove("psa__content--loading");
  const spinner = _container.querySelector(".psa__loading");
  if (spinner) spinner.style.display = "none";
}
function showError(message) {
  if (!_container) return;
  const alert = _container.querySelector(".psa__alert--error");
  if (alert) {
    alert.style.display = "flex";
    const textEl = alert.querySelector("span") || alert;
    if (textEl) textEl.textContent = message;
  }
}
function hideError() {
  if (!_container) return;
  const alert = _container.querySelector(".psa__alert--error");
  if (alert) alert.style.display = "none";
}
function setFilters(filters) {
  if (!_container || !filters) return;
  const statusSelect = _container.querySelector('[data-filter="status"]');
  if (statusSelect && filters.status) statusSelect.value = filters.status;
  const searchInput = _container.querySelector('[data-filter="search"]');
  if (searchInput && filters.search !== void 0) searchInput.value = filters.search;
}
function setAutoRefresh(enabled) {
  if (!_container) return;
  const btn = _container.querySelector('[data-action="toggle-auto-refresh"]');
  if (btn) {
    btn.classList.toggle("psa__btn--active", enabled);
    btn.setAttribute("aria-pressed", String(enabled));
  }
}
function setCountdown(seconds) {
  if (!_container) return;
  const countdown = _container.querySelector("[data-countdown]");
  if (countdown) countdown.textContent = `${seconds}s`;
}
function setTableDensity(density) {
  if (!_container) return;
  const table = _container.querySelector(".psa__table");
  if (table) {
    table.classList.remove("psa__table--compact", "psa__table--comfortable");
    if (density === "compact") table.classList.add("psa__table--compact");
    if (density === "comfortable") table.classList.add("psa__table--comfortable");
  }
}
function highlightRow(sessionToken) {
  if (!_container || !sessionToken) return;
  const row = _container.querySelector(`[data-session-token="${sessionToken}"]`);
  if (row) {
    if (row._highlightTimer) clearTimeout(row._highlightTimer);
    row.classList.add("psa__row--highlight");
    row._highlightTimer = setTimeout(() => {
      row.classList.remove("psa__row--highlight");
      row._highlightTimer = null;
    }, 2e3);
  }
}
function setRowSelected(sessionToken, selected) {
  if (!_container || !sessionToken) return;
  const row = _container.querySelector(`[data-session-token="${sessionToken}"]`);
  if (row) {
    row.classList.toggle("psa__row--selected", selected);
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox) checkbox.checked = selected;
  }
}
function updateSummary(total, active, filtered) {
  if (!_container) return;
  const totalEl = _container.querySelector('[data-summary="total"]');
  if (totalEl) totalEl.textContent = String(total);
  const activeEl = _container.querySelector('[data-summary="active"]');
  if (activeEl) activeEl.textContent = String(active);
  const filteredEl = _container.querySelector('[data-summary="filtered"]');
  if (filteredEl) {
    if (filtered !== null && filtered !== void 0 && filtered !== total) {
      filteredEl.textContent = String(filtered);
      const parent = filteredEl.closest(".psa__summary-item");
      if (parent) parent.classList.remove("hidden");
    } else {
      const parent2 = filteredEl.closest(".psa__summary-item");
      if (parent2) parent2.classList.add("hidden");
    }
  }
}
function setLastUpdate(timestamp) {
  if (!_container || !timestamp) return;
  const el = _container.querySelector("[data-last-update]");
  if (el) {
    const date = new Date(timestamp);
    el.textContent = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    el.title = date.toLocaleString("pt-BR");
  }
}
function setButtonLoading(action, loading) {
  if (!_container) return;
  const btn = _container.querySelector(`[data-action="${action}"]`);
  if (btn) {
    btn.disabled = loading;
    btn.classList.toggle("psa__btn--loading", loading);
    const icon = btn.querySelector("svg, .psa__spin");
    if (icon) icon.classList.toggle("psa__spin", loading);
  }
}
function setButtonDisabled(action, disabled) {
  if (!_container) return;
  const btn = _container.querySelector(`[data-action="${action}"]`);
  if (btn) btn.disabled = disabled;
}
function toast(message, type) {
  if (!type) type = "info";
  const toastService = _getToast();
  if (toastService?.show) toastService.show(message, type);
}
function setFullscreen(active) {
  if (!_container) return false;
  const panel = _container.querySelector(".psa");
  if (panel) {
    panel.classList.toggle("psa--fullscreen", active);
    return active;
  }
  return false;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasContainer: !!_container, p25Compliant: true };
}
function healthCheck() {
  return { status: _container ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, hasContainer: !!_container, p25Compliant: true, timestamp: Date.now() };
}
function getVersion() {
  return VERSION;
}
var states_default = { VERSION, MODULE_ID, init, destroy, showLoading, hideLoading, showError, hideError, setFilters, setAutoRefresh, setCountdown, setTableDensity, highlightRow, setRowSelected, updateSummary, setLastUpdate, setButtonLoading, setButtonDisabled, toast, setFullscreen, info, healthCheck, getVersion };
export {
  MODULE_ID,
  VERSION,
  states_default as default,
  destroy,
  getVersion,
  healthCheck,
  hideError,
  hideLoading,
  highlightRow,
  info,
  init,
  setAutoRefresh,
  setButtonDisabled,
  setButtonLoading,
  setCountdown,
  setFilters,
  setFullscreen,
  setLastUpdate,
  setRowSelected,
  setTableDensity,
  showError,
  showLoading,
  toast,
  updateSummary
};
