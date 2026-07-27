// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE3)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.badges
// PURPOSE: Badges — Indicadores visuais para itens (novo, sem UARPS, erro)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID, injectPorts, getPorts
//   BadgeManager — exported class
//   createBadgeManager() — factory
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/table/badge-new.js for nav-admin
// @changelog
//   10.1.0-MIGRATION-PHASE3: Initial creation — FASE 3 B.7
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '10.1.0-MIGRATION-PHASE3';
export const MODULE_ID = 'panel-nav-admin.ui.badges';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const STORAGE_KEY = 'pna_last_visit';

/**
 * Badge types for nav-admin items.
 * @readonly
 * @enum {string}
 */
export const BADGE_TYPES = Object.freeze({
  NEW:         'new',
  NO_UARPS:    'no-uarps',
  INACTIVE:    'inactive',
  NO_ROUTE:    'no-route',
  DUPLICATE:   'duplicate',
  ERROR:       'error'
});

/**
 * BadgeManager — Detecta e renderiza badges para itens de navegação.
 */
export class BadgeManager {
  [key: string]: any;
  /**
   * @param {Object} [options]
   * @param {Function} [options.onNewItems] — Callback quando novos itens detectados
   * @param {string} [options.timestampField='createdAt']
   */
  constructor(options: Record<string, unknown> = {}) {
    this.onNewItems = options.onNewItems || null;
    this.timestampField = options.timestampField || 'createdAt';
    this._lastVisit = this._loadLastVisit();
    this._newItems = [];
  }

  /**
   * Analyze items and detect which ones have badges.
   * @param {Array<Object>} items
   * @returns {Map<string, string[]>} Map of itemId → array of badge types
   */
  analyze(items: Record<string, unknown>[]) {
    const badgeMap = new Map();
    this._newItems = [];

    for (const item of (items || [])) {
      const badges = [];
      const id = item.id;

      // NEW badge — created after last visit
      if (this._isNew(item)) {
        badges.push(BADGE_TYPES.NEW);
        this._newItems.push(item);
      }

      // NO_UARPS badge — item without UARPS trigger configured
      if (!item.uarpsTrigger) {
        badges.push(BADGE_TYPES.NO_UARPS);
      }

      // INACTIVE badge
      if (item.isActive === false) {
        badges.push(BADGE_TYPES.INACTIVE);
      }

      // NO_ROUTE badge — no href/route configured
      if (!item.href && item.itemType !== 'separator' && !item.isDivider) {
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
  _isNew(item: Record<string, unknown>) {
    if (!this._lastVisit) return false;
    const ts = item[this.timestampField as string] || item.createdAt || item.created_at;
    if (!ts) return false;
    return new Date(ts as string | number).getTime() > this._lastVisit;
  }

  /**
   * Check if item has a specific badge.
   * @param {Object} item
   * @param {string} badgeType
   * @returns {boolean}
   */
  isNew(item: Record<string, unknown>) { return this._isNew(item); }
  hasNoUarps(item: Record<string, unknown>) { return !item.uarpsTrigger; }
  isInactive(item: Record<string, unknown>) { return item.isActive === false; }

  /** @returns {number} Count of new items from last analyze */
  getNewCount() { return this._newItems.length; }

  /** @returns {boolean} Whether there are new items */
  hasNew() { return this._newItems.length > 0; }

  /**
   * Render a badge HTML element.
   * @param {string} type — BADGE_TYPES value
   * @returns {string} HTML
   */
  renderBadge(type: string) {
    const labels: Record<string, string> = {
      [BADGE_TYPES.NEW]: 'Novo',
      [BADGE_TYPES.NO_UARPS]: 'Sem UARPS',
      [BADGE_TYPES.INACTIVE]: 'Inativo',
      [BADGE_TYPES.NO_ROUTE]: 'Sem rota',
      [BADGE_TYPES.DUPLICATE]: 'Duplicado',
      [BADGE_TYPES.ERROR]: 'Erro'
    };
    return '<span class="pna-badge pna-badge--' + type + '">' + (labels[type] || type) + '</span>';
  }

  /**
   * Render all badges for an item.
   * @param {string[]} badgeTypes
   * @returns {string} HTML with all badges
   */
  renderBadges(badgeTypes: string[]) {
    if (!badgeTypes || badgeTypes.length === 0) return '';
    return badgeTypes.map((t: string) => this.renderBadge(t)).join('');
  }

  /**
   * Render the "New" counter badge (for toolbar/header).
   * @returns {string} HTML
   */
  renderNewCounter() {
    const count = this._newItems.length;
    if (count === 0) return '';
    const display = count > 99 ? '99+' : String(count);
    return '<span class="pna-badge pna-badge--new-counter">' + display + '</span>';
  }

  /** Mark current time as last visit (clears "new" status). */
  markAsSeen() {
    this._lastVisit = Date.now();
    this._newItems = [];
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch (e) { /* ignore */ }
  }

  /** @private Load last visit from localStorage */
  _loadLastVisit() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Date(saved).getTime() : null;
    } catch (e) { return null; }
  }

  /** Reset all state */
  reset() {
    this._newItems = [];
    this._lastVisit = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }
}

/**
 * Factory to create a BadgeManager instance.
 * @param {Object} [options]
 * @returns {BadgeManager}
 */
export function createBadgeManager(options: Record<string, unknown> = {}) {
  return new BadgeManager(options);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, badgeTypes: Object.values(BADGE_TYPES) };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default { BADGE_TYPES, BadgeManager, createBadgeManager, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
