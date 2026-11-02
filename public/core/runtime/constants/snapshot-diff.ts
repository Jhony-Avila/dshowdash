// Migrado para TypeScript: 2026-02-25
// Snapshot Diff - Comparar snapshots para detectar mudancas
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// @version 1.0.0
// @description Diff entre snapshots para handlers decidirem se precisam reagir
// @melhoria #21 - Handlers reagem a updates sem mudanca real
'use strict';

export const MODULE_ID = 'snapshot-diff' as const;
export const VERSION = '1.0.0' as const;

interface FieldChange {
  from: unknown;
  to: unknown;
}

interface DiffResult {
  changed: boolean;
  changes: Record<string, FieldChange | boolean>;
}

interface SnapshotDiffInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
}

export function diff(oldSnap: Record<string, unknown> | null | undefined, newSnap: Record<string, unknown> | null | undefined): DiffResult {
  if (!oldSnap && !newSnap) return { changed: false, changes: {} };
  if (!oldSnap) return { changed: true, changes: { _initial: true } };
  if (!newSnap) return { changed: true, changes: { _removed: true } };

  const changes: Record<string, FieldChange> = {};
  const allKeys: Record<string, boolean> = {};
  const oKeys = Object.keys(oldSnap);
  const nKeys = Object.keys(newSnap);
  let i: number;
  for (i = 0; i < oKeys.length; i++) allKeys[oKeys[i]] = true;
  for (i = 0; i < nKeys.length; i++) allKeys[nKeys[i]] = true;

  const keys = Object.keys(allKeys);
  for (i = 0; i < keys.length; i++) {
    const k = keys[i];
    const oldVal = oldSnap[k];
    const newVal = newSnap[k];
    if (oldVal !== newVal) {
      if (typeof oldVal === 'object' && typeof newVal === 'object') {
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes[k] = { from: oldVal, to: newVal };
        }
      } else {
        changes[k] = { from: oldVal, to: newVal };
      }
    }
  }

  return {
    changed: Object.keys(changes).length > 0,
    changes
  };
}

export function hasChanged(oldSnap: Record<string, unknown> | null | undefined, newSnap: Record<string, unknown> | null | undefined, fields?: string[]): boolean {
  if (!fields || fields.length === 0) return diff(oldSnap, newSnap).changed;
  if (!oldSnap || !newSnap) return true;
  for (let i = 0; i < fields.length; i++) {
    if (oldSnap[fields[i]] !== newSnap[fields[i]]) return true;
  }
  return false;
}

export function modeChanged(oldSnap: Record<string, unknown> | null | undefined, newSnap: Record<string, unknown> | null | undefined): boolean {
  return hasChanged(oldSnap, newSnap, ['mode']);
}

export function authChanged(oldSnap: Record<string, unknown> | null | undefined, newSnap: Record<string, unknown> | null | undefined): boolean {
  return hasChanged(oldSnap, newSnap, ['authenticated', 'authLevel']);
}

export function healthChanged(oldSnap: Record<string, unknown> | null | undefined, newSnap: Record<string, unknown> | null | undefined): boolean {
  return hasChanged(oldSnap, newSnap, ['healthy', 'healthScore']);
}

export function info(): SnapshotDiffInfo {
  return { moduleId: MODULE_ID, version: VERSION };
}

export default {
  MODULE_ID,
  VERSION,
  diff,
  hasChanged,
  modeChanged,
  authChanged,
  healthChanged,
  info
};
