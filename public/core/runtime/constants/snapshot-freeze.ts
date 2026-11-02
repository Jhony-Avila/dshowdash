// Migrado para TypeScript: 2026-02-25
// Snapshot Freeze - Imutabilidade dos snapshots
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// @version 1.0.0
// @description Deep freeze de snapshots para prevenir mutacao acidental
// @melhoria #18 - Snapshot mutavel pode causar bugs
'use strict';

export const MODULE_ID = 'snapshot-freeze' as const;
export const VERSION = '1.0.0' as const;

interface SnapshotFreezeInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
}

export function deepFreeze<T extends Record<string, unknown>>(obj: T): Readonly<T>;
export function deepFreeze(obj: unknown): unknown;
export function deepFreeze(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  const keys = Object.keys(obj as Record<string, unknown>);
  for (let i = 0; i < keys.length; i++) {
    const val = (obj as Record<string, unknown>)[keys[i]];
    if (val && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

export function freezeSnapshot<T extends Record<string, unknown>>(snapshot: T | null | undefined): Readonly<T> | null | undefined {
  if (!snapshot) return snapshot as null | undefined;
  return deepFreeze(Object.assign({}, snapshot));
}

export function cloneSnapshot<T extends Record<string, unknown>>(snapshot: T | null | undefined): T | null {
  if (!snapshot) return null;
  const clone: Record<string, unknown> = {};
  const keys = Object.keys(snapshot);
  for (let i = 0; i < keys.length; i++) {
    const val = (snapshot as Record<string, unknown>)[keys[i]];
    if (val && typeof val === 'object') {
      clone[keys[i]] = Object.assign({}, val);
    } else {
      clone[keys[i]] = val;
    }
  }
  return clone as T;
}

export function safeCopy<T extends Record<string, unknown>>(snapshot: T | null | undefined): Readonly<T> | null {
  return deepFreeze(cloneSnapshot(snapshot)) as Readonly<T> | null;
}

export function isFrozen(obj: unknown): boolean {
  return obj ? Object.isFrozen(obj) : false;
}

export function info(): SnapshotFreezeInfo {
  return { moduleId: MODULE_ID, version: VERSION };
}

export default {
  MODULE_ID,
  VERSION,
  deepFreeze,
  freezeSnapshot,
  cloneSnapshot,
  safeCopy,
  isFrozen,
  info
};
