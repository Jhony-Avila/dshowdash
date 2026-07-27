// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-management/ui/helpers
// PURPOSE: Panel User Management - UI Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   AVATAR_COLORS — exported value
//   sanitize() — exported function
//   getInitials() — exported function
//   getAvatarColor() — exported function
//   formatDate() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-management/ui/helpers';

export const AVATAR_COLORS = [ '#4F6D7A', '#5D6B7A', '#6B5D7A', '#5D7A6B', '#7A6B5D', '#5D6A7A', '#6A5D6B', '#5D7A7A' ];

export function sanitize(str: unknown) { if (typeof str !== 'string') return ''; return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').trim(); }

export function getInitials(name: string) { if (!name) return '?'; const parts = name.trim().split(' ').filter(Boolean); if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase(); return name.substring(0, 2).toUpperCase(); }

export function getAvatarColor(id: string | number) { return AVATAR_COLORS[Number(id) % AVATAR_COLORS.length]; }

export function formatDate(dateStr: string | null | undefined) { if (!dateStr) return '—'; try { const date = new Date(dateStr); if (isNaN(date.getTime())) return '—'; return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return '—'; } }

export default { sanitize, getInitials, getAvatarColor, formatDate, AVATAR_COLORS };
