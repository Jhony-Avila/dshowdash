// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-user-menu-ui-template
// PURPOSE: User Menu - Templates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ./icons.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   createTriggerHTML() — exported function
//   createDropdownHTML() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { ICONS } from './icons.js';

export const MODULE_ID = 'header-user-menu-ui-template';
export const VERSION = '1.2.0-ENTERPRISE-UARPS';

let _metrics = { triggers: 0, dropdowns: 0 };

export function createTriggerHTML() {
  _metrics.triggers++;
  return `<button class="user-menu-trigger" aria-haspopup="true" aria-expanded="false" aria-label="Menu do usuário" data-uarps-trigger="trigger:header:user-menu"><div class="user-avatar"><img class="avatar-img" src="" alt="" style="display:none"><span class="avatar-initials">--</span></div><span class="user-name">...</span><span class="user-chevron">${ICONS.chevron}</span></button>`;
}

export function createDropdownHTML() {
  _metrics.dropdowns++;
  return `<div class="dropdown-header"><div class="user-avatar-large"><img class="avatar-img" src="" alt="" style="display:none"><span class="avatar-initials">--</span></div><div class="user-info"><span class="user-name-full">Carregando...</span><span class="user-role">---</span></div></div><div class="dropdown-divider"></div><button class="dropdown-item" role="menuitem" data-action="profile" data-uarps-trigger="trigger:header:profile"><span class="item-icon">${ICONS.user}</span>Meu Perfil</button><button class="dropdown-item" role="menuitem" data-action="preferences" data-uarps-trigger="trigger:header:preferences"><span class="item-icon">${ICONS.settings}</span>Minhas Preferências</button><button class="dropdown-item" role="menuitem" data-action="security" data-uarps-trigger="trigger:header:security"><span class="item-icon">${ICONS.shield}</span>Segurança da Conta</button><button class="dropdown-item" role="menuitem" data-action="notifications" data-uarps-trigger="trigger:header:notifications"><span class="item-icon">${ICONS.bell}</span>Notificações</button><button class="dropdown-item" role="menuitem" data-action="sessions" data-uarps-trigger="trigger:header:sessions"><span class="item-icon">${ICONS.monitor}</span>Sessões Ativas</button><div class="dropdown-divider"></div><button class="dropdown-item logout" role="menuitem" data-action="logout" data-uarps-trigger="trigger:header:logout"><span class="item-icon">${ICONS.logout}</span>Sair</button>`;
}

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { templateReady: true }, metrics: getMetrics() }; }
