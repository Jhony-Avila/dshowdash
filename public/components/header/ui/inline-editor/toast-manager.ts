// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/ui/inline-editor/toast-manager
// PURPOSE: Toast notifications and edit-mode UI state management
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   showToast(message, type) — displays a toast notification
//   setEditModeUI(isEditMode) — toggles edit mode UI elements
//   setDoneButtonState(state) — updates done button visual state
//   setResetButtonVisible(visible) — toggles reset button visibility
//   showConfirmDialog() — shows unsaved changes dialog
//   hideConfirmDialog() — hides unsaved changes dialog
// ═══════════════════════════════════════════════════════════════
// Inline Editor - Toast Manager
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B04: var → const/let
// Gerencia toasts e UI de estado
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/ui/inline-editor/toast-manager';

let _toastTimeout: ReturnType<typeof setTimeout>|null = null;

export function showToast(message: string, type?: string) {
  type = type || 'success';
  
  const existingToast = document.querySelector('.hie-toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = `hie-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });
  
  if (_toastTimeout) clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => { toast.remove(); }, 300);
  }, 3000);
}

export function setEditModeUI(isEditMode: string) {
  const banner = document.getElementById('hie-edit-banner');
  const triggerBtn = document.getElementById('hie-trigger-btn');
  const doneBtn = document.getElementById('hie-done-btn');
  const resetBtn = document.getElementById('hie-reset-btn');
  
  // @ts-expect-error TS migration - TS2345
  if (banner) banner.classList.toggle('visible', isEditMode);
  if (triggerBtn) triggerBtn.style.display = isEditMode ? 'none' : '';
  if (doneBtn) doneBtn.style.display = isEditMode ? '' : 'none';
  if (resetBtn) resetBtn.style.display = 'none';
}

export function setDoneButtonState(state: Record<string,unknown>) {
  const doneBtn = document.getElementById('hie-done-btn');
  if (!doneBtn) return;
  
  doneBtn.classList.remove('has-changes', 'saving', 'saved');
  
  switch (state) {
    // @ts-expect-error TS migration - TS2678
    case 'hasChanges':
      doneBtn.classList.add('has-changes');
      doneBtn.textContent = 'Salvar';
      break;
    // @ts-expect-error TS migration - TS2678
    case 'saving':
      doneBtn.classList.add('saving');
      doneBtn.textContent = 'Salvando...';
      break;
    // @ts-expect-error TS migration - TS2678
    case 'saved':
      doneBtn.classList.add('saved');
      doneBtn.textContent = 'Salvo!';
      break;
    default:
      doneBtn.textContent = 'Concluir';
  }
}

export function setResetButtonVisible(visible: boolean) {
  const resetBtn = document.getElementById('hie-reset-btn');
  if (resetBtn) resetBtn.classList.toggle('visible', visible);
}

export function showConfirmDialog() {
  const overlay = document.getElementById('hie-confirm-overlay');
  if (overlay) overlay.classList.add('visible');
}

export function hideConfirmDialog() {
  const overlay = document.getElementById('hie-confirm-overlay');
  if (overlay) overlay.classList.remove('visible');
}

export default {
  VERSION,
  showToast,
  setEditModeUI,
  setDoneButtonState,
  setResetButtonVisible,
  showConfirmDialog,
  hideConfirmDialog
};
