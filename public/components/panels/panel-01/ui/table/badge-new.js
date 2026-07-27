const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/badge-new";
const STORAGE_KEY = "p01_last_visit";
class NewBadgeManager {
  constructor(options = {}) {
    this.onNewItems = options.onNewItems || (() => {
    });
    this.timestampField = options.timestampField || "updated_at";
    this._lastVisit = this._loadLastVisit();
    this._newCount = 0;
  }
  _loadLastVisit() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Date(saved) : /* @__PURE__ */ new Date(0);
    } catch {
      return /* @__PURE__ */ new Date(0);
    }
  }
  _saveLastVisit() {
    try {
      localStorage.setItem(STORAGE_KEY, (/* @__PURE__ */ new Date()).toISOString());
    } catch {
    }
  }
  checkNewItems(items) {
    const newItems = items.filter((item) => {
      const itemDate = new Date(String(item[this.timestampField] || item.created_at || item.Data_Requisicao || ""));
      return itemDate > this._lastVisit;
    });
    this._newCount = newItems.length;
    if (this._newCount > 0) this.onNewItems(newItems);
    return newItems;
  }
  getNewCount() {
    return this._newCount;
  }
  hasNew() {
    return this._newCount > 0;
  }
  markAsSeen() {
    this._saveLastVisit();
    this._lastVisit = /* @__PURE__ */ new Date();
    this._newCount = 0;
  }
  isNew(item) {
    const itemDate = new Date(String(item[this.timestampField] || item.created_at || item.Data_Requisicao || ""));
    return itemDate > this._lastVisit;
  }
  renderBadge() {
    if (this._newCount === 0) return "";
    const text = this._newCount > 99 ? "99+" : String(this._newCount);
    return `<span class="p01-new-badge">${text}</span>`;
  }
  renderRowIndicator(item) {
    if (!this.isNew(item)) return "";
    return '<span class="p01-new-indicator" title="Novo"></span>';
  }
  getLastVisit() {
    return this._lastVisit;
  }
  reset() {
    this._newCount = 0;
    localStorage.removeItem(STORAGE_KEY);
    this._lastVisit = /* @__PURE__ */ new Date(0);
  }
}
function createNewBadgeManager(options = {}) {
  return new NewBadgeManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var badge_new_default = { NewBadgeManager, createNewBadgeManager };
export {
  MODULE_ID,
  NewBadgeManager,
  VERSION,
  createNewBadgeManager,
  badge_new_default as default,
  healthCheck,
  info
};
