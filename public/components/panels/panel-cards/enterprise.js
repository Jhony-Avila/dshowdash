import { mount as legacyMount, unmount as legacyUnmount, refresh, healthCheck, getStatus, getVersion } from "./index.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-cards-enterprise";
const SVGS = { warning: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' };
let _ctx = null;
let _root = null;
async function load(ctx = {}) {
  _ctx = ctx;
  return { ready: true, panelId: "panel-cards", timestamp: Date.now() };
}
async function mount(root, ctx = {}) {
  if (!root) throw new Error("Root container obrigat\xF3rio");
  _root = root;
  _ctx = { ..._ctx, ...ctx };
  await legacyMount(root, _ctx.params || {});
  return true;
}
async function update(root, ctx = {}) {
  _ctx = { ..._ctx, ...ctx };
  await refresh();
  return true;
}
async function unmount(ctx = {}) {
  await legacyUnmount();
  _root = null;
  _ctx = null;
  return true;
}
async function error(ctx = {}) {
  const { error: error2, panelId } = ctx;
  if (_root) {
    _root.innerHTML = `<div class="panel-error" style="padding: 2rem; text-align: center;"><span style="display:inline-block;">${SVGS.warning}</span><p style="color: #ef4444; margin-top: 1rem;">${error2?.message || "Erro ao carregar painel"}</p></div>`;
  }
  return { handled: true };
}
async function recover(ctx = {}) {
  if (_root && _ctx) {
    await unmount();
    await mount(_root, _ctx);
    return { recovered: true };
  }
  return { recovered: false };
}
function info() {
  return { id: "panel-cards", version: VERSION, legacyVersion: getVersion(), title: "Dashboard Principal", description: "Painel de cards com vis\xE3o geral do sistema", icon: "grid", category: "dashboard", domain: "operations", requiresAuth: true, minLevel: 20, enterprise: true, contract: ["load", "mount", "update", "unmount", "error", "recover", "info"] };
}
var enterprise_default = { load, mount, update, unmount, error, recover, info, refresh, healthCheck, getStatus };
export {
  MODULE_ID,
  VERSION,
  enterprise_default as default,
  error,
  getStatus,
  healthCheck,
  info,
  load,
  mount,
  recover,
  refresh,
  unmount,
  update
};
