// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.9.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences.avatar.state
// PURPOSE: Avatar System - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   TELEMETRY_INTENTS from /core/runtime/events/catalog/telemetry.events.js
//   DEFAULT_AVATAR_CONFIG, AVATAR_TYPES, AVATAR_EVENTS from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   getCurrent() — exported function
//   getEditing() — exported function
//   getHistory() — exported function
//   isLoading() — exported function
//   isSaving() — exported function
//   isEditorOpen() — exported function
//   getError() — exported function
//   hasAvatar() — exported function
//   getAvatarType() — exported function
//   getRenderConfig() — exported function
//   setCurrent() — exported function
//   setEditing() — exported function
//   ... and 14 more exports
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

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { TELEMETRY_INTENTS } from '/core/runtime/events/catalog/telemetry.events.js';
import { DEFAULT_AVATAR_CONFIG, AVATAR_TYPES, AVATAR_EVENTS } from './constants.js';

interface AvatarData {
  type: string;
  config: Record<string, unknown> | null;
  imageUrl?: string | null;
  initials?: string;
  backgroundColor?: string;
  version?: number;
  savedAt?: number;
  updatedAt?: number;
  [key: string]: unknown;
}

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-preferences.avatar.state';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: unknown) => Ports.inject(p);
const getPorts = () => Ports.snapshot();

const initialState: { current: AvatarData | null; editing: Record<string, unknown> | null; isLoading: boolean; isSaving: boolean; isEditorOpen: boolean; error: string | null; lastError: unknown; history: AvatarData[]; loadedAt: number | null; savedAt: number | null; editCount: number; saveCount: number } = { current: null, editing: null, isLoading: false, isSaving: false, isEditorOpen: false, error: null, lastError: null, history: [], loadedAt: null, savedAt: null, editCount: 0, saveCount: 0 };
let state = { ...initialState };

const _emit = (event: string, data: Record<string, unknown> = {}) => { const eb = _getPort('eventBus'); eb?.emit?.(event, { source: MODULE_ID, timestamp: Date.now(), ...data }); };
const _track = (event: string, data: Record<string, unknown> = {}) => { const eb = _getPort('eventBus'); eb?.emit?.(TELEMETRY_INTENTS.TRACK, { event, module: MODULE_ID, timestamp: Date.now(), ...data }); };

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
  if (state.current.type === AVATAR_TYPES.IMAGE) return { type: 'image', url: state.current.imageUrl };
  return { type: 'fallback', initials: state.current.initials || '??', backgroundColor: state.current.backgroundColor || '#7c3aed' };
};

const setCurrent = (avatar: AvatarData | Record<string, unknown> | null) => { _initPorts(); state.current = avatar ? { ...avatar } as AvatarData : null; state.loadedAt = Date.now(); state.error = null; _emit(AVATAR_EVENTS.LOADED, { avatar: state.current }); _track('avatar:loaded', { type: avatar?.type ?? null }); };
const setEditing = (config: Record<string, unknown> | null) => { state.editing = config ? { ...config } : null; state.editCount++; _emit(AVATAR_EVENTS.PREVIEW_CHANGED, { config: state.editing }); };
const updateEditing = (partial: Record<string, unknown>) => { if (!state.editing) state.editing = { ...DEFAULT_AVATAR_CONFIG }; state.editing = { ...state.editing, ...partial }; _emit(AVATAR_EVENTS.PREVIEW_CHANGED, { config: state.editing }); _track('avatar:option:selected', { changed: Object.keys(partial) }); };
const setLoading = (loading: boolean) => { state.isLoading = !!loading; };
const setSaving = (saving: boolean) => { state.isSaving = !!saving; };

const openEditor = () => { _initPorts(); if (state.current?.type === AVATAR_TYPES.GENERATED && state.current.config) state.editing = { ...state.current.config }; else state.editing = { ...DEFAULT_AVATAR_CONFIG }; state.isEditorOpen = true; state.error = null; _emit(AVATAR_EVENTS.EDIT_OPENED, { editing: state.editing }); _track('avatar:edit:opened'); };

const closeEditor = (save: boolean) => {
  if (save && state.editing) {
    if (state.current) { state.history.unshift({ ...state.current, savedAt: Date.now() }); if (state.history.length > 10) state.history.pop(); }
    state.current = { type: AVATAR_TYPES.GENERATED, config: { ...state.editing }, version: ((state.current?.version as number) ?? 0) + 1, updatedAt: Date.now() } as AvatarData;
    state.saveCount++; state.savedAt = Date.now();
    _emit(AVATAR_EVENTS.SAVED, { avatar: state.current }); _track('avatar:saved', { version: state.current.version as number });
  }
  state.editing = null; state.isEditorOpen = false; _emit(AVATAR_EVENTS.EDIT_CLOSED, { saved: !!save });
};

const discardEditing = () => { state.editing = null; state.isEditorOpen = false; _emit(AVATAR_EVENTS.EDIT_CLOSED, { saved: false }); _track('avatar:edit:discarded'); };
const setError = (error: string | null) => { state.error = error; state.lastError = error ? { message: error, at: Date.now() } : null; if (error) { _emit(AVATAR_EVENTS.ERROR, { error }); _track('avatar:error', { error }); } };
const clearError = () => { state.error = null; };

const restoreFromHistory = (index: number) => {
  if (index < 0 || index >= state.history.length) return false;
  const restored = state.history[index]; if (!restored) return false;
  if (state.current) { state.history.unshift({ ...state.current, savedAt: Date.now() } as AvatarData); if (state.history.length > 10) state.history.pop(); }
  state.current = { ...restored } as AvatarData;
  _emit(AVATAR_EVENTS.UPDATED, { avatar: state.current, source: 'restore' }); _track('avatar:restored', { fromIndex: index });
  return true;
};

const reset = () => { state = { ...initialState }; };

const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), hasAvatar: hasAvatar(), avatarType: getAvatarType(), isEditorOpen: state.isEditorOpen, historyCount: state.history.length, usingP18Intents: true, metrics: { editCount: state.editCount, saveCount: state.saveCount, loadedAt: state.loadedAt, savedAt: state.savedAt } });

const healthCheck = () => {
  const checks = { stateInitialized: true, noError: !state.error, notLoading: !state.isLoading, notSaving: !state.isSaving, portsInitialized: Ports.isInitialized(), p18IntentsAvailable: true };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID };
};

export { getState, getCurrent, getEditing, getHistory, isLoading, isSaving, isEditorOpen, getError, hasAvatar, getAvatarType, getRenderConfig, setCurrent, setEditing, updateEditing, setLoading, setSaving, openEditor, closeEditor, discardEditing, setError, clearError, restoreFromHistory, reset, info, healthCheck, injectPorts, getPorts };
export default { getState, getCurrent, getEditing, getHistory, isLoading, isSaving, isEditorOpen, getError, hasAvatar, getAvatarType, getRenderConfig, setCurrent, setEditing, updateEditing, setLoading, setSaving, openEditor, closeEditor, discardEditing, setError, clearError, restoreFromHistory, reset, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
