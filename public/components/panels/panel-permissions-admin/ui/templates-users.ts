// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-templates-users
// PURPOSE: UARPS Admin - User Templates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Icons from ./icons.js
//   getInitials, getLevelClass from ./templates-helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   userCard() — exported function
//   userFocus() — exported function
//   userFocusEmpty() — exported function
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

import { Icons } from './icons.js';
import { getInitials, getLevelClass } from './templates-helpers.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-templates-users';

export const userCard = (user: Record<string, unknown>, isSelected = false) => {
  const initials = getInitials(String(user.nome || user.name || 'U'));
  const statusClass = user.ativo !== false ? 'active' : 'inactive';
  const selectedClass = isSelected ? 'uarps-user--selected' : '';
  const level = Number(user.nivel || user.level || 0);
  const levelClass = getLevelClass(level);
  const avatarUrl = user.avatar_url || user.avatar || null;
  const tooltip = `${user.nome || user.name}\nEmail: ${user.email || 'N/A'}\nNível: ${level}`;
  
  return `<div class="uarps-user ${selectedClass} uarps-tooltip--bottom" data-user-id="${user.id}" data-tooltip="${tooltip}" tabindex="0" role="button" aria-label="Selecionar ${user.nome || user.name}"><div class="uarps-user__avatar uarps-user__avatar--${statusClass}">${avatarUrl ? `<img src="${avatarUrl}" alt="" class="uarps-user__avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="uarps-user__initials" style="display:none">${initials}</span>` : `<span class="uarps-user__initials">${initials}</span>`}<div class="uarps-user__glow"></div></div><div class="uarps-user__info"><span class="uarps-user__name">${user.nome || user.name || 'Usuário'}</span><span class="uarps-user__level ${levelClass}">${Icons.star} Nível ${level}</span></div><div class="uarps-user__status uarps-user__status--${statusClass}">${user.ativo !== false ? Icons.checkCircle : Icons.xCircle}</div></div>`;
};

export const userFocus = (user: Record<string, unknown>, perms: { triggers?: unknown[]; regions?: unknown[] }) => {
  const initials = getInitials(String(user.nome || user.name || 'U'));
  const level = Number(user.nivel || user.level || 0);
  const levelClass = getLevelClass(level);
  const triggerCount = perms.triggers ? perms.triggers.length : 0;
  const regionCount = perms.regions ? perms.regions.length : 0;
  const avatarUrl = user.avatar_url || user.avatar || null;
  
  return `<div class="uarps-focus__card"><div class="uarps-focus__avatar">${avatarUrl ? `<img src="${avatarUrl}" alt="" class="uarps-focus__avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="uarps-focus__initials" style="display:none">${initials}</span>` : `<span class="uarps-focus__initials">${initials}</span>`}<div class="uarps-focus__glow uarps-focus__glow--${levelClass}"></div><div class="uarps-focus__ring"></div></div><h3 class="uarps-focus__name">${user.nome || user.name}</h3><p class="uarps-focus__email">${user.email || ''}</p><div class="uarps-focus__badges"><span class="uarps-badge uarps-badge--${levelClass}">${Icons.star} Nível ${level}</span><span class="uarps-badge ${user.ativo !== false ? 'uarps-badge--success' : 'uarps-badge--danger'}">${user.ativo !== false ? `${Icons.checkCircle} Ativo` : `${Icons.xCircle} Inativo`}</span></div><div class="uarps-focus__stats"><div class="uarps-focus__stat uarps-tooltip" data-tooltip="Triggers liberados"><span class="uarps-focus__stat-value uarps-glow--cyan">${triggerCount}</span><span class="uarps-focus__stat-label">Triggers</span></div><div class="uarps-focus__stat uarps-tooltip" data-tooltip="Regiões visíveis"><span class="uarps-focus__stat-value uarps-glow--purple">${regionCount}</span><span class="uarps-focus__stat-label">Regiões</span></div></div><div class="uarps-focus__actions"><button class="uarps-btn uarps-btn--sm uarps-btn--success uarps-tooltip" data-action="grant-all-triggers" data-tooltip="Liberar todos os triggers">${Icons.checkAll} Liberar Todos</button><button class="uarps-btn uarps-btn--sm uarps-btn--danger uarps-tooltip" data-action="revoke-all-triggers" data-tooltip="Revogar todos os triggers">${Icons.xAll} Revogar Todos</button></div></div>`;
};

export const userFocusEmpty = () => `<div class="uarps-focus__empty"><div class="uarps-focus__empty-icon">${Icons.userSelect}</div><p>Selecione um usuário para visualizar e gerenciar permissões</p></div>`;

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { templatesReady: typeof userCard === 'function' } });
