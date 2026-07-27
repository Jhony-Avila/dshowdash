

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-permissions-admin-state-extras
// PURPOSE: Panel Permissions Admin - State Extras
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   getFavorites() — exported function
//   toggleFavorite() — exported function
//   isFavorite() — exported function
//   setFavorites() — exported function
//   getUserNotes() — exported function
//   setUserNote() — exported function
//   getUserNote() — exported function
//   clearUserNotes() — exported function
//   setAllUserNotes() — exported function
//   getUserGroups() — exported function
//   createGroup() — exported function
//   updateGroup() — exported function
//   deleteGroup() — exported function
//   ... and 18 more exports
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

export const MODULE_ID = 'panel-permissions-admin-state-extras';
export const VERSION = '9.3.0-P2-ENTERPRISE';

let _favorites = new Set();
let _userNotes = new Map();
interface UserGroup {
  id: string;
  name: string;
  userIds: (string | number)[];
  createdAt: string;
  updatedAt?: string;
}

let _userGroups: UserGroup[] = [];
let _triggerAliases = new Map<string, string>();
const _initialStreak: { current: number; lastDate: string | null; best: number } = { current: 0, lastDate: null as string | null, best: 0 };
let _streak: { current: number; lastDate: string | null; best: number } = { ..._initialStreak };

// ══════════════════════════════════════════════════════════════
// FAVORITES
// ══════════════════════════════════════════════════════════════

export function getFavorites() {
  return Array.from(_favorites);
}

export function toggleFavorite(odataUserId: string | number) {
  if (_favorites.has(odataUserId)) {
    _favorites.delete(odataUserId);
    return false;
  }
  _favorites.add(odataUserId);
  return true;
}

export function isFavorite(odataUserId: string | number) {
  return _favorites.has(odataUserId);
}

export function setFavorites(list: (string | number)[]) {
  _favorites = new Set(list || []);
}

// ══════════════════════════════════════════════════════════════
// USER NOTES
// ══════════════════════════════════════════════════════════════

export function getUserNotes() {
  const result: Record<string, string> = {};
  for (const [key, value] of _userNotes) {
    result[key] = value;
  }
  return result;
}

export function setUserNote(odataUserId: string | number, note: string) {
  if (!note || note.trim() === '') {
    _userNotes.delete(odataUserId);
  } else {
    _userNotes.set(odataUserId, note.trim());
  }
}

export function getUserNote(odataUserId: string | number) {
  return _userNotes.get(odataUserId) || '';
}

export function clearUserNotes() {
  _userNotes.clear();
}

