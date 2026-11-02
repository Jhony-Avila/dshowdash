'use strict';
// panel-home.bundle.js — SUBSTITUÍDO pelo adaptador da Home Inteligente (2026-07-29).
// O bundle noturno original está em /backup/panel-home-noturna-*. Este arquivo
// existe para capturar navegadores com o index.js ANTIGO ainda em cache (que
// importa ./dist/panel-home.bundle.js): os dois caminhos montam a Home nova.
import painel from '/components/panels/panel-dashboard/index.js';

export const MODULE_ID = 'panel-home';
export const VERSION = '2.0.0-home-inteligente-bundle';

export async function mount(contentEl, config = {}) {
  return painel.mount(contentEl, { ...config, home: true });
}
export async function unmount() { return painel.unmount(); }
export const destroy = unmount;
export const dispose = unmount;
export function healthCheck() { return painel.healthCheck(); }
export function info() { return { MODULE_ID, VERSION, delega: painel.info() }; }
export default { mount, unmount, destroy, dispose, healthCheck, info, MODULE_ID, VERSION };
