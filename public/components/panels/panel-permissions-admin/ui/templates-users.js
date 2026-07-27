import { Icons } from "./icons.js";
import { getInitials, getLevelClass } from "./templates-helpers.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-templates-users";
const userCard = (user, isSelected = false) => {
  const initials = getInitials(String(user.nome || user.name || "U"));
  const statusClass = user.ativo !== false ? "active" : "inactive";
  const selectedClass = isSelected ? "uarps-user--selected" : "";
  const level = Number(user.nivel || user.level || 0);
  const levelClass = getLevelClass(level);
  const avatarUrl = user.avatar_url || user.avatar || null;
  const tooltip = `${user.nome || user.name}
Email: ${user.email || "N/A"}
N\xEDvel: ${level}`;
  return `<div class="uarps-user ${selectedClass} uarps-tooltip--bottom" data-user-id="${user.id}" data-tooltip="${tooltip}" tabindex="0" role="button" aria-label="Selecionar ${user.nome || user.name}"><div class="uarps-user__avatar uarps-user__avatar--${statusClass}">${avatarUrl ? `<img src="${avatarUrl}" alt="" class="uarps-user__avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="uarps-user__initials" style="display:none">${initials}</span>` : `<span class="uarps-user__initials">${initials}</span>`}<div class="uarps-user__glow"></div></div><div class="uarps-user__info"><span class="uarps-user__name">${user.nome || user.name || "Usu\xE1rio"}</span><span class="uarps-user__level ${levelClass}">${Icons.star} N\xEDvel ${level}</span></div><div class="uarps-user__status uarps-user__status--${statusClass}">${user.ativo !== false ? Icons.checkCircle : Icons.xCircle}</div></div>`;
};
const userFocus = (user, perms) => {
  const initials = getInitials(String(user.nome || user.name || "U"));
  const level = Number(user.nivel || user.level || 0);
  const levelClass = getLevelClass(level);
  const triggerCount = perms.triggers ? perms.triggers.length : 0;
  const regionCount = perms.regions ? perms.regions.length : 0;
  const avatarUrl = user.avatar_url || user.avatar || null;
  return `<div class="uarps-focus__card"><div class="uarps-focus__avatar">${avatarUrl ? `<img src="${avatarUrl}" alt="" class="uarps-focus__avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="uarps-focus__initials" style="display:none">${initials}</span>` : `<span class="uarps-focus__initials">${initials}</span>`}<div class="uarps-focus__glow uarps-focus__glow--${levelClass}"></div><div class="uarps-focus__ring"></div></div><h3 class="uarps-focus__name">${user.nome || user.name}</h3><p class="uarps-focus__email">${user.email || ""}</p><div class="uarps-focus__badges"><span class="uarps-badge uarps-badge--${levelClass}">${Icons.star} N\xEDvel ${level}</span><span class="uarps-badge ${user.ativo !== false ? "uarps-badge--success" : "uarps-badge--danger"}">${user.ativo !== false ? `${Icons.checkCircle} Ativo` : `${Icons.xCircle} Inativo`}</span></div><div class="uarps-focus__stats"><div class="uarps-focus__stat uarps-tooltip" data-tooltip="Triggers liberados"><span class="uarps-focus__stat-value uarps-glow--cyan">${triggerCount}</span><span class="uarps-focus__stat-label">Triggers</span></div><div class="uarps-focus__stat uarps-tooltip" data-tooltip="Regi\xF5es vis\xEDveis"><span class="uarps-focus__stat-value uarps-glow--purple">${regionCount}</span><span class="uarps-focus__stat-label">Regi\xF5es</span></div></div><div class="uarps-focus__actions"><button class="uarps-btn uarps-btn--sm uarps-btn--success uarps-tooltip" data-action="grant-all-triggers" data-tooltip="Liberar todos os triggers">${Icons.checkAll} Liberar Todos</button><button class="uarps-btn uarps-btn--sm uarps-btn--danger uarps-tooltip" data-action="revoke-all-triggers" data-tooltip="Revogar todos os triggers">${Icons.xAll} Revogar Todos</button></div></div>`;
};
const userFocusEmpty = () => `<div class="uarps-focus__empty"><div class="uarps-focus__empty-icon">${Icons.userSelect}</div><p>Selecione um usu\xE1rio para visualizar e gerenciar permiss\xF5es</p></div>`;
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { templatesReady: typeof userCard === "function" } });
export {
  MODULE_ID,
  VERSION,
  healthCheck,
  info,
  userCard,
  userFocus,
  userFocusEmpty
};
