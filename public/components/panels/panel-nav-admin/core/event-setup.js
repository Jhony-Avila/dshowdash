import { store } from "../state/store.js";
import * as crud from "../handlers/crud.js";
import { triggerConfetti } from "../renderer/effects.js";
var MODULE_ID = "panel-nav-admin-event-setup";
var VERSION = "12.3.0-STOP-PROPAGATION";
function setupEventListeners(deps) {
  var container = deps.container;
  var abortController = deps.abortController;
  var refs = deps.refs;
  var clickRouter = deps.clickRouter;
  var keyboardHandlers = deps.keyboardHandlers;
  var inlineEditHandlers = deps.inlineEditHandlers;
  var dragDropHandlers = deps.dragDropHandlers;
  var filterChipsHandlers = deps.filterChipsHandlers;
  var autocompleteRenderer = deps.autocompleteRenderer;
  var routeSelectHandlers = deps.routeSelectHandlers;
  var columnSortHandlers = deps.columnSortHandlers;
  var iconPopoverHandlers = deps.iconPopoverHandlers;
  var groupSelectHandlers = deps.groupSelectHandlers;
  var levelSelectHandlers = deps.levelSelectHandlers;
  var applyFilters = deps.applyFilters;
  var showToast = deps.showToast;
  if (!container || !abortController) return;
  var signal = abortController.signal;
  var _classDispatch = {};
  var _attrDispatch = {};
  if (clickRouter) {
    _attrDispatch["data-action"] = { handler: clickRouter, bodyOnly: false };
  }
  if (inlineEditHandlers) {
    _classDispatch["pna-item-label"] = {
      handler: function(e) {
        inlineEditHandlers.handleLabelClick(e);
      },
      bodyOnly: true
    };
    _classDispatch["pna-display-title"] = {
      handler: function(e) {
        inlineEditHandlers.handleDisplayTitleClick(e);
      },
      bodyOnly: true
    };
  }
  if (iconPopoverHandlers) {
    _attrDispatch["data-icon-col"] = {
      handler: function(e) {
        iconPopoverHandlers.handleIconClick(e);
      },
      bodyOnly: false
    };
  }
  if (routeSelectHandlers) {
    _classDispatch["pna-col-href"] = {
      handler: function(e) {
        routeSelectHandlers.handleRouteClick(e);
      },
      bodyOnly: false
    };
  }
  if (levelSelectHandlers) {
    _classDispatch["pna-col-level"] = {
      handler: function(e) {
        levelSelectHandlers.handleLevelClick(e);
      },
      bodyOnly: true
    };
  }
  if (groupSelectHandlers) {
    _classDispatch["pna-col-group"] = {
      handler: function(e) {
        groupSelectHandlers.handleGroupClick(e);
      },
      bodyOnly: true
    };
  }
  var _attrKeys = Object.keys(_attrDispatch);
  var _classKeys = Object.keys(_classDispatch);
  var _attrLen = _attrKeys.length;
  var _classLen = _classKeys.length;
  container.addEventListener("click", function(e) {
    var el = e.target;
    var closestAction = el.closest ? el.closest("[data-action]") : null;
    var tabEl = el.closest ? el.closest("[data-tab]") : null;
    if (tabEl && tabEl.dataset.tab) {
      var tab = tabEl.dataset.tab;
      store.setActiveTab(tab);
      if (clickRouter) clickRouter(e);
      return;
    }
    if (el.dataset && el.dataset.action) {
      var fastAction = el.dataset.action;
      if (fastAction === "delete-item" || fastAction === "duplicate-item") {
        e.stopPropagation();
        e.preventDefault();
      }
      if (clickRouter) clickRouter(e);
      if (fastAction === "delete-item" || fastAction === "duplicate-item") {
        e.stopImmediatePropagation();
      }
      return;
    }
    var elParent = el.parentElement;
    if (elParent && elParent.dataset && elParent.dataset.action) {
      var parentAction = elParent.dataset.action;
      if (parentAction === "delete-item" || parentAction === "duplicate-item") {
        e.stopPropagation();
        e.preventDefault();
      }
      if (clickRouter) clickRouter(e);
      if (parentAction === "delete-item" || parentAction === "duplicate-item") {
        e.stopImmediatePropagation();
      }
      return;
    }
    var node = el;
    var isInHeader = false;
    var matched = null;
    var foundSort = false;
    while (node && node !== container) {
      if (!isInHeader && node.classList && node.classList.contains("pna-list-header")) {
        isInHeader = true;
      }
      if (isInHeader && !foundSort && columnSortHandlers && node instanceof HTMLElement && node.hasAttribute("data-sort")) {
        columnSortHandlers.handleHeaderClick(e);
        return;
      }
      if (!matched && node instanceof HTMLElement) {
        for (var ai = 0; ai < _attrLen; ai++) {
          if (node.hasAttribute(_attrKeys[ai])) {
            matched = _attrDispatch[_attrKeys[ai]];
            if (_attrKeys[ai] === "data-action") {
              var walkAction = node.getAttribute("data-action");
              if (walkAction === "delete-item" || walkAction === "duplicate-item") {
                e.stopPropagation();
                e.preventDefault();
              }
              matched.handler(e);
              if (walkAction === "delete-item" || walkAction === "duplicate-item") {
                e.stopImmediatePropagation();
              }
              return;
            }
            break;
          }
        }
      }
      if (!matched && node.classList) {
        for (var ci = 0; ci < _classLen; ci++) {
          if (node.classList.contains(_classKeys[ci])) {
            matched = _classDispatch[_classKeys[ci]];
            break;
          }
        }
      }
      node = node.parentElement;
    }
    if (matched) {
      if (matched.bodyOnly && isInHeader) {
        if (clickRouter) clickRouter(e);
        return;
      }
      matched.handler(e);
      return;
    }
    if (clickRouter) clickRouter(e);
  }, { signal });
  container.addEventListener("change", function(e) {
    var changeTarget = e.target;
    if (changeTarget.classList.contains("pna-bulk-select-all")) {
      var checked = changeTarget.checked;
      var checkboxes = container.querySelectorAll(".pna-bulk-checkbox");
      for (var ci = 0; ci < checkboxes.length; ci++) checkboxes[ci].checked = checked;
      container.dispatchEvent(new CustomEvent("pna:bulk-selection-changed", { bubbles: false }));
      return;
    }
    if (changeTarget.classList.contains("pna-bulk-checkbox")) {
      container.dispatchEvent(new CustomEvent("pna:bulk-selection-changed", { bubbles: false }));
      return;
    }
    handleChange(e, filterChipsHandlers, applyFilters);
  }, { signal });
  container.addEventListener("input", function(e) {
    handleInput(e, filterChipsHandlers, autocompleteRenderer, applyFilters);
  }, { signal });
  container.addEventListener("submit", function(e) {
    handleSubmit(e, refs, showToast);
  }, { signal });
  container.addEventListener("keydown", function(e) {
    if (keyboardHandlers) keyboardHandlers.handleInputKeydown(e);
  }, { signal });
  container.addEventListener("dblclick", function(e) {
    if (inlineEditHandlers) inlineEditHandlers.handleDoubleClick(e);
  }, { signal });
  document.addEventListener("keydown", function(e) {
    if (keyboardHandlers) keyboardHandlers.handleGlobalKeydown(e);
  }, { signal });
}
function handleChange(e, filterChipsHandlers, applyFilters) {
  const changeTarget = e.target;
  var filter = changeTarget.dataset.filter;
  if (!filter) return;
  if (changeTarget.classList.contains("pna-route-dropdown") || changeTarget.classList.contains("pna-group-dropdown") || changeTarget.classList.contains("pna-level-dropdown")) return;
  var value = changeTarget.value;
  store.setFilter(filter, value);
  if (filter !== "search") {
    var options = changeTarget.options;
    var label = options && options[changeTarget.selectedIndex] ? options[changeTarget.selectedIndex].text : filter;
    if (filterChipsHandlers) filterChipsHandlers.addFilterChip(filter, value && value !== "all" && value !== "" ? label : null, filter);
  }
  applyFilters();
}
var _inputTimer = null;
function handleInput(e, filterChipsHandlers, autocompleteRenderer, applyFilters) {
  const inputTarget = e.target;
  var filter = inputTarget.dataset.filter;
  if (filter !== "search") return;
  clearTimeout(_inputTimer);
  _inputTimer = setTimeout(function() {
    store.setFilter("search", inputTarget.value);
    const target = inputTarget;
    if (target.value) {
      if (filterChipsHandlers) filterChipsHandlers.addFilterChip("search", target.value, "Busca");
    } else {
      if (filterChipsHandlers) filterChipsHandlers.removeFilterChip("search");
    }
    if (autocompleteRenderer) autocompleteRenderer.updateAutocomplete(target.value);
    applyFilters();
  }, 300);
}
async function handleSubmit(e, refs, showToast) {
  e.preventDefault();
  var form = e.target.closest("[data-form]");
  if (!form) return;
  var formType = form.dataset.form;
  var formData = new FormData(form);
  var data = {};
  formData.forEach(function(value, key) {
    data[key] = value;
  });
  var isDividerEl = form.querySelector('[name="isDivider"]');
  var scaffoldEl = form.querySelector('[name="scaffold"]');
  data.isDivider = isDividerEl ? isDividerEl.checked : false;
  data.scaffold = scaffoldEl ? scaffoldEl.checked : false;
  const refsMap = refs;
  var callbacks = { showToast, showLoading: function() {
  }, closeAllModals: function() {
  }, loadData: function() {
  }, triggerConfetti: function() {
    triggerConfetti(refsMap ? refsMap.confettiContainer : null, 30);
  } };
  if (formType === "item") {
    var result = await crud.saveItem(data, callbacks);
    if (result && result.success && !data.id) triggerConfetti(refsMap ? refsMap.confettiContainer : null, 30);
  } else if (formType === "section") {
    var result2 = await crud.saveSection(data, callbacks);
    if (result2 && result2.success && !data.key) triggerConfetti(refsMap ? refsMap.confettiContainer : null, 30);
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var event_setup_default = { MODULE_ID, VERSION, setupEventListeners, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  event_setup_default as default,
  healthCheck,
  info,
  setupEventListeners
};
