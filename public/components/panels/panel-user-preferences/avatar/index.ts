// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences:avatar
// PURPOSE: Avatar System - Index
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   render() — exported function
//   renderCurrent() — exported function
//   openEditor() — exported function
//   closeEditor() — exported function
//   updatePreview() — exported function
//   getState() — exported function
//   hasAvatar() — exported function
//   getCurrent() — exported function
//   getEditing() — exported function
//   clearCache() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   constants — exported value
//   ... and 3 more exports
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

import * as constants from './constants.js';
import * as state from './state.js';
import * as api from './api.js';
import * as renderer from './renderer.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-preferences:avatar';

export { constants, state, api, renderer };
export const { AVATAR_TYPES, AVATAR_BASES, AVATAR_FRAMES, AVATAR_BACKGROUNDS, AVATAR_ICONS, AVATAR_BADGES, AVATAR_SIZES, DEFAULT_AVATAR_CONFIG, AVATAR_EVENTS } = constants;

export async function load(options: Record<string, unknown> = {}) { return api.loadAvatar(options); }
export async function save(config: Record<string, unknown>) { return api.saveAvatar(config); }
export async function uploadImage(file: File) { return api.uploadAvatarImage(file); }
export async function remove() { return api.deleteAvatar(); }
export function render(avatarData: Record<string, unknown> | null, options: Record<string, unknown> = {}) { return renderer.render(avatarData, options); }
export function renderCurrent(options: Record<string, unknown> = {}) { const current = state.getCurrent(); return renderer.render(current, options); }
export function openEditor() { state.openEditor(); }
export function closeEditor(save = false) { state.closeEditor(save); }
export function updatePreview(partial: Record<string, unknown>) { state.updateEditing(partial); }
export function getState() { return state.getState(); }
export function hasAvatar() { return state.hasAvatar(); }
export function getCurrent() { return state.getCurrent(); }
export function getEditing() { return state.getEditing(); }
export function clearCache() { api.clearCache(); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, submodules: { constants: constants.info(), state: state.info(), api: api.info(), renderer: renderer.info() } }; }
export function healthCheck() { const stateHealth = state.healthCheck(); const apiHealth = api.healthCheck(); const rendererHealth = renderer.healthCheck(); const subHealthy = [stateHealth, apiHealth, rendererHealth].every(h => h.status !== 'UNHEALTHY'); return { status: subHealthy ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, submodules: { state: stateHealth, api: apiHealth, renderer: rendererHealth } }; }
export async function init(options: Record<string, unknown> = {}) { const { autoLoad = true } = options; if (autoLoad) { await load(); } return { ok: true, moduleId: MODULE_ID, version: VERSION }; }

export default { init, load, save, uploadImage, remove, render, renderCurrent, openEditor, closeEditor, updatePreview, getState, hasAvatar, getCurrent, getEditing, clearCache, info, healthCheck, AVATAR_TYPES, AVATAR_BASES, AVATAR_FRAMES, AVATAR_BACKGROUNDS, AVATAR_ICONS, AVATAR_BADGES, AVATAR_SIZES, DEFAULT_AVATAR_CONFIG, AVATAR_EVENTS, constants, state, api, renderer, VERSION, MODULE_ID };
