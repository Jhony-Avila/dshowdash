import * as Core from "./core.js";
import * as History from "./history.js";
import * as Cache from "./cache.js";
import * as Bulk from "./bulk.js";
import * as Filters from "./filters.js";
import * as Permissions from "./permissions.js";
import * as Compare from "./compare.js";
import * as Extras from "./extras.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-store";
function init(useCache = true) {
  if (Core._isInitialized()) return;
  if (useCache) Cache.applyCacheToState();
  Core.init();
}
function reset() {
  Core.reset();
  History.resetHistory();
  Compare.resetCompare();
  Extras.resetKbdNav();
}
function setUsers(users) {
  Core.setUsers(users);
  Cache.saveToCache();
}
function setTriggers(triggers) {
  Core.setTriggers(triggers);
  Cache.saveToCache();
}
function setRegions(regions) {
  Core.setRegions(regions);
  Cache.saveToCache();
}
function setUserPermissions(userId, permissions) {
  Core.setUserPermissions(userId, permissions);
  Cache.saveToCache();
}
const getState = Core.getState;
const getUsers = Core.getUsers;
const getTriggers = Core.getTriggers;
const getRegions = Core.getRegions;
const getSelectedUserId = Core.getSelectedUserId;
const getSelectedUser = Core.getSelectedUser;
const isLoading = Core.isLoading;
const getError = Core.getError;
const getFilter = Core.getFilter;
const getView = Core.getView;
const getLastSync = Core.getLastSync;
const getUserPermissions = Core.getUserPermissions;
const getSelectedUserPermissions = Core.getSelectedUserPermissions;
const setSelectedUser = Core.setSelectedUser;
const setLoading = Core.setLoading;
const setError = Core.setError;
const setFilter = Core.setFilter;
const setView = Core.setView;
const setLastSync = Core.setLastSync;
const subscribe = Core.subscribe;
const getStats = Core.getStats;
const coreHealthCheck = Core.healthCheck;
const coreInfo = Core.info;
const notify = Core.notify;
const canUndo = History.canUndo;
const canRedo = History.canRedo;
const undo = History.undo;
const redo = History.redo;
const clearHistory = History.clearHistory;
const getUndoCount = History.getUndoCount;
const getRedoCount = History.getRedoCount;
const getHistoryInfo = History.getHistoryInfo;
const saveToCache = Cache.saveToCache;
const loadFromCache = Cache.loadFromCache;
const clearCache = Cache.clearCache;
const getCacheAge = Cache.getCacheAge;
const isCacheValid = Cache.isCacheValid;
const getCacheTTL = Cache.getCacheTTL;
const getSavedFilters = Cache.getSavedFilters;
const saveFilter = Cache.saveFilter;
const removeSavedFilter = Cache.removeSavedFilter;
const getBulkSelection = Bulk.getBulkSelection;
const getBulkCount = Bulk.getBulkCount;
const isBulkMode = Bulk.isBulkMode;
const setBulkMode = Bulk.setBulkMode;
const toggleBulkMode = Bulk.toggleBulkMode;
const addToBulk = Bulk.addToBulk;
const removeFromBulk = Bulk.removeFromBulk;
const toggleBulkItem = Bulk.toggleBulkItem;
const selectAllBulk = Bulk.selectAllBulk;
const clearBulk = Bulk.clearBulk;
const bulkGrant = Bulk.bulkGrant;
const bulkRevoke = Bulk.bulkRevoke;
const getUserFilter = Filters.getUserFilter;
const setUserFilter = Filters.setUserFilter;
const getFilteredUsers = Filters.getFilteredUsers;
const getFilteredTriggers = Filters.getFilteredTriggers;
const getFilteredRegions = Filters.getFilteredRegions;
const getTriggerAreas = Filters.getTriggerAreas;
function applySavedFilter(id) {
  return Filters.applySavedFilter(id, Cache.getSavedFilters());
}
const addTriggerPermission = Permissions.addTriggerPermission;
const removeTriggerPermission = Permissions.removeTriggerPermission;
const toggleTriggerPermission = Permissions.toggleTriggerPermission;
const addRegionPermission = Permissions.addRegionPermission;
const removeRegionPermission = Permissions.removeRegionPermission;
const toggleRegionPermission = Permissions.toggleRegionPermission;
const grantAllTriggers = Permissions.grantAllTriggers;
const revokeAllTriggers = Permissions.revokeAllTriggers;
const clonePermissions = Permissions.clonePermissions;
const isSensitiveTrigger = Permissions.isSensitiveTrigger;
const getSensitiveTriggers = Permissions.getSensitiveTriggers;
const isCompareMode = Compare.isCompareMode;
const getCompareUserA = Compare.getCompareUserA;
const getCompareUserB = Compare.getCompareUserB;
const setCompareMode = Compare.setCompareMode;
const setCompareUsers = Compare.setCompareUsers;
const toggleCompareUser = Compare.toggleCompareUser;
const getCompareData = Compare.getCompareData;
const addActivity = Extras.addActivity;
const getActivities = Extras.getActivities;
const getUserActivities = Extras.getUserActivities;
const clearActivities = Extras.clearActivities;
const isKbdNavEnabled = Extras.isKbdNavEnabled;
const getKbdFocusIndex = Extras.getKbdFocusIndex;
const getKbdFocusArea = Extras.getKbdFocusArea;
const setKbdNav = Extras.setKbdNav;
const setKbdFocus = Extras.setKbdFocus;
const moveKbdFocus = Extras.moveKbdFocus;
const getFavorites = Extras.getFavorites;
const toggleFavorite = Extras.toggleFavorite;
const isFavorite = Extras.isFavorite;
const getUserNotes = Extras.getUserNotes;
const setUserNote = Extras.setUserNote;
const getUserNote = Extras.getUserNote;
const getUserGroups = Extras.getUserGroups;
const createGroup = Extras.createGroup;
const updateGroup = Extras.updateGroup;
const deleteGroup = Extras.deleteGroup;
const getUsersByGroup = Extras.getUsersByGroup;
const getTriggerAliases = Extras.getTriggerAliases;
const setTriggerAlias = Extras.setTriggerAlias;
const getTriggerAlias = Extras.getTriggerAlias;
const getStreak = Extras.getStreak;
const updateStreak = Extras.updateStreak;
const getReportByArea = Extras.getReportByArea;
const getReportByUser = Extras.getReportByUser;
function healthCheck() {
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
function info() {
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
const Store = {
  init,
  reset,
  getState,
  getUsers,
  getTriggers,
  getRegions,
  getSelectedUserId,
  getSelectedUser,
  isLoading,
  getError,
  getFilter,
  getView,
  getUserPermissions,
  getSelectedUserPermissions,
  setUsers,
  setTriggers,
  setRegions,
  setSelectedUser,
  setLoading,
  setError,
  setFilter,
  setView,
  setUserPermissions,
  setLastSync,
  addTriggerPermission,
  removeTriggerPermission,
  addRegionPermission,
  removeRegionPermission,
  toggleTriggerPermission,
  toggleRegionPermission,
  grantAllTriggers,
  revokeAllTriggers,
  subscribe,
  getFilteredTriggers,
  getFilteredRegions,
  getFilteredUsers,
  getTriggerAreas,
  getStats,
  canUndo,
  canRedo,
  undo,
  redo,
  clearHistory,
  getUndoCount,
  getRedoCount,
  saveToCache,
  loadFromCache,
  clearCache,
  getCacheAge,
  isCacheValid,
  getBulkSelection,
  getBulkCount,
  isBulkMode,
  setBulkMode,
  toggleBulkMode,
  addToBulk,
  removeFromBulk,
  toggleBulkItem,
  selectAllBulk,
  clearBulk,
  bulkGrant,
  bulkRevoke,
  getUserFilter,
  setUserFilter,
  healthCheck,
  info,
  VERSION,
  MODULE_ID,
  addActivity,
  getActivities,
  getUserActivities,
  clearActivities,
  isCompareMode,
  getCompareUserA,
  getCompareUserB,
  setCompareMode,
  setCompareUsers,
  toggleCompareUser,
  getCompareData,
  isKbdNavEnabled,
  getKbdFocusIndex,
  getKbdFocusArea,
  setKbdNav,
  setKbdFocus,
  moveKbdFocus,
  getSavedFilters,
  saveFilter,
  removeSavedFilter,
  applySavedFilter,
  isSensitiveTrigger,
  getSensitiveTriggers,
  getReportByArea,
  getReportByUser,
  getFavorites,
  toggleFavorite,
  isFavorite,
  getUserNotes,
  setUserNote,
  getUserNote,
  clonePermissions,
  getUserGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getUsersByGroup,
  getTriggerAliases,
  setTriggerAlias,
  getTriggerAlias,
  getStreak,
  updateStreak
};
var state_default = Store;
export {
  MODULE_ID,
  Store,
  VERSION,
  addActivity,
  addRegionPermission,
  addToBulk,
  addTriggerPermission,
  applySavedFilter,
  bulkGrant,
  bulkRevoke,
  canRedo,
  canUndo,
  clearActivities,
  clearBulk,
  clearCache,
  clearHistory,
  clonePermissions,
  coreHealthCheck,
  coreInfo,
  createGroup,
  state_default as default,
  deleteGroup,
  getActivities,
  getBulkCount,
  getBulkSelection,
  getCacheAge,
  getCacheTTL,
  getCompareData,
  getCompareUserA,
  getCompareUserB,
  getError,
  getFavorites,
  getFilter,
  getFilteredRegions,
  getFilteredTriggers,
  getFilteredUsers,
  getHistoryInfo,
  getKbdFocusArea,
  getKbdFocusIndex,
  getLastSync,
  getRedoCount,
  getRegions,
  getReportByArea,
  getReportByUser,
  getSavedFilters,
  getSelectedUser,
  getSelectedUserId,
  getSelectedUserPermissions,
  getSensitiveTriggers,
  getState,
  getStats,
  getStreak,
  getTriggerAlias,
  getTriggerAliases,
  getTriggerAreas,
  getTriggers,
  getUndoCount,
  getUserActivities,
  getUserFilter,
  getUserGroups,
  getUserNote,
  getUserNotes,
  getUserPermissions,
  getUsers,
  getUsersByGroup,
  getView,
  grantAllTriggers,
  healthCheck,
  info,
  init,
  isBulkMode,
  isCacheValid,
  isCompareMode,
  isFavorite,
  isKbdNavEnabled,
  isLoading,
  isSensitiveTrigger,
  loadFromCache,
  moveKbdFocus,
  notify,
  redo,
  removeFromBulk,
  removeRegionPermission,
  removeSavedFilter,
  removeTriggerPermission,
  reset,
  revokeAllTriggers,
  saveFilter,
  saveToCache,
  selectAllBulk,
  setBulkMode,
  setCompareMode,
  setCompareUsers,
  setError,
  setFilter,
  setKbdFocus,
  setKbdNav,
  setLastSync,
  setLoading,
  setRegions,
  setSelectedUser,
  setTriggerAlias,
  setTriggers,
  setUserFilter,
  setUserNote,
  setUserPermissions,
  setUsers,
  setView,
  subscribe,
  toggleBulkItem,
  toggleBulkMode,
  toggleCompareUser,
  toggleFavorite,
  toggleRegionPermission,
  toggleTriggerPermission,
  undo,
  updateGroup,
  updateStreak
};
