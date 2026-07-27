const MODULE_ID = "panel-nav-admin/handlers/crud";
const VERSION = "11.7.0-CONFIRM-FIX";
import { state } from "../state/store.js";
import { tracker } from "../telemetry/tracker.js";
import { ui } from "../ui/renderer.js";
import * as navAdapter from "../core/nav-adapter.js";
import { validateItem, validateSectionData } from "../utils/validators.js";
import { mapFormToItem, mapItemToForm, mapFormToSection, mapSectionToForm } from "../utils/mappers.js";
import { metrics } from "../core/lifecycle.js";
import { showConfirmDialog } from "../ui/modals.js";
const _ui = ui;
const _navAdapter = navAdapter;
const _tracker = tracker;
const _validateItem = validateItem;
const _validateSectionData = validateSectionData;
let _editingItem = null;
let _editingSection = null;
let _pendingDelete = null;
let _confirmInProgress = false;
function getEditingItem() {
  return _editingItem;
}
function getEditingSection() {
  return _editingSection;
}
function getPendingDelete() {
  return _pendingDelete;
}
function clearEditingItem() {
  _editingItem = null;
}
function clearEditingSection() {
  _editingSection = null;
}
function clearPendingDelete() {
  _pendingDelete = null;
}
function resetConfirmState() {
  _confirmInProgress = false;
  _pendingDelete = null;
}
function openItemForm(container, itemId = null) {
  const currentState = state.getState();
  let item = null;
  if (itemId) {
    item = currentState.items?.find((i) => i.id === itemId);
    if (item) item = mapItemToForm(item);
  }
  _editingItem = itemId;
  const modal = container?.querySelector('[data-modal="item-form"]');
  const backdrop = container?.querySelector("[data-modal-backdrop]");
  if (modal && backdrop) {
    modal.innerHTML = _ui.renderItemForm(item, currentState.sections, currentState.icons);
    modal.hidden = false;
    backdrop.hidden = false;
  }
}
async function saveItem(data, callbacks) {
  const { showToast, showLoading, closeAllModals, loadData } = callbacks;
  const currentState = state.getState();
  const itemData = mapFormToItem(data);
  const isEdit = !!_editingItem;
  const validation = _validateItem(itemData, currentState.sections, currentState.items, isEdit);
  if (!validation.valid) {
    showToast(validation.errors[0], "error");
    return;
  }
  state.markSaving();
  showLoading(true);
  try {
    let result;
    if (isEdit) {
      result = await _navAdapter.updateItem(_editingItem, itemData);
      if (result.success) {
        metrics.itemsUpdated++;
        _tracker.trackItemUpdated(itemData);
        showToast("Item atualizado com sucesso", "success");
      }
    } else {
      result = await _navAdapter.createItem(itemData);
      if (result.success) {
        metrics.itemsCreated++;
        _tracker.trackItemCreated(itemData);
        showToast("Item criado com sucesso", "success");
        if (data.scaffold) {
          await runScaffold(itemData, showToast);
        }
      }
    }
    if (result.success) {
      window.dispatchEvent(new CustomEvent("navigation:icons:updated", {
        detail: { source: "panel-nav-admin", timestamp: Date.now() }
      }));
      closeAllModals();
      await loadData();
    } else {
      showToast(result.error || "Erro ao salvar item", "error");
      state.markReady();
    }
  } catch (error) {
    metrics.errorCount++;
    showToast(error.message, "error");
    state.setError(error.message);
  }
  showLoading(false);
}
function openSectionForm(container, sectionKey = null) {
  const currentState = state.getState();
  let section = null;
  const sections = currentState.sections;
  if (sectionKey && sections[sectionKey]) {
    section = mapSectionToForm(sectionKey, sections[sectionKey]);
  }
  _editingSection = sectionKey;
  const modal = container?.querySelector('[data-modal="section-form"]');
  const backdrop = container?.querySelector("[data-modal-backdrop]");
  if (modal && backdrop) {
    modal.innerHTML = _ui.renderSectionForm(section);
    modal.hidden = false;
    backdrop.hidden = false;
  }
}
async function saveSection(data, callbacks) {
  const { showToast, showLoading, closeAllModals, loadData } = callbacks;
  const currentState = state.getState();
  const sectionData = mapFormToSection(data);
  const isEdit = !!_editingSection;
  const validation = _validateSectionData(sectionData, currentState.sections, isEdit);
  if (!validation.valid) {
    showToast(validation.errors[0], "error");
    return;
  }
  state.markSaving();
  showLoading(true);
  try {
    let result;
    if (isEdit) {
      result = await _navAdapter.updateSection(_editingSection, sectionData);
      if (result.success) {
        _tracker.trackSectionUpdated(sectionData);
        showToast("Se\xE7\xE3o atualizada com sucesso", "success");
      }
    } else {
      result = await _navAdapter.createSection(sectionData);
      if (result.success) {
        metrics.sectionsCreated++;
        _tracker.trackSectionCreated(sectionData);
        showToast("Se\xE7\xE3o criada com sucesso", "success");
      }
    }
    if (result.success) {
      closeAllModals();
      await loadData();
    } else {
      showToast(result.error || "Erro ao salvar se\xE7\xE3o", "error");
      state.markReady();
    }
  } catch (error) {
    metrics.errorCount++;
    showToast(error.message, "error");
  }
  showLoading(false);
}
async function confirmDeleteItem(container, itemId, callbacks, triggerElement) {
  if (_confirmInProgress) return;
  _confirmInProgress = true;
  try {
    const items = state.get("items") || [];
    const item = items.find((i) => String(i.id) === String(itemId));
    const label = item?.label || itemId;
    const confirmed = await showConfirmDialog(
      "Excluir " + label,
      "Tem certeza que deseja excluir este item?",
      "Excluir",
      triggerElement
    );
    if (!confirmed) {
      return;
    }
    if (!item?.sourceTable || !item?.sourceId) {
      console.error("[crud] ERRO: sourceTable ou sourceId ausentes no item! item:", JSON.stringify(item));
    }
    _pendingDelete = { type: "item", id: itemId, sourceTable: item?.sourceTable, sourceId: item?.sourceId };
    _confirmInProgress = false;
    await executeDeleteItem(callbacks);
  } catch (err) {
    console.error("[crud] ERRO em confirmDeleteItem:", err);
    _confirmInProgress = false;
  }
}
async function executeDeleteItem(callbacks) {
  const { showToast, showLoading, closeAllModals, loadData } = callbacks;
  const showToastWithAction = callbacks.showToastWithAction;
  if (!_pendingDelete || _pendingDelete.type !== "item") {
    console.warn("[crud] executeDeleteItem ABORTADO \u2014 _pendingDelete invalido:", JSON.stringify(_pendingDelete));
    return;
  }
  if (!_pendingDelete.sourceTable || !_pendingDelete.sourceId) {
    console.error("[crud] executeDeleteItem ABORTADO \u2014 sourceTable/sourceId ausentes:", { sourceTable: _pendingDelete.sourceTable, sourceId: _pendingDelete.sourceId });
    showToast("Erro: dados de origem do item n\xE3o encontrados (sourceTable/sourceId)", "error");
    _pendingDelete = null;
    showLoading(false);
    return;
  }
  const deletedSourceTable = _pendingDelete.sourceTable;
  const deletedSourceId = _pendingDelete.sourceId;
  const deletedItemId = _pendingDelete.id;
  state.markSaving();
  showLoading(true);
  try {
    const result = await _navAdapter.deleteItem(_pendingDelete.id, _pendingDelete.sourceTable, _pendingDelete.sourceId);
    if (result.success) {
      metrics.itemsDeleted++;
      _tracker.trackItemDeleted(_pendingDelete.id);
      const deletedRow = document.querySelector(`[data-item-id="${_pendingDelete.id}"]`);
      if (deletedRow) {
        deletedRow.style.transition = "opacity 300ms ease-out";
        deletedRow.style.opacity = "0";
        await new Promise((resolve) => {
          setTimeout(() => {
            deletedRow.remove();
            resolve();
          }, 300);
        });
      }
      closeAllModals();
      window.dispatchEvent(new CustomEvent("navigation:items:changed", {
        detail: { source: "panel-nav-admin", action: "delete-item", itemId: _pendingDelete.id, timestamp: Date.now() }
      }));
      await loadData();
      if (showToastWithAction) {
        showToastWithAction("Item exclu\xEDdo com sucesso", "success", "Desfazer", function() {
          _navAdapter.restoreItem(deletedSourceTable, deletedSourceId).then(function(restoreResult) {
            if (restoreResult.success) {
              showToast("Item restaurado com sucesso", "success");
              loadData();
            } else {
              showToast(restoreResult.error || "Erro ao restaurar item", "error");
            }
          }).catch(function(err) {
            showToast("Erro ao restaurar: " + err.message, "error");
          });
        }, 5e3);
      } else {
        showToast("Item exclu\xEDdo com sucesso", "success");
      }
    } else {
      showToast(result.error || "Erro ao excluir item", "error");
      state.markReady();
    }
  } catch (error) {
    metrics.errorCount++;
    showToast(error.message, "error");
  }
  _pendingDelete = null;
  showLoading(false);
}
function confirmDeleteSection(container, sectionKey) {
  const currentState = state.getState();
  const itemsInSection = currentState.items?.filter((i) => i.section === sectionKey).length || 0;
  _pendingDelete = { type: "section", key: sectionKey };
  const modal = container?.querySelector('[data-modal="confirm"]');
  const backdrop = container?.querySelector("[data-modal-backdrop]");
  if (modal && backdrop) {
    modal.innerHTML = _ui.renderConfirmModal(
      "Excluir Se\xE7\xE3o",
      `Deseja realmente excluir a se\xE7\xE3o "${sectionKey}"?${itemsInSection > 0 ? ` Os ${itemsInSection} itens ser\xE3o movidos para "operacional".` : ""}`,
      "Excluir",
      "confirm-delete-section"
    );
    modal.hidden = false;
    backdrop.hidden = false;
  }
}
async function executeDeleteSection(callbacks) {
  const { showToast, showLoading, closeAllModals, loadData } = callbacks;
  if (!_pendingDelete || _pendingDelete.type !== "section") return;
  state.markSaving();
  showLoading(true);
  try {
    const result = await _navAdapter.deleteSection(_pendingDelete.key, "operacional");
    if (result.success) {
      _tracker.trackSectionDeleted(_pendingDelete.key);
      showToast("Se\xE7\xE3o exclu\xEDda com sucesso", "success");
      closeAllModals();
      await loadData();
    } else {
      showToast(result.error || "Erro ao excluir se\xE7\xE3o", "error");
      state.markReady();
    }
  } catch (error) {
    metrics.errorCount++;
    showToast(error.message, "error");
  }
  _pendingDelete = null;
  showLoading(false);
}
async function runScaffold(item, showToast) {
  _tracker.trackScaffoldStarted({ id: item.id });
  try {
    const result = await _navAdapter.scaffoldPage({
      id: item.id,
      label: item.label,
      href: item.href,
      section: item.section
    });
    if (result.success) {
      _tracker.trackScaffoldCompleted({ id: item.id });
      showToast("Estrutura da p\xE1gina criada com sucesso", "success");
    } else {
      _tracker.trackScaffoldError(result.error);
      showToast(`Erro ao criar estrutura da p\xE1gina: ${result.error || "Erro desconhecido"}`, "error");
    }
  } catch (error) {
    _tracker.trackScaffoldError(error);
    showToast("Erro ao criar estrutura da p\xE1gina", "error");
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { crudReady: true } };
}
export {
  clearEditingItem,
  clearEditingSection,
  clearPendingDelete,
  confirmDeleteItem,
  confirmDeleteSection,
  executeDeleteItem,
  executeDeleteSection,
  getEditingItem,
  getEditingSection,
  getPendingDelete,
  healthCheck,
  info,
  openItemForm,
  openSectionForm,
  resetConfirmState,
  runScaffold,
  saveItem,
  saveSection
};
