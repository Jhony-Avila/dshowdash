// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ES6)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   Core from ./core.js (state, getters, setters, subscribe, healthCheck, info)
//   History from ./history.js (undo/redo)
//   Cache from ./cache.js (persistence, saved filters)
//   Bulk from ./bulk.js (bulk selection/operations)
//   Filters from ./filters.js (filtering logic)
//   Permissions from ./permissions.js (trigger/region permissions)
//   Compare from ./compare.js (user comparison mode)
//   Extras from ./extras.js (activities, kbd nav, favorites, notes, groups, aliases, streaks, reports)
//
// PROVIDES: Store orchestrator (80+ re-exports): init/reset,
//   getState/getUsers/getTriggers/getRegions/setUsers/setTriggers/setRegions/
//   setUserPermissions/subscribe, undo/redo/clearHistory,
//   saveToCache/loadFromCache/clearCache, getBulkSelection/setBulkMode/
//   addToBulk/removeFromBulk/bulkGrant/bulkRevoke,
//   getFilteredUsers/getFilteredTriggers/getFilteredRegions/applySavedFilter,
//   add/remove/toggleTriggerPermission, add/remove/toggleRegionPermission,
//   grantAllTriggers/revokeAllTriggers/clonePermissions,
//   isCompareMode/setCompareMode/setCompareUsers/toggleCompareUser/getCompareData,
//   addActivity/getActivities/clearActivities,
//   isKbdNavEnabled/setKbdNav/setKbdFocus/moveKbdFocus,
//   getFavorites/toggleFavorite/isFavorite,
//   getUserNotes/setUserNote/getUserNote,
//   getUserGroups/createGroup/updateGroup/deleteGroup/getUsersByGroup,
//   getTriggerAliases/setTriggerAlias/getTriggerAlias,
//   getStreak/updateStreak, getReportByArea/getReportByUser,
//   healthCheck/info, Store (backward compat), VERSION, MODULE_ID
//
// BROWSER APIs (legítimo — cache persistence):
//   localStorage (via Cache module)
// ═══════════════════════════════════════════════════════════════
// UARPS Admin - State Store (Orchestrator)
// @version 8.2.0-ES6
// @changelog v8.2.0-ES6 - var→const migration
// Módulo orquestrador - reexporta todas as funcionalidades
'use strict';

import * as Core from './core.js';
import * as History from './history.js';
import * as Cache from './cache.js';
import * as Bulk from './bulk.js';
import * as Filters from './filters.js';
import * as Permissions from './permissions.js';
import * as Compare from './compare.js';
import * as Extras from './extras.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-store';

// === INIT COM CACHE ===
export function init(useCache = true) {
  if (Core._isInitialized()) return;
  if (useCache) Cache.applyCacheToState();
  Core.init();
}

export function reset() {
  Core.reset();
  History.resetHistory();
  Compare.resetCompare();

  // @ts-expect-error TS migration - TS2339
  Extras.resetKbdNav();
}

// === SETTERS COM CACHE ===
export function setUsers(users: Record<string, unknown>[]) { Core.setUsers(users); Cache.saveToCache(); }
export function setTriggers(triggers: Record<string, unknown>[]) { Core.setTriggers(triggers); Cache.saveToCache(); }
export function setRegions(regions: Record<string, unknown>[]) { Core.setRegions(regions); Cache.saveToCache(); }
export function setUserPermissions(userId: string | number, permissions: { triggers?: string[]; regions?: string[] }) { Core.setUserPermissions(userId, permissions); Cache.saveToCache(); }

// === RE-EXPORTS CORE ===
export const getState = Core.getState;
export const getUsers = Core.getUsers;
export const getTriggers = Core.getTriggers;
export const getRegions = Core.getRegions;
export const getSelectedUserId = Core.getSelectedUserId;
export const getSelectedUser = Core.getSelectedUser;
export const isLoading = Core.isLoading;
export const getError = Core.getError;
export const getFilter = Core.getFilter;
export const getView = Core.getView;
export const getLastSync = Core.getLastSync;
export const getUserPermissions = Core.getUserPermissions;
export const getSelectedUserPermissions = Core.getSelectedUserPermissions;
export const setSelectedUser = Core.setSelectedUser;
export const setLoading = Core.setLoading;
export const setError = Core.setError;
export const setFilter = Core.setFilter;
export const setView = Core.setView;
export const setLastSync = Core.setLastSync;
export const subscribe = Core.subscribe;
export const getStats = Core.getStats;
export const coreHealthCheck = Core.healthCheck;
export const coreInfo = Core.info;
export const notify = Core.notify;

