// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-management/ui/templates/card
// PURPOSE: Panel User Management - Card Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   sanitize, getInitials, getAvatarColor from ../helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderUserCard() — exported function
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

import { sanitize, getInitials, getAvatarColor } from '../helpers.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-management/ui/templates/card';

export function renderUserCard(user: Record<string, unknown>) { const isActive = user.status === 'active'; const statusClass = isActive ? 'active' : (user.status === 'disabled' ? 'inactive' : 'unknown'); const initials = getInitials(String(user.nome_completo || user.nome || user.username || '')); const avatarColor = getAvatarColor(user.id as string | number); const displayName = user.nome_completo || user.nome || user.username || '—'; const displayEmail = user.email || '—'; const funcao = user.funcao || ''; const departamento = user.departamento || ''; const roleInfo = [funcao, departamento].filter(Boolean).join(' • '); const avatarUrl = String(user.avatar_url || user.avatar || ''); const hasAvatar = avatarUrl && avatarUrl.length > 0 && !avatarUrl.includes('default'); const avatarHtml = hasAvatar ? `<img src="${sanitize(avatarUrl)}" alt="" class="avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''; const initialsHtml = `<span class="avatar-initials" style="${hasAvatar ? 'display:none' : ''}">${initials}</span>`; return `<div class="user-card" data-user-id="${user.id}" data-action="open-modal" data-status="${user.status || 'unknown'}"><div class="user-header"><div class="avatar" style="background:${avatarColor}">${avatarHtml}${initialsHtml}</div><div class="user-info"><div class="user-name">${sanitize(displayName)}</div><div class="user-email">${sanitize(displayEmail)}</div>${roleInfo ? `<div class="user-role">${sanitize(roleInfo)}</div>` : ''}</div><span class="status-dot status-${statusClass}" title="${isActive ? 'Ativo' : 'Inativo'}"></span></div></div>`; }

export default { renderUserCard };
