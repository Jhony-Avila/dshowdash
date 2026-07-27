import { openCustomSelect } from "../ui/custom-select.js";
var MODULE_ID = "panel-nav-admin-handlers-group-select";
var VERSION = "2.0.0-CUSTOM-SELECT";
var _cachedSections = null;
var _fetchInFlight = false;
var _isOpen = false;
var _FETCH_TIMEOUT_MS = 5e3;
function createGroupSelectHandlers(deps) {
  var navAdapter = deps.navAdapter;
  var showToast = deps.showToast;
  var loadData = deps.loadData;
  function handleGroupClick(e) {
    var groupCol = e.target.closest(".pna-col-group");
    if (!groupCol) return;
    if (_isOpen) return;
    var row = groupCol.closest("[data-item-id]");
    if (!row) return;
    var itemId = row.dataset.itemId;
    var sourceTable = row.dataset.sourceTable;
    var sourceId = row.dataset.sourceId;
    var section = row.dataset.section;
    if (!sourceTable || !sourceId) {
      showToast("Item sem source_table/source_id \u2014 n\xE3o edit\xE1vel", "warning");
      return;
    }
    if (_fetchInFlight) return;
    var badgeEl = groupCol.querySelector(".pna-badge-group");
    var currentValue = badgeEl ? (badgeEl.getAttribute("title") || "").trim() : "";
    groupCol.classList.add("pna-group-loading");
    _fetchInFlight = true;
    _getSectionsWithTimeout(navAdapter).then(function(sections) {
      _fetchInFlight = false;
      groupCol.classList.remove("pna-group-loading");
      var anchorEl = badgeEl || groupCol;
      _isOpen = true;
      var groupOptions = [
        { value: "", label: "Sem grupo", description: "Item avulso" }
      ];
      for (var i = 0; i < sections.length; i++) {
        var s = sections[i];
        var sKey = s.key || s.group_key || s.item_key || "";
        var sLabel = s.label || s.displayLabel || sKey;
        var sCtx = s.context || s.display_context || "";
        groupOptions.push({
          value: sKey,
          label: sLabel,
          description: sCtx ? sCtx : void 0
        });
      }
      openCustomSelect({
        anchor: anchorEl,
        options: groupOptions,
        value: currentValue,
        searchable: true,
        searchPlaceholder: "Buscar grupo...",
        width: 220,
        onSelect: function(newValue) {
          _isOpen = false;
          if (newValue === currentValue) return;
          var newLabel = newValue ? newValue : "-";
          if (_cachedSections && newValue) {
            for (var j = 0; j < _cachedSections.length; j++) {
              var sec = _cachedSections[j];
              var secKey = sec.key || sec.group_key || sec.item_key || "";
              if (secKey === newValue) {
                newLabel = sec.label || sec.displayLabel || secKey;
                break;
              }
            }
          }
          if (badgeEl) {
            badgeEl.textContent = newLabel;
            badgeEl.setAttribute("title", newValue);
          }
          var updates = {
            sourceTable,
            sourceId,
            parentKey: newValue || null
          };
          navAdapter.updateItem(itemId, updates, {}).then(function(result) {
            if (result.success) {
              showToast("Grupo atualizado: " + (newLabel || "Sem grupo"), "success");
              window.dispatchEvent(new CustomEvent("navigation:items:changed", {
                detail: {
                  source: "panel-nav-admin",
                  action: "group-change",
                  itemId,
                  newGroup: newValue,
                  timestamp: Date.now()
                }
              }));
              loadData();
            } else {
              showToast("Erro ao salvar: " + (result.error || "desconhecido"), "error");
              if (badgeEl) {
                badgeEl.textContent = currentValue || "-";
                badgeEl.setAttribute("title", currentValue);
              }
            }
          }).catch(function(err) {
            showToast("Erro: " + err.message, "error");
            if (badgeEl) {
              badgeEl.textContent = currentValue || "-";
              badgeEl.setAttribute("title", currentValue);
            }
          });
        },
        onClose: function() {
          _isOpen = false;
        }
      });
    }).catch(function(err) {
      _fetchInFlight = false;
      groupCol.classList.remove("pna-group-loading");
      showToast("Erro ao carregar grupos: " + err.message, "error");
    });
  }
  function _getSectionsWithTimeout(adapter) {
    if (_cachedSections) return Promise.resolve(_cachedSections);
    return new Promise(function(resolve, reject) {
      var timedOut = false;
      var timer = setTimeout(function() {
        timedOut = true;
        reject(new Error("Timeout: API n\xE3o respondeu em " + _FETCH_TIMEOUT_MS / 1e3 + "s"));
      }, _FETCH_TIMEOUT_MS);
      _getSections(adapter).then(function(sections) {
        if (!timedOut) {
          clearTimeout(timer);
          resolve(sections);
        }
      }).catch(function(err) {
        if (!timedOut) {
          clearTimeout(timer);
          reject(err);
        }
      });
    });
  }
  function _getSections(adapter) {
    if (_cachedSections) return Promise.resolve(_cachedSections);
    return adapter.fetchSections({}).then(function(result) {
      var data = result;
      if (Array.isArray(data)) {
        _cachedSections = data;
        return _cachedSections;
      }
      var flat = [];
      if (data && typeof data === "object") {
        var keys = Object.keys(data);
        for (var k = 0; k < keys.length; k++) {
          var arr = data[keys[k]];
          if (Array.isArray(arr)) {
            for (var j = 0; j < arr.length; j++) {
              flat.push(arr[j]);
            }
          }
        }
      }
      _cachedSections = flat;
      return _cachedSections;
    });
  }
  function clearSectionsCache() {
    _cachedSections = null;
  }
  return {
    handleGroupClick,
    clearSectionsCache
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
  createGroupSelectHandlers,
  healthCheck,
  info
};
