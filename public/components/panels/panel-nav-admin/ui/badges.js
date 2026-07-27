import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE3";
const MODULE_ID = "panel-nav-admin.ui.badges";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const STORAGE_KEY = "pna_last_visit";
const BADGE_TYPES = Object.freeze({
  NEW: "new",
  NO_UARPS: "no-uarps",
  INACTIVE: "inactive",
  NO_ROUTE: "no-route",
  DUPLICATE: "duplicate",
  ERROR: "error"
});
class BadgeManager {
  /**
   * @param {Object} [options]
   * @param {Function} [options.onNewItems] — Callback quando novos itens detectados
   * @param {string} [options.timestampField='createdAt']
   */
  constructor(options = {}) {
    this.onNewItems = options.onNewItems || null;
    this.timestampField = options.timestampField || "createdAt";
    this._lastVisit = this._loadLastVisit();
    this._newItems = [];
  }
  /**
   * Analyze items and detect which ones have badges.
   * @param {Array<Object>} items
   * @returns {Map<string, string[]>} Map of itemId → array of badge types
   */
  analyze(items) {
    const badgeMap = /* @__PURE__ */ new Map();
    this._newItems = [];
    for (const item of items || []) {
      const badges = [];
      const id = item.id;
      if (this._isNew(item)) {
        badges.push(BADGE_TYPES.NEW);
        this._newItems.push(item);
      }
      if (!item.uarpsTrigger) {
        badges.push(BADGE_TYPES.NO_UARPS);
      }
      if (item.isActive === false) {
        badges.push(BADGE_TYPES.INACTIVE);
      }
      if (!item.href && item.itemType !== "separator" && !item.isDivider) {
        badges.push(BADGE_TYPES.NO_ROUTE);
      }
      if (badges.length > 0) {
        badgeMap.set(id, badges);
      }
    }
    if (this._newItems.length > 0 && this.onNewItems) {
      this.onNewItems(this._newItems);
    }
    return badgeMap;
  }
  /**
   * Check if a single item is new (created after last visit).
   * @param {Object} item
   * @returns {boolean}
   */
  _isNew(item) {
    if (!this._lastVisit) return false;
    const ts = item[this.timestampField] || item.createdAt || item.created_at;
    if (!ts) return false;
    return new Date(ts).getTime() > this._lastVisit;
  }
  /**
   * Check if item has a specific badge.
   * @param {Object} item
   * @param {string} badgeType
   * @returns {boolean}
   */
  isNew(item) {
    return this._isNew(item);
  }
  hasNoUarps(item) {
    return !item.uarpsTrigger;
  }
  isInactive(item) {
    return item.isActive === false;
  }
  /** @returns {number} Count of new items from last analyze */
  getNewCount() {
    return this._newItems.length;
  }
  /** @returns {boolean} Whether there are new items */
  hasNew() {
    return this._newItems.length > 0;
  }
  /**
   * Render a badge HTML element.
   * @param {string} type — BADGE_TYPES value
   * @returns {string} HTML
   */
  renderBadge(type) {
    const labels = {
      [BADGE_TYPES.NEW]: "Novo",
      [BADGE_TYPES.NO_UARPS]: "Sem UARPS",
      [BADGE_TYPES.INACTIVE]: "Inativo",
      [BADGE_TYPES.NO_ROUTE]: "Sem rota",
      [BADGE_TYPES.DUPLICATE]: "Duplicado",
      [BADGE_TYPES.ERROR]: "Erro"
    };
    return '<span class="pna-badge pna-badge--' + type + '">' + (labels[type] || type) + "</span>";
  }
  /**
   * Render all badges for an item.
   * @param {string[]} badgeTypes
   * @returns {string} HTML with all badges
   */
  renderBadges(badgeTypes) {
    if (!badgeTypes || badgeTypes.length === 0) return "";
    return badgeTypes.map((t) => this.renderBadge(t)).join("");
  }
  /**
   * Render the "New" counter badge (for toolbar/header).
   * @returns {string} HTML
   */
  renderNewCounter() {
    const count = this._newItems.length;
    if (count === 0) return "";
    const display = count > 99 ? "99+" : String(count);
    return '<span class="pna-badge pna-badge--new-counter">' + display + "</span>";
  }
  /** Mark current time as last visit (clears "new" status). */
  markAsSeen() {
    this._lastVisit = Date.now();
    this._newItems = [];
    try {
      localStorage.setItem(STORAGE_KEY, (/* @__PURE__ */ new Date()).toISOString());
    } catch (e) {
    }
  }
  /** @private Load last visit from localStorage */
  _loadLastVisit() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Date(saved).getTime() : null;
    } catch (e) {
      return null;
    }
  }
  /** Reset all state */
  reset() {
    this._newItems = [];
    this._lastVisit = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
    }
  }
}
function createBadgeManager(options = {}) {
  return new BadgeManager(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, badgeTypes: Object.values(BADGE_TYPES) };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var badges_default = { BADGE_TYPES, BadgeManager, createBadgeManager, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  BADGE_TYPES,
  BadgeManager,
  MODULE_ID,
  VERSION,
  createBadgeManager,
  badges_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
