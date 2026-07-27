import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { store } from "./state/store.js";
import { tracker } from "./telemetry/tracker.js";
import * as navAdapter from "./core/nav-adapter.js";
import { scheduler } from "./scheduler/refresh.js";
import { REFRESH_INTERVAL } from "./core/constants.js";
import { MODULE_ID, metrics, loadCSS, ensureAuth, checkPanelAccess, healthCheck as buildHealthCheck, info as buildInfo } from "./core/lifecycle.js";
import { loadData, updateKPIsWithAnimations, resetPreviousKPIs } from "./core/data-loader.js";
import { setupSubscriptions } from "./core/subscriptions.js";
import { setupEventListeners } from "./core/event-setup.js";
import { mount as bootstrapMount, unmount as bootstrapUnmount, getRefs } from "./bootstrap/mount.js";
import { showEmptyState, showSkeleton as showItemsSkeleton, clear as clearItems, getSelectedIds, renderGroupedItemsList } from "./renderer/items.js";
import { clear as clearSections } from "./renderer/sections.js";
import { updateLoading, updateCountdown } from "./renderer/status.js";
import { mapItemsToViewModel } from "./utils/mappers.js";
import { updateItems } from "./renderer/items.js";
import { triggerConfetti, attachRippleToButtons, animateHealthGauge, refreshSyncTimeDisplay, renderHeatmap, renderRouteTree, renderTimeline } from "./renderer/effects.js";
import { renderPanel } from "./ui/renderer.js";
import * as crud from "./handlers/crud.js";
import * as uiActions from "./handlers/ui-actions.js";
import * as diagnostic from "./handlers/diagnostic.js";
import { createClickRouter } from "./handlers/click-router.js";
import { createDragDropHandlers } from "./handlers/drag-drop.js";
import { createInlineEditHandlers, clearEditState } from "./handlers/inline-edit.js";
import { createExportImportHandlers } from "./handlers/export-import.js";
import { createFilterChipsHandlers } from "./handlers/filter-chips.js";
import { createKeyboardHandlers } from "./handlers/keyboard.js";
import { createRouteSelectHandlers } from "./handlers/route-select.js";
import { createGroupSelectHandlers } from "./handlers/group-select.js";
import { createLevelSelectHandlers } from "./handlers/level-select.js";
import { createColumnSortHandlers } from "./handlers/column-sort.js";
import { createAutocompleteRenderer } from "./renderer/autocomplete.js";
import { openInlinePopover, closeInlinePopover } from "./ui/icon-picker.js";
import { renderDiagnosticTab, renderValidationResult } from "./ui/diagnostic-renderer.js";
import { ToastManager } from "./ui/toast-manager.js";
import { openAuditPanel, closeAuditPanel } from "./ui/audit-history.js";
import { showConfirmDialog, showItemFormModal } from "./ui/modals.js";
import { createPagination } from "./ui/pagination.js";
import { createBulkOperations, BULK_ACTIONS } from "./data/bulk-operations.js";
var VERSION = "12.3.0-UX-IMPROVEMENTS";
var getVersion = function() {
  return VERSION;
};
var _isDocumentVisible = function() {
  return typeof document !== "undefined" && !document.hidden;
};
function _rebuildRefsFromContainer(currentContainer) {
  if (!currentContainer) return null;
  return {
    container: currentContainer,
    content: currentContainer.querySelector(".pna-content") || currentContainer.querySelector("[data-content]") || currentContainer,
    itemsContainer: currentContainer.querySelector(".pna-items") || currentContainer.querySelector("[data-items]"),
    itemsList: currentContainer.querySelector(".pna-items-list") || currentContainer.querySelector(".pna-list[data-sortable]") || currentContainer.querySelector("[data-items-list]"),
    sectionsContainer: currentContainer.querySelector(".pna-sections") || currentContainer.querySelector("[data-sections]"),
    sectionsList: currentContainer.querySelector(".pna-sections-list") || currentContainer.querySelector("[data-sections-list]"),
    groupsContainer: currentContainer.querySelector(".pna-groups") || currentContainer.querySelector("[data-groups]"),
    tableBody: currentContainer.querySelector(".pna-table tbody") || currentContainer.querySelector("[data-table-body]"),
    loadingOverlay: currentContainer.querySelector(".pna-loading") || currentContainer.querySelector("[data-loading]"),
    loading: currentContainer.querySelector(".pna-loading-indicator"),
    errorMessage: currentContainer.querySelector(".pna-error") || currentContainer.querySelector("[data-error]"),
    error: currentContainer.querySelector(".pna-error-message"),
    countdownEl: currentContainer.querySelector(".pna-countdown") || currentContainer.querySelector("[data-countdown]"),
    countdown: currentContainer.querySelector("[data-refresh-countdown]"),
    refreshCountdown: currentContainer.querySelector(".pna-refresh-countdown"),
    filterSelect: currentContainer.querySelector(".pna-filter select") || currentContainer.querySelector("[data-filter-select]"),
    filterDropdown: currentContainer.querySelector(".pna-filter-dropdown"),
    filterChips: currentContainer.querySelector(".pna-filter-chips") || currentContainer.querySelector("[data-filter-chips]"),
    toolbar: currentContainer.querySelector(".pna-toolbar") || currentContainer.querySelector("[data-toolbar]"),
    tabs: currentContainer.querySelector(".pna-tabs") || currentContainer.querySelector("[data-tabs]"),
    searchInput: currentContainer.querySelector(".pna-search input") || currentContainer.querySelector("[data-search]"),
    diagnosticContainer: currentContainer.querySelector(".pna-diagnostic") || currentContainer.querySelector("[data-diagnostic]"),
    statusDot: currentContainer.querySelector(".pna-status-dot"),
    syncTime: currentContainer.querySelector(".pna-sync-time"),
    toastContainer: currentContainer.querySelector(".pna-toast-container") || currentContainer.querySelector("[data-toast-container]"),
    confettiContainer: currentContainer.querySelector(".pna-confetti-container"),
    version: currentContainer.querySelector(".pna-version"),
    userInitials: currentContainer.querySelector(".pna-user-initials"),
    userAvatar: currentContainer.querySelector(".pna-user-avatar"),
    kpiTotalItems: currentContainer.querySelector('[data-kpi-value="totalItems"]'),
    kpiTotalSections: currentContainer.querySelector('[data-kpi-value="totalSections"]'),
    kpiActiveItems: currentContainer.querySelector('[data-kpi-value="activeItems"]'),
    kpiAdminItems: currentContainer.querySelector('[data-kpi-value="adminItems"]'),
    kpiCoverage: currentContainer.querySelector('[data-kpi-value="coverage"]'),
    kpiTotalItemsTrend: currentContainer.querySelector('[data-kpi-trend="totalItems"]'),
    kpiTotalSectionsTrend: currentContainer.querySelector('[data-kpi-trend="totalSections"]'),
    kpiActiveItemsTrend: currentContainer.querySelector('[data-kpi-trend="activeItems"]'),
    coverageRingFill: currentContainer.querySelector(".pna-coverage-ring-fill"),
    healthGaugeFill: currentContainer.querySelector(".pna-health-gauge-fill"),
    healthValue: currentContainer.querySelector(".pna-health-value"),
    healthStatus: currentContainer.querySelector(".pna-health-status"),
    coverageHeatmap: currentContainer.querySelector(".pna-coverage-heatmap"),
    routeTree: currentContainer.querySelector(".pna-route-tree"),
    timeline: currentContainer.querySelector(".pna-timeline")
  };
}
var PanelNavAdmin = function() {
  "use strict";
  var isInitialized = false;
  var container = null;
  var abortController = null;
  var _unsubscribes = [];
  var _refs = null;
  var _syncTimeInterval = null;
  var _clickRouter = null;
  var _dragDropHandlers = null;
  var _inlineEditHandlers = null;
  var _exportImportHandlers = null;
  var _filterChipsHandlers = null;
  var _keyboardHandlers = null;
  var _autocompleteRenderer = null;
  var _routeSelectHandlers = null;
  var _columnSortHandlers = null;
  var _iconPopoverHandlers = null;
  var _groupSelectHandlers = null;
  var _levelSelectHandlers = null;
  var _integration = null;
  var _unmountIntegrationFn = null;
  var _getIntegrationHealthFn = null;
  var _currentPage = 1;
  var _perPage = 9999;
  var _pagination = createPagination({
    onPageChange: function(page) {
      _currentPage = page;
      _applyFilters();
    },
    onPageSizeChange: function(size) {
      _perPage = size;
      _currentPage = 1;
      _applyFilters();
    }
  });
  var _bulkOps = null;
  var _isGroupView = function() {
    try {
      return localStorage.getItem("pna-group-view") === "true";
    } catch (e) {
      return false;
    }
  }();
  var _isCompactMode = function() {
    try {
      return localStorage.getItem("pna-compact-mode") === "true";
    } catch (e) {
      return false;
    }
  }();
  var _collapsedGroups = /* @__PURE__ */ new Set();
  try {
    localStorage.removeItem("pna-collapsed-groups");
    localStorage.removeItem("pna-flat-collapsed-groups");
  } catch (e) {
  }
  var _toastManager = new ToastManager({ position: "top-right", defaultDuration: 3e3 });
  var _showToast = function(msg, type) {
    _toastManager.show(msg, type, type === "error" ? 6e3 : 3e3);
  };
  var _showToastWithAction = function(msg, type, actionLabel, onAction, duration) {
    _toastManager.showWithAction(msg, type, actionLabel, onAction, duration || 5e3);
  };
  var _loadDataFn = function() {
    if (!_isDocumentVisible()) {
      return Promise.resolve();
    }
    if (!ensureAuth("loadData")) {
      return Promise.resolve();
    }
    return loadData(_refs, container, _filterChipsHandlers, metrics).then(function(result) {
      if (container) {
        _refs = _rebuildRefsFromContainer(container);
      }
      _applyFilters();
      return result;
    });
  };
  var init = function() {
    if (isInitialized) return Promise.resolve({ success: true, alreadyInitialized: true });
    tracker.trackInit();
    loadCSS();
    _loadPremiumCSS();
    store.init();
    store.loadFavoritos();
    isInitialized = true;
    tracker.trackInitComplete();
    return Promise.resolve({ success: true });
  };
  var _loadPremiumCSS = function() {
    var cssId = "pna-premium-css";
    if (!document.getElementById(cssId)) {
      var link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "/components/panels/panel-nav-admin/styles-premium.css";
      document.head.appendChild(link);
    }
  };
  var mount2 = function(targetContainer) {
    if (!targetContainer) return Promise.resolve({ success: false, error: "Container is required" });
    if (!ensureAuth("mount")) return Promise.resolve({ success: false, error: "Authentication required" });
    if (!checkPanelAccess()) {
      tracker.trackAccessDenied("mount");
      return Promise.resolve({ success: false, error: "Access denied" });
    }
    container = targetContainer;
    abortController = new AbortController();
    return init().then(function() {
      var initialState = store.getState();
      var panelHTML = renderPanel(initialState, {});
      container.innerHTML = panelHTML;
      return bootstrapMount(container);
    }).then(function() {
      _refs = getRefs();
      if (!_refs || !_refs.itemsList) {
        _refs = _rebuildRefsFromContainer(container);
      }
      _initializeHandlers();
      _setupAllEventListeners();
      _setupAllSubscriptions();
      _setupPremiumFeatures();
      if (_columnSortHandlers && _columnSortHandlers.init) _columnSortHandlers.init();
      if (container && _columnSortHandlers) {
        var _colDragObserver = new MutationObserver(function(mutations) {
          for (var i = 0; i < mutations.length; i++) {
            var added = mutations[i].addedNodes;
            for (var j = 0; j < added.length; j++) {
              var node = added[j];
              if (node.nodeType !== 1) continue;
              var hdr = node.matches && node.matches(".pna-list-header[data-grid-header]") ? node : node.querySelector ? node.querySelector(".pna-list-header[data-grid-header]") : null;
              if (hdr && _columnSortHandlers) {
                _columnSortHandlers.setupColumnDrag(hdr);
              }
            }
          }
        });
        _colDragObserver.observe(container, { childList: true, subtree: true });
        container.__colDragObserver = _colDragObserver;
      }
      import("./core/integration-layer.js").then(function(mod) {
        try {
          _unmountIntegrationFn = mod.unmountIntegration;
          _getIntegrationHealthFn = mod.getIntegrationHealth;
          _integration = mod.initIntegration({ store, tracker, navAdapter });
          mod.mountIntegration(_integration, _refs, container);
        } catch (err) {
          console.error("[PanelNavAdmin] Integration layer init failed (panel continues):", err);
          _integration = null;
        }
      }).catch(function(err) {
        console.error("[PanelNavAdmin] Integration layer load failed (panel continues):", err);
        _integration = null;
      });
      _startScheduler();
      _startSyncTimeUpdater();
      metrics.mountCount++;
      metrics.lastActivity = Date.now();
      tracker.trackMounted();
      var isFirstLoad = !container.querySelector("ul.pna-list");
      if (isFirstLoad) showItemsSkeleton(_refs, 8);
      return _loadDataFn();
    }).then(function() {
      return { success: true };
    });
  };
  var _initializeHandlers = function() {
    var baseDeps = { container, refs: _refs, store, navAdapter, showToast: _showToast, loadData: _loadDataFn };
    _dragDropHandlers = createDragDropHandlers(baseDeps);
    _inlineEditHandlers = createInlineEditHandlers(baseDeps);
    _routeSelectHandlers = createRouteSelectHandlers(baseDeps);
    _columnSortHandlers = createColumnSortHandlers(baseDeps);
    _iconPopoverHandlers = _createIconPopoverHandlers(baseDeps);
    _groupSelectHandlers = createGroupSelectHandlers(baseDeps);
    _levelSelectHandlers = createLevelSelectHandlers(baseDeps);
    _exportImportHandlers = createExportImportHandlers({ store, showToast: _showToast });
    _bulkOps = createBulkOperations({ navAdapter, store, showToast: _showToast, loadData: _loadDataFn });
    _filterChipsHandlers = createFilterChipsHandlers(Object.assign({}, baseDeps, { applyFilters: _applyFilters }));
    _keyboardHandlers = createKeyboardHandlers({ container, refs: _refs, scheduler });
    _autocompleteRenderer = createAutocompleteRenderer({ refs: _refs, store, container });
    var callbacks = { showToast: _showToast, showToastWithAction: _showToastWithAction, showLoading: function(show) {
      updateLoading(_refs, show);
    }, closeAllModals: function() {
      uiActions.closeAllModals(container);
    }, loadData: _loadDataFn, triggerConfetti: function() {
      triggerConfetti(_refs ? _refs.confettiContainer : null);
    } };
    _clickRouter = createClickRouter({ container, refs: _refs, store, scheduler, callbacks, handlers: { onCreateItem: _createItem, onToggleActive: _toggleItemActive, onDismissError: function() {
      store.clearError();
    }, onRetry: _loadDataFn, onImport: _exportImportHandlers.handleImport, onExportCSV: _exportImportHandlers.exportCSV, onDuplicate: _handleDuplicate, onBulkDelete: _handleBulkDelete, onSettings: function() {
      _showToast("Configura\xE7\xF5es em desenvolvimento", "info");
    }, onAuditHistory: _openAuditHistory, onLoadDiagnostic: _loadDiagnostic, onValidateRoute: _validateRoute, onExport: _exportImportHandlers.exportJSON, onRemoveFilterChip: _filterChipsHandlers.removeFilterChip, onToggleAdvancedFilters: _filterChipsHandlers.toggleAdvancedFilters, onClearSearch: _filterChipsHandlers.clearSearch, onBulkDeleteSelected: function() {
      if (_bulkOps && _bulkOps.getSelectionCount() > 0) {
        _confirmBulkDelete();
      }
    }, onBulkActivateSelected: function() {
      if (_bulkOps && _bulkOps.getSelectionCount() > 0) {
        _bulkOps.execute(BULK_ACTIONS.TOGGLE_ACTIVE, { activate: true });
      }
    }, onBulkDeactivateSelected: function() {
      if (_bulkOps && _bulkOps.getSelectionCount() > 0) {
        _bulkOps.execute(BULK_ACTIONS.TOGGLE_ACTIVE, { activate: false });
      }
    }, onBulkClearSelection: function() {
      if (_bulkOps) {
        _bulkOps.clearSelection();
        _clearAllBulkCheckboxes();
        _renderBulkToolbar(0);
      }
    }, onHealthStatus: _openHealthDashboard, onResetDisplayTitle: _resetDisplayTitle, onBulkSetTitle: _bulkSetTitle, onDuplicateItem: _duplicateItem, onToggleGroupView: _toggleGroupView, onToggleCompactMode: _toggleCompactMode, onExpandAllGroups: _expandAllGroups, onCollapseAllGroups: _collapseAllGroups, onInlineEditGroupLabel: _inlineEditGroupLabel, onNewGroup: _newGroup, onToggleFlatGroupCollapse: _toggleFlatGroupCollapse } });
  };
  var _setupAllEventListeners = function() {
    setupEventListeners({ container, abortController, refs: _refs, clickRouter: _clickRouter, keyboardHandlers: _keyboardHandlers, inlineEditHandlers: _inlineEditHandlers, dragDropHandlers: _dragDropHandlers, filterChipsHandlers: _filterChipsHandlers, autocompleteRenderer: _autocompleteRenderer, routeSelectHandlers: _routeSelectHandlers, columnSortHandlers: _columnSortHandlers, iconPopoverHandlers: _iconPopoverHandlers, groupSelectHandlers: _groupSelectHandlers, levelSelectHandlers: _levelSelectHandlers, applyFilters: _applyFilters, showToast: _showToast });
    if (container && abortController) {
      container.addEventListener("pna:bulk-selection-changed", function() {
        _updateBulkSelection();
      }, { signal: abortController.signal });
      container.addEventListener("click", function(ev) {
        var target = ev.target;
        var groupHeader = target.closest('[data-action="toggle-group-collapse"]');
        if (groupHeader && groupHeader.dataset.groupKey) {
          _toggleGroupCollapse(groupHeader.dataset.groupKey);
          return;
        }
        var expandAllBtn = target.closest('[data-action="expand-all-groups"]');
        if (expandAllBtn) {
          _expandAllGroups();
          return;
        }
        var collapseAllBtn = target.closest('[data-action="collapse-all-groups"]');
        if (collapseAllBtn) {
          _collapseAllGroups();
          return;
        }
      }, { signal: abortController.signal });
      var _draggedGroupSep = null;
      container.addEventListener("dragstart", function(e) {
        var sep = e.target.closest('.pna-list-group-separator[data-group-drag="true"]');
        if (!sep) return;
        _draggedGroupSep = sep;
        sep.style.opacity = "0.5";
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", sep.dataset.groupKey || "");
      }, { signal: abortController.signal });
      container.addEventListener("dragover", function(e) {
        if (!_draggedGroupSep) return;
        var sep = e.target.closest('.pna-list-group-separator[data-group-drag="true"]');
        if (sep && sep !== _draggedGroupSep) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          sep.style.background = "rgba(255,255,255,0.06)";
        }
      }, { signal: abortController.signal });
      container.addEventListener("dragleave", function(e) {
        if (!_draggedGroupSep) return;
        var sep = e.target.closest('.pna-list-group-separator[data-group-drag="true"]');
        if (sep) sep.style.background = "";
      }, { signal: abortController.signal });
      container.addEventListener("drop", function(e) {
        if (!_draggedGroupSep) return;
        e.preventDefault();
        var targetSep = e.target.closest('.pna-list-group-separator[data-group-drag="true"]');
        if (!targetSep || targetSep === _draggedGroupSep) {
          if (_draggedGroupSep) _draggedGroupSep.style.opacity = "";
          _draggedGroupSep = null;
          return;
        }
        targetSep.style.background = "";
        _draggedGroupSep.style.opacity = "";
        var allSeps = Array.from(container.querySelectorAll('.pna-list-group-separator[data-group-drag="true"]'));
        var fromIdx = allSeps.indexOf(_draggedGroupSep);
        var toIdx = allSeps.indexOf(targetSep);
        if (fromIdx === -1 || toIdx === -1) {
          _draggedGroupSep = null;
          return;
        }
        var groupKeys = allSeps.map(function(s) {
          return s.dataset.groupKey || "";
        });
        var moved = groupKeys.splice(fromIdx, 1)[0];
        groupKeys.splice(toIdx, 0, moved);
        var sections = store.get("sections") || [];
        var patchPromises = [];
        for (var gi = 0; gi < groupKeys.length; gi++) {
          var gk = groupKeys[gi];
          var sec = sections.find(function(s) {
            return String(s.group_key || s.item_key || "") === gk;
          });
          if (sec) {
            patchPromises.push(
              fetch("/api/admin/navigation/sections", {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  source_table: String(sec.source_table || "ui_nav_items"),
                  source_id: Number(sec.source_id || 0),
                  order_index: gi + 1
                })
              }).then(function(r) {
                return r.json();
              })
            );
          }
        }
        Promise.all(patchPromises).then(function() {
          _showToast("Ordem dos grupos atualizada!", "success");
          _loadDataFn();
        }).catch(function(err) {
          _showToast("Erro ao reordenar grupos: " + err.message, "error");
        });
        _draggedGroupSep = null;
      }, { signal: abortController.signal });
      container.addEventListener("dragend", function() {
        if (_draggedGroupSep) _draggedGroupSep.style.opacity = "";
        _draggedGroupSep = null;
        container.querySelectorAll(".pna-list-group-separator").forEach(function(s) {
          s.style.background = "";
        });
      }, { signal: abortController.signal });
    }
  };
  var _setupAllSubscriptions = function() {
    _unsubscribes = setupSubscriptions({ refs: _refs, scheduler, filterChipsHandlers: _filterChipsHandlers, showToast: _showToast, loadDiagnostic: _loadDiagnostic, renderDiagnostic: _renderDiagnostic, updateKPIsWithAnimations: function(kpis) {
      updateKPIsWithAnimations(_refs, container, kpis);
    } });
  };
  var _setupPremiumFeatures = function() {
    attachRippleToButtons(container);
    _updateUserAvatar();
    if (_refs && _refs.version) _refs.version.textContent = "v" + VERSION.split("-")[0];
    _restoreViewPreferences();
  };
  var _restoreViewPreferences = function() {
    if (!container) return;
    if (_isCompactMode) container.classList.add("pna-compact");
    var groupBtn = container.querySelector('[data-action="toggle-group-view"]');
    if (groupBtn && _isGroupView) groupBtn.classList.add("pna-btn--active");
    var compactBtn = container.querySelector('[data-action="toggle-compact-mode"]');
    if (compactBtn && _isCompactMode) compactBtn.classList.add("pna-btn--active");
  };
  var _updateUserAvatar = function() {
    if (!_refs || !_refs.userInitials) return;
    var user = typeof window !== "undefined" && window.AuthManager && window.AuthManager.getCurrentUser ? window.AuthManager.getCurrentUser() : typeof window !== "undefined" && window.DShowAuth ? window.DShowAuth.user : { name: "Admin" };
    var name = user.name || user.email || "Admin";
    var initials = name.split(" ").map(function(n) {
      return n[0];
    }).slice(0, 2).join("").toUpperCase();
    _refs.userInitials.textContent = initials;
    if (_refs.userAvatar) _refs.userAvatar.setAttribute("title", name);
  };
  var _startSyncTimeUpdater = function() {
    if (_syncTimeInterval) clearInterval(_syncTimeInterval);
    _syncTimeInterval = setInterval(function() {
      if (_isDocumentVisible()) refreshSyncTimeDisplay(_refs ? _refs.syncTime : null);
    }, 1e4);
  };
  var _startScheduler = function() {
    scheduler.start({
      interval: REFRESH_INTERVAL,
      onTick: function(seconds) {
        if (_isDocumentVisible()) {
          store.setCountdown(seconds);
          updateCountdown(_refs, seconds);
        }
      },
      onRefresh: function() {
        if (_isDocumentVisible() && ensureAuth("scheduler")) {
          _loadDataFn();
        }
      }
    });
  };
  var unmount2 = function() {
    scheduler.stop();
    if (_syncTimeInterval) {
      clearInterval(_syncTimeInterval);
      _syncTimeInterval = null;
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    if (container && container.__colDragObserver) {
      container.__colDragObserver.disconnect();
      delete container.__colDragObserver;
    }
    _unsubscribes.forEach(function(fn) {
      fn();
    });
    _unsubscribes = [];
    clearItems();
    clearSections();
    clearEditState();
    bootstrapUnmount();
    resetPreviousKPIs();
    if (_integration && _unmountIntegrationFn) {
      _unmountIntegrationFn(_integration);
      _integration = null;
    }
    closeInlinePopover();
    if (_toastManager) {
      _toastManager.destroy();
    }
    closeAuditPanel();
    if (_groupSelectHandlers) _groupSelectHandlers.clearSectionsCache();
    if (_pagination) _pagination.destroy();
    _currentPage = 1;
    var _existingToolbar = document.querySelector("[data-bulk-toolbar]");
    if (_existingToolbar) _existingToolbar.remove();
    if (_bulkOps) {
      _bulkOps.clearSelection();
      _bulkOps = null;
    }
    _refs = null;
    container = null;
    _clickRouter = null;
    _dragDropHandlers = null;
    _inlineEditHandlers = null;
    _exportImportHandlers = null;
    _filterChipsHandlers = null;
    _keyboardHandlers = null;
    _autocompleteRenderer = null;
    _routeSelectHandlers = null;
    _columnSortHandlers = null;
    _iconPopoverHandlers = null;
    _groupSelectHandlers = null;
    _levelSelectHandlers = null;
    crud.clearEditingItem();
    crud.clearEditingSection();
    crud.clearPendingDelete();
    crud.resetConfirmState();
    store.reset();
    metrics.unmountCount++;
    tracker.trackUnmounted();
    return { success: true };
  };
  var _applyFilters = function() {
    var filtered = store.getFilteredItems();
    var filtersObj = store.get("filters") || {};
    var searchTerm = filtersObj.search || "";
    var itemsVM = mapItemsToViewModel(filtered);
    var totalItems = itemsVM.length;
    var pagedItems = itemsVM;
    if (_isGroupView && pagedItems.length > 0) {
      var groups = {};
      var sections = store.get("sections") || {};
      for (var gi = 0; gi < pagedItems.length; gi++) {
        var gItem = pagedItems[gi];
        var gKey = gItem.parentKey || gItem.section || "main";
        if (!groups[gKey]) groups[gKey] = [];
        groups[gKey].push(gItem);
      }
      var itemsContainer = _refs ? _refs.itemsContainer || _refs.itemsList || _refs.tableBody : null;
      if (itemsContainer) {
        var groupToolbar = '<div class="pna-group-toolbar" style="display:flex;gap:0.5rem;padding:0.25rem 0.75rem;margin-bottom:0.25rem;"><button type="button" class="pna-btn pna-btn--sm pna-btn--ghost" data-action="expand-all-groups" title="Expandir todos os grupos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg> Expandir tudo</button><button type="button" class="pna-btn pna-btn--sm pna-btn--ghost" data-action="collapse-all-groups" title="Colapsar todos os grupos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="18 15 12 9 6 15"/></svg> Colapsar tudo</button></div>';
        itemsContainer.innerHTML = groupToolbar + renderGroupedItemsList(groups, sections, _collapsedGroups);
      }
    } else {
      if (container) {
        var existingGroupToolbar = container.querySelector(".pna-group-toolbar");
        if (existingGroupToolbar) existingGroupToolbar.remove();
      }
      if (pagedItems.length === 0) {
        showEmptyState(_refs);
      } else {
        updateItems(_refs, pagedItems, searchTerm);
      }
    }
    if (_filterChipsHandlers) _filterChipsHandlers.updateFilterCounter(totalItems, (store.get("items") || []).length);
    if (searchTerm && container) {
      var collapsedSeps = container.querySelectorAll(".pna-list-group-separator");
      collapsedSeps.forEach(function(sep) {
        var groupKey = sep.dataset.groupKey || "";
        if (!groupKey) return;
        var groupHasResults = filtered.some(function(item) {
          return String(item.parent_key || item.parentKey || "_none") === groupKey;
        });
        if (groupHasResults && _collapsedGroups.has(groupKey)) {
          _collapsedGroups.delete(groupKey);
          var arrow = sep.querySelector(".pna-flat-group-arrow");
          if (arrow) arrow.innerHTML = "&#9660;";
          var hiddenItems = container.querySelectorAll('.pna-list-item[data-group-key="' + groupKey + '"].pna-flat-group-hidden');
          hiddenItems.forEach(function(el) {
            el.classList.remove("pna-flat-group-hidden");
            el.style.display = "";
          });
        }
      });
    }
    _ensureColumnDrag();
  };
  var _ensureColumnDrag = function() {
    if (!_columnSortHandlers || !container) return;
    var hdr = container.querySelector(".pna-list-header[data-grid-header]");
    if (hdr) {
      _columnSortHandlers.setupColumnDrag(hdr);
    } else {
      setTimeout(function() {
        if (!_columnSortHandlers || !container) return;
        var hdrRetry = container.querySelector(".pna-list-header[data-grid-header]");
        if (hdrRetry) {
          _columnSortHandlers.setupColumnDrag(hdrRetry);
        }
      }, 100);
    }
  };
  var _renderPaginationControls = function(_totalItems) {
    if (!container) return;
    var existingPag = container.querySelector("[data-pagination]");
    if (existingPag) existingPag.remove();
  };
  var _renderBulkToolbar = function(selectedCount) {
    var existing = document.querySelector("[data-bulk-toolbar]");
    if (existing) existing.remove();
    if (selectedCount <= 0) return;
    var toolbar = document.createElement("div");
    toolbar.className = "pna-bulk-toolbar";
    toolbar.setAttribute("data-bulk-toolbar", "");
    toolbar.innerHTML = '<div class="pna-bulk-toolbar__info"><span class="pna-bulk-toolbar__count">' + selectedCount + " iten" + (selectedCount === 1 ? "" : "s") + " selecionado" + (selectedCount === 1 ? "" : "s") + '</span></div><div class="pna-bulk-toolbar__actions"><button type="button" class="pna-btn pna-btn--success pna-btn--sm" data-bulk-action="activate" title="Ativar selecionados"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ativar</button><button type="button" class="pna-btn pna-btn--warning pna-btn--sm" data-bulk-action="deactivate" title="Desativar selecionados"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg> Desativar</button><button type="button" class="pna-btn pna-btn--danger pna-btn--sm" data-bulk-action="delete" title="Excluir selecionados"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Excluir</button><button type="button" class="pna-btn pna-btn--sm pna-btn--ghost" data-bulk-action="clear" title="Limpar selecao"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Limpar</button></div>';
    document.body.appendChild(toolbar);
    toolbar.addEventListener("click", function(ev) {
      var btn = ev.target.closest("[data-bulk-action]");
      if (!btn) return;
      var action = btn.dataset.bulkAction;
      if (action === "activate" && _bulkOps && _bulkOps.getSelectionCount() > 0) {
        _bulkOps.execute(BULK_ACTIONS.TOGGLE_ACTIVE, { activate: true });
      } else if (action === "deactivate" && _bulkOps && _bulkOps.getSelectionCount() > 0) {
        _bulkOps.execute(BULK_ACTIONS.TOGGLE_ACTIVE, { activate: false });
      } else if (action === "delete" && _bulkOps && _bulkOps.getSelectionCount() > 0) {
        _confirmBulkDelete();
      } else if (action === "clear" && _bulkOps) {
        _bulkOps.clearSelection();
        _clearAllBulkCheckboxes();
        _renderBulkToolbar(0);
      }
    });
  };
  var _updateBulkSelection = function() {
    if (!_bulkOps || !container) return;
    var checkboxes = container.querySelectorAll(".pna-bulk-checkbox:checked");
    var ids = [];
    for (var i = 0; i < checkboxes.length; i++) {
      var row = checkboxes[i].closest("[data-item-id]");
      if (row && row.dataset.itemId) ids.push(row.dataset.itemId);
    }
    _bulkOps.setSelection(ids);
    _renderBulkToolbar(ids.length);
  };
  var _clearAllBulkCheckboxes = function() {
    if (!container) return;
    var cbs = container.querySelectorAll(".pna-bulk-checkbox");
    for (var i = 0; i < cbs.length; i++) cbs[i].checked = false;
    var selectAll = container.querySelector(".pna-bulk-select-all");
    if (selectAll) selectAll.checked = false;
  };
  var _createIconPopoverHandlers = function(baseDeps) {
    return {
      handleIconClick: function(e) {
        var iconCol = e.target.closest("[data-icon-col]");
        if (!iconCol) return;
        var itemId = iconCol.dataset.itemId;
        var currentIcon = iconCol.dataset.iconName || "";
        var sourceTable = iconCol.dataset.sourceTable || "";
        var sourceId = iconCol.dataset.sourceId || "";
        if (!itemId) return;
        openInlinePopover(iconCol, {
          currentIcon,
          onSelect: function(iconKey) {
            var shortName = iconKey.indexOf(":") >= 0 ? iconKey.substring(iconKey.indexOf(":") + 1) : iconKey;
            navAdapter.updateItem(itemId, { sourceTable, sourceId, icon: shortName }).then(function(result) {
              if (result.success) {
                _showToast("Icone atualizado", "success");
                var previewEl = iconCol.querySelector(".pna-icon-preview");
                if (previewEl) {
                  var svg = window.__iconRegistry_get ? window.__iconRegistry_get(iconKey) : null;
                  if (!svg) {
                    import("/components/icon-registry/index.js").then(function(mod) {
                      var resolvedSvg = mod.get(iconKey);
                      if (resolvedSvg && previewEl) previewEl.innerHTML = resolvedSvg;
                    });
                  } else {
                    previewEl.innerHTML = svg;
                  }
                }
                iconCol.dataset.iconName = shortName;
                window.dispatchEvent(new CustomEvent("navigation:icons:updated", {
                  detail: { source: "panel-nav-admin:icon-popover", itemId, icon: shortName, timestamp: Date.now() }
                }));
              } else {
                _showToast(result.error || "Erro ao atualizar icone", "error");
              }
            }).catch(function(err) {
              _showToast("Erro: " + err.message, "error");
            });
          }
        });
      }
    };
  };
  var _toggleItemActive = function(itemId) {
    if (!ensureAuth("toggleItemActive")) return Promise.resolve();
    var items = store.get("items") || [];
    var item = items.find(function(i) {
      return String(i.id) === String(itemId);
    });
    if (!item) return;
    var newIsActive = item.isActive === false;
    var patchPayload = { sourceTable: item.sourceTable, sourceId: item.sourceId, isActive: newIsActive };
    return navAdapter.updateItem(item.id, patchPayload).then(function(result) {
      var patchOk = result && (result.success || result.ok);
      if (!patchOk) {
        console.warn("[PNA] _toggleItemActive PATCH NAO sucesso:", result);
        _showToast(result.error || "Erro ao atualizar status", "error");
        return;
      }
      _showToast(item.isActive === false ? "Item ativado" : "Item desativado", "success");
      _loadDataFn();
    }).catch(function(error) {
      console.error("[PNA] _toggleItemActive PATCH error:", error);
      _showToast("Erro ao atualizar: " + error.message, "error");
    });
  };
  var _createItem = function() {
    if (!ensureAuth("createItem")) return;
    var currentState = store.getState();
    showItemFormModal(null, currentState.sections, currentState.icons, function(data, _isEdit) {
      var itemData = data;
      navAdapter.createItem(itemData).then(function(result) {
        if (result.ok || result.success) {
          _showToast("Item criado com sucesso", "success");
          window.dispatchEvent(new CustomEvent("navigation:items:changed", { detail: { source: "panel-nav-admin", action: "create-item", timestamp: Date.now() } }));
          window.dispatchEvent(new CustomEvent("navigation:icons:updated", { detail: { source: "panel-nav-admin", timestamp: Date.now() } }));
          _loadDataFn().catch(function(err) {
            console.error("[PNA] createItem: _loadDataFn() FALHOU", err);
          });
        } else {
          _showToast(result.error || "Erro ao criar item", "error");
        }
      }).catch(function(error) {
        _showToast("Erro ao criar: " + error.message, "error");
      });
    });
  };
  var _openAuditHistory = function() {
    if (!ensureAuth("auditHistory")) return;
    if (!container) return;
    openAuditPanel(container, navAdapter, _showToast);
  };
  var _openHealthDashboard = function() {
    if (!ensureAuth("healthDashboard")) return;
    if (!container) return;
    var existing = container.querySelector("[data-health-dashboard]");
    if (existing) {
      existing.remove();
      return;
    }
    var overlay = document.createElement("div");
    overlay.className = "pna-health-dashboard-overlay";
    overlay.setAttribute("data-health-dashboard", "");
    overlay.innerHTML = '<div class="pna-health-dashboard"><div class="pna-health-dashboard__header"><h3>Status da Navega\xE7\xE3o</h3><button class="pna-health-dashboard__close" data-action="close-modal">&times;</button></div><div class="pna-health-dashboard__body"><div class="pna-spinner"></div><p>Carregando...</p></div></div>';
    container.appendChild(overlay);
    overlay.addEventListener("click", function(e) {
      if (e.target === overlay || e.target.closest('[data-action="close-modal"]')) {
        overlay.remove();
      }
    });
    fetch("/api/admin/health-dashboard.php", { credentials: "same-origin" }).then(function(r) {
      return r.json();
    }).then(function(json) {
      var body = overlay.querySelector(".pna-health-dashboard__body");
      if (!body) return;
      if (!json.ok) {
        body.innerHTML = '<p class="pna-health-dashboard__error">Erro ao carregar dados</p>';
        return;
      }
      var d = json.data;
      var summary = d.summary;
      var byCtx = d.by_context;
      var top5 = d.top5_recent || [];
      var html = '<div class="pna-health-dashboard__summary"><div class="pna-health-dashboard__kpi"><span class="pna-health-dashboard__kpi-value">' + summary.total_items + '</span><span class="pna-health-dashboard__kpi-label">Total</span></div><div class="pna-health-dashboard__kpi"><span class="pna-health-dashboard__kpi-value pna-health-dashboard__kpi-value--ok">' + summary.active_items + '</span><span class="pna-health-dashboard__kpi-label">Ativos</span></div><div class="pna-health-dashboard__kpi"><span class="pna-health-dashboard__kpi-value pna-health-dashboard__kpi-value--warn">' + summary.inactive_items + '</span><span class="pna-health-dashboard__kpi-label">Inativos</span></div><div class="pna-health-dashboard__kpi"><span class="pna-health-dashboard__kpi-value">' + summary.coverage + '%</span><span class="pna-health-dashboard__kpi-label">Cobertura</span></div></div>';
      html += '<table class="pna-health-dashboard__table"><thead><tr><th>Contexto</th><th>Total</th><th>Ativos</th><th>Inativos</th><th>\xDAltima Modifica\xE7\xE3o</th></tr></thead><tbody>';
      for (var ctx in byCtx) {
        var c = byCtx[ctx];
        var lastMod = c.last_modified ? new Date(c.last_modified).toLocaleString("pt-BR") : "\u2014";
        html += "<tr><td>" + ctx + "</td><td>" + c.total + "</td><td>" + c.active + "</td><td>" + c.inactive + "</td><td>" + lastMod + "</td></tr>";
      }
      html += "</tbody></table>";
      if (top5.length > 0) {
        html += '<h4>Top 5 \u2014 Alterados Recentemente</h4><table class="pna-health-dashboard__table"><thead><tr><th>Label</th><th>Contexto</th><th>Modificado em</th></tr></thead><tbody>';
        for (var i = 0; i < top5.length; i++) {
          var item = top5[i];
          html += "<tr><td>" + (item.label || "\u2014") + "</td><td>" + item.context + "</td><td>" + new Date(item.updated_at).toLocaleString("pt-BR") + "</td></tr>";
        }
        html += "</tbody></table>";
      }
      html += '<p class="pna-health-dashboard__footer">Resposta em ' + d.response_ms + "ms \u2014 " + d.timestamp + "</p>";
      body.innerHTML = html;
    }).catch(function(err) {
      var body = overlay.querySelector(".pna-health-dashboard__body");
      if (body) body.innerHTML = '<p class="pna-health-dashboard__error">Erro: ' + err.message + "</p>";
    });
  };
  var _handleDuplicate = function() {
    if (!ensureAuth("duplicate")) return;
    var ids = getSelectedIds();
    if (ids.length === 0) return _showToast("Selecione itens para duplicar", "error");
    _showToast(ids.length + " itens selecionados para duplicar", "info");
  };
  var _handleBulkDelete = function() {
    if (!ensureAuth("bulkDelete")) return;
    var ids = getSelectedIds();
    if (ids.length === 0) return _showToast("Selecione itens para excluir", "error");
    _showToast(ids.length + " itens selecionados para exclus\xE3o", "info");
  };
  var _duplicateItem = function(itemId, triggerElement) {
    if (!ensureAuth("duplicateItem")) return;
    if (!itemId) return;
    var items = store.get("items") || [];
    var item = items.find(function(i) {
      return String(i.id) === String(itemId);
    });
    if (!item) {
      _showToast("Item n\xE3o encontrado", "error");
      return;
    }
    var itemLabel = String(item.label || item.id || "Sem t\xEDtulo");
    var copyLabel = itemLabel + " (c\xF3pia)";
    showConfirmDialog(
      "Duplicar " + itemLabel,
      'Um novo item ser\xE1 criado com o nome "' + copyLabel + '".',
      "Duplicar",
      triggerElement
    ).then(function(confirmed) {
      if (!confirmed) return;
      var duplicate = { id: item.id + "-copy", label: copyLabel, icon: item.icon || "", section: item.section || "sidebar", parentKey: item.parentKey || "", panelId: item.panelId || "", href: item.href || "", order: (item.order || 0) + 1, minLevel: item.minLevel || 0, isActive: item.isActive !== false, isVisible: item.isVisible !== false, itemType: item.itemType || "navigation", description: item.description || "" };
      navAdapter.createItem(duplicate).then(function(result) {
        if (result.ok || result.success) {
          var newItemId = result.id || result.data && result.data.id || duplicate.id;
          _loadDataFn().then(function() {
            _showToast("Item duplicado com sucesso", "success");
            setTimeout(function() {
              var newEl = container ? container.querySelector('[data-item-id="' + newItemId + '"]') : null;
              if (newEl) {
                newEl.scrollIntoView({ behavior: "smooth", block: "center" });
                newEl.classList.add("pna-item-highlight");
                setTimeout(function() {
                  newEl.classList.remove("pna-item-highlight");
                }, 3e3);
              }
            }, 200);
          });
          window.dispatchEvent(new CustomEvent("navigation:items:changed", { detail: { source: "panel-nav-admin", action: "duplicate-item", originalItemId: itemId, newItemId, timestamp: Date.now() } }));
        } else {
          _showToast(result.error || "Erro ao duplicar item", "error");
        }
      }).catch(function(error) {
        console.error("[PNA] _duplicateItem: ERRO em createItem", error);
        _showToast("Erro ao duplicar: " + error.message, "error");
      });
    }).catch(function(outerErr) {
      console.error("[PNA] _duplicateItem: ERRO NAO CAPTURADO no fluxo de duplicate", outerErr);
      _showToast("Erro inesperado ao duplicar: " + (outerErr.message || outerErr), "error");
    });
  };
  var _resetDisplayTitle = function(targetEl) {
    var itemId = targetEl.dataset.itemId || "";
    var sourceTable = targetEl.dataset.sourceTable || "";
    var sourceId = targetEl.dataset.sourceId || "";
    if (!itemId) return;
    navAdapter.updateItem(itemId, { sourceTable, sourceId, displayTitle: "" }).then(function() {
      _showToast("Titulo resetado (usando label)", "success");
      window.dispatchEvent(new CustomEvent("navigation:items:changed", { detail: { source: "panel-nav-admin", action: "display-title-edit", itemId, newDisplayTitle: null, timestamp: Date.now() } }));
      _loadDataFn();
    }).catch(function(error) {
      _showToast("Erro ao resetar titulo: " + error.message, "error");
    });
  };
  var _bulkSetTitle = function() {
    if (!_bulkOps || _bulkOps.getSelectionCount() === 0) {
      _showToast("Nenhum item selecionado", "warning");
      return;
    }
    if (!container) return;
    var overlay = document.createElement("div");
    overlay.className = "pna-modal-overlay";
    overlay.innerHTML = '<div class="pna-modal"><div class="pna-modal__header"><h3>Definir titulo em massa</h3><button class="pna-modal__close" data-action="close-modal">&times;</button></div><div class="pna-modal__body"><p>' + _bulkOps.getSelectionCount() + ' itens selecionados</p><div class="pna-form__field"><label>Titulo para todos os itens</label><input type="text" class="pna-bulk-title-input" placeholder="Digite o titulo..." autofocus></div></div><div class="pna-modal__footer"><button class="pna-btn" data-action="close-modal">Cancelar</button><button class="pna-btn pna-btn--primary pna-bulk-title-confirm">Aplicar</button></div></div>';
    container.appendChild(overlay);
    var input = overlay.querySelector(".pna-bulk-title-input");
    var confirmBtn = overlay.querySelector(".pna-bulk-title-confirm");
    if (input) input.focus();
    var _close = function() {
      overlay.remove();
    };
    overlay.addEventListener("click", function(e) {
      if (e.target === overlay || e.target.closest('[data-action="close-modal"]')) {
        _close();
      }
    });
    if (input) input.addEventListener("keydown", function(ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        confirmBtn.click();
      } else if (ev.key === "Escape") {
        _close();
      }
    });
    confirmBtn.addEventListener("click", function() {
      var title = input ? input.value.trim() : "";
      if (title.length > 0 && title.length < 2) {
        _showToast("Titulo deve ter pelo menos 2 caracteres", "warning");
        return;
      }
      _close();
      _bulkOps.execute(BULK_ACTIONS.SET_DISPLAY_TITLE, { displayTitle: title });
    });
  };
  var _confirmBulkDelete = function() {
    if (!_bulkOps || _bulkOps.getSelectionCount() === 0) return;
    var selectedIds = _bulkOps.getSelection();
    var allItems = store.get("items") || [];
    var selectedItems = allItems.filter(function(i) {
      return selectedIds.indexOf(i.id) >= 0;
    });
    var count = selectedItems.length;
    var first5 = selectedItems.slice(0, 5).map(function(i) {
      return "  - " + (i.label || i.id || "(sem nome)");
    });
    var msg = "Excluir " + count + " iten" + (count === 1 ? "" : "s") + " de navega\xE7\xE3o?\n\n" + first5.join("\n") + (count > 5 ? "\n  ... e mais " + (count - 5) + " iten" + (count - 5 === 1 ? "" : "s") : "") + "\n\nEsta a\xE7\xE3o n\xE3o pode ser desfeita.";
    if (window.confirm(msg)) {
      _bulkOps.execute(BULK_ACTIONS.DELETE);
    }
  };
  var _toggleGroupView = function() {
    _isGroupView = !_isGroupView;
    try {
      localStorage.setItem("pna-group-view", String(_isGroupView));
    } catch (e) {
    }
    var btn = container ? container.querySelector('[data-action="toggle-group-view"]') : null;
    if (btn) {
      btn.classList.toggle("pna-btn--active", _isGroupView);
    }
    _applyFilters();
    _showToast(_isGroupView ? "Modo agrupado ativado" : "Lista plana restaurada", "info");
  };
  var _toggleGroupCollapse = function(groupKey) {
    if (_collapsedGroups.has(groupKey)) {
      _collapsedGroups.delete(groupKey);
    } else {
      _collapsedGroups.add(groupKey);
    }
    try {
      localStorage.setItem("pna-collapsed-groups", JSON.stringify(Array.from(_collapsedGroups)));
    } catch (e) {
    }
    _applyFilters();
  };
  var _expandAllGroups = function() {
    _collapsedGroups.clear();
    try {
      localStorage.setItem("pna-collapsed-groups", "[]");
    } catch (e) {
    }
    _applyFilters();
  };
  var _collapseAllGroups = function() {
    var sections = store.get("sections") || {};
    var items = store.get("items") || [];
    var keys = /* @__PURE__ */ new Set();
    for (var i = 0; i < items.length; i++) {
      var gk = items[i].parentKey || items[i].section || "main";
      keys.add(gk);
    }
    _collapsedGroups = keys;
    try {
      localStorage.setItem("pna-collapsed-groups", JSON.stringify(Array.from(_collapsedGroups)));
    } catch (e) {
    }
    _applyFilters();
  };
  var _toggleFlatGroupCollapse = function(target) {
    var groupKey = target.dataset.groupKey || target.closest("[data-group-key]")?.dataset.groupKey;
    if (!groupKey) return;
    var collapsed;
    try {
      var raw = localStorage.getItem("pna-flat-collapsed-groups");
      collapsed = raw ? new Set(JSON.parse(raw)) : /* @__PURE__ */ new Set();
    } catch (_e) {
      collapsed = /* @__PURE__ */ new Set();
    }
    if (collapsed.has(groupKey)) {
      collapsed.delete(groupKey);
    } else {
      collapsed.add(groupKey);
    }
    try {
      localStorage.setItem("pna-flat-collapsed-groups", JSON.stringify(Array.from(collapsed)));
    } catch (_e) {
    }
    if (container) {
      var items = container.querySelectorAll('.pna-list-item[data-group-key="' + groupKey + '"]');
      var isNowCollapsed = collapsed.has(groupKey);
      for (var fi = 0; fi < items.length; fi++) {
        items[fi].classList.toggle("pna-flat-group-hidden", isNowCollapsed);
      }
      var sep = container.querySelector('[data-group-separator="' + groupKey + '"] .pna-flat-group-arrow');
      if (sep) sep.innerHTML = isNowCollapsed ? "&#9654;" : "&#9660;";
    }
  };
  var _toggleCompactMode = function() {
    _isCompactMode = !_isCompactMode;
    try {
      localStorage.setItem("pna-compact-mode", String(_isCompactMode));
    } catch (e) {
    }
    if (container) {
      container.classList.toggle("pna-compact", _isCompactMode);
    }
    var btn = container ? container.querySelector('[data-action="toggle-compact-mode"]') : null;
    if (btn) {
      btn.classList.toggle("pna-btn--active", _isCompactMode);
    }
    _showToast(_isCompactMode ? "Modo compacto ativado" : "Modo normal restaurado", "info");
  };
  var _inlineEditGroupLabel = function(target) {
    if (!target || !ensureAuth("editGroupLabel")) return;
    var sectionKey = target.dataset.sectionKey || "";
    var sourceTable = target.dataset.sourceTable || "ui_nav_items";
    var sourceId = target.dataset.sourceId || "";
    var currentLabel = target.textContent || "";
    target.setAttribute("contenteditable", "true");
    target.style.outline = "1px solid rgba(99,102,241,0.5)";
    target.style.borderRadius = "3px";
    target.style.padding = "2px 4px";
    target.focus();
    if (window.getSelection && document.createRange) {
      var range = document.createRange();
      range.selectNodeContents(target);
      var sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    var _saveLabel = function() {
      target.removeAttribute("contenteditable");
      target.style.outline = "";
      target.style.padding = "";
      var newLabel = (target.textContent || "").trim();
      if (!newLabel || newLabel === currentLabel) {
        target.textContent = currentLabel;
        return;
      }
      var csrfToken = document.querySelector('meta[name="csrf-token"]');
      var headers = { "Content-Type": "application/json" };
      if (csrfToken) headers["X-CSRF-Token"] = csrfToken.getAttribute("content") || "";
      fetch("/api/admin/navigation/sections", {
        method: "PATCH",
        headers,
        credentials: "same-origin",
        body: JSON.stringify({ source_table: sourceTable, source_id: Number(sourceId), label: newLabel })
      }).then(function(res) {
        return res.json();
      }).then(function(data) {
        if (data.success) {
          _showToast("Grupo renomeado: " + newLabel, "success");
          if (_loadDataFn) _loadDataFn();
        } else {
          _showToast("Erro ao renomear grupo", "error");
          target.textContent = currentLabel;
        }
      }).catch(function() {
        _showToast("Erro de rede ao renomear grupo", "error");
        target.textContent = currentLabel;
      });
    };
    target.addEventListener("blur", _saveLabel, { once: true });
    target.addEventListener("keydown", function(ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        target.blur();
      }
      if (ev.key === "Escape") {
        target.textContent = currentLabel;
        target.blur();
      }
    });
  };
  var _newGroup = function() {
    if (!ensureAuth("createGroup")) return;
    var modalHtml = '<div class="pna-modal-overlay" data-modal="new-group" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;"><div class="pna-modal" style="background:var(--pna-surface, #1e1e2e);border-radius:0.75rem;padding:1.5rem;min-width:380px;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.08);"><h3 style="margin:0 0 1rem;font-size:1.1rem;font-weight:600;color:rgba(255,255,255,0.9);">Novo Grupo</h3><form data-form="new-group" style="display:flex;flex-direction:column;gap:0.75rem;"><div><label style="display:block;font-size:0.75rem;color:rgba(255,255,255,0.6);margin-bottom:0.25rem;">Chave (group_key) *</label><input type="text" name="group_key" required placeholder="sidebar.grp-meugrupo" style="width:100%;padding:0.5rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:0.375rem;color:inherit;font-size:0.85rem;box-sizing:border-box;"></div><div><label style="display:block;font-size:0.75rem;color:rgba(255,255,255,0.6);margin-bottom:0.25rem;">Nome (label) *</label><input type="text" name="label" required placeholder="Meu Grupo" style="width:100%;padding:0.5rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:0.375rem;color:inherit;font-size:0.85rem;box-sizing:border-box;"></div><div><label style="display:block;font-size:0.75rem;color:rgba(255,255,255,0.6);margin-bottom:0.25rem;">\xCDcone</label><input type="text" name="icon_name" placeholder="folder" style="width:100%;padding:0.5rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:0.375rem;color:inherit;font-size:0.85rem;box-sizing:border-box;"></div><div><label style="display:block;font-size:0.75rem;color:rgba(255,255,255,0.6);margin-bottom:0.25rem;">Contexto</label><select name="display_context" style="width:100%;padding:0.5rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:0.375rem;color:inherit;font-size:0.85rem;box-sizing:border-box;"><option value="sidebar">Sidebar</option><option value="navrail">NavRail</option><option value="header">Header</option></select></div><div><label style="display:block;font-size:0.75rem;color:rgba(255,255,255,0.6);margin-bottom:0.25rem;">Ordem</label><input type="number" name="order_index" value="99" min="0" style="width:100%;padding:0.5rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:0.375rem;color:inherit;font-size:0.85rem;box-sizing:border-box;"></div><div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:0.5rem;"><button type="button" data-action="close-modal" style="padding:0.5rem 1rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:0.375rem;color:inherit;cursor:pointer;font-size:0.8rem;">Cancelar</button><button type="submit" style="padding:0.5rem 1rem;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.4);border-radius:0.375rem;color:#818cf8;cursor:pointer;font-size:0.8rem;font-weight:600;">Criar Grupo</button></div></form></div></div>';
    if (container) {
      container.insertAdjacentHTML("beforeend", modalHtml);
      var overlay = container.querySelector('[data-modal="new-group"]');
      if (!overlay) return;
      overlay.addEventListener("click", function(ev) {
        if (ev.target === overlay) overlay.remove();
      });
      var closeBtn = overlay.querySelector('[data-action="close-modal"]');
      if (closeBtn) closeBtn.addEventListener("click", function() {
        overlay.remove();
      });
      var form = overlay.querySelector('[data-form="new-group"]');
      if (form) {
        form.addEventListener("submit", function(ev) {
          ev.preventDefault();
          var fd = new FormData(form);
          var payload = {};
          fd.forEach(function(val, key) {
            payload[key] = val;
          });
          if (!payload.group_key || !payload.label) {
            _showToast("Chave e nome s\xE3o obrigat\xF3rios", "error");
            return;
          }
          var csrfToken = document.querySelector('meta[name="csrf-token"]');
          var headers = { "Content-Type": "application/json" };
          if (csrfToken) headers["X-CSRF-Token"] = csrfToken.getAttribute("content") || "";
          fetch("/api/admin/navigation/sections", {
            method: "POST",
            headers,
            credentials: "same-origin",
            body: JSON.stringify(payload)
          }).then(function(res) {
            return res.json();
          }).then(function(data) {
            if (data.success) {
              overlay.remove();
              _showToast("Grupo criado com sucesso!", "success");
              if (_loadDataFn) _loadDataFn();
            } else {
              _showToast("Erro: " + (data.meta?.message || "Falha ao criar grupo"), "error");
            }
          }).catch(function() {
            _showToast("Erro de rede ao criar grupo", "error");
          });
        });
      }
    }
  };
  var _loadDiagnostic = function() {
    if (!ensureAuth("loadDiagnostic")) return Promise.resolve();
    store.setDiagnosticLoading(true);
    return diagnostic.fetchFullReport().then(function(data) {
      store.setDiagnosticData(data);
      _showToast("Diagn\xF3stico carregado", "success");
    }).catch(function(error) {
      store.setDiagnosticLoading(false);
      _showToast("Erro: " + error.message, "error");
    });
  };
  var _validateRoute = function() {
    if (!ensureAuth("validateRoute")) return;
    var input = container.querySelector('[data-input="validate-route"]');
    var resultContainer = container.querySelector("[data-validate-result]");
    if (!input || !resultContainer) return;
    var route = input.value.trim();
    if (!route) return _showToast("Digite uma rota para validar", "error");
    resultContainer.innerHTML = '<div class="pna-diagnostic-loading"><div class="pna-spinner"></div><p>Validando...</p></div>';
    return diagnostic.validateRoute(route).then(function(data) {
      resultContainer.innerHTML = renderValidationResult(data);
    }).catch(function(error) {
      resultContainer.innerHTML = '<div class="pna-validation-result pna-validation-result--danger"><p>Erro: ' + error.message + "</p></div>";
    });
  };
  var _renderDiagnostic = function(data, loading) {
    if (!_refs || !_refs.diagnosticContainer) return;
    var diagEl = _refs.diagnosticContainer;
    var validationResult = diagEl.querySelector("[data-validate-result]");
    var existingResult = validationResult ? validationResult.innerHTML : null;
    diagEl.innerHTML = renderDiagnosticTab(data, loading);
    if (existingResult) {
      var newValidationResult = diagEl.querySelector("[data-validate-result]");
      if (newValidationResult) newValidationResult.innerHTML = existingResult;
    }
    var dataObj = data;
    if (dataObj && dataObj.health !== void 0) animateHealthGauge(_refs.healthGaugeFill, _refs.healthValue, _refs.healthStatus, dataObj.health);
    if (dataObj && dataObj.sections && _refs.coverageHeatmap) renderHeatmap(_refs.coverageHeatmap, dataObj.sections);
    if (dataObj && dataObj.routes && _refs.routeTree) renderRouteTree(_refs.routeTree, dataObj.routes);
    if (dataObj && dataObj.history && _refs.timeline) renderTimeline(_refs.timeline, dataObj.history);
  };
  var refresh = function() {
    return _loadDataFn();
  };
  var getState = function() {
    return store.getState();
  };
  var healthCheck2 = function() {
    return Object.assign({}, buildHealthCheck(isInitialized, container, store.healthCheck(), navAdapter.healthCheck()), { isDocumentVisible: _isDocumentVisible(), scheduler: scheduler.healthCheck(), bootstrap: { mounted: !!_refs, refsCount: _refs ? Object.keys(_refs).length : 0, premium: true, modular: true }, integration: _integration && _getIntegrationHealthFn ? _getIntegrationHealthFn(_integration) : null });
  };
  var info = function() {
    return Object.assign({}, buildInfo(isInitialized, container, healthCheck2()), { version: VERSION, isDocumentVisible: _isDocumentVisible(), architecture: "bootstrap-incremental-premium-modular-v2-full-migration", features: "55 Migrated Modules + Modular Core + Route Select", scheduler: scheduler.info(), store: store.info() });
  };
  return { init, mount: mount2, unmount: unmount2, refresh, getState, healthCheck: healthCheck2, info, getVersion: function() {
    return VERSION;
  } };
}();
if (typeof window !== "undefined" && !isStrict()) {
  window.PanelNavAdmin = PanelNavAdmin;
  window.__dev = window.__dev || {};
  window.__dev.panels = window.__dev.panels || {};
  window.__dev.panels.navAdmin = PanelNavAdmin;
}
var mount = PanelNavAdmin.mount;
var unmount = PanelNavAdmin.unmount;
var destroy = function() {
  return unmount();
};
var healthCheck = PanelNavAdmin.healthCheck;
var panel_nav_admin_default = PanelNavAdmin;
export {
  MODULE_ID,
  PanelNavAdmin,
  VERSION,
  panel_nav_admin_default as default,
  destroy,
  getVersion,
  healthCheck,
  mount,
  unmount
};
