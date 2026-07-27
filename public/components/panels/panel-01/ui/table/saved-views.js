const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/saved-views";
const STORAGE_KEY = "p01_saved_views";
class SavedViewsManager {
  constructor(options = {}) {
    this.onApply = options.onApply || (() => {
    });
    this.maxViews = options.maxViews || 10;
    this.views = this._load();
  }
  _load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.views));
    } catch {
    }
  }
  getAll() {
    return [...this.views];
  }
  getById(id) {
    return this.views.find((v) => v.id === id);
  }
  create(name, config) {
    if (this.views.length >= this.maxViews) {
      throw new Error(`Limite de views atingido (${this.maxViews})`);
    }
    const view = {
      id: `view_${Date.now()}`,
      name: name.substring(0, 50),
      config: { filters: config.filters || {}, sort: config.sort || null, columns: config.columns || [], density: config.density || "normal" },
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.views.push(view);
    this._save();
    return view;
  }
  update(id, updates) {
    const view = this.getById(id);
    if (!view) return null;
    if (updates.name) view.name = updates.name.substring(0, 50);
    if (updates.config) view.config = { ...view.config, ...updates.config };
    view.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this._save();
    return view;
  }
  delete(id) {
    const index = this.views.findIndex((v) => v.id === id);
    if (index >= 0) {
      this.views.splice(index, 1);
      this._save();
      return true;
    }
    return false;
  }
  apply(id) {
    const view = this.getById(id);
    if (view) {
      this.onApply(view.config);
      return true;
    }
    return false;
  }
  duplicate(id) {
    const view = this.getById(id);
    if (!view) return null;
    return this.create(`${view.name} (copia)`, view.config);
  }
  export(id) {
    const view = this.getById(id);
    return view ? JSON.stringify(view, null, 2) : null;
  }
  import(jsonStr) {
    try {
      const view = JSON.parse(jsonStr);
      if (!view.name || !view.config) throw new Error("View invalida");
      return this.create(view.name, view.config);
    } catch (e) {
      throw new Error(`Falha ao importar: ${e.message}`);
    }
  }
  clear() {
    this.views = [];
    this._save();
  }
}
function createSavedViewsManager(options = {}) {
  return new SavedViewsManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var saved_views_default = { SavedViewsManager, createSavedViewsManager };
export {
  MODULE_ID,
  SavedViewsManager,
  VERSION,
  createSavedViewsManager,
  saved_views_default as default,
  healthCheck,
  info
};
