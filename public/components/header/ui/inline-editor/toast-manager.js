const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/ui/inline-editor/toast-manager";
let _toastTimeout = null;
function showToast(message, type) {
  type = type || "success";
  const existingToast = document.querySelector(".hie-toast");
  if (existingToast) existingToast.remove();
  const toast = document.createElement("div");
  toast.className = `hie-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });
  if (_toastTimeout) clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3e3);
}
function setEditModeUI(isEditMode) {
  const banner = document.getElementById("hie-edit-banner");
  const triggerBtn = document.getElementById("hie-trigger-btn");
  const doneBtn = document.getElementById("hie-done-btn");
  const resetBtn = document.getElementById("hie-reset-btn");
  if (banner) banner.classList.toggle("visible", isEditMode);
  if (triggerBtn) triggerBtn.style.display = isEditMode ? "none" : "";
  if (doneBtn) doneBtn.style.display = isEditMode ? "" : "none";
  if (resetBtn) resetBtn.style.display = "none";
}
function setDoneButtonState(state) {
  const doneBtn = document.getElementById("hie-done-btn");
  if (!doneBtn) return;
  doneBtn.classList.remove("has-changes", "saving", "saved");
  switch (state) {
    case "hasChanges":
      doneBtn.classList.add("has-changes");
      doneBtn.textContent = "Salvar";
      break;
    case "saving":
      doneBtn.classList.add("saving");
      doneBtn.textContent = "Salvando...";
      break;
    case "saved":
      doneBtn.classList.add("saved");
      doneBtn.textContent = "Salvo!";
      break;
    default:
      doneBtn.textContent = "Concluir";
  }
}
function setResetButtonVisible(visible) {
  const resetBtn = document.getElementById("hie-reset-btn");
  if (resetBtn) resetBtn.classList.toggle("visible", visible);
}
function showConfirmDialog() {
  const overlay = document.getElementById("hie-confirm-overlay");
  if (overlay) overlay.classList.add("visible");
}
function hideConfirmDialog() {
  const overlay = document.getElementById("hie-confirm-overlay");
  if (overlay) overlay.classList.remove("visible");
}
var toast_manager_default = {
  VERSION,
  showToast,
  setEditModeUI,
  setDoneButtonState,
  setResetButtonVisible,
  showConfirmDialog,
  hideConfirmDialog
};
export {
  MODULE_ID,
  VERSION,
  toast_manager_default as default,
  hideConfirmDialog,
  setDoneButtonState,
  setEditModeUI,
  setResetButtonVisible,
  showConfirmDialog,
  showToast
};
