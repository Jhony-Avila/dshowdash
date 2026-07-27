// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-14/utils/storage
// PURPOSE: Panel-14 - Filter Storage Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   getVersion() — exported function
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
export const MODULE_ID = 'panel-14/utils/storage';
const STORAGE_KEY = 'p14-filters';
const STORAGE_VERSION = 1;

export class FilterStorage {
  [key: string]: any;
  constructor(logger: Record<string, unknown>) {
    this.logger = logger;
    this.available = this.checkAvailability();
  }

  checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      this.logger?.warn?.('storage.unavailable');
      return false;
    }
  }

  save(filters: Record<string, unknown>) {
    if (!this.available) return false;
    try {
      const data = { version: STORAGE_VERSION, timestamp: Date.now(), filters };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.logger?.debug?.('storage.saved', { filters });
      return true;
    } catch (e: any) {
      this.logger?.warn?.('storage.save-failed', { error: e.message });
      return false;
    }
  }

  load() {
    if (!this.available) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== STORAGE_VERSION) { this.logger?.info?.('storage.version-mismatch'); this.clear(); return null; }
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - data.timestamp > maxAge) { this.logger?.info?.('storage.expired'); this.clear(); return null; }
      this.logger?.debug?.('storage.loaded', { filters: data.filters });
      return data.filters;
    } catch (e: any) {
      this.logger?.warn?.('storage.load-failed', { error: e.message });
      return null;
    }
  }

  clear() {
    if (!this.available) return false;
    try { localStorage.removeItem(STORAGE_KEY); this.logger?.debug?.('storage.cleared'); return true; } catch { return false; }
  }

  info() {
    if (!this.available) return { available: false, hasData: false };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { available: true, hasData: false };
      const data = JSON.parse(raw);
      return { available: true, hasData: true, version: data.version, age: Date.now() - data.timestamp, size: raw.length };
    } catch { return { available: true, hasData: false, corrupted: true }; }
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export function getVersion() { return VERSION; }

export default FilterStorage;
