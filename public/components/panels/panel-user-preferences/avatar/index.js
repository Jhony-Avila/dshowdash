import * as constants from "./constants.js";
import * as state from "./state.js";
import * as api from "./api.js";
import * as renderer from "./renderer.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences:avatar";
const { AVATAR_TYPES, AVATAR_BASES, AVATAR_FRAMES, AVATAR_BACKGROUNDS, AVATAR_ICONS, AVATAR_BADGES, AVATAR_SIZES, DEFAULT_AVATAR_CONFIG, AVATAR_EVENTS } = constants;
async function load(options = {}) {
  return api.loadAvatar(options);
}
async function save(config) {
  return api.saveAvatar(config);
}
async function uploadImage(file) {
  return api.uploadAvatarImage(file);
}
async function remove() {
  return api.deleteAvatar();
}
function render(avatarData, options = {}) {
  return renderer.render(avatarData, options);
}
function renderCurrent(options = {}) {
  const current = state.getCurrent();
  return renderer.render(current, options);
}
function openEditor() {
  state.openEditor();
}
function closeEditor(save2 = false) {
  state.closeEditor(save2);
}
function updatePreview(partial) {
  state.updateEditing(partial);
}
function getState() {
  return state.getState();
}
function hasAvatar() {
  return state.hasAvatar();
}
function getCurrent() {
  return state.getCurrent();
}
function getEditing() {
  return state.getEditing();
}
function clearCache() {
  api.clearCache();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, submodules: { constants: constants.info(), state: state.info(), api: api.info(), renderer: renderer.info() } };
}
function healthCheck() {
  const stateHealth = state.healthCheck();
  const apiHealth = api.healthCheck();
  const rendererHealth = renderer.healthCheck();
  const subHealthy = [stateHealth, apiHealth, rendererHealth].every((h) => h.status !== "UNHEALTHY");
  return { status: subHealthy ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, submodules: { state: stateHealth, api: apiHealth, renderer: rendererHealth } };
}
async function init(options = {}) {
  const { autoLoad = true } = options;
  if (autoLoad) {
    await load();
  }
  return { ok: true, moduleId: MODULE_ID, version: VERSION };
}
var avatar_default = { init, load, save, uploadImage, remove, render, renderCurrent, openEditor, closeEditor, updatePreview, getState, hasAvatar, getCurrent, getEditing, clearCache, info, healthCheck, AVATAR_TYPES, AVATAR_BASES, AVATAR_FRAMES, AVATAR_BACKGROUNDS, AVATAR_ICONS, AVATAR_BADGES, AVATAR_SIZES, DEFAULT_AVATAR_CONFIG, AVATAR_EVENTS, constants, state, api, renderer, VERSION, MODULE_ID };
export {
  AVATAR_BACKGROUNDS,
  AVATAR_BADGES,
  AVATAR_BASES,
  AVATAR_EVENTS,
  AVATAR_FRAMES,
  AVATAR_ICONS,
  AVATAR_SIZES,
  AVATAR_TYPES,
  DEFAULT_AVATAR_CONFIG,
  MODULE_ID,
  VERSION,
  api,
  clearCache,
  closeEditor,
  constants,
  avatar_default as default,
  getCurrent,
  getEditing,
  getState,
  hasAvatar,
  healthCheck,
  info,
  init,
  load,
  openEditor,
  remove,
  render,
  renderCurrent,
  renderer,
  save,
  state,
  updatePreview,
  uploadImage
};
