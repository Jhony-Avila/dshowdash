// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/ui/inline-editor/keyboard-handler
// PURPOSE: Keyboard navigation and shortcuts for inline editor (Ctrl+E, arrows, undo/redo)
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   createKeyboardHandler(callbacks) — factory returning keyboard event handler
// ═══════════════════════════════════════════════════════════════
// Inline Editor - Keyboard Handler
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B05: var → const/let
// Gerencia navegação e ações via teclado
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/ui/inline-editor/keyboard-handler';

export function createKeyboardHandler(callbacks: unknown) {
  let _keydownHandler: Function|null = null;
  
  function _handleKeydown(e: KeyboardEvent) {
    // Atalhos globais
    if (e.ctrlKey || e.metaKey) {
      // @ts-expect-error TS migration - TS2339
      if (e.key === 'e' && !callbacks.isEditMode()) {
        e.preventDefault();
        // @ts-expect-error TS migration - TS2339
        callbacks.enterEditMode();
        return;
      }
      // @ts-expect-error TS migration - TS2339
      if (e.key === 'z' && callbacks.isEditMode()) {
        e.preventDefault();
        // @ts-expect-error TS migration - TS2339
        if (e.shiftKey) callbacks.redo();
        // @ts-expect-error TS migration - TS2339
        else callbacks.undo();
        return;
      }
      // @ts-expect-error TS migration - TS2339
      if (e.key === 'y' && callbacks.isEditMode()) {
        e.preventDefault();
        // @ts-expect-error TS migration - TS2339
        callbacks.redo();
        return;
      }
    }
    
    // Escape para sair
    // @ts-expect-error TS migration - TS2339
    if (e.key === 'Escape' && callbacks.isEditMode()) {
      e.preventDefault();
      // @ts-expect-error TS migration - TS2339
      callbacks.handleDoneClick();
      return;
    }
    
    // Navegação no modo edição
    // @ts-expect-error TS migration - TS2339
    if (!callbacks.isEditMode()) return;
    
    // @ts-expect-error TS migration - TS2339
    const wrappers = callbacks.getComponentWrappers();
    if (wrappers.length === 0) return;
    
    // @ts-expect-error TS migration - TS2339
    const selectedIndex = callbacks.getSelectedIndex();
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = selectedIndex < wrappers.length - 1 ? selectedIndex + 1 : 0;
      // @ts-expect-error TS migration - TS2339
      callbacks.setSelectedIndex(newIndex);
      // @ts-expect-error TS migration - TS2339
      callbacks.updateKeyboardSelection();
      wrappers[newIndex].focus();
      // @ts-expect-error TS migration - TS2339
      callbacks.announceToScreenReader(`Item ${newIndex + 1} de ${wrappers.length} selecionado`);
    }
    
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : wrappers.length - 1;
      // @ts-expect-error TS migration - TS2339
      callbacks.setSelectedIndex(newIndex);
      // @ts-expect-error TS migration - TS2339
      callbacks.updateKeyboardSelection();
      wrappers[newIndex].focus();
      // @ts-expect-error TS migration - TS2339
      callbacks.announceToScreenReader(`Item ${newIndex + 1} de ${wrappers.length} selecionado`);
    }
    
    // Mover item com Shift + Setas
    if (e.shiftKey && selectedIndex >= 0) {
      // @ts-expect-error TS migration - TS2339
      const headerRight = callbacks.getHeaderRight();
      const currentWrapper = wrappers[selectedIndex];
      
      if (e.key === 'ArrowRight' && selectedIndex < wrappers.length - 1) {
        e.preventDefault();
        // @ts-expect-error TS migration - TS2339
        callbacks.pushToUndoStack();
        const nextWrapper = wrappers[selectedIndex + 1];
        headerRight.insertBefore(nextWrapper, currentWrapper);
        // @ts-expect-error TS migration - TS2339
        callbacks.setSelectedIndex(selectedIndex + 1);
        // @ts-expect-error TS migration - TS2339
        callbacks.updatePositionBadges();
        // @ts-expect-error TS migration - TS2339
        callbacks.markUnsavedChanges();
        // @ts-expect-error TS migration - TS2339
        callbacks.playDropSound();
        // @ts-expect-error TS migration - TS2339
        callbacks.scheduleAutoSave();
        // @ts-expect-error TS migration - TS2339
        callbacks.announceToScreenReader(`Item movido para posição ${selectedIndex + 2}`);
      }
      
      if (e.key === 'ArrowLeft' && selectedIndex > 0) {
        e.preventDefault();
        // @ts-expect-error TS migration - TS2339
        callbacks.pushToUndoStack();
        const prevWrapper = wrappers[selectedIndex - 1];
        headerRight.insertBefore(currentWrapper, prevWrapper);
        // @ts-expect-error TS migration - TS2339
        callbacks.setSelectedIndex(selectedIndex - 1);
        // @ts-expect-error TS migration - TS2339
        callbacks.updatePositionBadges();
        // @ts-expect-error TS migration - TS2339
        callbacks.markUnsavedChanges();
        // @ts-expect-error TS migration - TS2339
        callbacks.playDropSound();
        // @ts-expect-error TS migration - TS2339
        callbacks.scheduleAutoSave();
        // @ts-expect-error TS migration - TS2339
        callbacks.announceToScreenReader(`Item movido para posição ${selectedIndex}`);
      }
    }
  }
  
  return {
    setup() {
      _keydownHandler = _handleKeydown;
      // @ts-expect-error TS migration - TS2769
      document.addEventListener('keydown', _keydownHandler);
    },
    
    cleanup() {
      if (_keydownHandler) {
        // @ts-expect-error TS migration - TS2769
        document.removeEventListener('keydown', _keydownHandler);
        _keydownHandler = null;
      }
    }
  };
}

export default { VERSION, createKeyboardHandler };
