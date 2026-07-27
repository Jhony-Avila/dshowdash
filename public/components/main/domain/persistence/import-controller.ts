// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: import-controller
// PURPOSE: Import Controller - Importação de Snapshots P10.2 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PERSISTENCE_EVENTS from /core/runtime/events/catalog/persistence.events.js
//   SCHEMA_VERSION, generateChecksum, isSchemaCompatible from ./persistence-port.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createImportController() — exported function
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

import { PERSISTENCE_EVENTS } from '/core/runtime/events/catalog/persistence.events.js';
import { SCHEMA_VERSION, generateChecksum, isSchemaCompatible } from './persistence-port.js';

export const VERSION = '2.1.0-P18EC';
export const MODULE_ID = 'import-controller';

export class ImportController {
  [key: string]: any;
  constructor(context: Record<string, any> = {}) {
    this._persistence = context.persistence || null;
    this._rehydration = context.rehydration || null;
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._metrics = { imports: 0, validated: 0, rejected: 0, errors: 0 };
  }

  async validateImport(data: Record<string, unknown>) {
    const errors = [];
    const warnings = [];
    let parsed = data;
    if (typeof data === 'string') {
      try { parsed = JSON.parse(data); } catch (e) { return { valid: false, errors: ['Invalid JSON format'], warnings: [] as unknown[] }; }
    }
    if (!parsed) errors.push('Empty data');
    if (!parsed.schemaVersion) errors.push('Missing schemaVersion');
    if (!parsed.snapshot) errors.push('Missing snapshot data');
    if (parsed.schemaVersion && !isSchemaCompatible(parsed.schemaVersion)) warnings.push(`Schema version mismatch: ${parsed.schemaVersion} vs ${SCHEMA_VERSION}`);
    if (parsed.checksum && parsed.snapshot) {
// @ts-expect-error TS migration - TS2345
      const computed = generateChecksum(parsed.snapshot);
      if (computed !== parsed.checksum) errors.push('Checksum mismatch - data may be corrupted');
    }
    if (parsed.snapshot) {
// @ts-expect-error TS migration - TS2339
      if (!Array.isArray(parsed.snapshot.containers)) errors.push('Invalid snapshot: containers must be array');
    }
    const valid = errors.length === 0;
    this._metrics.validated++;
    if (!valid) this._metrics.rejected++;
    return { valid, errors, warnings, data: parsed };
  }

  async importSnapshot(data: Record<string, unknown>, options: Record<string, unknown> = {}) {
    const { dryRun = true, force = false } = options;
    this._emit(PERSISTENCE_EVENTS.IMPORT_STARTED, { dryRun, force });
    this._track('import:started', { dryRun });
    try {
      const validation = await this.validateImport(data);
      if (!validation.valid && !force) {
        this._emit(PERSISTENCE_EVENTS.IMPORT_REJECTED, { errors: validation.errors });
        return { ok: false, error: 'Validation failed', validation };
      }
      if (dryRun) {
        this._emit(PERSISTENCE_EVENTS.IMPORT_DRYRUN_COMPLETED, { warnings: validation.warnings });
        return { ok: true, dryRun: true, validation, wouldImport: true, snapshot: validation.data?.snapshot };
      }
      if (!this._persistence?.save) throw new Error('No persistence adapter available');
      // @ts-expect-error strict migration — TS18048
      const snapshot = validation.data.snapshot;
      await this._persistence.save(undefined, snapshot);
      this._metrics.imports++;
// @ts-expect-error TS migration - TS2339
      this._emit(PERSISTENCE_EVENTS.IMPORT_COMPLETED, { containers: snapshot.containers?.length || 0 });
// @ts-expect-error TS migration - TS2339
      this._track('import:completed', { containers: snapshot.containers?.length || 0 });
      return { ok: true, dryRun: false, imported: true, validation };
    } catch (error: any) {
      this._metrics.errors++;
      this._emit(PERSISTENCE_EVENTS.IMPORT_ERROR, { error: error.message });
      this._track('import:error', { error: error.message });
      return { ok: false, error: error.message };
    }
  }

  _emit(event: string, data: Record<string, unknown> = {}) { try { this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); } catch(e) {} }
  _track(event: string, data: Record<string, unknown> = {}) { try { this._telemetry?.track?.(event, data); } catch(e) {} }

  healthCheck() { return { status: this._persistence ? 'healthy' : 'degraded', hasPersistence: !!this._persistence, hasRehydration: !!this._rehydration, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, schemaVersion: SCHEMA_VERSION, metrics: { ...this._metrics } }; }
}

export function createImportController(context: Record<string, unknown>) { return new ImportController(context); }
export default { ImportController, createImportController, VERSION, MODULE_ID };