// === RE-EXPORTS HISTORY ===
export const canUndo = History.canUndo;
export const canRedo = History.canRedo;
export const undo = History.undo;
export const redo = History.redo;
export const clearHistory = History.clearHistory;
export const getUndoCount = History.getUndoCount;
export const getRedoCount = History.getRedoCount;
export const getHistoryInfo = History.getHistoryInfo;

// === RE-EXPORTS CACHE ===
export const saveToCache = Cache.saveToCache;
export const loadFromCache = Cache.loadFromCache;
export const clearCache = Cache.clearCache;
export const getCacheAge = Cache.getCacheAge;
export const isCacheValid = Cache.isCacheValid;
export const getCacheTTL = Cache.getCacheTTL;
export const getSavedFilters = Cache.getSavedFilters;
export const saveFilter = Cache.saveFilter;
export const removeSavedFilter = Cache.removeSavedFilter;

// === RE-EXPORTS BULK ===
export const getBulkSelection = Bulk.getBulkSelection;
export const getBulkCount = Bulk.getBulkCount;
export const isBulkMode = Bulk.isBulkMode;
export const setBulkMode = Bulk.setBulkMode;
export const toggleBulkMode = Bulk.toggleBulkMode;
export const addToBulk = Bulk.addToBulk;
export const removeFromBulk = Bulk.removeFromBulk;
export const toggleBulkItem = Bulk.toggleBulkItem;
export const selectAllBulk = Bulk.selectAllBulk;
export const clearBulk = Bulk.clearBulk;
export const bulkGrant = Bulk.bulkGrant;
export const bulkRevoke = Bulk.bulkRevoke;

// === RE-EXPORTS FILTERS ===
export const getUserFilter = Filters.getUserFilter;
export const setUserFilter = Filters.setUserFilter;
export const getFilteredUsers = Filters.getFilteredUsers;
export const getFilteredTriggers = Filters.getFilteredTriggers;
export const getFilteredRegions = Filters.getFilteredRegions;
export const getTriggerAreas = Filters.getTriggerAreas;

export function applySavedFilter(id: number | string) {
  return Filters.applySavedFilter(id, Cache.getSavedFilters());
}

// === RE-EXPORTS PERMISSIONS ===
export const addTriggerPermission = Permissions.addTriggerPermission;
export const removeTriggerPermission = Permissions.removeTriggerPermission;
export const toggleTriggerPermission = Permissions.toggleTriggerPermission;
export const addRegionPermission = Permissions.addRegionPermission;
export const removeRegionPermission = Permissions.removeRegionPermission;
export const toggleRegionPermission = Permissions.toggleRegionPermission;
export const grantAllTriggers = Permissions.grantAllTriggers;
export const revokeAllTriggers = Permissions.revokeAllTriggers;
export const clonePermissions = Permissions.clonePermissions;
export const isSensitiveTrigger = Permissions.isSensitiveTrigger;
export const getSensitiveTriggers = Permissions.getSensitiveTriggers;

// === RE-EXPORTS COMPARE ===
export const isCompareMode = Compare.isCompareMode;
export const getCompareUserA = Compare.getCompareUserA;
export const getCompareUserB = Compare.getCompareUserB;
export const setCompareMode = Compare.setCompareMode;
export const setCompareUsers = Compare.setCompareUsers;
export const toggleCompareUser = Compare.toggleCompareUser;
export const getCompareData = Compare.getCompareData;

// === RE-EXPORTS EXTRAS ===

// @ts-expect-error TS migration - TS2339
export const addActivity = Extras.addActivity;

// @ts-expect-error TS migration - TS2339
export const getActivities = Extras.getActivities;

// @ts-expect-error TS migration - TS2339
export const getUserActivities = Extras.getUserActivities;

// @ts-expect-error TS migration - TS2339
export const clearActivities = Extras.clearActivities;

// @ts-expect-error TS migration - TS2339
export const isKbdNavEnabled = Extras.isKbdNavEnabled;

// @ts-expect-error TS migration - TS2339
export const getKbdFocusIndex = Extras.getKbdFocusIndex;

// @ts-expect-error TS migration - TS2339
export const getKbdFocusArea = Extras.getKbdFocusArea;

// @ts-expect-error TS migration - TS2339
export const setKbdNav = Extras.setKbdNav;

