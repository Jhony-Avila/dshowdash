import { CONTAINER_EVENTS } from "/core/runtime/events/catalog/container.events.js";
const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "container-transactions";
function createTransactionManager(deps = {}) {
  const { containers, listeners, eventsPort, getPolicy, getActiveId, setPolicy, setActiveId, onRollback } = deps;
  let _currentTx = null;
  let _txHistory = [];
  let _maxHistory = 50;
  let _metrics2 = { started: 0, committed: 0, rolledBack: 0, errors: 0 };
  function _emit(event, data = {}) {
    eventsPort?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
  function _captureSnapshot() {
    return { policy: getPolicy ? getPolicy() : "ephemeral", activeId: getActiveId ? getActiveId() : null, containerIds: containers ? Array.from(containers.keys()) : [], listenerIds: listeners ? Array.from(listeners.keys()) : [], timestamp: Date.now() };
  }
  return {
    begin() {
      if (_currentTx) {
        this.commit();
      }
      _currentTx = { id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, startedAt: Date.now(), snapshot: _captureSnapshot(), operations: [], state: "pending" };
      _metrics2.started++;
      return _currentTx.id;
    },
    addOperation(operation) {
      if (_currentTx) {
        _currentTx.operations.push({ ...operation, timestamp: Date.now() });
      }
    },
    commit() {
      if (!_currentTx) return false;
      _currentTx.state = "committed";
      _currentTx.committedAt = Date.now();
      _txHistory.push({ ..._currentTx });
      if (_txHistory.length > _maxHistory) _txHistory.shift();
      _metrics2.committed++;
      _emit(CONTAINER_EVENTS.TRANSACTION_COMMITTED, { txId: _currentTx.id });
      _currentTx = null;
      return true;
    },
    rollback(reason = "") {
      if (!_currentTx) return false;
      const snapshot = _currentTx.snapshot;
      if (snapshot.policy && setPolicy) {
        setPolicy(snapshot.policy);
      }
      if (setActiveId) {
        setActiveId(snapshot.activeId);
      }
      if (onRollback && _currentTx.operations.length > 0) {
        _currentTx.operations.forEach((op) => {
          if (op.containerId) {
            try {
              onRollback(op.containerId);
            } catch {
            }
          }
        });
      }
      _currentTx.state = "rolledBack";
      _currentTx.rolledBackAt = Date.now();
      _currentTx.rollbackReason = reason;
      _txHistory.push({ ..._currentTx });
      if (_txHistory.length > _maxHistory) _txHistory.shift();
      _metrics2.rolledBack++;
      _emit(CONTAINER_EVENTS.TRANSACTION_ROLLED_BACK, { txId: _currentTx.id, reason });
      _currentTx = null;
      return true;
    },
    isActive() {
      return _currentTx !== null;
    },
    getCurrent() {
      return _currentTx ? { ..._currentTx } : null;
    },
    getHistory(limit = 20) {
      return _txHistory.slice(-limit);
    },
    getMetrics() {
      return { ..._metrics2, historySize: _txHistory.length, hasActiveTx: !!_currentTx };
    },
    healthCheck() {
      return { status: _metrics2.errors < 5 ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { hasActiveTx: !!_currentTx, historySize: _txHistory.length, commitRate: _metrics2.started > 0 ? _metrics2.committed / _metrics2.started : 1 }, metrics: this.getMetrics() };
    },
    info() {
      return { version: VERSION, moduleId: MODULE_ID, hasActiveTx: !!_currentTx, metrics: this.getMetrics() };
    }
  };
}
let _transactions = /* @__PURE__ */ new Map();
let _metrics = { started: 0, committed: 0, rolledBack: 0, errors: 0 };
function begin(id) {
  _transactions.set(id, { id, startedAt: Date.now(), state: "pending", operations: [] });
  _metrics.started++;
  return id;
}
function addOperation(txId, operation) {
  const tx = _transactions.get(txId);
  if (tx) tx.operations.push(operation);
}
function commit(id) {
  const tx = _transactions.get(id);
  if (tx) {
    tx.state = "committed";
    _metrics.committed++;
    return true;
  }
  return false;
}
function rollback(id) {
  const tx = _transactions.get(id);
  if (tx) {
    tx.state = "rolledBack";
    _metrics.rolledBack++;
    return true;
  }
  return false;
}
function get(id) {
  return _transactions.get(id) || null;
}
function clear() {
  _transactions.clear();
}
function getMetrics() {
  return { ..._metrics, active: _transactions.size };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, metrics: getMetrics() };
}
var transactions_default = { createTransactionManager, begin, addOperation, commit, rollback, get, clear, getMetrics, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  addOperation,
  begin,
  clear,
  commit,
  createTransactionManager,
  transactions_default as default,
  get,
  getMetrics,
  healthCheck,
  rollback
};
