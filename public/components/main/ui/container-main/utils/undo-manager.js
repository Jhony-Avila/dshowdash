import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:undo-manager";
function createUndoManager(options = {}) {
  const { maxHistory = 100, groupTimeout = 1e3, onUndo = null, onRedo = null, onChange = null, persist = false, storageKey = "cm_undo_history" } = options;
  const _logger = createLogger(MODULE_ID);
  let _undoStack = [];
  let _redoStack = [];
  let _currentGroup = null;
  let _groupTimer = null;
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
    } catch (e) {
      _logger.warn("Persist failed:", e);
    }
  }
  function _restore() {
    if (!persist) return;
    try {
      const data = JSON.parse(localStorage.getItem(storageKey));
      if (data) {
        _undoStack = data.undoStack || [];
        _redoStack = data.redoStack || [];
      }
    } catch (e) {
      _logger.warn("Restore failed:", e);
    }
  }
  _restore();
  const manager = {
    // Registra ação
    record(action) {
      if (!_enabled) return;
      const entry = {
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        // @ts-expect-error TS migration - TS2339
        type: action.type || "unknown",
        // @ts-expect-error TS migration - TS2339
        description: action.description || "",
        // @ts-expect-error TS migration - TS2339
        undo: action.undo,
        // @ts-expect-error TS migration - TS2339
        redo: action.redo,
        // @ts-expect-error TS migration - TS2339
        data: action.data || null
      };
      if (_currentGroup) {
        _currentGroup.actions.push(entry);
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
        if (entry.actions) {
          for (let i = entry.actions.length - 1; i >= 0; i--) {
            entry.actions[i].undo?.(entry.actions[i].data);
          }
        } else {
          entry.undo?.(entry.data);
        }
        _redoStack.push(entry);
        _metrics.undos++;
        onUndo?.(entry);
        _notify();
        _persist();
        return entry;
      } catch (e) {
        _logger.error("Undo failed:", e);
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
        if (entry.actions) {
          for (const action of entry.actions) {
            action.redo?.(action.data);
          }
        } else {
          entry.redo?.(entry.data);
        }
        _undoStack.push(entry);
        _metrics.redos++;
        onRedo?.(entry);
        _notify();
        _persist();
        return entry;
      } catch (e) {
        _logger.error("Redo failed:", e);
        _redoStack.push(entry);
        return null;
      }
    },
    // Inicia grupo de ações
    startGroup(description = "") {
      if (_currentGroup) this.endGroup();
      _currentGroup = { id: `group-${Date.now()}`, timestamp: Date.now(), description, actions: [] };
      return _currentGroup.id;
    },
    // Finaliza grupo
    endGroup() {
      if (!_currentGroup) return null;
      clearTimeout(_groupTimer);
      if (_currentGroup.actions.length > 0) {
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
      clearTimeout(_groupTimer);
      _currentGroup = null;
    },
    // Verifica estados
    canUndo() {
      return _undoStack.length > 0;
    },
    canRedo() {
      return _redoStack.length > 0;
    },
    // Obtém histórico
    getUndoStack() {
      return [..._undoStack];
    },
    getRedoStack() {
      return [..._redoStack];
    },
    getLastAction() {
      return _undoStack[_undoStack.length - 1] || null;
    },
    // Limpa histórico
    clear() {
      _undoStack = [];
      _redoStack = [];
      _currentGroup = null;
      clearTimeout(_groupTimer);
      _notify();
      _persist();
    },
    // Habilita/desabilita
    enable() {
      _enabled = true;
    },
    disable() {
      _enabled = false;
    },
    isEnabled() {
      return _enabled;
    },
    // Executa ação com registro automático
    execute(action) {
      action.redo?.(action.data);
      this.record(action);
    },
    // Wrapper para funções
    wrap(doFn, undoFn, description = "") {
      return (...args) => {
        const result = doFn(...args);
        this.record({
          type: "wrapped",
          description,
          data: { args, result },
          undo: () => undoFn(...args),
          redo: () => doFn(...args)
        });
        return result;
      };
    },
    getMetrics() {
      return { ..._metrics, undoCount: _undoStack.length, redoCount: _redoStack.length, grouping: !!_currentGroup };
    },
    resetMetrics() {
      _metrics = { undos: 0, redos: 0, recorded: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, undoCount: _undoStack.length, redoCount: _redoStack.length, enabled: _enabled, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, undoCount: _undoStack.length, redoCount: _redoStack.length, maxHistory, enabled: _enabled };
    },
    destroy() {
      clearTimeout(_groupTimer);
      _undoStack = [];
      _redoStack = [];
      _currentGroup = null;
    }
  };
  return manager;
}
let _instance = null;
function getUndoManager(options = {}) {
  if (!_instance) _instance = createUndoManager(options);
  return _instance;
}
function resetUndoManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function undo() {
  return getUndoManager().undo();
}
function redo() {
  return getUndoManager().redo();
}
function record(action) {
  return getUndoManager().record(action);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var undo_manager_default = { VERSION, MODULE_ID, createUndoManager, getUndoManager, resetUndoManager, undo, redo, record, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createUndoManager,
  undo_manager_default as default,
  getUndoManager,
  healthCheck,
  info,
  record,
  redo,
  resetUndoManager,
  undo
};
