// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: versioning
// PURPOSE: Versioning - Controle de Versões P10.2 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PERSISTENCE_EVENTS from /core/runtime/events/catalog/persistence.events.js
//   SCHEMA_VERSION from ./persistence-port.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createVersioningController() — exported function
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
import { SCHEMA_VERSION } from './persistence-port.js';

export const VERSION = '1.1.0-P18EC';
export const MODULE_ID = 'versioning';

const SUPPORTED_VERSIONS = ['1.0.0', '2.0.0'];
const MIGRATION_MAP = { '1.0.0': { target: '2.0.0', migrate: migrateV1toV2 } };

function migrateV1toV2(snapshot: unknown) {
// @ts-expect-error TS migration - TS2698
  return { ...snapshot, version: 'P8-AAA', migratedAt: Date.now(), migratedFrom: '1.0.0' };
}

export class VersioningController {
  [key: string]: any;
  constructor(context: Record<string, any> = {}) {
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._metrics = { checks: 0, migrations: 0, errors: 0 };
  }

  getCurrentVersion() { return SCHEMA_VERSION; }
  getSupportedVersions() { return [...SUPPORTED_VERSIONS]; }
  isVersionSupported(version: unknown) {
    if (!version) return false;
// @ts-expect-error TS migration - TS2339
    const [major] = version.split('.');
    return SUPPORTED_VERSIONS.some(v => v.split('.')[0] === major);
  }

  checkCompatibility(snapshotVersion: unknown) {
    this._metrics.checks++;
    if (!snapshotVersion) return { compatible: false, reason: 'No version specified' };
// @ts-expect-error TS migration - TS2339
    const [snapMajor] = snapshotVersion.split('.');
    const [currMajor] = SCHEMA_VERSION.split('.');
    if (snapMajor === currMajor) return { compatible: true, exact: snapshotVersion === SCHEMA_VERSION };
// @ts-expect-error TS migration - TS2578
    if (MIGRATION_MAP[snapshotVersion]) return { compatible: true, needsMigration: true, migrateTo: MIGRATION_MAP[snapshotVersion].target };
    return { compatible: false, reason: `Version ${snapshotVersion} not supported` };
  }

  async migrate(snapshot: unknown, fromVersion: unknown) {
    this._emit(PERSISTENCE_EVENTS.MIGRATION_STARTED, { from: fromVersion, to: SCHEMA_VERSION });
    try {
// @ts-expect-error TS migration - TS2538
      const migration = MIGRATION_MAP[fromVersion];
      if (!migration) throw new Error(`No migration path from ${fromVersion}`);
      const migrated = migration.migrate(snapshot);
      this._metrics.migrations++;
      this._emit(PERSISTENCE_EVENTS.MIGRATION_COMPLETED, { from: fromVersion, to: migration.target });
      this._track('migration:completed', { from: fromVersion, to: migration.target });
      return { ok: true, snapshot: migrated, migratedFrom: fromVersion, migratedTo: migration.target };
    } catch (error: any) {
      this._metrics.errors++;
      this._emit(PERSISTENCE_EVENTS.MIGRATION_ERROR, { from: fromVersion, error: error.message });
      return { ok: false, error: error.message };
    }
  }

  _emit(event: string, data: Record<string, unknown> = {}) { try { this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); } catch(e) {} }
  _track(event: string, data: Record<string, unknown> = {}) { try { this._telemetry?.track?.(event, data); } catch(e) {} }

  healthCheck() { return { status: 'healthy', currentVersion: SCHEMA_VERSION, supportedVersions: SUPPORTED_VERSIONS, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, schemaVersion: SCHEMA_VERSION, supportedVersions: SUPPORTED_VERSIONS, metrics: { ...this._metrics } }; }
}

export function createVersioningController(context: Record<string, unknown>) { return new VersioningController(context); }
export default { VersioningController, createVersioningController, SUPPORTED_VERSIONS, VERSION, MODULE_ID };
