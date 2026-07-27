import { startInlineEdit, endInlineEdit } from "../renderer/items.js";
import { shakeElement } from "../renderer/effects.js";
const MODULE_ID = "panel-nav-admin-handlers-inline-edit";
const VERSION = "12.1.0-TITLE-UX-ENHANCE";
let _currentEditState = null;
let _labelEditActive = false;
function createInlineEditHandlers(deps) {
  const container = deps.container;
  const store = deps.store;
  const navAdapter = deps.navAdapter;
  const showToast = deps.showToast;
  const loadData = deps.loadData;
  function handleLabelClick(e) {
    var el = e.target;
    var labelSpan = el.closest(".pna-item-label");
    if (!labelSpan) return;
    if (el.closest(".pna-list-header")) return;
    if (_labelEditActive) return;
    var row = labelSpan.closest("[data-item-id]");
    if (!row) return;
    var itemId = row.dataset.itemId || "";
    var sourceTable = row.dataset.sourceTable || "";
    var sourceId = row.dataset.sourceId || "";
    var originalValue = (labelSpan.textContent || "").trim();
    _labelEditActive = true;
    var input = document.createElement("input");
    input.type = "text";
    input.className = "pna-inline-edit-input";
    input.value = originalValue;
    var originalHtml = labelSpan.innerHTML;
    labelSpan.textContent = "";
    labelSpan.appendChild(input);
    labelSpan.classList.add("pna-item__field--editing");
    row.classList.add("pna-list-item--editing");
    input.focus();
    input.select();
    var _saved = false;
    function _finishEdit(save) {
      if (_saved) return;
      var newValue = input.value.trim();
      if (save && newValue !== originalValue) {
        if (!newValue || newValue.length < 2) {
          input.classList.add("pna-input-invalid");
          var existingError = labelSpan.querySelector(".pna-inline-error");
          if (!existingError) {
            var errSpan = document.createElement("span");
            errSpan.className = "pna-inline-error";
            errSpan.textContent = "Label deve ter pelo menos 2 caracteres";
            labelSpan.appendChild(errSpan);
          }
          shakeElement(input);
          input.focus();
          return;
        }
      }
      _saved = true;
      _labelEditActive = false;
      labelSpan.classList.remove("pna-item__field--editing");
      row.classList.remove("pna-list-item--editing");
      if (!save || newValue === originalValue) {
        labelSpan.innerHTML = originalHtml;
        return;
      }
      labelSpan.textContent = newValue;
      var savingEl = document.createElement("span");
      savingEl.className = "pna-saving-indicator";
      savingEl.textContent = " Salvando...";
      labelSpan.appendChild(savingEl);
      row.classList.add("pna-list-item--saving");
      var updates = {
        sourceTable,
        sourceId,
        label: newValue
      };
      navAdapter.updateItem(itemId, updates).then(function(result) {
        if (savingEl.parentNode) savingEl.remove();
        row.classList.remove("pna-list-item--saving");
        if (result && !result.success) {
          console.error("[inline-edit] updateItem FAILED \u2014 result.success is falsy:", result);
          labelSpan.innerHTML = originalHtml;
          shakeElement(labelSpan);
          showToast("Failed to update item: " + (result.error || result.message || "Unknown error"), "error");
          return;
        }
        showToast("Item atualizado", "success");
        window.dispatchEvent(new CustomEvent("navigation:items:changed", {
          detail: { source: "panel-nav-admin", action: "label-edit", itemId, newLabel: newValue, timestamp: Date.now() }
        }));
        loadData();
      }).catch(function(error) {
        if (savingEl.parentNode) savingEl.remove();
        row.classList.remove("pna-list-item--saving");
        labelSpan.innerHTML = originalHtml;
        shakeElement(labelSpan);
        showToast("Erro: " + error.message, "error");
      });
    }
    input.addEventListener("keydown", function(ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        _finishEdit(true);
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        _finishEdit(false);
      }
    });
    input.addEventListener("blur", function() {
      _finishEdit(true);
    });
  }
  function handleDisplayTitleClick(e) {
    var el = e.target;
    var titleSpan = el.closest(".pna-display-title");
    if (!titleSpan) return;
    if (el.closest(".pna-list-header")) return;
    if (_labelEditActive) return;
    var row = titleSpan.closest("[data-item-id]");
    if (!row) return;
    var itemId = row.dataset.itemId || "";
    var sourceTable = row.dataset.sourceTable || "";
    var sourceId = row.dataset.sourceId || "";
    var items = store.get("items") || [];
    var storeItem = items.find(function(i) {
      return i.id === itemId;
    });
    var originalValue = (storeItem && storeItem.displayTitle ? String(storeItem.displayTitle) : "").trim();
    var fallbackLabel = storeItem && storeItem.label ? String(storeItem.label) : (titleSpan.textContent || "").trim();
    _labelEditActive = true;
    var input = document.createElement("input");
    input.type = "text";
    input.className = "pna-inline-edit-input";
    input.value = originalValue || "";
    input.placeholder = fallbackLabel;
    var originalHtml = titleSpan.innerHTML;
    titleSpan.textContent = "";
    titleSpan.appendChild(input);
    titleSpan.classList.add("pna-item__field--editing");
    row.classList.add("pna-list-item--editing");
    input.focus();
    input.select();
    var _saved = false;
    function _finishTitleEdit(save) {
      if (_saved) return;
      var newValue = input.value.trim();
      if (save && newValue.length > 0 && newValue.length < 2) {
        input.classList.add("pna-input-invalid");
        var existingError = titleSpan.querySelector(".pna-inline-error");
        if (!existingError) {
          var errSpan = document.createElement("span");
          errSpan.className = "pna-inline-error";
          errSpan.textContent = "Titulo deve ter pelo menos 2 caracteres";
          titleSpan.appendChild(errSpan);
        }
        shakeElement(input);
        input.focus();
        return;
      }
      _saved = true;
      _labelEditActive = false;
      titleSpan.classList.remove("pna-item__field--editing");
      row.classList.remove("pna-list-item--editing");
      var valueToSave = newValue || "";
      if (!save || valueToSave === originalValue) {
        titleSpan.innerHTML = originalHtml;
        return;
      }
      titleSpan.textContent = valueToSave || fallbackLabel;
      var savingEl = document.createElement("span");
      savingEl.className = "pna-saving-indicator";
      savingEl.textContent = " Salvando...";
      titleSpan.appendChild(savingEl);
      row.classList.add("pna-list-item--saving");
      var updates = {
        sourceTable,
        sourceId,
        displayTitle: valueToSave
      };
      navAdapter.updateItem(itemId, updates).then(function(result) {
        if (savingEl.parentNode) savingEl.remove();
        row.classList.remove("pna-list-item--saving");
        if (result && !result.success) {
          titleSpan.innerHTML = originalHtml;
          shakeElement(titleSpan);
          showToast("Falha ao atualizar titulo: " + (result.error || result.message || "Erro desconhecido"), "error");
          return;
        }
        showToast("Titulo atualizado", "success");
        window.dispatchEvent(new CustomEvent("navigation:items:changed", {
          detail: { source: "panel-nav-admin", action: "display-title-edit", itemId, newDisplayTitle: valueToSave, timestamp: Date.now() }
        }));
        loadData();
      }).catch(function(error) {
        if (savingEl.parentNode) savingEl.remove();
        row.classList.remove("pna-list-item--saving");
        titleSpan.innerHTML = originalHtml;
        shakeElement(titleSpan);
        showToast("Erro: " + error.message, "error");
      });
    }
    input.addEventListener("keydown", function(ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        _finishTitleEdit(true);
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        _finishTitleEdit(false);
      }
    });
    input.addEventListener("blur", function() {
      _finishTitleEdit(true);
    });
  }
  function handleDoubleClick(e) {
    const el = e.target;
    const labelCell = el.closest("[data-inline-edit]");
    if (!labelCell) return;
    const row = labelCell.closest("[data-item-id]");
    if (!row) return;
    const itemId = row.dataset.itemId;
    const field = labelCell.dataset.inlineEdit;
    const editState = startInlineEdit(itemId, field);
    if (!editState) return;
    _currentEditState = editState;
    const saveBtn = editState.wrapper.querySelector('[data-action="save-inline"]');
    const cancelBtn = editState.wrapper.querySelector('[data-action="cancel-inline"]');
    const input = editState.wrapper.querySelector("input");
    if (saveBtn) saveBtn.addEventListener("click", () => {
      const newValue = input ? input.value : "";
      saveInlineEdit(itemId, field, newValue);
    });
    if (cancelBtn) cancelBtn.addEventListener("click", () => {
      cancelInlineEdit();
    });
    if (input) {
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          saveInlineEdit(itemId, field, ev.target.value);
        } else if (ev.key === "Escape") {
          ev.preventDefault();
          cancelInlineEdit();
        }
      });
      input.focus();
      input.select();
    }
  }
  function saveInlineEdit(itemId, field, newValue) {
    if (!_currentEditState) return;
    const items = store.get("items") || [];
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const updateData = Object.assign({}, item);
    updateData[field] = newValue;
    navAdapter.updateItem(itemId, updateData).then(() => {
      _currentEditState.originalCell.textContent = newValue;
      endInlineEdit(_currentEditState.wrapper, _currentEditState.originalCell);
      _currentEditState = null;
      showToast("Item atualizado", "success");
      loadData();
    }).catch((error) => {
      const inp = _currentEditState.wrapper.querySelector("input");
      if (inp) shakeElement(inp);
      showToast(`Erro: ${error.message}`, "error");
    });
  }
  function cancelInlineEdit() {
    if (!_currentEditState) return;
    endInlineEdit(_currentEditState.wrapper, _currentEditState.originalCell);
    _currentEditState = null;
  }
  return { handleLabelClick, handleDisplayTitleClick, handleDoubleClick, saveInlineEdit, cancelInlineEdit };
}
function getCurrentEditState() {
  return _currentEditState;
}
function clearEditState() {
  if (_currentEditState) {
    endInlineEdit(_currentEditState.wrapper, _currentEditState.originalCell);
    _currentEditState = null;
  }
  _labelEditActive = false;
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
  clearEditState,
  createInlineEditHandlers,
  getCurrentEditState,
  healthCheck,
  info
};
