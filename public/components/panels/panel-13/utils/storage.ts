// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-13/utils/storage
// PURPOSE: Panel-13 - Filter Storage Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//   FilterStorage() — exported function
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
export const MODULE_ID = 'panel-13/utils/storage';
const STORAGE_KEY = 'p13-filters';
const STORAGE_VERSION = 1;

function FilterStorage(this: any, logger: Record<string, unknown>) {
  this.logger = logger;
  this.available = this.checkAvailability();
}

FilterStorage.prototype.checkAvailability = function() {
  try { const test = '__storage_test__'; localStorage.setItem(test, test); localStorage.removeItem(test); return true; }
  catch (e: any) { if (this.logger && this.logger.warn) this.logger.warn('storage.unavailable'); return false; }
};

FilterStorage.prototype.save = function(filters: Record<string, unknown>) {
  if (!this.available) return false;
  try {
    const data = { version: STORAGE_VERSION, timestamp: Date.now(), filters };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (this.logger && this.logger.debug) this.logger.debug('storage.saved', { filters });
    return true;
  } catch (e: any) { if (this.logger && this.logger.warn) this.logger.warn('storage.save-failed', { error: e.message }); return false; }
};

FilterStorage.prototype.load = function() {
  if (!this.available) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== STORAGE_VERSION) { if (this.logger && this.logger.info) this.logger.info('storage.version-mismatch', { stored: data.version, current: STORAGE_VERSION }); this.clear(); return null; }
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > maxAge) { if (this.logger && this.logger.info) this.logger.info('storage.expired'); this.clear(); return null; }
    if (this.logger && this.logger.debug) this.logger.debug('storage.loaded', { filters: data.filters });
    return data.filters;
  } catch (e: any) { if (this.logger && this.logger.warn) this.logger.warn('storage.load-failed', { error: e.message }); return null; }
};

FilterStorage.prototype.clear = function() {
  if (!this.available) return false;
  try { localStorage.removeItem(STORAGE_KEY); if (this.logger && this.logger.debug) this.logger.debug('storage.cleared'); return true; }
  catch (e: any) { return false; }
};

FilterStorage.prototype.info = function() {
  if (!this.available) return { available: false, hasData: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { available: true, hasData: false };
    const data = JSON.parse(raw);
    return { available: true, hasData: true, version: data.version, age: Date.now() - data.timestamp, size: raw.length };
  } catch (e: any) { return { available: true, hasData: false, corrupted: true }; }
};

FilterStorage.prototype.healthCheck = function() { return { status: this.available ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { storageAvailable: this.available } }; };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { FilterStorageReady: typeof FilterStorage === 'function' } }; }

export { FilterStorage };
export default FilterStorage;
