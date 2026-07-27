import { openCustomSelect } from "../ui/custom-select.js";
var MODULE_ID = "panel-nav-admin-handlers-level-select";
var VERSION = "2.1.0-LEVEL-BADGE-FIX";
var LEVEL_OPTIONS = [
  { value: "0", label: "P\xFAblico", color: "#9ca3af", description: "N\xEDvel 0 \u2014 P\xFAblico" },
  { value: "1", label: "Usu\xE1rio", color: "#4ade80", description: "N\xEDvel 1 \u2014 Usu\xE1rio" },
  { value: "2", label: "Moderador", color: "#60a5fa", description: "N\xEDvel 2 \u2014 Moderador" },
  { value: "3", label: "Admin", color: "#ef4444", description: "N\xEDvel 3 \u2014 Admin" }
];
var LEVEL_LABELS = { "0": "P\xFAblico", "1": "Usu\xE1rio", "2": "Moderador", "3": "Admin" };
var SHIELD_ICON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
function getLevelBadgeHTML(level) {
  var lvl = String(level);
  var label = LEVEL_LABELS[lvl] || "N\xEDvel " + lvl;
  return SHIELD_ICON + " " + label;
}
function _applyLevelBadge(badgeEl, level) {
  badgeEl.innerHTML = getLevelBadgeHTML(level);
  badgeEl.setAttribute("data-level", level);
  var classes = badgeEl.className.split(" ");
  var filtered = [];
  for (var i = 0; i < classes.length; i++) {
    if (classes[i].indexOf("pna-level-") !== 0) {
      filtered.push(classes[i]);
    }
  }
  filtered.push("pna-level-" + level);
  badgeEl.className = filtered.join(" ");
  var numVal = parseInt(level, 10);
  if (numVal >= 80) {
    badgeEl.classList.add("pna-badge-admin");
  } else {
    badgeEl.classList.remove("pna-badge-admin");
  }
}
var _isOpen = false;
function createLevelSelectHandlers(deps) {
  var navAdapter = deps.navAdapter;
  var showToast = deps.showToast;
  var loadData = deps.loadData;
  function handleLevelClick(e) {
    var levelCol = e.target.closest(".pna-col-level");
    if (!levelCol) return;
    if (_isOpen) return;
    var row = levelCol.closest("[data-item-id]");
    if (!row) return;
    var itemId = row.dataset.itemId;
    var sourceTable = row.dataset.sourceTable;
    var sourceId = row.dataset.sourceId;
    if (!sourceTable || !sourceId) {
      showToast("Item sem source_table/source_id \u2014 n\xE3o edit\xE1vel", "warning");
      return;
    }
    var badgeEl = levelCol.querySelector(".pna-badge-level");
    var currentValue = "0";
    if (badgeEl) {
      currentValue = badgeEl.getAttribute("data-level") || "0";
    }
    var anchorEl = badgeEl || levelCol;
    _isOpen = true;
    openCustomSelect({
      anchor: anchorEl,
      options: LEVEL_OPTIONS,
      value: currentValue,
      searchable: false,
      width: 180,
      onSelect: function(newValue) {
        _isOpen = false;
        if (newValue === currentValue) return;
        if (badgeEl) {
          _applyLevelBadge(badgeEl, newValue);
        }
        var levelLabel = LEVEL_LABELS[newValue] || newValue;
        var updates = {
          sourceTable,
          sourceId,
          minLevel: parseInt(newValue, 10)
        };
        navAdapter.updateItem(itemId, updates, {}).then(function(result) {
          if (result.success) {
            showToast("N\xEDvel atualizado: " + levelLabel, "success");
            window.dispatchEvent(new CustomEvent("navigation:items:changed", {
              detail: {
                source: "panel-nav-admin",
                action: "level-change",
                itemId,
                newLevel: newValue,
                timestamp: Date.now()
              }
            }));
            loadData();
          } else {
            showToast("Erro ao salvar: " + (result.error || "desconhecido"), "error");
            if (badgeEl) {
              _applyLevelBadge(badgeEl, currentValue);
            }
          }
        }).catch(function(err) {
          showToast("Erro: " + err.message, "error");
          if (badgeEl) {
            _applyLevelBadge(badgeEl, currentValue);
          }
        });
      },
      onClose: function() {
        _isOpen = false;
      }
    });
  }
  return {
    handleLevelClick
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
  createLevelSelectHandlers,
  getLevelBadgeHTML,
  healthCheck,
  info
};