export function setAllUserNotes(notesObj: Record<string, string> | null) {
  _userNotes.clear();
  if (notesObj && typeof notesObj === 'object') {
    for (const key in notesObj) {
      if (Object.prototype.hasOwnProperty.call(notesObj, key)) {
        _userNotes.set(key, notesObj[key]);
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════
// USER GROUPS
// ══════════════════════════════════════════════════════════════

export function getUserGroups() {
  return _userGroups.slice();
}

export function createGroup(name: string, userIds: (string | number)[] = []) {
  const id = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const group = { id, name, userIds: userIds.slice(), createdAt: new Date().toISOString() };
  _userGroups.push(group);
  return group;
}

export function updateGroup(groupId: string, updates: Partial<UserGroup>) {
  const idx = _userGroups.findIndex(g => g.id === groupId);
  if (idx === -1) return null;
  _userGroups[idx] = { ..._userGroups[idx], ...updates, updatedAt: new Date().toISOString() };
  return _userGroups[idx];
}

export function deleteGroup(groupId: string) {
  const idx = _userGroups.findIndex(g => g.id === groupId);
  if (idx === -1) return false;
  _userGroups.splice(idx, 1);
  return true;
}

export function getUsersByGroup(groupId: string) {
  const group = _userGroups.find(g => g.id === groupId);
  return group ? group.userIds.slice() : [];
}

export function setAllGroups(groups: UserGroup[]) {
  _userGroups = Array.isArray(groups) ? groups.slice() : [];
}

export function addUserToGroup(groupId: string, userId: string | number) {
  const group = _userGroups.find(g => g.id === groupId);
  if (!group) return false;
  if (!group.userIds.includes(userId)) {
    group.userIds.push(userId);
  }
  return true;
}

export function removeUserFromGroup(groupId: string, userId: string | number) {
  const group = _userGroups.find(g => g.id === groupId);
  if (!group) return false;
  const idx = group.userIds.indexOf(userId);
  if (idx !== -1) {
    group.userIds.splice(idx, 1);
  }
  return true;
}

// ══════════════════════════════════════════════════════════════
// TRIGGER ALIASES
// ══════════════════════════════════════════════════════════════

export function getTriggerAliases() {
  const result: Record<string, string> = {};
  for (const [key, value] of _triggerAliases) {
    result[key] = value;
  }
  return result;
}

export function setTriggerAlias(triggerId: string, alias: string) {
  if (!alias || alias.trim() === '') {
    _triggerAliases.delete(triggerId);
  } else {
    _triggerAliases.set(triggerId, alias.trim());
  }
}

export function getTriggerAlias(triggerId: string) {
  return _triggerAliases.get(triggerId) || '';
}

export function clearTriggerAliases() {
  _triggerAliases.clear();
}

export function setAllTriggerAliases(aliasesObj: Record<string, string> | null) {
  _triggerAliases.clear();
  if (aliasesObj && typeof aliasesObj === 'object') {
    for (const key in aliasesObj) {
      if (Object.prototype.hasOwnProperty.call(aliasesObj, key)) {
        _triggerAliases.set(key, aliasesObj[key]);
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════
// STREAK (Gamification)
// ══════════════════════════════════════════════════════════════

export function getStreak() {
  return { ..._streak };
}

export function updateStreak() {
  const today = new Date().toISOString().split('T')[0];
  
  if (_streak.lastDate === today) {
    return _streak;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (_streak.lastDate === yesterdayStr) {
    _streak.current += 1;
  } else {
    _streak.current = 1;
  }
  
  _streak.lastDate = today;
  
  if (_streak.current > _streak.best) {
    _streak.best = _streak.current;
  }
  
  return { ..._streak };
}

export function resetStreak() {
  _streak = { current: 0, lastDate: null, best: _streak.best };
  return { ..._streak };
}

export function setStreak(data: { current?: number; lastDate?: string | null; best?: number } | null) {
  if (data && typeof data === 'object') {
    _streak = {
      current: data.current || 0,
      lastDate: data.lastDate || null,
      best: data.best || 0
    };
  }
}

// ══════════════════════════════════════════════════════════════
// RESET ALL
// ══════════════════════════════════════════════════════════════

export function resetExtras() {
  _favorites.clear();
  _userNotes.clear();
  _userGroups = [];
  _triggerAliases.clear();
  _streak = { current: 0, lastDate: null, best: 0 };
}

// ══════════════════════════════════════════════════════════════
// SERIALIZATION
// ══════════════════════════════════════════════════════════════

export function serializeExtras() {
  return {
    favorites: Array.from(_favorites),
    userNotes: getUserNotes(),
    userGroups: _userGroups.slice(),
    triggerAliases: getTriggerAliases(),
    streak: { ..._streak }
  };
}

export function deserializeExtras(data: Record<string, unknown> | null) {
  if (!data) return;
  if (data.favorites) setFavorites(data.favorites as (string | number)[]);
  if (data.userNotes) setAllUserNotes(data.userNotes as Record<string, string>);
  if (data.userGroups) setAllGroups(data.userGroups as UserGroup[]);
  if (data.triggerAliases) setAllTriggerAliases(data.triggerAliases as Record<string, string>);
  if (data.streak) setStreak(data.streak as { current?: number; lastDate?: string | null; best?: number });
}

// ══════════════════════════════════════════════════════════════
// INFO / HEALTH
// ══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    counts: {
      favorites: _favorites.size,
      userNotes: _userNotes.size,
      userGroups: _userGroups.length,
      triggerAliases: _triggerAliases.size
    },
    streak: { ..._streak }
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      favoritesReady: _favorites instanceof Set,
      userNotesReady: _userNotes instanceof Map,
      userGroupsReady: Array.isArray(_userGroups),
      triggerAliasesReady: _triggerAliases instanceof Map
    }
  };
}

export default {
  MODULE_ID,
  VERSION,
  getFavorites, toggleFavorite, isFavorite, setFavorites,
  getUserNotes, setUserNote, getUserNote, clearUserNotes, setAllUserNotes,
  getUserGroups, createGroup, updateGroup, deleteGroup, getUsersByGroup, setAllGroups, addUserToGroup, removeUserFromGroup,
  getTriggerAliases, setTriggerAlias, getTriggerAlias, clearTriggerAliases, setAllTriggerAliases,
  getStreak, updateStreak, resetStreak, setStreak,
  resetExtras, serializeExtras, deserializeExtras,
  info, healthCheck
};
