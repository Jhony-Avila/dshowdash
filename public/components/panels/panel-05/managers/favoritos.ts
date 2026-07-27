// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:managers:favoritos
// PURPOSE: Panel-05 - Favoritos Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//   emitLifecycle from ../utils/lifecycle.js
//   toastManager from ../ui/toast.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   load() — exported function
//   save() — exported function
//   toggle() — exported function
//   getAll() — exported function
//   clear() — exported function
//   count() — exported function
//   isFavorito() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { emitLifecycle } from '../utils/lifecycle.js';
import { toastManager } from '../ui/toast.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:managers:favoritos';

const STORAGE_KEY = 'panel05_favoritos';
let _favoritos: string[] = [];

export const load = () => { try { const stored = localStorage.getItem(STORAGE_KEY); _favoritos = stored ? JSON.parse(stored) : []; } catch (e) { _favoritos = []; } return _favoritos; };

export const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_favoritos)); } catch (e) {} };

export const toggle = (id: unknown, moduleId: string, version: string) => { if (!id) return; const idx = _favoritos.indexOf(String(id)); if (idx >= 0) { _favoritos.splice(idx, 1); } else { _favoritos.push(String(id)); } save(); emitLifecycle(moduleId, version, PANEL_EVENTS.FAVORITO_CHANGED, { id, isFavorito: idx < 0 }); toastManager.success(idx >= 0 ? 'Removido dos favoritos' : 'Adicionado aos favoritos'); return idx < 0; };

export const getAll = () => _favoritos.slice();
export const clear = () => { _favoritos = []; };
export const count = () => _favoritos.length;
export const isFavorito = (id: unknown) => _favoritos.indexOf(String(id)) >= 0;

export const healthCheck = () => { const checks = { storageAvailable: (() => { try { localStorage.setItem('__test__', '1'); localStorage.removeItem('__test__'); return true; } catch (e) { return false; } })(), arrayInitialized: Array.isArray(_favoritos) }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, favoritosCount: _favoritos.length, timestamp: Date.now() }; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, count: _favoritos.length });

export default { load, save, toggle, getAll, clear, count, isFavorito, healthCheck, info, VERSION, MODULE_ID };
