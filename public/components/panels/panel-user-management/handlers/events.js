import { state } from "../state/store.js";
import { ui } from "../ui/renderer.js";
import { tracker } from "../telemetry/tracker.js";
import * as crud from "./crud.js";
const MODULE_ID = "panels-panel-user-management-handlers-events";
const VERSION = "9.3.0-P2-ENTERPRISE";
let _abortController = null;
let _listenerCount = 0;
function setupEventHandlers(container) {
  if (!container) return;
  teardownEventHandlers();
  _abortController = new AbortController();
  const signal = _abortController.signal;
  _listenerCount = 0;
  const searchBtn = container.querySelector('[data-action="search"]');
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const filters = ui.getSearchFilters();
      tracker.trackFilterChanged(filters);
      crud.searchUsers(filters);
    }, { signal });
    _listenerCount++;
  }
  const searchInput = container.querySelector('[data-field="search"]');
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const filters = ui.getSearchFilters();
        tracker.trackFilterChanged(filters);
        crud.searchUsers(filters);
      }
    }, { signal });
    _listenerCount++;
  }
  const refreshBtn = container.querySelector('[data-action="refresh"]');
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      crud.loadData();
    }, { signal });
    _listenerCount++;
  }
  container.addEventListener("click", async (e) => {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const userIdEl = e.target.closest("[data-user-id]");
    const userId = userIdEl?.dataset?.userId;
    switch (action) {
      case "open-modal":
        if (userId) {
          await crud.viewUser(userId);
        }
        break;
      case "reset-password":
        if (userId && confirm("Confirma reset de senha para este usu\xE1rio?")) {
          await crud.resetPassword(userId);
        }
        break;
      case "activate":
        if (userId) {
          await crud.updateUserStatus(userId, "active");
        }
        break;
      case "deactivate":
        if (userId && confirm("Confirma desativa\xE7\xE3o deste usu\xE1rio?")) {
          await crud.updateUserStatus(userId, "disabled");
        }
        break;
      case "close-modal":
        ui.hideUserDetails();
        state.setSelectedUser(null);
        break;
      case "clear-filters":
        const searchEl = container.querySelector('[data-field="search"]');
        const statusSelect = container.querySelector('[data-field="status"]');
        const roleSelect = container.querySelector('[data-field="role"]');
        if (searchEl) searchEl.value = "";
        if (statusSelect) statusSelect.value = "";
        if (roleSelect) roleSelect.value = "";
        crud.loadData();
        break;
    }
  }, { signal });
  _listenerCount++;
  container.addEventListener("submit", async (e) => {
    const form = e.target.closest('[data-form="edit-user"]');
    if (!form) return;
    e.preventDefault();
    const formData = ui.getFormData(form);
    const userId = formData.id || state.getSelectedUser()?.id;
    if (userId) {
      await crud.editUser(userId, formData);
    }
  }, { signal });
  _listenerCount++;
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
