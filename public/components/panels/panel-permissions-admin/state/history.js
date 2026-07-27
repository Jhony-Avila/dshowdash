import { notify, getUserPermissions, setUserPermissions } from "./core.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-history";
const MAX_HISTORY = 50;
let _undoStack = [];
let _redoStack = [];
function saveToHistory(action, userId, permissions) {
  const snapshot = { action, timestamp: Date.now(), userId, permissions: permissions ? JSON.stringify(permissions) : null };
  _undoStack.push(snapshot);
  if (_undoStack.length > MAX_HISTORY) _undoStack.shift();
  _redoStack = [];
  notify("history");
}
function saveCurrentToHistory(action, userId) {
  if (!userId) return;
  const perms = getUserPermissions(userId);
  saveToHistory(action, userId, perms);
}
function canUndo() {
  return _undoStack.length > 0;
}
function canRedo() {
  return _redoStack.length > 0;
}
function getUndoCount() {
  return _undoStack.length;
}
function getRedoCount() {
  return _redoStack.length;
}
function undo() {
  if (!canUndo()) return false;
  const snapshot = _undoStack.pop();
  if (snapshot?.permissions && snapshot.userId) {
    const currentPerms = JSON.stringify(getUserPermissions(snapshot.userId));
    _redoStack.push({ action: "redo", timestamp: Date.now(), userId: snapshot.userId, permissions: currentPerms });
    const perms = JSON.parse(snapshot.permissions);
    setUserPermissions(snapshot.userId, perms);
    notify("history");
    return true;
  }
  return false;
}
function redo() {
  if (!canRedo()) return false;
  const snapshot = _redoStack.pop();
  if (snapshot?.permissions && snapshot.userId) {
    const currentPerms = JSON.stringify(getUserPermissions(snapshot.userId));
    _undoStack.push({ action: "undo", timestamp: Date.now(), userId: snapshot.userId, permissions: currentPerms });
    const perms = JSON.parse(snapshot.permissions);
    setUserPermissions(snapshot.userId, perms);
    notify("history");
    return true;
  }
  return false;
}
function clearHistory() {
  _undoStack = [];
  _redoStack = [];
  notify("history");
}
function resetHistory() {
  _undoStack = [];
  _redoStack = [];
}
function getHistoryInfo() {
  return { undoCount: _undoStack.length, redoCount: _redoStack.length, maxHistory: MAX_HISTORY };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { undoStackReady: Array.isArray(_undoStack), redoStackReady: Array.isArray(_redoStack) } };
}
export {
  MODULE_ID,
  VERSION,
  canRedo,
  canUndo,
  clearHistory,
  getHistoryInfo,
  getRedoCount,
  getUndoCount,
  healthCheck,
  info,
  redo,
  resetHistory,
  saveCurrentToHistory,
  saveToHistory,
  undo
};
