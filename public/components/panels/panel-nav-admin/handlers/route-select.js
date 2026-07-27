var MODULE_ID = "panel-nav-admin-handlers-route-select";
var VERSION = "2.0.0-ROUTE-INPUT";
var _activeEdit = null;
function createRouteSelectHandlers(deps) {
  var navAdapter = deps.navAdapter;
  var showToast = deps.showToast;
  var loadData = deps.loadData;
  function handleRouteClick(e) {
    var hrefCol = e.target.closest(".pna-col-href");
    if (!hrefCol) return;
    if (hrefCol.querySelector(".pna-route-input")) return;
    var row = hrefCol.closest("[data-item-id]");
    if (!row) return;
    var itemId = row.dataset.itemId;
    var sourceTable = row.dataset.sourceTable;
    var sourceId = row.dataset.sourceId;
    if (!sourceTable || !sourceId) {
      showToast("Item sem source_table/source_id \u2014 n\xE3o edit\xE1vel", "warning");
      return;
    }
    _closeActiveEdit(false);
    var codeEl = hrefCol.querySelector(".pna-item-href");
    var currentValue = codeEl ? (codeEl.textContent || "").trim() : "";
    if (currentValue === "-") currentValue = "";
    _openInput(hrefCol, currentValue, {
      itemId,
      sourceTable,
      sourceId,
      codeEl
    });
  }
  function _openInput(hrefCol, currentValue, meta) {
    var input = document.createElement("input");
    input.type = "text";
    input.className = "pna-route-input";
    input.value = currentValue;
    input.placeholder = "ex: #/dashboard ou panel-xyz";
    if (meta.codeEl) meta.codeEl.style.display = "none";
    hrefCol.appendChild(input);
    _activeEdit = {
      input,
      hrefCol,
      codeEl: meta.codeEl,
      meta,
      originalValue: currentValue
    };
    input.focus();
    input.select();
    var _saved = false;
    function _finishEdit(save) {
      if (_saved) return;
      _saved = true;
      var newValue = input.value.trim();
      if (!save || newValue === currentValue) {
        _closeActiveEdit(false);
        return;
      }
      _saveRoute(newValue);
    }
    input.addEventListener("keydown", function(ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        _finishEdit(true);
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        ev.stopPropagation();
        _finishEdit(false);
      }
    });
    input.addEventListener("blur", function() {
      _finishEdit(true);
    });
  }
  function _saveRoute(newValue) {
    if (!_activeEdit) return;
    var meta = _activeEdit.meta;
    var originalValue = _activeEdit.originalValue;
    if (newValue && newValue.indexOf("#") !== 0 && newValue.indexOf("/") !== 0 && newValue.indexOf("panel-") !== 0) {
      showToast("Rota deve come\xE7ar com #, / ou panel-", "error");
      _closeActiveEdit(true);
      return;
    }
    var isRoute = newValue.indexOf("#/") === 0 || newValue.indexOf("/") === 0;
    var updates = {
      sourceTable: meta.sourceTable,
      sourceId: meta.sourceId
    };
    if (isRoute) {
      updates.href = newValue;
    } else {
      updates.panelId = newValue;
    }
    if (_activeEdit.codeEl) {
      _activeEdit.codeEl.textContent = newValue || "-";
    }
    _closeActiveEdit(false);
    navAdapter.updateItem(meta.itemId, updates, {}).then(function(result) {
      if (result.success) {
        showToast("Rota atualizada: " + newValue, "success");
        loadData();
      } else {
        showToast("Erro ao salvar: " + (result.error || "desconhecido"), "error");
        if (meta.codeEl) meta.codeEl.textContent = originalValue || "-";
      }
    }).catch(function(err) {
      showToast("Erro: " + err.message, "error");
      if (meta.codeEl) meta.codeEl.textContent = originalValue || "-";
    });
  }
  function _closeActiveEdit(revert) {
    if (!_activeEdit) return;
    var ed = _activeEdit;
    _activeEdit = null;
    if (ed.codeEl) ed.codeEl.style.display = "";
    if (ed.input && ed.input.parentNode) {
      ed.input.parentNode.removeChild(ed.input);
    }
  }
  function clearRoutesCache() {
  }
  return {
    handleRouteClick,
    clearRoutesCache
  };
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
  createRouteSelectHandlers,
  healthCheck,
  info
};
