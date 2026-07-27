import { getPort } from "./ports.js";
import { getCreateFormHTML, getEditFormHTML, parseCreateForm, parseEditForm } from "./modals.js";
import { AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
import { PANEL_ID } from "./core/constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-feature-flags-admin:crud-operations";
function _getAuth() {
  if (typeof window !== "undefined") return window.AuthAdapter || null;
  return null;
}
let ModalAdapter = null;
function loadModalAdapter() {
  if (ModalAdapter) return Promise.resolve(ModalAdapter);
  return import("/components/overlay-layer/adapters/modal-adapter.js").then((mod) => {
    ModalAdapter = mod;
    return ModalAdapter;
  }).catch(() => null);
}
function toggleFlag(panel, flagKey) {
  const auth = _getAuth();
  if (!auth || !auth.isAuthenticated || !auth.isAuthenticated()) {
    const eventBus = getPort("eventBus");
    if (eventBus && eventBus.emit) eventBus.emit(AUTH_INTENTS.LOGIN, { reason: "toggle-flag", source: PANEL_ID });
    return Promise.resolve(false);
  }
  return panel.apiClient.toggleFlag(flagKey, { signal: panel.abortController ? panel.abortController.signal : void 0 }).then((result) => {
    if (result.success) {
      panel.telemetry.trackToggle(flagKey, result.payload ? result.payload.is_enabled : void 0);
      const toast = getPort("toast");
      if (toast && toast.show) toast.show(`Flag "${flagKey}" ${result.payload && result.payload.is_enabled ? "ativado" : "desativado"}`, "success");
      return panel.dataLoader.loadData().then(() => true);
    } else {
      const toast = getPort("toast");
      if (toast && toast.show) toast.show(`Erro: ${result.message}`, "error");
      return false;
    }
  }).catch((e) => {
    const toast = getPort("toast");
    if (toast && toast.show) toast.show(`Erro: ${e.message}`, "error");
    return false;
  });
}
function showCreateModal(panel) {
  return loadModalAdapter().then((modal) => {
    if (!modal || !modal.showCustomModal) {
      alert("Modal n\xE3o dispon\xEDvel");
      return;
    }
    return modal.showCustomModal({
      id: "pfa-create-modal",
      title: "Criar Feature Flag",
      bodyHTML: getCreateFormHTML(),
      buttons: [{ id: "cancel", text: "Cancelar", variant: "secondary", action: "cancel" }, { id: "create", text: "Criar Flag", variant: "primary", action: "create" }],
      scope: PANEL_ID,
      onBeforeClose(action, modalEl) {
        if (action === "create") {
          const form = modalEl.querySelector('[data-form="create-flag"]');
          if (!form || !form.checkValidity()) {
            form?.reportValidity();
            return Promise.resolve(false);
          }
          const data = parseCreateForm(form);
          return panel.apiClient.createFlag(data, { signal: panel.abortController ? panel.abortController.signal : void 0 }).then((result) => {
            if (result.success) {
              panel.telemetry.trackCreate(data.flag_key);
              const toast = getPort("toast");
              if (toast && toast.show) toast.show("Flag criado com sucesso", "success");
              return panel.dataLoader.loadData().then(() => true);
            } else {
              const toast = getPort("toast");
              if (toast && toast.show) toast.show(`Erro: ${result.message}`, "error");
              return false;
            }
          });
        }
        return Promise.resolve(true);
      }
    });
  });
}
function showEditModal(panel, flagKey) {
  let flag = null;
  const flags = panel.store.getFlags();
  for (let i = 0; i < flags.length; i++) {
    if (flags[i].flag_key === flagKey) {
      flag = flags[i];
      break;
    }
  }
  if (!flag) return Promise.resolve();
  return loadModalAdapter().then((modal) => {
    if (!modal || !modal.showCustomModal) {
      alert("Modal n\xE3o dispon\xEDvel");
      return;
    }
    return modal.showCustomModal({
      id: "pfa-edit-modal",
      title: `Editar: ${flag.flag_name || flag.flag_key}`,
      bodyHTML: getEditFormHTML(flag),
      buttons: [{ id: "cancel", text: "Cancelar", variant: "secondary", action: "cancel" }, { id: "save", text: "Salvar", variant: "primary", action: "save" }],
      scope: PANEL_ID,
      onBeforeClose(action, modalEl) {
        if (action === "save") {
          const form = modalEl.querySelector('[data-form="edit-flag"]');
          if (!form || !form.checkValidity()) {
            form?.reportValidity();
            return Promise.resolve(false);
          }
          const data = parseEditForm(form);
          return panel.apiClient.updateFlag(flagKey, data, { signal: panel.abortController ? panel.abortController.signal : void 0 }).then((result) => {
            if (result.success) {
              panel.telemetry.trackUpdate(flagKey);
              const toast = getPort("toast");
              if (toast && toast.show) toast.show("Flag atualizado com sucesso", "success");
              return panel.dataLoader.loadData().then(() => true);
            } else {
              const toast = getPort("toast");
              if (toast && toast.show) toast.show(`Erro: ${result.message}`, "error");
              return false;
            }
          });
        }
        return Promise.resolve(true);
      }
    });
  });
}
function deleteFlag(panel, flagKey) {
  const auth = _getAuth();
  if (!auth || !auth.isAuthenticated || !auth.isAuthenticated()) {
    const eventBus = getPort("eventBus");
    if (eventBus && eventBus.emit) eventBus.emit(AUTH_INTENTS.LOGIN, { reason: "delete-flag", source: PANEL_ID });
    return Promise.resolve(false);
  }
  return loadModalAdapter().then((modal) => {
    let confirmPromise;
    if (modal && modal.showConfirmModal) {
      confirmPromise = modal.showConfirmModal({ id: "pfa-delete-confirm", title: "Confirmar Exclus\xE3o", message: `Remover flag "${flagKey}"? Esta a\xE7\xE3o n\xE3o pode ser desfeita.`, confirmText: "Remover", cancelText: "Cancelar", danger: true, icon: "warning", scope: PANEL_ID });
    } else {
      confirmPromise = Promise.resolve(confirm(`Remover flag "${flagKey}"?`));
    }
    return confirmPromise;
  }).then((confirmed) => {
    if (!confirmed) return false;
    return panel.apiClient.deleteFlag(flagKey, { signal: panel.abortController ? panel.abortController.signal : void 0 }).then((result) => {
      if (result.success) {
        panel.telemetry.trackDelete(flagKey);
        const toast = getPort("toast");
        if (toast && toast.show) toast.show("Flag removido com sucesso", "success");
        return panel.dataLoader.loadData().then(() => true);
      } else {
        const toast = getPort("toast");
        if (toast && toast.show) toast.show(`Erro: ${result.message}`, "error");
        return false;
      }
    }).catch((e) => {
      const toast = getPort("toast");
      if (toast && toast.show) toast.show(`Erro: ${e.message}`, "error");
      return false;
    });
  });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var crud_operations_default = { toggleFlag, showCreateModal, showEditModal, deleteFlag };
export {
  MODULE_ID,
  VERSION,
  crud_operations_default as default,
  deleteFlag,
  info,
  showCreateModal,
  showEditModal,
  toggleFlag
};
