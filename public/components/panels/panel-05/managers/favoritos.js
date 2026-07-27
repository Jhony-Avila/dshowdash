import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
import { emitLifecycle } from "../utils/lifecycle.js";
import { toastManager } from "../ui/toast.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:managers:favoritos";
const STORAGE_KEY = "panel05_favoritos";
let _favoritos = [];
const load = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    _favoritos = stored ? JSON.parse(stored) : [];
  } catch (e) {
    _favoritos = [];
  }
  return _favoritos;
};
const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_favoritos));
  } catch (e) {
  }
};
const toggle = (id, moduleId, version) => {
  if (!id) return;
  const idx = _favoritos.indexOf(String(id));
  if (idx >= 0) {
    _favoritos.splice(idx, 1);
  } else {
    _favoritos.push(String(id));
  }
  save();
  emitLifecycle(moduleId, version, PANEL_EVENTS.FAVORITO_CHANGED, { id, isFavorito: idx < 0 });
  toastManager.success(idx >= 0 ? "Removido dos favoritos" : "Adicionado aos favoritos");
  return idx < 0;
};
const getAll = () => _favoritos.slice();
const clear = () => {
  _favoritos = [];
};
const count = () => _favoritos.length;
const isFavorito = (id) => _favoritos.indexOf(String(id)) >= 0;
const healthCheck = () => {
  const checks = { storageAvailable: (() => {
    try {
      localStorage.setItem("__test__", "1");
      localStorage.removeItem("__test__");
      return true;
    } catch (e) {
      return false;
    }
  })(), arrayInitialized: Array.isArray(_favoritos) };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, favoritosCount: _favoritos.length, timestamp: Date.now() };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, count: _favoritos.length });
var favoritos_default = { load, save, toggle, getAll, clear, count, isFavorito, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clear,
  count,
  favoritos_default as default,
  getAll,
  healthCheck,
  info,
  isFavorito,
  load,
  save,
  toggle
};
