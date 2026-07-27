const MODULE_ID = "panel-permissions-admin-state-extras";
const VERSION = "9.3.0-P2-ENTERPRISE";
let _favorites = /* @__PURE__ */ new Set();
let _userNotes = /* @__PURE__ */ new Map();
let _userGroups = [];
let _triggerAliases = /* @__PURE__ */ new Map();
const _initialStreak = { current: 0, lastDate: null, best: 0 };
let _streak = { ..._initialStreak };
function getFavorites() {
  return Array.from(_favorites);
}
function toggleFavorite(odataUserId) {
  if (_favorites.has(odataUserId)) {
    _favorites.delete(odataUserId);
    return false;
  }
  _favorites.add(odataUserId);
  return true;
}
function isFavorite(odataUserId) {
  return _favorites.has(odataUserId);
}
function setFavorites(list) {
  _favorites = new Set(list || []);
}
function getUserNotes() {
  const result = {};
  for (const [key, value] of _userNotes) {
    result[key] = value;
  }
  return result;
}
function setUserNote(odataUserId, note) {
  if (!note || note.trim() === "") {
    _userNotes.delete(odataUserId);
  } else {
    _userNotes.set(odataUserId, note.trim());
  }
}
function getUserNote(odataUserId) {
  return _userNotes.get(odataUserId) || "";
}
function clearUserNotes() {
  _userNotes.clear();
}
function setAllUserNotes(notesObj) {
  _userNotes.clear();
  if (notesObj && typeof notesObj === "object") {
    for (const key in notesObj) {
      if (Object.prototype.hasOwnProperty.call(notesObj, key)) {
        _userNotes.set(key, notesObj[key]);
      }
    }
  }
}
function getUserGroups() {
  return _userGroups.slice();
}
function createGroup(name, userIds = []) {
  const id = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const group = { id, name, userIds: userIds.slice(), createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  _userGroups.push(group);
  return group;
}
function updateGroup(groupId, updates) {
  const idx = _userGroups.findIndex((g) => g.id === groupId);
  if (idx === -1) return null;
  _userGroups[idx] = { ..._userGroups[idx], ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  return _userGroups[idx];
}
function deleteGroup(groupId) {
  const idx = _userGroups.findIndex((g) => g.id === groupId);
  if (idx === -1) return false;
  _userGroups.splice(idx, 1);
  return true;
}
function getUsersByGroup(groupId) {
  const group = _userGroups.find((g) => g.id === groupId);
  return group ? group.userIds.slice() : [];
}
function setAllGroups(groups) {
  _userGroups = Array.isArray(groups) ? groups.slice() : [];
}
function addUserToGroup(groupId, userId) {
  const group = _userGroups.find((g) => g.id === groupId);
  if (!group) return false;
  if (!group.userIds.includes(userId)) {
    group.userIds.push(userId);
  }
  return true;
}
function removeUserFromGroup(groupId, userId) {
  const group = _userGroups.find((g) => g.id === groupId);
  if (!group) return false;
  const idx = group.userIds.indexOf(userId);
  if (idx !== -1) {
    group.userIds.splice(idx, 1);
  }
  return true;
}
function getTriggerAliases() {
  const result = {};
  for (const [key, value] of _triggerAliases) {
    result[key] = value;
  }
  return result;
}
function setTriggerAlias(triggerId, alias) {
  if (!alias || alias.trim() === "") {
    _triggerAliases.delete(triggerId);
  } else {
    _triggerAliases.set(triggerId, alias.trim());
  }
}
function getTriggerAlias(triggerId) {
  return _triggerAliases.get(triggerId) || "";
}
function clearTriggerAliases() {
  _triggerAliases.clear();
}
function setAllTriggerAliases(aliasesObj) {
  _triggerAliases.clear();
  if (aliasesObj && typeof aliasesObj === "object") {
    for (const key in aliasesObj) {
      if (Object.prototype.hasOwnProperty.call(aliasesObj, key)) {
        _triggerAliases.set(key, aliasesObj[key]);
      }
    }
  }
}
function getStreak() {
  return { ..._streak };
}
function updateStreak() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  if (_streak.lastDate === today) {
    return _streak;
  }
  const yesterday = /* @__PURE__ */ new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
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
function resetStreak() {
  _streak = { current: 0, lastDate: null, best: _streak.best };
  return { ..._streak };
}
function setStreak(data) {
  if (data && typeof data === "object") {
    _streak = {
      current: data.current || 0,
      lastDate: data.lastDate || null,
      best: data.best || 0
    };
  }
}
function resetExtras() {
  _favorites.clear();
  _userNotes.clear();
  _userGroups = [];
  _triggerAliases.clear();
  _streak = { current: 0, lastDate: null, best: 0 };
}
function serializeExtras() {
  return {
    favorites: Array.from(_favorites),
    userNotes: getUserNotes(),
    userGroups: _userGroups.slice(),
    triggerAliases: getTriggerAliases(),
    streak: { ..._streak }
  };
}
function deserializeExtras(data) {
  if (!data) return;
  if (data.favorites) setFavorites(data.favorites);
  if (data.userNotes) setAllUserNotes(data.userNotes);
  if (data.userGroups) setAllGroups(data.userGroups);
  if (data.triggerAliases) setAllTriggerAliases(data.triggerAliases);
  if (data.streak) setStreak(data.streak);
}
function info() {
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
function healthCheck() {
  return {
    status: "HEALTHY",
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
var extras_default = {
  MODULE_ID,
  VERSION,
  getFavorites,
  toggleFavorite,
  isFavorite,
  setFavorites,
  getUserNotes,
  setUserNote,
  getUserNote,
  clearUserNotes,
  setAllUserNotes,
  getUserGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getUsersByGroup,
  setAllGroups,
  addUserToGroup,
  removeUserFromGroup,
  getTriggerAliases,
  setTriggerAlias,
  getTriggerAlias,
  clearTriggerAliases,
  setAllTriggerAliases,
  getStreak,
  updateStreak,
  resetStreak,
  setStreak,
  resetExtras,
  serializeExtras,
  deserializeExtras,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  addUserToGroup,
  clearTriggerAliases,
  clearUserNotes,
  createGroup,
  extras_default as default,
  deleteGroup,
  deserializeExtras,
  getFavorites,
  getStreak,
  getTriggerAlias,
  getTriggerAliases,
  getUserGroups,
  getUserNote,
  getUserNotes,
  getUsersByGroup,
  healthCheck,
  info,
  isFavorite,
  removeUserFromGroup,
  resetExtras,
  resetStreak,
  serializeExtras,
  setAllGroups,
  setAllTriggerAliases,
  setAllUserNotes,
  setFavorites,
  setStreak,
  setTriggerAlias,
  setUserNote,
  toggleFavorite,
  updateGroup,
  updateStreak
};
