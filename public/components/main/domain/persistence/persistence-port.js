const VERSION = "2.0.0-P8-AAA";
const MODULE_ID = "persistence-port";
const STORAGE_KEY = "dshowdash:p8:snapshot";
const SCHEMA_VERSION = "2.0.0";
const DEFAULT_TTL_MS = 1e3 * 60 * 60 * 24;
class PersistencePort {
  async save(key, payload) {
    throw new Error("PersistencePort.save must be implemented");
  }
  async load(key) {
    throw new Error("PersistencePort.load must be implemented");
  }
  async clear(key) {
    throw new Error("PersistencePort.clear must be implemented");
  }
  healthCheck() {
    return { status: "unhealthy", reason: "Not implemented" };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, schemaVersion: SCHEMA_VERSION };
  }
}
function generateChecksum(payload) {
  const str = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
function validateChecksum(payload, expectedChecksum) {
  const computed = generateChecksum(payload);
  return computed === expectedChecksum;
}
function isExpired(timestamp, ttlMs = DEFAULT_TTL_MS) {
  if (!timestamp) return true;
  return Date.now() - timestamp > ttlMs;
}
function isSchemaCompatible(snapshotVersion, currentVersion = SCHEMA_VERSION) {
  if (!snapshotVersion) return false;
  const [snapMajor] = snapshotVersion.split(".");
  const [currMajor] = currentVersion.split(".");
  return snapMajor === currMajor;
}
var persistence_port_default = { PersistencePort, STORAGE_KEY, SCHEMA_VERSION, DEFAULT_TTL_MS, generateChecksum, validateChecksum, isExpired, isSchemaCompatible, VERSION, MODULE_ID };
export {
  DEFAULT_TTL_MS,
  MODULE_ID,
  PersistencePort,
  SCHEMA_VERSION,
  STORAGE_KEY,
  VERSION,
  persistence_port_default as default,
  generateChecksum,
  isExpired,
  isSchemaCompatible,
  validateChecksum
};
