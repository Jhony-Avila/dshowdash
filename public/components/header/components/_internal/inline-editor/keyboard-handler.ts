// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-ui-inline-editor-keyboard-handler
// PURPOSE: Inline Editor - Keyboard Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SHORTCUTS — exported value
//   createKeyboardHandler() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'header-ui-inline-editor-keyboard-handler';

let _metrics = { keydowns: 0, navigates: 0, moves: 0 };

export const SHORTCUTS = { TOGGLE_EDIT: { key: 'E', ctrl: true, shift: true, description: 'Ativar modo edição' }, EXIT: { key: 'Escape', description: 'Sair do modo edição' }, UNDO: { key: 'z', ctrl: true, description: 'Desfazer' }, REDO: { key: 'y', ctrl: true, description: 'Refazer' }, REDO_ALT: { key: 'z', ctrl: true, shift: true, description: 'Refazer (alternativo)' }, NAV_UP: { key: 'ArrowUp', description: 'Navegar para cima' }, NAV_DOWN: { key: 'ArrowDown', description: 'Navegar para baixo' }, MOVE_LEFT: { key: 'ArrowLeft', description: 'Mover item para esquerda' }, MOVE_RIGHT: { key: 'ArrowRight', description: 'Mover item para direita' }, SELECT: { key: 'Enter', description: 'Selecionar item' }, SELECT_ALT: { key: ' ', description: 'Selecionar item (espaço)' } };

export function createKeyboardHandler(deps: unknown) {
  // @ts-expect-error TS migration - TS2339
  const { isEditMode, enterEditMode, handleDoneClick, undo, redo, getComponentWrappers, getHeaderRight, getSelectedIndex, setSelectedIndex, updateKeyboardSelection, pushToUndoStack, updatePositionBadges, markUnsavedChanges, playDropSound, scheduleAutoSave, announceToScreenReader } = deps;
  let cleanupFn: unknown = null;

  function navigateItems(direction: string) { _metrics.navigates++; const wrappers = getComponentWrappers?.() || []; if (wrappers.length === 0) return; let selectedIndex = getSelectedIndex?.() ?? -1; selectedIndex += direction; if (selectedIndex < 0) selectedIndex = wrappers.length - 1; if (selectedIndex >= wrappers.length) selectedIndex = 0; setSelectedIndex?.(selectedIndex); updateKeyboardSelection?.(); wrappers[selectedIndex]?.focus(); announceToScreenReader?.(`Item ${selectedIndex + 1} de ${wrappers.length}: ${wrappers[selectedIndex]?.dataset.componentLabel}`); }

  // @ts-expect-error TS migration - TS2365
  function moveSelectedItem(direction: string) { _metrics.moves++; const wrappers = getComponentWrappers?.() || []; const selectedIndex = getSelectedIndex?.() ?? -1; if (selectedIndex < 0 || selectedIndex >= wrappers.length) return; const currentWrapper = wrappers[selectedIndex]; const newIndex = selectedIndex + direction; if (newIndex < 0 || newIndex >= wrappers.length) return; if (currentWrapper.dataset.draggable === 'false') { currentWrapper.classList.add('hie-shake'); setTimeout(() => currentWrapper.classList.remove('hie-shake'), 400); announceToScreenReader?.('Este item não pode ser movido'); return; } pushToUndoStack?.(); const headerRight = getHeaderRight?.(); const targetWrapper = wrappers[newIndex]; if (direction < 0) { headerRight?.insertBefore(currentWrapper, targetWrapper); } else { headerRight?.insertBefore(targetWrapper, currentWrapper); } setSelectedIndex?.(newIndex); updateKeyboardSelection?.(); updatePositionBadges?.(); markUnsavedChanges?.(); playDropSound?.(); scheduleAutoSave?.(); announceToScreenReader?.(`Movido para posição ${newIndex + 1}`); currentWrapper.focus(); }

  // @ts-expect-error TS migration - TS2345
  function handleKeydown(e: KeyboardEvent) { _metrics.keydowns++; const editMode = isEditMode?.() ?? false; if (!editMode) { if (e.ctrlKey && e.shiftKey && e.key === 'E') { e.preventDefault(); enterEditMode?.(); } return; } if (e.key === 'Escape') { e.preventDefault(); handleDoneClick?.(); return; } if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo?.(); return; } if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) { e.preventDefault(); redo?.(); return; } if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); navigateItems(e.key === 'ArrowUp' ? -1 : 1); return; } const isArrowLeft = e.key === 'ArrowLeft'; const isArrowRight = e.key === 'ArrowRight'; const selectedIndex = getSelectedIndex?.() ?? -1; if ((isArrowLeft || isArrowRight) && selectedIndex >= 0) { e.preventDefault(); moveSelectedItem(isArrowLeft ? -1 : 1); return; } if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.classList.contains('header-component-wrapper')) { e.preventDefault(); const wrappers = getComponentWrappers?.() || []; const index = wrappers.indexOf(document.activeElement); setSelectedIndex?.(index); updateKeyboardSelection?.(); } }

  function setup() { document.addEventListener('keydown', handleKeydown); cleanupFn = () => document.removeEventListener('keydown', handleKeydown); }
  // @ts-expect-error TS migration - TS2349
  function cleanup() { cleanupFn?.(); cleanupFn = null; }

  return { setup, cleanup, navigateItems, moveSelectedItem };
}

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, shortcuts: Object.keys(SHORTCUTS).length, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { keyboardReady: true }, metrics: getMetrics() }; }

export default { createKeyboardHandler, SHORTCUTS, getMetrics, info, healthCheck };
