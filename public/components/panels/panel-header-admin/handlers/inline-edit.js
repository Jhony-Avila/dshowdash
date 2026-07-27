const MODULE_ID = "panel-header-admin-handlers-inline-edit";
const VERSION = "1.0.0-INLINE-EDIT";
let _editActive = false;
function createInlineEditHandlers(deps) {
  const { container, api, showToast, loadData } = deps;
  function _shakeElement(el) {
    el.classList.add("pha-shake");
    setTimeout(() => el.classList.remove("pha-shake"), 500);
  }
  function handleLabelClick(e) {
    const el = e.target;
    const nameSpan = el.closest(".pha-card__name");
    if (!nameSpan) return;
    if (_editActive) return;
    const card = nameSpan.closest("[data-component-id]");
    if (!card) return;
    const componentId = card.dataset.componentId || "";
    const originalValue = (nameSpan.textContent || "").trim();
    _editActive = true;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "pha-inline-edit-input";
    input.value = originalValue;
    const originalHtml = nameSpan.innerHTML;
    nameSpan.textContent = "";
    nameSpan.appendChild(input);
    nameSpan.classList.add("pha-card__name--editing");
    card.classList.add("pha-card--editing");
    input.focus();
    input.select();
    let _saved = false;
    function _finishEdit(save) {
      if (_saved) return;
      const newValue = input.value.trim();
      if (save && newValue !== originalValue) {
        if (!newValue || newValue.length < 2) {
          input.classList.add("pha-input-invalid");
          let existingError = nameSpan.querySelector(".pha-inline-error");
          if (!existingError) {
            const errSpan = document.createElement("span");
            errSpan.className = "pha-inline-error";
            errSpan.textContent = "Label deve ter pelo menos 2 caracteres";
            nameSpan.appendChild(errSpan);
          }
          _shakeElement(input);
          input.focus();
          return;
        }
      }
      _saved = true;
      _editActive = false;
      nameSpan.classList.remove("pha-card__name--editing");
      card.classList.remove("pha-card--editing");
      if (!save || newValue === originalValue) {
        nameSpan.innerHTML = originalHtml;
        return;
      }
      nameSpan.textContent = newValue;
      api.updateComponent({ id: componentId, label: newValue }).then(function(result) {
        if (result && !result.success) {
          nameSpan.innerHTML = originalHtml;
          _shakeElement(nameSpan);
          showToast("Falha ao atualizar label: " + (result.error || result.message || "Erro desconhecido"), "error");
          return;
        }
        showToast("Label atualizado", "success");
        window.dispatchEvent(new CustomEvent("header:components:changed", {
          detail: { source: "panel-header-admin", action: "label-edit", componentId, newLabel: newValue, timestamp: Date.now() }
        }));
        loadData();
      }).catch(function(error) {
        nameSpan.innerHTML = originalHtml;
        _shakeElement(nameSpan);
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
  function handleOrderClick(e) {
    const el = e.target;
    const orderSpan = el.closest(".pha-card__order");
    if (!orderSpan) return;
    if (_editActive) return;
    const card = orderSpan.closest("[data-component-id]");
    if (!card) return;
    const componentId = card.dataset.componentId || "";
    const originalText = (orderSpan.textContent || "").trim();
    const originalValue = parseInt(originalText.replace("#", ""), 10) || 0;
    _editActive = true;
    const input = document.createElement("input");
    input.type = "number";
    input.className = "pha-inline-edit-input pha-inline-edit-input--order";
    input.value = String(originalValue);
    input.min = "0";
    const originalHtml = orderSpan.innerHTML;
    orderSpan.textContent = "";
    orderSpan.appendChild(input);
    orderSpan.classList.add("pha-card__order--editing");
    card.classList.add("pha-card--editing");
    input.focus();
    input.select();
    let _saved = false;
    function _finishEdit(save) {
      if (_saved) return;
      const newValue = parseInt(input.value, 10);
      if (save && !isNaN(newValue) && newValue !== originalValue) {
        if (newValue < 0) {
          input.classList.add("pha-input-invalid");
          _shakeElement(input);
          input.focus();
          return;
        }
      }
      _saved = true;
      _editActive = false;
      orderSpan.classList.remove("pha-card__order--editing");
      card.classList.remove("pha-card--editing");
      if (!save || isNaN(newValue) || newValue === originalValue) {
        orderSpan.innerHTML = originalHtml;
        return;
      }
      orderSpan.textContent = "#" + newValue;
      api.updateComponent({ id: componentId, order_index: newValue }).then(function(result) {
        if (result && !result.success) {
          orderSpan.innerHTML = originalHtml;
          _shakeElement(orderSpan);
          showToast("Falha ao atualizar ordem: " + (result.error || result.message || "Erro desconhecido"), "error");
          return;
        }
        showToast("Ordem atualizada", "success");
        window.dispatchEvent(new CustomEvent("header:components:changed", {
          detail: { source: "panel-header-admin", action: "order-edit", componentId, newOrder: newValue, timestamp: Date.now() }
        }));
        loadData();
      }).catch(function(error) {
        orderSpan.innerHTML = originalHtml;
        _shakeElement(orderSpan);
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
  function handleClick(e) {
    const el = e.target;
    if (el.closest("[data-action]")) return;
    if (el.closest(".pha-card__drag-handle")) return;
    if (el.closest(".pha-card__name")) {
      handleLabelClick(e);
      return;
    }
    if (el.closest(".pha-card__order")) {
      handleOrderClick(e);
      return;
    }
  }
  return { handleClick, handleLabelClick, handleOrderClick };
}
function getCurrentEditState() {
  return _editActive;
}
function clearEditState() {
  _editActive = false;
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