// @ts-expect-error TS migration - TS2339
export const setKbdFocus = Extras.setKbdFocus;

// @ts-expect-error TS migration - TS2339
export const moveKbdFocus = Extras.moveKbdFocus;
export const getFavorites = Extras.getFavorites;
export const toggleFavorite = Extras.toggleFavorite;
export const isFavorite = Extras.isFavorite;
export const getUserNotes = Extras.getUserNotes;
export const setUserNote = Extras.setUserNote;
export const getUserNote = Extras.getUserNote;
export const getUserGroups = Extras.getUserGroups;
export const createGroup = Extras.createGroup;
export const updateGroup = Extras.updateGroup;
export const deleteGroup = Extras.deleteGroup;
export const getUsersByGroup = Extras.getUsersByGroup;
export const getTriggerAliases = Extras.getTriggerAliases;
export const setTriggerAlias = Extras.setTriggerAlias;
export const getTriggerAlias = Extras.getTriggerAlias;
export const getStreak = Extras.getStreak;
export const updateStreak = Extras.updateStreak;

// @ts-expect-error TS migration - TS2339
export const getReportByArea = Extras.getReportByArea;

// @ts-expect-error TS migration - TS2339
export const getReportByUser = Extras.getReportByUser;

// === DIAGNOSTICS ===
export function healthCheck() {
  const core = Core.healthCheck();
  return {
    status: core.status,
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: core.initialized,
    undoCount: History.getUndoCount(),
    redoCount: History.getRedoCount(),
    cacheValid: Cache.isCacheValid(),
    bulkCount: Bulk.getBulkCount(),
    compareMode: Compare.isCompareMode()
  };
}

export function info() {
  const core = Core.info();
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: core.initialized,

    // @ts-expect-error TS migration - TS2339
    usersCount: core.usersCount,

    // @ts-expect-error TS migration - TS2339
    triggersCount: core.triggersCount,

    // @ts-expect-error TS migration - TS2339
    regionsCount: core.regionsCount,
    history: History.getHistoryInfo(),
    cache: { valid: Cache.isCacheValid(), age: Cache.getCacheAge(), ttl: Cache.getCacheTTL() },
    bulk: { mode: Bulk.isBulkMode(), count: Bulk.getBulkCount() }
  };
}

// === STORE OBJECT (BACKWARD COMPATIBILITY) ===
export const Store = {
  init, reset,
  getState, getUsers, getTriggers, getRegions,
  getSelectedUserId, getSelectedUser, isLoading, getError, getFilter, getView,
  getUserPermissions, getSelectedUserPermissions,
  setUsers, setTriggers, setRegions, setSelectedUser,
  setLoading, setError, setFilter, setView, setUserPermissions, setLastSync,
  addTriggerPermission, removeTriggerPermission,
  addRegionPermission, removeRegionPermission,
  toggleTriggerPermission, toggleRegionPermission,
  grantAllTriggers, revokeAllTriggers,
  subscribe,
  getFilteredTriggers, getFilteredRegions, getFilteredUsers, getTriggerAreas, getStats,
  canUndo, canRedo, undo, redo, clearHistory, getUndoCount, getRedoCount,
  saveToCache, loadFromCache, clearCache, getCacheAge, isCacheValid,
  getBulkSelection, getBulkCount, isBulkMode, setBulkMode, toggleBulkMode,
  addToBulk, removeFromBulk, toggleBulkItem, selectAllBulk, clearBulk,
  bulkGrant, bulkRevoke,
  getUserFilter, setUserFilter,
  healthCheck, info,
  VERSION, MODULE_ID,
  addActivity, getActivities, getUserActivities, clearActivities,
  isCompareMode, getCompareUserA, getCompareUserB,
  setCompareMode, setCompareUsers, toggleCompareUser, getCompareData,
  isKbdNavEnabled, getKbdFocusIndex, getKbdFocusArea,
  setKbdNav, setKbdFocus, moveKbdFocus,
  getSavedFilters, saveFilter, removeSavedFilter, applySavedFilter,
  isSensitiveTrigger, getSensitiveTriggers,
  getReportByArea, getReportByUser,
  getFavorites, toggleFavorite, isFavorite,
  getUserNotes, setUserNote, getUserNote,
  clonePermissions,
  getUserGroups, createGroup, updateGroup, deleteGroup, getUsersByGroup,
  getTriggerAliases, setTriggerAlias, getTriggerAlias,
  getStreak, updateStreak
};

export default Store;
