// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-cards-enterprise
// PURPOSE: Panel Cards - Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   refresh — exported value
//   healthCheck — exported value
//   getStatus — exported value
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

import PanelCards, { mount as legacyMount, unmount as legacyUnmount, refresh, healthCheck, getStatus, getVersion } from './index.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-cards-enterprise';

const SVGS = { warning: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' };

let _ctx: Record<string, unknown> | null = null;
let _root: HTMLElement | null = null;

export async function load(ctx: Record<string, unknown> = {}) { _ctx = ctx; return { ready: true, panelId: 'panel-cards', timestamp: Date.now() }; }

export async function mount(root: HTMLElement, ctx: Record<string, unknown> = {}) {
  if (!root) throw new Error('Root container obrigatório');
  _root = root;
  _ctx = { ..._ctx, ...ctx };
  await legacyMount(root, (_ctx.params as Record<string, unknown>) || {});
  return true;
}

export async function update(root: HTMLElement, ctx: Record<string, unknown> = {}) { _ctx = { ..._ctx, ...ctx }; await refresh(); return true; }

export async function unmount(ctx: Record<string, any> = {}) { await legacyUnmount(); _root = null; _ctx = null; return true; }

export async function error(ctx: Record<string, any> = {}) {
  const { error, panelId } = ctx;
  if (_root) {
    _root.innerHTML = `<div class="panel-error" style="padding: 2rem; text-align: center;"><span style="display:inline-block;">${SVGS.warning}</span><p style="color: #ef4444; margin-top: 1rem;">${error?.message || 'Erro ao carregar painel'}</p></div>`;
  }
  return { handled: true };
}

export async function recover(ctx: Record<string, unknown> = {}) {
  if (_root && _ctx) { await unmount(); await mount(_root, _ctx); return { recovered: true }; }
  return { recovered: false };
}

export function info() {
  return { id: 'panel-cards', version: VERSION, legacyVersion: getVersion(), title: 'Dashboard Principal', description: 'Painel de cards com visão geral do sistema', icon: 'grid', category: 'dashboard', domain: 'operations', requiresAuth: true, minLevel: 20, enterprise: true, contract: ['load', 'mount', 'update', 'unmount', 'error', 'recover', 'info'] };
}

export { refresh, healthCheck, getStatus };
export default { load, mount, update, unmount, error, recover, info, refresh, healthCheck, getStatus };
