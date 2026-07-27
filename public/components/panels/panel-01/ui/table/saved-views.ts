// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/saved-views
// PURPOSE: Panel-01 - Saved Views
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createSavedViewsManager() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/saved-views';

const STORAGE_KEY = 'p01_saved_views';

export class SavedViewsManager {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.onApply = options.onApply || (() => {});
    this.maxViews = options.maxViews || 10;
    this.views = this._load();
  }

  _load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }

  _save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.views)); } catch {}
  }

  getAll() { return [...this.views]; }
  getById(id: string) { return this.views.find((v: Record<string, unknown>) => v.id === id); }

  create(name: string, config: Record<string, unknown>) {
    if (this.views.length >= this.maxViews) {
      throw new Error(`Limite de views atingido (${this.maxViews})`);
    }
    const view = {
      id: `view_${Date.now()}`,
      name: name.substring(0, 50),
      config: { filters: config.filters || {}, sort: config.sort || null, columns: config.columns || [], density: config.density || 'normal' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.views.push(view);
    this._save();
    return view;
  }

  update(id: string, updates: Record<string, unknown>) {
    const view = this.getById(id);
    if (!view) return null;
    if (updates.name) view.name = (updates.name as string).substring(0, 50);
    if (updates.config) view.config = { ...(view.config as Record<string, unknown>), ...(updates.config as Record<string, unknown>) };
    view.updatedAt = new Date().toISOString();
    this._save();
    return view;
  }

  delete(id: string) {
    const index = this.views.findIndex((v: Record<string, unknown>) => v.id === id);
    if (index >= 0) { this.views.splice(index, 1); this._save(); return true; }
    return false;
  }

  apply(id: string) {
    const view = this.getById(id);
    if (view) { this.onApply(view.config); return true; }
    return false;
  }

  duplicate(id: string) {
    const view = this.getById(id);
    if (!view) return null;
    return this.create(`${view.name} (copia)`, view.config);
  }

  export(id: string) {
    const view = this.getById(id);
    return view ? JSON.stringify(view, null, 2) : null;
  }

  import(jsonStr: string) {
    try {
      const view = JSON.parse(jsonStr);
      if (!view.name || !view.config) throw new Error('View invalida');
      return this.create(view.name, view.config);
    } catch (e) { throw new Error(`Falha ao importar: ${(e as Error).message}`); }
  }

  clear() { this.views = []; this._save(); }
}

export function createSavedViewsManager(options: Record<string, unknown> = {}) { return new SavedViewsManager(options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { SavedViewsManager, createSavedViewsManager };
