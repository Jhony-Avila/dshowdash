// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-P8-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: persistence-port
// PURPOSE: Persistence Port - Contrato de Persistência P8 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   STORAGE_KEY — exported value
//   SCHEMA_VERSION — exported value
//   DEFAULT_TTL_MS — exported value
//   generateChecksum() — exported function
//   validateChecksum() — exported function
//   isExpired() — exported function
//   isSchemaCompatible() — exported function
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

export const VERSION = '2.0.0-P8-AAA';
export const MODULE_ID = 'persistence-port';

export const STORAGE_KEY = 'dshowdash:p8:snapshot';
export const SCHEMA_VERSION = '2.0.0';
export const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24h

export class PersistencePort {
  async save(key: string, payload: Record<string, unknown>) { throw new Error('PersistencePort.save must be implemented'); }
  async load(key: string) { throw new Error('PersistencePort.load must be implemented'); }
  async clear(key: string) { throw new Error('PersistencePort.clear must be implemented'); }
  healthCheck() { return { status: 'unhealthy', reason: 'Not implemented' }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, schemaVersion: SCHEMA_VERSION }; }
}

// Gera checksum simples (hash baseado em string)
export function generateChecksum(payload: Record<string, unknown>) {
  const str = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Valida checksum
export function validateChecksum(payload: Record<string, unknown>, expectedChecksum: unknown) {
  const computed = generateChecksum(payload);
  return computed === expectedChecksum;
}

// Verifica se snapshot expirou
export function isExpired(timestamp: number, ttlMs = DEFAULT_TTL_MS) {
  if (!timestamp) return true;
  return (Date.now() - timestamp) > ttlMs;
}

// Verifica compatibilidade de schema
export function isSchemaCompatible(snapshotVersion: unknown, currentVersion = SCHEMA_VERSION) {
  if (!snapshotVersion) return false;
// @ts-expect-error TS migration - TS2339
  const [snapMajor] = snapshotVersion.split('.');
  const [currMajor] = currentVersion.split('.');
  return snapMajor === currMajor;
}

export default { PersistencePort, STORAGE_KEY, SCHEMA_VERSION, DEFAULT_TTL_MS, generateChecksum, validateChecksum, isExpired, isSchemaCompatible, VERSION, MODULE_ID };
