import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
import { DEFAULT_AVATAR_CONFIG, AVATAR_TYPES, AVATAR_EVENTS } from "./constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences.avatar.state";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const initialState = { current: null, editing: null, isLoading: false, isSaving: false, isEditorOpen: false, error: null, lastError: null, history: [], loadedAt: null, savedAt: null, editCount: 0, saveCount: 0 };
let state = { ...initialState };
const _emit = (event, data = {}) => {
  const eb = _getPort("eventBus");
  eb?.emit?.(event, { source: MODULE_ID, timestamp: Date.now(), ...data });
};
const _track = (event, data = {}) => {
  const eb = _getPort("eventBus");
  eb?.emit?.(TELEMETRY_INTENTS.TRACK, { event, module: MODULE_ID, timestamp: Date.now(), ...data });
};
const getState = () => ({ ...state });
const getCurrent = () => state.current ? { ...state.current } : null;
const getEditing = () => state.editing ? { ...state.editing } : null;
const getHistory = () => state.history.slice();
const isLoading = () => state.isLoading;
const isSaving = () => state.isSaving;
const isEditorOpen = () => state.isEditorOpen;
const getError = () => state.error;
const hasAvatar = () => state.current && state.current.type !== AVATAR_TYPES.FALLBACK;
const getAvatarType = () => state.current?.type ?? AVATAR_TYPES.FALLBACK;
const getRenderConfig = () => {
  if (!state.current) return { ...DEFAULT_AVATAR_CONFIG };
  if (state.current.type === AVATAR_TYPES.GENERATED) return state.current.config ? { ...state.current.config } : { ...DEFAULT_AVATAR_CONFIG };
  if (state.current.type === AVATAR_TYPES.IMAGE) return { type: "image", url: state.current.imageUrl };
  return { type: "fallback", initials: state.current.initials || "??", backgroundColor: state.current.backgroundColor || "#7c3aed" };
};
const setCurrent = (avatar) => {
  _initPorts();
  state.current = avatar ? { ...avatar } : null;
  state.loadedAt = Date.now();
  state.error = null;
  _emit(AVATAR_EVENTS.LOADED, { avatar: state.current });
  _track("avatar:loaded", { type: avatar?.type ?? null });
};
const setEditing = (config) => {
  state.editing = config ? { ...config } : null;
  state.editCount++;
  _emit(AVATAR_EVENTS.PREVIEW_CHANGED, { config: state.editing });
};
const updateEditing = (partial) => {
  if (!state.editing) state.editing = { ...DEFAULT_AVATAR_CONFIG };
  state.editing = { ...state.editing, ...partial };
  _emit(AVATAR_EVENTS.PREVIEW_CHANGED, { config: state.editing });
  _track("avatar:option:selected", { changed: Object.keys(partial) });
};
const setLoading = (loading) => {
  state.isLoading = !!loading;
};
const setSaving = (saving) => {
  state.isSaving = !!saving;
};
const openEditor = () => {
  _initPorts();
  if (state.current?.type === AVATAR_TYPES.GENERATED && state.current.config) state.editing = { ...state.current.config };
  else state.editing = { ...DEFAULT_AVATAR_CONFIG };
  state.isEditorOpen = true;
  state.error = null;
  _emit(AVATAR_EVENTS.EDIT_OPENED, { editing: state.editing });
  _track("avatar:edit:opened");
};
const closeEditor = (save) => {
  if (save && state.editing) {
    if (state.current) {
      state.history.unshift({ ...state.current, savedAt: Date.now() });
      if (state.history.length > 10) state.history.pop();
    }
    state.current = { type: AVATAR_TYPES.GENERATED, config: { ...state.editing }, version: (state.current?.version ?? 0) + 1, updatedAt: Date.now() };
    state.saveCount++;
    state.savedAt = Date.now();
    _emit(AVATAR_EVENTS.SAVED, { avatar: state.current });
    _track("avatar:saved", { version: state.current.version });
  }
  state.editing = null;
  state.isEditorOpen = false;
  _emit(AVATAR_EVENTS.EDIT_CLOSED, { saved: !!save });
};
const discardEditing = () => {
  state.editing = null;
  state.isEditorOpen = false;
  _emit(AVATAR_EVENTS.EDIT_CLOSED, { saved: false });
  _track("avatar:edit:discarded");
};
const setError = (error) => {
  state.error = error;
  state.lastError = error ? { message: error, at: Date.now() } : null;
  if (error) {
    _emit(AVATAR_EVENTS.ERROR, { error });
    _track("avatar:error", { error });
  }
};
const clearError = () => {
  state.error = null;
};
const restoreFromHistory = (index) => {
  if (index < 0 || index >= state.history.length) return false;
  const restored = state.history[index];
  if (!restored) return false;
  if (state.current) {
    state.history.unshift({ ...state.current, savedAt: Date.now() });
    if (state.history.length > 10) state.history.pop();
  }
  state.current = { ...restored };
  _emit(AVATAR_EVENTS.UPDATED, { avatar: state.current, source: "restore" });
  _track("avatar:restored", { fromIndex: index });
  return true;
};
const reset = () => {
  state = { ...initialState };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), hasAvatar: hasAvatar(), avatarType: getAvatarType(), isEditorOpen: state.isEditorOpen, historyCount: state.history.length, usingP18Intents: true, metrics: { editCount: state.editCount, saveCount: state.saveCount, loadedAt: state.loadedAt, savedAt: state.savedAt } });
const healthCheck = () => {
  const checks = { stateInitialized: true, noError: !state.error, notLoading: !state.isLoading, notSaving: !state.isSaving, portsInitialized: Ports.isInitialized(), p18IntentsAvailable: true };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID };
};
var state_default = { getState, getCurrent, getEditing, getHistory, isLoading, isSaving, isEditorOpen, getError, hasAvatar, getAvatarType, getRenderConfig, setCurrent, setEditing, updateEditing, setLoading, setSaving, openEditor, closeEditor, discardEditing, setError, clearError, restoreFromHistory, reset, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearError,
  closeEditor,
  state_default as default,
  discardEditing,
  getAvatarType,
  getCurrent,
  getEditing,
  getError,
  getHistory,
  getPorts,
  getRenderConfig,
  getState,
  hasAvatar,
  healthCheck,
  info,
  injectPorts,
  isEditorOpen,
  isLoading,
  isSaving,
  openEditor,
  reset,
  restoreFromHistory,
  setCurrent,
  setEditing,
  setError,
  setLoading,
  setSaving,
  updateEditing
};
