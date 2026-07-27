import { ICONS } from "./icons.js";
const MODULE_ID = "header-user-menu-ui-template";
const VERSION = "1.2.0-ENTERPRISE-UARPS";
let _metrics = { triggers: 0, dropdowns: 0 };
function createTriggerHTML() {
  _metrics.triggers++;
  return `<button class="user-menu-trigger" aria-haspopup="true" aria-expanded="false" aria-label="Menu do usu\xE1rio" data-uarps-trigger="trigger:header:user-menu"><div class="user-avatar"><img class="avatar-img" src="" alt="" style="display:none"><span class="avatar-initials">--</span></div><span class="user-name">...</span><span class="user-chevron">${ICONS.chevron}</span></button>`;
}
function createDropdownHTML() {
  _metrics.dropdowns++;
  return `<div class="dropdown-header"><div class="user-avatar-large"><img class="avatar-img" src="" alt="" style="display:none"><span class="avatar-initials">--</span></div><div class="user-info"><span class="user-name-full">Carregando...</span><span class="user-role">---</span></div></div><div class="dropdown-divider"></div><button class="dropdown-item" role="menuitem" data-action="profile" data-uarps-trigger="trigger:header:profile"><span class="item-icon">${ICONS.user}</span>Meu Perfil</button><button class="dropdown-item" role="menuitem" data-action="preferences" data-uarps-trigger="trigger:header:preferences"><span class="item-icon">${ICONS.settings}</span>Minhas Prefer\xEAncias</button><button class="dropdown-item" role="menuitem" data-action="security" data-uarps-trigger="trigger:header:security"><span class="item-icon">${ICONS.shield}</span>Seguran\xE7a da Conta</button><button class="dropdown-item" role="menuitem" data-action="notifications" data-uarps-trigger="trigger:header:notifications"><span class="item-icon">${ICONS.bell}</span>Notifica\xE7\xF5es</button><button class="dropdown-item" role="menuitem" data-action="sessions" data-uarps-trigger="trigger:header:sessions"><span class="item-icon">${ICONS.monitor}</span>Sess\xF5es Ativas</button><div class="dropdown-divider"></div><button class="dropdown-item logout" role="menuitem" data-action="logout" data-uarps-trigger="trigger:header:logout"><span class="item-icon">${ICONS.logout}</span>Sair</button>`;
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { templateReady: true }, metrics: getMetrics() };
}
export {
  MODULE_ID,
  VERSION,
  createDropdownHTML,
  createTriggerHTML,
  getMetrics,
  healthCheck,
  info
};
