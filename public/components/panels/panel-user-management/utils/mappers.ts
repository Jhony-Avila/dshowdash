// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-management-mappers
// PURPOSE: Panel User Management - Mappers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   sanitizeString from ./validators.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   mapUserDtoToViewModel() — exported function
//   mapUserListToViewModel() — exported function
//   mapRoleDtoToViewModel() — exported function
//   mapRoleListToViewModel() — exported function
//   mapSessionDtoToViewModel() — exported function
//   mapSessionListToViewModel() — exported function
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

import { sanitizeString } from './validators.js';

export const MODULE_ID = 'panel-user-management-mappers';
export const VERSION = '9.3.0-P2-ENTERPRISE';

// SVGs enterprise (substituem emojis)
const SVGS = {
  monitor: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  smartphone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  helpCircle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  globe: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  firefox: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff7139" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0-7.5 16.5"/></svg>',
  compass: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>'
};

function getStatusLabel(status: string) {
  const labels: Record<string, string> = { active: 'Ativo', inactive: 'Inativo', disabled: 'Inativo', suspended: 'Suspenso', pending: 'Pendente' };
  return labels[status] || 'Desconhecido';
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = { active: 'success', inactive: 'secondary', disabled: 'secondary', suspended: 'danger', pending: 'warning' };
  return colors[status] || 'secondary';
}

function getUserLevelLabel(level: number) {
  const labels: Record<number, string> = { 1: 'Usuário', 2: 'Operador', 3: 'Gerente', 4: 'Admin', 5: 'Super Admin' };
  return labels[level] || 'Usuário';
}

function formatRoles(roles: unknown[]) {
  if (!Array.isArray(roles) || roles.length === 0) return 'Sem roles';
  const r0 = roles[0] as Record<string, unknown>; if (roles.length === 1) return (r0.role_name || r0.name || roles[0]) as string;
  return `${roles.length} roles`;
}

function getInitials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  const filtered = [];
  for (let i = 0; i < parts.length; i++) { if (parts[i]) filtered.push(parts[i]); }
  if (filtered.length >= 2) return (filtered[0][0] + filtered[filtered.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return '—'; }
}

function getDeviceIcon(deviceType: string) {
  const icons: Record<string, string> = { Desktop: SVGS.monitor, Mobile: SVGS.smartphone, Tablet: SVGS.smartphone, Unknown: SVGS.helpCircle };
  return icons[deviceType] || icons.Unknown;
}

function getBrowserIcon(browser: string) {
  if (!browser) return SVGS.globe;
  const b = browser.toLowerCase();
  if (b.indexOf('chrome') !== -1) return SVGS.globe;
  if (b.indexOf('firefox') !== -1) return SVGS.firefox;
  if (b.indexOf('safari') !== -1) return SVGS.compass;
  if (b.indexOf('edge') !== -1) return SVGS.globe;
  return SVGS.globe;
}

function maskIp(ip: string) {
  if (!ip) return '—';
  const parts = ip.split('.');
  if (parts.length !== 4) return ip;
  return `${parts[0]}.${parts[1]}.***.***`;
}

// Mapeia DTO de usuário da API para ViewModel
export function mapUserDtoToViewModel(dto: Record<string, unknown>) {
  if (!dto) return null;
  return {
    id: Number(dto.id),
    username: sanitizeString(dto.username || ''),
    nome: sanitizeString(dto.nome || dto.name || ''),
    name: sanitizeString(dto.nome || dto.name || ''),
    nome_completo: sanitizeString(dto.nome_completo || ''),
    nome_resumido: sanitizeString(dto.nome_resumido || ''),
    email: sanitizeString(dto.email || '').toLowerCase(),
    status: dto.status || 'unknown',
    statusLabel: getStatusLabel(String(dto.status || '')),
    statusColor: getStatusColor(String(dto.status || '')),
    role: sanitizeString(dto.role || ''),
    roles: Array.isArray(dto.roles) ? dto.roles : [],
    rolesDisplay: formatRoles(Array.isArray(dto.roles) ? dto.roles : []),
    userLevel: Number(dto.userLevel || dto.user_level || 1),
    userLevelLabel: getUserLevelLabel(Number(dto.userLevel || dto.user_level || 1)),
    avatar_url: dto.avatar_url || dto.avatar || null,
    avatar: dto.avatar_url || dto.avatar || null,
    initials: getInitials(String(dto.nome_completo || dto.nome || dto.name || dto.username || '')),
    funcao: sanitizeString(dto.funcao || ''),
    departamento: sanitizeString(dto.departamento || ''),
    id_cargo: dto.id_cargo || null,
    id_matricula: dto.id_matricula || null,
    createdAt: dto.createdAt || dto.created_at || null,
    created_at: dto.created_at || dto.createdAt || null,
    createdAtFormatted: formatDate(String(dto.createdAt || dto.created_at || '') || null),
    lastLoginAt: dto.lastLoginAt || dto.last_login_at || null,
    last_login_at: dto.last_login_at || dto.lastLoginAt || null,
    lastLoginAtFormatted: formatDate(String(dto.lastLoginAt || dto.last_login_at || '') || null),
    updatedAt: dto.updatedAt || dto.updated_at || null,
    updated_at: dto.updated_at || dto.updatedAt || null,
    isActive: dto.status === 'active',
    canEdit: true,
    canDelete: dto.status !== 'active'
  };
}

