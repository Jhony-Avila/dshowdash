// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:undo-manager
// PURPOSE: Undo Manager - Sistema de desfazer/refazer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createUndoManager() — exported function
//   getUndoManager() — exported function
//   resetUndoManager() — exported function
//   undo() — exported function
//   redo() — exported function
//   record() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:undo-manager';

export function createUndoManager(options: Record<string, any> = {}) {
  const { maxHistory = 100, groupTimeout = 1000, onUndo = null, onRedo = null, onChange = null, persist = false, storageKey = 'cm_undo_history' } = options;

  const _logger = createLogger(MODULE_ID);
  let _undoStack: unknown[] = [];
  let _redoStack: unknown[] = [];
  let _currentGroup: Record<string, unknown> | null = null;
  let _groupTimer: ReturnType<typeof setTimeout> | null = null;
  let _enabled = true;
  let _metrics = { undos: 0, redos: 0, recorded: 0 };

  function _notify() {
    onChange?.({ canUndo: manager.canUndo(), canRedo: manager.canRedo(), undoCount: _undoStack.length, redoCount: _redoStack.length });
  }

  function _persist() {
    if (!persist) return;
    try {
      const data = { undoStack: _undoStack.slice(-50), redoStack: _redoStack.slice(-20) };
      localStorage.setItem(storageKey, JSON.stringify(data));
    // @ts-expect-error strict migration — TS2345
    } catch (e) { _logger.warn('Persist failed:', e); }
  }

  function _restore() {
    if (!persist) return;
    try {
      // @ts-expect-error strict migration — TS2345
      const data = JSON.parse(localStorage.getItem(storageKey));
      if (data) { _undoStack = data.undoStack || []; _redoStack = data.redoStack || []; }
    // @ts-expect-error strict migration — TS2345
    } catch (e) { _logger.warn('Restore failed:', e); }
  }

  _restore();

  const manager = {
    // Registra ação
    record(action: string) {
      if (!_enabled) return;

      const entry = {
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        // @ts-expect-error TS migration - TS2339
        type: action.type || 'unknown',
        // @ts-expect-error TS migration - TS2339
        description: action.description || '',
        // @ts-expect-error TS migration - TS2339
        undo: action.undo,
        // @ts-expect-error TS migration - TS2339
        redo: action.redo,
        // @ts-expect-error TS migration - TS2339
        data: action.data || null
      };

      if (_currentGroup) {
        (_currentGroup.actions as unknown[]).push(entry);
        // @ts-expect-error strict migration — TS2769
        clearTimeout(_groupTimer);
        _groupTimer = setTimeout(() => this.endGroup(), groupTimeout);
      } else {
        _undoStack.push(entry);
        if (_undoStack.length > maxHistory) _undoStack.shift();
      }

      _redoStack = [];
      _metrics.recorded++;
      _notify();
      _persist();
    },

    // Desfaz última ação
    undo() {
      if (!this.canUndo()) return null;

      const entry = _undoStack.pop();
      if (!entry) return null;

      try {
        if ((entry as Record<string, unknown>).actions) {
          // Grupo - desfaz em ordem reversa
          // @ts-expect-error TS migration - TS2339
          for (let i = (entry as Record<string, unknown>).actions.length - 1; i >= 0; i--) {
            // @ts-expect-error TS migration - TS7053, TS2339
            (entry as Record<string, unknown>).actions[i].undo?.(entry.actions[i].data);
          }
        } else {
          // @ts-expect-error TS migration - TS2349, TS2339
          (entry as Record<string, unknown>).undo?.(entry.data);
        }

        _redoStack.push(entry);
        _metrics.undos++;
        onUndo?.(entry);
        _notify();
        _persist();
        return entry;
      } catch (e) {
        _logger.error('Undo failed:', e);
        _undoStack.push(entry);
        return null;
      }
    },

    // Refaz última ação desfeita
    redo() {
      if (!this.canRedo()) return null;

      const entry = _redoStack.pop();
      if (!entry) return null;

      try {
        if ((entry as Record<string, unknown>).actions) {
          // Grupo - refaz em ordem normal
          // @ts-expect-error TS migration - TS2488
          for (const action of (entry as Record<string, unknown>).actions) {
            action.redo?.(action.data);
          }
        } else {
          // @ts-expect-error TS migration - TS2349, TS2339
          (entry as Record<string, unknown>).redo?.(entry.data);
        }

        _undoStack.push(entry);
        _metrics.redos++;
        onRedo?.(entry);
        _notify();
        _persist();
        return entry;
      } catch (e) {
        _logger.error('Redo failed:', e);
        _redoStack.push(entry);
        return null;
      }
    },

    // Inicia grupo de ações
    startGroup(description = '') {
      if (_currentGroup) this.endGroup();
      _currentGroup = { id: `group-${Date.now()}`, timestamp: Date.now(), description, actions: [] };
      return _currentGroup.id;
    },

    // Finaliza grupo
    endGroup() {
      if (!_currentGroup) return null;
      // @ts-expect-error strict migration — TS2769
      clearTimeout(_groupTimer);

      if ((_currentGroup.actions as unknown[]).length > 0) {
        _undoStack.push(_currentGroup);
        if (_undoStack.length > maxHistory) _undoStack.shift();
        _redoStack = [];
        _notify();
        _persist();
      }

      const group = _currentGroup;
      _currentGroup = null;
      return group;
    },

    // Cancela grupo atual
    cancelGroup() {
      // @ts-expect-error strict migration — TS2769
      clearTimeout(_groupTimer);
      _currentGroup = null;
    },

    // Verifica estados
    canUndo() { return _undoStack.length > 0; },
    canRedo() { return _redoStack.length > 0; },

    // Obtém histórico
    getUndoStack() { return [..._undoStack]; },
    getRedoStack() { return [..._redoStack]; },
    getLastAction() { return _undoStack[_undoStack.length - 1] || null; },

    // Limpa histórico
    clear() {
      _undoStack = [];
      _redoStack = [];
      _currentGroup = null;
      // @ts-expect-error strict migration — TS2769
      clearTimeout(_groupTimer);
      _notify();
      _persist();
    },

    // Habilita/desabilita
    enable() { _enabled = true; },
    disable() { _enabled = false; },
    isEnabled() { return _enabled; },

    // Executa ação com registro automático
    execute(action: string) {
      // @ts-expect-error TS migration - TS2339
      action.redo?.(action.data);
      this.record(action);
    },

    // Wrapper para funções
    wrap(doFn: unknown, undoFn: unknown, description = '') {
      return (...args: unknown[]) => {
        const result = (doFn as (...args: unknown[]) => unknown)(...args);
        // @ts-expect-error strict migration — TS2345
        this.record({
          type: 'wrapped',
          description,
          data: { args, result },
          undo: () => (undoFn as (...args: unknown[]) => unknown)(...args),
          redo: () => (doFn as (...args: unknown[]) => unknown)(...args)
        });
        return result;
      };
    },

    getMetrics() { return { ..._metrics, undoCount: _undoStack.length, redoCount: _redoStack.length, grouping: !!_currentGroup }; },
    resetMetrics() { _metrics = { undos: 0, redos: 0, recorded: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, undoCount: _undoStack.length, redoCount: _redoStack.length, enabled: _enabled, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, undoCount: _undoStack.length, redoCount: _redoStack.length, maxHistory, enabled: _enabled }; },

    destroy() {
      // @ts-expect-error strict migration — TS2769
      clearTimeout(_groupTimer);
      _undoStack = [];
      _redoStack = [];
      _currentGroup = null;
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getUndoManager(options: Record<string, any> = {}) { if (!_instance) _instance = createUndoManager(options); return _instance; }
export function resetUndoManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function undo() { return (getUndoManager().undo as (...args: unknown[]) => unknown)(); }
export function redo() { return (getUndoManager().redo as (...args: unknown[]) => unknown)(); }
export function record(action: string) { return (getUndoManager().record as (...args: unknown[]) => unknown)(action); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, createUndoManager, getUndoManager, resetUndoManager, undo, redo, record, info, healthCheck };
