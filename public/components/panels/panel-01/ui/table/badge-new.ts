// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/badge-new
// PURPOSE: Panel-01 - Badge de Novidades
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createNewBadgeManager() — exported function
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
export const MODULE_ID = 'panel-01/ui/badge-new';

const STORAGE_KEY = 'p01_last_visit';

export class NewBadgeManager {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.onNewItems = options.onNewItems || (() => {});
    this.timestampField = options.timestampField || 'updated_at';
    this._lastVisit = this._loadLastVisit();
    this._newCount = 0;
  }

  _loadLastVisit() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Date(saved) : new Date(0);
    } catch { return new Date(0); }
  }

  _saveLastVisit() {
    try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch {}
  }

  checkNewItems(items: Record<string, unknown>[]) {
    const newItems = items.filter((item: Record<string, unknown>) => {
      const itemDate = new Date(String(item[this.timestampField] || item.created_at || item.Data_Requisicao || ''));
      return itemDate > this._lastVisit;
    });
    this._newCount = newItems.length;
    if (this._newCount > 0) this.onNewItems(newItems);
    return newItems;
  }

  getNewCount() { return this._newCount; }
  hasNew() { return this._newCount > 0; }

  markAsSeen() {
    this._saveLastVisit();
    this._lastVisit = new Date();
    this._newCount = 0;
  }

  isNew(item: Record<string, unknown>) {
    const itemDate = new Date(String(item[this.timestampField] || item.created_at || item.Data_Requisicao || ''));
    return itemDate > this._lastVisit;
  }

  renderBadge() {
    if (this._newCount === 0) return '';
    const text = this._newCount > 99 ? '99+' : String(this._newCount);
    return `<span class="p01-new-badge">${text}</span>`;
  }

  renderRowIndicator(item: Record<string, unknown>) {
    if (!this.isNew(item)) return '';
    return '<span class="p01-new-indicator" title="Novo"></span>';
  }

  getLastVisit() { return this._lastVisit; }
  reset() { this._newCount = 0; localStorage.removeItem(STORAGE_KEY); this._lastVisit = new Date(0); }
}

export function createNewBadgeManager(options: Record<string, unknown> = {}) { return new NewBadgeManager(options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { NewBadgeManager, createNewBadgeManager };