// Mapeia lista de usuários
export function mapUserListToViewModel(users: unknown[]) {
  if (!Array.isArray(users)) return [];
  const result = [];
  for (let i = 0; i < users.length; i++) {
    const mapped = mapUserDtoToViewModel(users[i] as Record<string, unknown>);
    if (mapped) result.push(mapped);
  }
  return result;
}

// Mapeia DTO de role para ViewModel
export function mapRoleDtoToViewModel(dto: Record<string, unknown>) {
  if (!dto) return null;
  return {
    id: Number(dto.id),
    name: sanitizeString(dto.role_name || dto.name || ''),
    role_name: sanitizeString(dto.role_name || dto.name || ''),
    role_key: sanitizeString(dto.role_key || ''),
    description: sanitizeString(dto.description || ''),
    level: Number(dto.level || 1),
    permissions: Array.isArray(dto.permissions) ? dto.permissions : [],
    permissionsCount: Array.isArray(dto.permissions) ? dto.permissions.length : 0
  };
}

// Mapeia lista de roles
export function mapRoleListToViewModel(roles: unknown[]) {
  if (!Array.isArray(roles)) return [];
  const result = [];
  for (let i = 0; i < roles.length; i++) {
    const mapped = mapRoleDtoToViewModel(roles[i] as Record<string, unknown>);
    if (mapped) result.push(mapped);
  }
  return result;
}

// Mapeia DTO de sessão para ViewModel
export function mapSessionDtoToViewModel(dto: Record<string, unknown>) {
  if (!dto) return null;
  return {
    id: String(dto.id),
    userId: Number(dto.userId || dto.user_id),
    deviceType: sanitizeString(String(dto.deviceType || dto.device_type || 'Desktop')),
    deviceIcon: getDeviceIcon(String(dto.deviceType || dto.device_type || 'Unknown')),
    browser: sanitizeString(String(dto.browser || 'Unknown')),
    browserIcon: getBrowserIcon(String(dto.browser || '')),
    ip: sanitizeString(String(dto.ip || dto.origin_ip || '')),
    ipMasked: maskIp(String(dto.ip || dto.origin_ip || '')),
    createdAt: dto.createdAt || dto.created_at || null,
    createdAtFormatted: formatDate(String(dto.createdAt || dto.created_at || '') || null),
    lastActivity: dto.lastActivity || dto.last_activity_at || dto.last_activity || null,
    lastActivityFormatted: formatDate(String(dto.lastActivity || dto.last_activity_at || dto.last_activity || '') || null),
    isCurrentSession: dto.isCurrent || dto.is_current || false,
    isActive: dto.is_active === 1 || dto.is_active === true
  };
}

// Mapeia lista de sessões
export function mapSessionListToViewModel(sessions: unknown[]) {
  if (!Array.isArray(sessions)) return [];
  const result = [];
  for (let i = 0; i < sessions.length; i++) {
    const mapped = mapSessionDtoToViewModel(sessions[i] as Record<string, unknown>);
    if (mapped) result.push(mapped);
  }
  return result;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID, VERSION, mapUserDtoToViewModel, mapUserListToViewModel, mapRoleDtoToViewModel, mapRoleListToViewModel, mapSessionDtoToViewModel, mapSessionListToViewModel, info, healthCheck };
