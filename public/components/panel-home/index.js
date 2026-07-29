'use strict';
// panel-home/index.js — ADAPTADOR da página inicial "Principal".
// @version 2.0.0-home-inteligente
// @changelog v2.0.0 — A página inicial deixou de ser a tela ilustrada
//   (bundle congelado + weather-fx) e passou a ser a HOME INTELIGENTE
//   (briefing 2026-07-29): este arquivo delega para o painel React da
//   Visão Geral (panels/panel-dashboard), que preserva a identidade
//   (céu/lua/estrelas por horário e clima) dentro do GreetingHero.
//   O carregador do main (bundle congelado) continua importando ESTE
//   caminho — o contrato mount/unmount é o mesmo. A tela anterior tem
//   backup em /backup no servidor e o código segue no repositório.
import painel from '/components/panels/panel-dashboard/index.js';

export const MODULE_ID = 'panel-home';
export const VERSION = '2.0.0-home-inteligente';

export async function mount(contentEl, config = {}) {
  return painel.mount(contentEl, config);
}

export async function unmount() {
  return painel.unmount();
}

export const destroy = unmount;
export const dispose = unmount;

export function healthCheck() {
  return painel.healthCheck();
}

export function info() {
  return { MODULE_ID, VERSION, delega: painel.info() };
}

export default { mount, unmount, destroy, dispose, healthCheck, info, MODULE_ID, VERSION };
