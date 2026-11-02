// Migrado para TypeScript: 2026-02-25
// RuntimeContext Snapshot Persistence
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// @version 1.0.0
// @description Salvar/recuperar snapshots do RuntimeContext em sessionStorage
// @melhoria #02 - Recuperacao rapida apos refresh
'use strict';

export const MODULE_ID = 'snapshot-persistence' as const;
export const VERSION = '1.0.0' as const;

const STORAGE_KEY: string = 'dsd_runtime_context_snapshot';
const MAX_AGE_MS: number = 300000;

interface StoredData {
  snapshot: Record<string, unknown>;
  savedAt: number;
  version: string;
}

interface SnapshotMeta {
  savedAt: number;
  age: number;
  expired: boolean;
  version: string;
}

interface SnapshotPersistenceInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  hasSnapshot: boolean;
  meta: SnapshotMeta | null;
  maxAgeMs: number;
  storageKey: string;
}

export function saveSnapshot(snapshot: Record<string, unknown>): boolean {
  try {
    if (!snapshot || typeof sessionStorage === 'undefined') return false;
    const data: StoredData = {
      snapshot,
      savedAt: Date.now(),
      version: VERSION
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e: unknown) {
    return false;
  }
}

export function loadSnapshot(): Record<string, unknown> | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: StoredData = JSON.parse(raw);
    if (!data || !data.snapshot || !data.savedAt) return null;
    if (Date.now() - data.savedAt > MAX_AGE_MS) {
      clearSnapshot();
      return null;
    }
    return data.snapshot;
  } catch (e: unknown) {
    return null;
  }
}

export function clearSnapshot(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (e: unknown) {}
}

export function hasSnapshot(): boolean {
  return loadSnapshot() !== null;
}

export function getSnapshotMeta(): SnapshotMeta | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: StoredData = JSON.parse(raw);
    if (!data) return null;
    return {
      savedAt: data.savedAt,
      age: Date.now() - data.savedAt,
      expired: Date.now() - data.savedAt > MAX_AGE_MS,
      version: data.version
    };
  } catch (e: unknown) {
    return null;
  }
}

export function info(): SnapshotPersistenceInfo {
  const meta = getSnapshotMeta();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    hasSnapshot: hasSnapshot(),
    meta,
    maxAgeMs: MAX_AGE_MS,
    storageKey: STORAGE_KEY
  };
}

export default {
  MODULE_ID,
  VERSION,
  saveSnapshot,
  loadSnapshot,
  clearSnapshot,
  hasSnapshot,
  getSnapshotMeta,
  info
};
