import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import * as store from "./state/store.js";
import * as persist from "./state/persist.js";
import * as tooltip from "./ui/tooltip.js";
import * as modals from "./ui/modals.js";
import * as panelHeader from "./ui/header.js";
import { PANEL_ID } from "./core/constants.js";
import { renderHeader } from "./core/header-template.js";
import { state, loadCSS, getRefreshInterval, getStatus, getVersion, healthCheck as lifecycleHealthCheck, info as lifecycleInfo, _log } from "./core/lifecycle.js";
import { loadData } from "./handlers/data.js";
import { handleToggleJob, handleDeleteJob } from "./handlers/crud.js";
import { handleSort, handleSearchChange, handleSearchClear, handleFilterChange, cleanup } from "./handlers/ui.js";
const MODULE_ID = "panel-12";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _isAuthenticated = () => {
  const auth = _getPort("auth");
  if (auth?.isAuthenticated?.()) return true;
  if (typeof window === "undefined") return false;
  const strictMode = isStrict();
  if (window.Core?.windowAdapter?.get) {
    const sm = window.Core.windowAdapter.get("SessionManager");
    if (sm?.isAuthenticated?.()) return true;
  }
  if (strictMode) return false;
  if (window.SessionManager?.isAuthenticated?.()) {
    recordViolation("WINDOW_SESSIONMANAGER_FALLBACK", { module: MODULE_ID, method: "_isAuthenticated" });
    return true;
  }
  return false;
};
const _isDocumentVisible = () => typeof document !== "undefined" && !document.hidden;
const _canRefresh = () => {
  if (!_isDocumentVisible()) return false;
  if (!_isAuthenticated()) return false;
  return true;
};
let _abortController = null;
const callbacks = { handleSort: (c, col, el) => handleSort(c, col, el, callbacks), setupTooltipsWrapper: () => setupTooltipsWrapper(), setupDelegatedEventListeners: (c) => setupDelegatedEventListeners(c) };
const setupTooltipsWrapper = () => tooltip.setup();
const setupDelegatedEventListeners = (container) => {
  container.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const row = target.closest("tr[data-job-id]");
    const jobId = row?.dataset.jobId ?? null;
    const jobName = row?.dataset.jobName ?? null;
    if (action === "toggle" && row && jobId) {
      if (!_isAuthenticated()) {
        _log("warn", "toggle blocked - not authenticated");
        return;
      }
      const isActive = target.dataset.active === "true";
      handleToggleJob(container, target, row, jobId, !isActive);
    } else if (action === "delete" && row && jobId && jobName) {
      if (!_isAuthenticated()) {
        _log("warn", "delete blocked - not authenticated");
        return;
      }
      modals.confirmDelete(jobName).then((confirmed) => {
        if (confirmed) handleDeleteJob(container, target, row, jobId, jobName);
      });
    } else if (action === "edit" && jobId) {
      if (!_isAuthenticated()) {
        _log("warn", "edit blocked - not authenticated");
        return;
      }
      const job = store.getJobById(jobId);
      if (job) modals.showEdit(job);
    } else if (action === "view" && jobId) {
      const job = store.getJobById(jobId);
      if (job) modals.showDetails(job);
    } else if (action === "refresh") {
      if (!_isAuthenticated()) {
        _log("warn", "refresh blocked - not authenticated");
        return;
      }
      loadData(container, callbacks);
    }
  }, { signal: _abortController?.signal });
  const searchInput = container.querySelector("[data-search]");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => handleSearchChange(e.target.value, callbacks), { signal: _abortController?.signal });
    searchInput.addEventListener("keydown", (e) => {
      const ke = e;
      if (ke.key === "Escape") {
        searchInput.value = "";
        handleSearchClear(callbacks);
      }
    }, { signal: _abortController?.signal });
  }
  const filters = container.querySelectorAll("[data-filter]");
  filters.forEach((select) => {
    select.addEventListener("change", (e) => {
      const filterType = e.target.dataset.filter;
      handleFilterChange(filterType || "", e.target.value, callbacks);
    }, { signal: _abortController?.signal });
  });
  const clearBtn = container.querySelector('[data-action="clear-filters"]');
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      handleSearchClear(callbacks);
      container.querySelectorAll("[data-filter]").forEach((s) => {
        s.value = "";
      });
      store.resetFilters();
    }, { signal: _abortController?.signal });
  }
};
const startPolling = (container) => {
  if (state.intervalId) clearTimeout(state.intervalId);
  const poll = () => {
    if (_canRefresh()) {
      loadData(container, callbacks).then(() => {
        state.intervalId = setTimeout(poll, getRefreshInterval());
      });
    } else {
      state.intervalId = setTimeout(poll, getRefreshInterval());
    }
  };
  state.intervalId = setTimeout(poll, getRefreshInterval());
  _log("debug", "Polling started", { interval: getRefreshInterval() });
};
const stopPolling = () => {
  if (state.intervalId) {
    clearTimeout(state.intervalId);
    state.intervalId = null;
    _log("debug", "Polling stopped");
  }
};
const mount = (container) => {
  try {
    if (!container) {
      _log("error", "Mount failed: container is null");
      return Promise.resolve(false);
    }
    if (!_isAuthenticated()) {
      container.innerHTML = '<div style="padding:2rem;text-align:center;color:#F59E0B;">Fa\xE7a login para acessar</div>';
      _log("warn", "mount.blocked - not authenticated");
      return Promise.resolve(false);
    }
    _log("debug", "Mounting panel-12...");
    _initPorts();
    loadCSS();
    _abortController = new AbortController();
    const savedSort = persist.getSortState();
    if (savedSort) store.setSort(savedSort);
    container.id = "painel-12";
    container.innerHTML = renderHeader();
    panelHeader.setup(container, { onSearchChange: (v) => handleSearchChange(v, callbacks), onSearchClear: () => handleSearchClear(callbacks), onFilterChange: (t, v) => handleFilterChange(t, v, callbacks), onRefresh: () => {
      if (_isAuthenticated()) loadData(container, callbacks);
    } });
    setupDelegatedEventListeners(container);
    return loadData(container, callbacks).then(() => {
      startPolling(container);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          stopPolling();
        } else if (_canRefresh()) {
          startPolling(container);
        }
      }, { signal: _abortController.signal });
      _log("debug", "Panel-12 mounted successfully");
      return true;
    });
  } catch (err) {
    const _l = Ports.get("logger");
    _l?.error?.(`[${"MODULE_ID"}] Mount failed`, err?.message);
    return false;
  }
};
const unmount = () => {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
  stopPolling();
  const container = document.querySelector(`#${PANEL_ID}`);
  cleanup(container);
  _log("debug", "Panel-12 unmounted");
  return true;
};
const healthCheck = () => {
  const result = lifecycleHealthCheck();
  result.p22Compliant = true;
  result.isAuthenticated = _isAuthenticated();
  result.isDocumentVisible = _isDocumentVisible();
  return result;
};
const info = () => {
  const result = lifecycleInfo();
  result.p22Compliant = true;
  result.isAuthenticated = _isAuthenticated();
  result.isDocumentVisible = _isDocumentVisible();
  return result;
};
if (typeof window !== "undefined") {
  if (!isStrict()) {
    window.Panel12 = { mount, unmount, getStatus, getVersion, healthCheck, info, MODULE_ID, VERSION };
    window.__dev = window.__dev || {};
    window.__dev.panel12 = { mount, unmount, getStatus, getVersion, healthCheck, info };
  } else {
    recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, property: "(window as any).Panel12" });
  }
}
const destroy = () => unmount();
var panel_12_default = { mount, unmount, destroy, getStatus, getVersion, healthCheck, info, MODULE_ID, VERSION, injectPorts, getPorts };
export {
  MODULE_ID,
  PANEL_ID,
  VERSION,
  panel_12_default as default,
  destroy,
  getPorts,
  getStatus,
  getVersion,
  healthCheck,
  info,
  injectPorts,
  mount,
  unmount
};
