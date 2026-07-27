import { applyTheme, applyDensity } from "../theme-applier.js";
import { _state, _handlers, _pendingImportData, _pendingDeleteAction, _draggedItem, pushUndo, setPendingImportData, setPendingDeleteAction, setDraggedItem, clearUndoStack } from "./state.js";
import { showToast, announce, setButtonLoading, openModal, closeModal, scheduleAutoSave, cancelAutoSave, addMicroAnimation, requestPushPermission } from "./utils.js";
const MODULE_ID = "panels-panel-user-preferences-events-handlers";
const VERSION = "9.3.0-P2-ENTERPRISE";
function _getPrefs() {
  return _state?.preferences;
}
function _callHandler(name, ...args) {
  if (_handlers && typeof _handlers[name] === "function") {
    return _handlers[name](...args);
  }
  return void 0;
}
async function _callHandlerAsync(name, ...args) {
  if (_handlers && typeof _handlers[name] === "function") {
    return await _handlers[name](...args);
  }
  return void 0;
}
let _boundListeners = [];
function _addListener(el, event, handler) {
  if (!el) return;
  el.addEventListener(event, handler);
  _boundListeners.push({ element: el, event, handler });
}
function setupThemeHandlers(container) {
  container.querySelectorAll("[data-theme]").forEach((el) => {
    const htmlEl = el;
    _addListener(el, "mouseenter", () => {
      const theme = htmlEl.dataset.theme;
      if (theme !== _getPrefs()?.theme) {
        el.classList.add("preview-active");
        applyTheme(theme);
      }
    });
    _addListener(el, "mouseleave", () => {
      el.classList.remove("preview-active");
      applyTheme(_getPrefs()?.theme || "dark");
    });
    _addListener(el, "click", () => {
      const theme = htmlEl.dataset.theme;
      pushUndo("theme", _getPrefs()?.theme || "dark");
      applyTheme(theme);
      _callHandler("markDirty", "theme", theme);
      scheduleAutoSave();
      addMicroAnimation(el, "pup-bounce");
      announce(`Tema: ${theme === "light" ? "claro" : theme === "dark" ? "escuro" : "auto"}`);
    });
    _addListener(el, "keydown", (e) => {
      const ke = e;
      if (ke.key === "Enter" || ke.key === " ") {
        e.preventDefault();
        htmlEl.click();
      }
    });
  });
}
function setupDensityHandlers(container) {
  container.querySelectorAll("[data-density]").forEach((el) => {
    const htmlEl = el;
    _addListener(el, "click", () => {
      const density = htmlEl.dataset.density;
      pushUndo("density", _getPrefs()?.density || "comfortable");
      applyDensity(density);
      _callHandler("markDirty", "density", density);
      scheduleAutoSave();
      addMicroAnimation(el, "pup-bounce");
      announce(`Densidade: ${density}`);
    });
    _addListener(el, "keydown", (e) => {
      const ke = e;
      if (ke.key === "Enter" || ke.key === " ") {
        e.preventDefault();
        htmlEl.click();
      }
    });
  });
}
function setupToggleHandlers(container) {
  container.querySelectorAll('[data-pref-change="toggle"]').forEach((el) => {
    const inputEl = el;
    _addListener(el, "change", async () => {
      const key = inputEl.dataset.pref;
      const value = inputEl.checked ? "true" : "false";
      pushUndo(key, inputEl.checked ? "false" : "true");
      if (key === "push_enabled" && inputEl.checked) {
        const granted = await requestPushPermission();
        if (!granted) {
          inputEl.checked = false;
          return;
        }
        showToast("Notifica\xE7\xF5es push ativadas!", "success");
      }
      _callHandler("markDirty", key, value);
      scheduleAutoSave();
      const parent = el.closest(".pup-notif-item");
      const iconEl = parent?.querySelector(".pup-notif-icon");
      if (iconEl && key === "sound_enabled") {
        iconEl.innerHTML = inputEl.checked ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>';
      }
      if (el.parentElement) addMicroAnimation(el.parentElement, "pup-bounce");
      announce(`${key === "notifications_enabled" ? "Notifica\xE7\xF5es" : key === "push_enabled" ? "Push" : "Sons"} ${inputEl.checked ? "ativados" : "desativados"}`);
    });
  });
}
function setupDragDropHandlers(container) {
  const droppableArea = container.querySelector('[data-droppable="layouts"]');
  if (!droppableArea) return;
  const items = droppableArea.querySelectorAll('.pup-item[draggable="true"]');
  items.forEach((item) => {
    const htmlItem = item;
    _addListener(item, "dragstart", (e) => {
      const de = e;
      setDraggedItem(item);
      htmlItem.classList.add("dragging");
      if (de.dataTransfer) {
        de.dataTransfer.effectAllowed = "move";
        de.dataTransfer.setData("text/plain", htmlItem.dataset.layoutKey || "");
      }
    });
    _addListener(item, "dragend", () => {
      htmlItem.classList.remove("dragging");
      setDraggedItem(null);
      droppableArea.querySelectorAll(".pup-item").forEach((i) => {
        i.classList.remove("drag-over");
      });
    });
    _addListener(item, "dragover", (e) => {
      e.preventDefault();
      const de = e;
      if (de.dataTransfer) de.dataTransfer.dropEffect = "move";
      if (_draggedItem && _draggedItem !== item) htmlItem.classList.add("drag-over");
    });
    _addListener(item, "dragleave", () => {
      htmlItem.classList.remove("drag-over");
    });
    _addListener(item, "drop", (e) => {
      e.preventDefault();
      item.classList.remove("drag-over");
      if (_draggedItem && _draggedItem !== item) {
        const allItems = Array.from(droppableArea.querySelectorAll('.pup-item[draggable="true"]'));
        const draggedIndex = allItems.indexOf(_draggedItem);
        const targetIndex = allItems.indexOf(item);
        if (draggedIndex < targetIndex) item.parentNode?.insertBefore(_draggedItem, item.nextSibling);
        else item.parentNode?.insertBefore(_draggedItem, item);
        const newOrder = Array.from(droppableArea.querySelectorAll('.pup-item[draggable="true"]')).map((i) => i.dataset.layoutKey);
        _callHandler("reorderLayouts", newOrder);
        showToast("Ordem dos layouts atualizada", "info");
        announce("Layouts reordenados");
      }
    });
  });
}
function setupActionHandlers(container) {
  const toggleCompactBtn = container.querySelector('[data-action="toggle-compact"]');
  if (toggleCompactBtn) _addListener(toggleCompactBtn, "click", (e) => {
    _callHandler("toggleCompact");
    addMicroAnimation(e.currentTarget, "pup-bounce");
    announce(_state?.isCompact ? "Modo expandido" : "Modo compacto");
  });
  const saveAllBtn = container.querySelector('[data-action="save-all"]');
  if (saveAllBtn) _addListener(saveAllBtn, "click", async (e) => {
    const btn = e.currentTarget;
    cancelAutoSave();
    setButtonLoading(btn, true);
    addMicroAnimation(btn, "pup-bounce");
    try {
      await _callHandlerAsync("saveAllChanges");
      showToast("Prefer\xEAncias salvas", "success");
      announce("Prefer\xEAncias salvas");
    } catch (err) {
      showToast("Erro ao salvar", "error");
      announce("Erro ao salvar");
    } finally {
      setButtonLoading(btn, false);
    }
  });
  const discardBtn = container.querySelector('[data-action="discard-changes"]');
  if (discardBtn) _addListener(discardBtn, "click", (e) => {
    cancelAutoSave();
    _callHandler("discardChanges");
    addMicroAnimation(e.currentTarget, "pup-shake");
    showToast("Altera\xE7\xF5es descartadas", "info");
    announce("Altera\xE7\xF5es descartadas");
  });
  const resetBtn = container.querySelector('[data-action="reset-preferences"]');
  if (resetBtn) _addListener(resetBtn, "click", () => {
    openModal("pup-reset-modal");
  });
  const closeResetBtn = container.querySelector('[data-action="close-reset"]');
  if (closeResetBtn) _addListener(closeResetBtn, "click", () => {
    closeModal("pup-reset-modal");
  });
  const confirmResetBtn = container.querySelector('[data-action="confirm-reset"]');
  if (confirmResetBtn) _addListener(confirmResetBtn, "click", async () => {
    closeModal("pup-reset-modal");
    cancelAutoSave();
    const defaults = { theme: "dark", density: "comfortable", notifications_enabled: "true", sound_enabled: "false", push_enabled: "false" };
    for (const key in defaults) {
      if (Object.prototype.hasOwnProperty.call(defaults, key)) _callHandler("markDirty", key, defaults[key]);
    }
    applyTheme("dark");
    applyDensity("comfortable");
    document.documentElement.style.removeProperty("--pup-accent");
    document.documentElement.style.removeProperty("--pup-bg");
    document.documentElement.style.removeProperty("--pup-card");
    document.documentElement.style.removeProperty("--pup-text");
    await _callHandlerAsync("saveAllChanges");
    clearUndoStack();
    showToast("Prefer\xEAncias restauradas", "success");
    announce("Prefer\xEAncias restauradas");
  });
  const showHistoryBtn = container.querySelector('[data-action="show-history"]');
  if (showHistoryBtn) _addListener(showHistoryBtn, "click", (e) => {
    const section = container.querySelector("#pup-history-section");
    if (section) {
      section.style.display = "block";
      section.classList.add("pup-slide-in");
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    addMicroAnimation(e.currentTarget, "pup-bounce");
    _callHandler("setHistoryVisible", true);
  });
  const hideHistoryBtn = container.querySelector('[data-action="hide-history"]');
  if (hideHistoryBtn) _addListener(hideHistoryBtn, "click", () => {
    const section = container.querySelector("#pup-history-section");
    if (section) section.style.display = "none";
    _callHandler("setHistoryVisible", false);
  });
  container.querySelectorAll("[data-filter]").forEach((btn) => {
    const htmlBtn = btn;
    _addListener(btn, "click", () => {
      const filter = htmlBtn.dataset.filter;
      container.querySelectorAll("[data-filter]").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      addMicroAnimation(btn, "pup-bounce");
      container.querySelectorAll(".pup-history-item").forEach((item) => {
        const htmlItem = item;
        const type = htmlItem.dataset.type;
        htmlItem.style.display = filter === "all" || type === filter ? "flex" : "none";
      });
      _callHandler("setHistoryFilter", filter);
    });
  });
  const historySearchInput = container.querySelector('[data-input="history-search"]');
  if (historySearchInput) _addListener(historySearchInput, "input", (e) => {
    const target = e.target;
    const query = target.value.toLowerCase().trim();
    container.querySelectorAll(".pup-history-item").forEach((item) => {
      const htmlItem = item;
      const text = (item.textContent || "").toLowerCase();
      htmlItem.style.display = !query || text.includes(query) ? "flex" : "none";
    });
  });
  container.querySelectorAll('[data-action="confirm-delete-layout"]').forEach((btn) => {
    _addListener(btn, "click", () => {
      const parent = btn.closest("[data-layout-key]");
      const key = parent?.dataset.layoutKey;
      if (!key) return;
      setPendingDeleteAction({ type: "layout", key });
      const msgEl = container.querySelector("#confirm-message");
      if (msgEl) msgEl.textContent = `Excluir layout "${key}"?`;
      openModal("pup-confirm-modal");
    });
  });
  container.querySelectorAll('[data-action="confirm-delete-view"]').forEach((btn) => {
    _addListener(btn, "click", () => {
      const parent = btn.closest("[data-view-id]");
      const id = parent?.dataset.viewId;
      if (!id) return;
      setPendingDeleteAction({ type: "view", id });
      const msgEl = container.querySelector("#confirm-message");
      if (msgEl) msgEl.textContent = "Excluir esta view?";
      openModal("pup-confirm-modal");
    });
  });
  const closeConfirmBtn = container.querySelector('[data-action="close-confirm"]');
  if (closeConfirmBtn) _addListener(closeConfirmBtn, "click", () => {
    closeModal("pup-confirm-modal");
    setPendingDeleteAction(null);
  });
  const confirmActionBtn = container.querySelector('[data-action="confirm-action"]');
  if (confirmActionBtn) _addListener(confirmActionBtn, "click", async () => {
    if (!_pendingDeleteAction) return;
    closeModal("pup-confirm-modal");
    if (_pendingDeleteAction.type === "layout") {
      await _callHandlerAsync("deleteLayout", _pendingDeleteAction.key);
      showToast("Layout exclu\xEDdo", "success");
    } else {
      await _callHandlerAsync("deleteSavedView", _pendingDeleteAction.id);
      showToast("View exclu\xEDda", "success");
    }
    setPendingDeleteAction(null);
  });
  container.querySelectorAll('[data-action="apply-layout"]').forEach((btn) => {
    _addListener(btn, "click", () => {
      const parent = btn.closest("[data-layout-key]");
      const key = parent?.dataset.layoutKey;
      if (key) {
        _callHandler("applyLayout", key);
        addMicroAnimation(btn, "pup-bounce");
        showToast(`Layout "${key}" aplicado`, "success");
      }
    });
  });
  container.querySelectorAll('[data-action="apply-view"]').forEach((btn) => {
    _addListener(btn, "click", () => {
      const parent = btn.closest("[data-view-id]");
      const id = parent?.dataset.viewId;
      if (id) {
        _callHandler("applyView", id);
        addMicroAnimation(btn, "pup-bounce");
        showToast("View aplicada", "success");
      }
    });
  });
  const saveLayoutBtn = container.querySelector('[data-action="save-current-layout"]');
  if (saveLayoutBtn) _addListener(saveLayoutBtn, "click", async (e) => {
    const input = container.querySelector('[data-input="new-layout-name"]');
    const name = input?.value.trim() || "";
    if (!name) {
      addMicroAnimation(input, "pup-shake");
      showToast("Digite um nome", "warning");
      return;
    }
    addMicroAnimation(e.currentTarget, "pup-bounce");
    await _callHandlerAsync("saveLayout", name, {}, false);
    if (input) input.value = "";
    showToast(`Layout "${name}" salvo`, "success");
  });
  const exportBtn = container.querySelector('[data-action="export"]');
  if (exportBtn) _addListener(exportBtn, "click", (e) => {
    _callHandler("exportPreferences");
    addMicroAnimation(e.currentTarget, "pup-bounce");
    showToast("Prefer\xEAncias exportadas", "success");
  });
  const importTriggerBtn = container.querySelector('[data-action="import-trigger"]');
  if (importTriggerBtn) _addListener(importTriggerBtn, "click", () => {
    const fileInput = container.querySelector('[data-input="import-file"]');
    if (fileInput) fileInput.click();
  });
  const importFileInput = container.querySelector('[data-input="import-file"]');
  if (importFileInput) _addListener(importFileInput, "change", async (e) => {
    const target = e.target;
    const file = target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setPendingImportData(data);
      const filenameEl = container.querySelector("#import-filename");
      const versionEl = container.querySelector("#import-version");
      const summaryEl = container.querySelector("#import-summary");
      if (filenameEl) filenameEl.textContent = file.name;
      if (versionEl) versionEl.textContent = data.version || "\u2014";
      const prefsCount = data.preferences ? Object.keys(data.preferences).length : 0;
      const layoutsCount = data.layouts?.items?.length || 0;
      if (summaryEl) summaryEl.textContent = `${prefsCount} prefs, ${layoutsCount} layouts`;
      openModal("pup-import-modal");
    } catch (err) {
      showToast("Arquivo inv\xE1lido", "error");
    }
    target.value = "";
  });
  const closeModalBtn = container.querySelector('[data-action="close-modal"]');
  if (closeModalBtn) _addListener(closeModalBtn, "click", () => {
    closeModal("pup-import-modal");
    setPendingImportData(null);
  });
  const confirmImportBtn = container.querySelector('[data-action="confirm-import"]');
  if (confirmImportBtn) _addListener(confirmImportBtn, "click", async () => {
    if (!_pendingImportData) return;
    closeModal("pup-import-modal");
    try {
      await _callHandlerAsync("importPreferencesData", _pendingImportData);
      showToast("Prefer\xEAncias importadas", "success");
    } catch (err) {
      showToast("Erro ao importar", "error");
    }
    setPendingImportData(null);
  });
  container.querySelectorAll(".pup-modal-overlay").forEach((overlay) => {
    _addListener(overlay, "click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("visible");
        setPendingImportData(null);
        setPendingDeleteAction(null);
      }
    });
  });
  const retryBtn = container.querySelector('[data-action="retry"]');
  if (retryBtn) _addListener(retryBtn, "click", () => {
    _callHandler("retry");
  });
}
function setupCustomThemeHandlers(container) {
  container.querySelectorAll(".pup-color-input").forEach((input) => {
    _addListener(input, "input", (e) => {
      const target = e.target;
      const color = target.value;
      const prop = target.dataset.color;
      if (prop === "accent") document.documentElement.style.setProperty("--pup-accent", color);
      if (prop === "bg") document.documentElement.style.setProperty("--pup-bg", color);
      if (prop === "card") document.documentElement.style.setProperty("--pup-card", color);
      if (prop === "text") document.documentElement.style.setProperty("--pup-text", color);
    });
  });
  const applyCustomBtn = container.querySelector('[data-action="apply-custom-theme"]');
  if (applyCustomBtn) _addListener(applyCustomBtn, "click", () => {
    const accentEl = container.querySelector('[data-color="accent"]');
    const bgEl = container.querySelector('[data-color="bg"]');
    const cardEl = container.querySelector('[data-color="card"]');
    const textEl = container.querySelector('[data-color="text"]');
    const accent = accentEl?.value || "#7c3aed";
    const bg = bgEl?.value || "#09090b";
    const card = cardEl?.value || "#131316";
    const text = textEl?.value || "#ffffff";
    const customTheme = JSON.stringify({ accent, bg, card, text });
    _callHandler("markDirty", "custom_theme", customTheme);
    _callHandler("markDirty", "theme", "custom");
    scheduleAutoSave();
    showToast("Tema personalizado aplicado", "success");
    announce("Tema personalizado aplicado");
  });
}
function destroy() {
  _boundListeners.forEach((item) => {
    if (item.element?.removeEventListener) {
      item.element.removeEventListener(item.event, item.handler);
    }
  });
  _boundListeners = [];
}
function getListenerCount() {
  return _boundListeners.length;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, listenerCount: _boundListeners.length };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { handlersReady: true, listenerCount: _boundListeners.length, hasCleanup: true } };
}
var handlers_default = { setupThemeHandlers, setupDensityHandlers, setupToggleHandlers, setupDragDropHandlers, setupActionHandlers, setupCustomThemeHandlers, destroy, getListenerCount, info, healthCheck, MODULE_ID, VERSION };
export {
  MODULE_ID,
  VERSION,
  handlers_default as default,
  destroy,
  getListenerCount,
  healthCheck,
  info,
  setupActionHandlers,
  setupCustomThemeHandlers,
  setupDensityHandlers,
  setupDragDropHandlers,
  setupThemeHandlers,
  setupToggleHandlers
};
