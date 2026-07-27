let _refs = null;
let _initialized = false;
let _unsubscribes = [];
let _favoritos = [];
let _selectedIds = /* @__PURE__ */ new Set();
let _currentView = "list";
function setRefs(r) {
  _refs = r;
}
function setInitialized(i) {
  _initialized = i;
}
function setCurrentView(v) {
  _currentView = v;
}
function loadFavoritos() {
  try {
    _favoritos = JSON.parse(localStorage.getItem("p05_favoritos") || "[]");
  } catch {
    _favoritos = [];
  }
}
function saveFavoritos() {
  try {
    localStorage.setItem("p05_favoritos", JSON.stringify(_favoritos));
  } catch {
  }
}
function toggleFavorito(id, updateFn) {
  const idx = _favoritos.indexOf(id);
  if (idx > -1) _favoritos.splice(idx, 1);
  else _favoritos.push(id);
  saveFavoritos();
  updateFn(_refs, id, _favoritos.includes(id));
}
function toggleSelection(id, updateFn) {
  if (_selectedIds.has(id)) _selectedIds.delete(id);
  else _selectedIds.add(id);
  updateFn(_refs, Array.from(_selectedIds));
}
function selectAll(ids, updateFn) {
  ids.forEach((id) => _selectedIds.add(id));
  updateFn(_refs, Array.from(_selectedIds));
}
function clearSelection(updateFn) {
  _selectedIds.clear();
  updateFn([]);
}
function addUnsubscribe(fn) {
  _unsubscribes.push(fn);
}
function clearUnsubscribes() {
  _unsubscribes.forEach((unsub) => unsub?.());
  _unsubscribes = [];
}
function resetState() {
  _refs = null;
  _initialized = false;
  _unsubscribes = [];
  _selectedIds.clear();
  _currentView = "list";
}
var state_default = { setRefs, setInitialized, setCurrentView, loadFavoritos, saveFavoritos, toggleFavorito, toggleSelection, selectAll, clearSelection, addUnsubscribe, clearUnsubscribes, resetState };
const MODULE_ID = "panel-05:index:state";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { stateReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  _currentView,
  _favoritos,
  _initialized,
  _refs,
  _selectedIds,
  _unsubscribes,
  addUnsubscribe,
  clearSelection,
  clearUnsubscribes,
  state_default as default,
  healthCheck,
  info,
  loadFavoritos,
  resetState,
  saveFavoritos,
  selectAll,
  setCurrentView,
  setInitialized,
  setRefs,
  toggleFavorito,
  toggleSelection
};
