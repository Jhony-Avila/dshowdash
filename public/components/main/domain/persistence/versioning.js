import { PERSISTENCE_EVENTS } from "/core/runtime/events/catalog/persistence.events.js";
import { SCHEMA_VERSION } from "./persistence-port.js";
const VERSION = "1.1.0-P18EC";
const MODULE_ID = "versioning";
const SUPPORTED_VERSIONS = ["1.0.0", "2.0.0"];
const MIGRATION_MAP = { "1.0.0": { target: "2.0.0", migrate: migrateV1toV2 } };
function migrateV1toV2(snapshot) {
  return { ...snapshot, version: "P8-AAA", migratedAt: Date.now(), migratedFrom: "1.0.0" };
}
class VersioningController {
  constructor(context = {}) {
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._metrics = { checks: 0, migrations: 0, errors: 0 };
  }
  getCurrentVersion() {
    return SCHEMA_VERSION;
  }
  getSupportedVersions() {
    return [...SUPPORTED_VERSIONS];
  }
  isVersionSupported(version) {
    if (!version) return false;
    const [major] = version.split(".");
    return SUPPORTED_VERSIONS.some((v) => v.split(".")[0] === major);
  }
  checkCompatibility(snapshotVersion) {
    this._metrics.checks++;
    if (!snapshotVersion) return { compatible: false, reason: "No version specified" };
    const [snapMajor] = snapshotVersion.split(".");
    const [currMajor] = SCHEMA_VERSION.split(".");
    if (snapMajor === currMajor) return { compatible: true, exact: snapshotVersion === SCHEMA_VERSION };
    if (MIGRATION_MAP[snapshotVersion]) return { compatible: true, needsMigration: true, migrateTo: MIGRATION_MAP[snapshotVersion].target };
    return { compatible: false, reason: `Version ${snapshotVersion} not supported` };
  }
  async migrate(snapshot, fromVersion) {
    this._emit(PERSISTENCE_EVENTS.MIGRATION_STARTED, { from: fromVersion, to: SCHEMA_VERSION });
    try {
      const migration = MIGRATION_MAP[fromVersion];
      if (!migration) throw new Error(`No migration path from ${fromVersion}`);
      const migrated = migration.migrate(snapshot);
      this._metrics.migrations++;
      this._emit(PERSISTENCE_EVENTS.MIGRATION_COMPLETED, { from: fromVersion, to: migration.target });
      this._track("migration:completed", { from: fromVersion, to: migration.target });
      return { ok: true, snapshot: migrated, migratedFrom: fromVersion, migratedTo: migration.target };
    } catch (error) {
      this._metrics.errors++;
      this._emit(PERSISTENCE_EVENTS.MIGRATION_ERROR, { from: fromVersion, error: error.message });
      return { ok: false, error: error.message };
    }
  }
  _emit(event, data = {}) {
    try {
      this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    } catch (e) {
    }
  }
  _track(event, data = {}) {
    try {
      this._telemetry?.track?.(event, data);
    } catch (e) {
    }
  }
  healthCheck() {
    return { status: "healthy", currentVersion: SCHEMA_VERSION, supportedVersions: SUPPORTED_VERSIONS, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, schemaVersion: SCHEMA_VERSION, supportedVersions: SUPPORTED_VERSIONS, metrics: { ...this._metrics } };
  }
}
function createVersioningController(context) {
  return new VersioningController(context);
}
var versioning_default = { VersioningController, createVersioningController, SUPPORTED_VERSIONS, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  VersioningController,
  createVersioningController,
  versioning_default as default
};
