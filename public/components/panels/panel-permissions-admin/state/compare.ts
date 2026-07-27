// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-compare
// PURPOSE: UARPS Admin - Compare Mode
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   _getState, notify, getUserPermissions from ./core.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isCompareMode() — exported function
//   getCompareUserA() — exported function
//   getCompareUserB() — exported function
//   setCompareMode() — exported function
//   setCompareUsers() — exported function
//   toggleCompareUser() — exported function
//   getCompareData() — exported function
//   resetCompare() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { _getState, notify, getUserPermissions } from './core.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-compare';

let _compareMode = false;
let _compareUserA: string | number | null = null;
let _compareUserB: string | number | null = null;

export function isCompareMode() { return _compareMode; }
export function getCompareUserA() { return _compareUserA; }
export function getCompareUserB() { return _compareUserB; }

export function setCompareMode(enabled: boolean) { _compareMode = !!enabled; if (!enabled) { _compareUserA = null; _compareUserB = null; } notify('compare'); }
export function setCompareUsers(userIdA: string | number | null, userIdB: string | number | null) { _compareUserA = userIdA; _compareUserB = userIdB; _compareMode = !!(userIdA && userIdB); notify('compare'); }

export function toggleCompareUser(userId: string | number) {
  if (!_compareUserA) { _compareUserA = userId; }
  else if (_compareUserA === userId) { _compareUserA = _compareUserB; _compareUserB = null; }
  else if (!_compareUserB) { _compareUserB = userId; _compareMode = true; }
  else if (_compareUserB === userId) { _compareUserB = null; _compareMode = false; }
  notify('compare');
}

export function getCompareData() {
  if (!_compareMode || !_compareUserA || !_compareUserB) return null;
  const state = _getState();
  const permsA = getUserPermissions(_compareUserA);
  const permsB = getUserPermissions(_compareUserB);
  let userA = null; let userB = null;
  for (let i = 0; i < state.users.length; i++) { if (String(state.users[i].id) === String(_compareUserA)) userA = state.users[i]; if (String(state.users[i].id) === String(_compareUserB)) userB = state.users[i]; }
  const triggersA: Record<string, boolean> = {}; permsA.triggers.forEach((t: string) => { triggersA[t] = true; });
  const triggersB: Record<string, boolean> = {}; permsB.triggers.forEach((t: string) => { triggersB[t] = true; });
  const onlyA: string[] = []; const onlyB: string[] = []; const both: string[] = []; const neither: string[] = [];
  permsA.triggers.forEach((t: string) => { if (!triggersB[t]) onlyA.push(t); else both.push(t); });
  permsB.triggers.forEach((t: string) => { if (!triggersA[t]) onlyB.push(t); });
  state.triggers.forEach((t: Record<string, unknown>) => { if (!triggersA[t.id as string] && !triggersB[t.id as string]) neither.push(t.id as string); });
  return { userA: { id: _compareUserA, name: userA ? userA.nome || userA.name : '', triggers: permsA.triggers }, userB: { id: _compareUserB, name: userB ? userB.nome || userB.name : '', triggers: permsB.triggers }, onlyA, onlyB, both, neither, stats: { onlyA: onlyA.length, onlyB: onlyB.length, both: both.length, neither: neither.length } };
}

export function resetCompare() { _compareMode = false; _compareUserA = null; _compareUserB = null; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { compareModeReady: typeof getCompareData === 'function' } }; }
