// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-management-validators
// PURPOSE: Panel User Management - Validators
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   sanitizeString() — exported function
//   truncate() — exported function
//   isValidEmail() — exported function
//   validateUser() — exported function
//   validateRole() — exported function
//   validateSession() — exported function
//   validateFilters() — exported function
//   containsSensitiveData() — exported function
//   removeSensitiveData() — exported function
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

export const MODULE_ID = 'panel-user-management-validators';
export const VERSION = '9.3.0-P2-ENTERPRISE';

// Sanitiza string contra XSS
export function sanitizeString(str: unknown) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').trim();
}

// Trunca texto muito longo
export function truncate(str: unknown, maxLength?: number) {
  maxLength = maxLength || 100;
  if (typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - 3)}...`;
}

// Valida email
export function isValidEmail(email: unknown) {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Valida usuário - PRESERVA CADA CAMPO
export function validateUser(user: unknown) {
  const errors: string[] = [];
  const normalized: Record<string, any> = {};
  if (!user || typeof user !== 'object') {
    return { valid: false, errors: ['Dados de usuário inválidos'], normalizedUser: null };
  }
  const u = user as any;
  if (u.id === undefined || u.id === null) { errors.push('ID é obrigatório'); }
  else { normalized.id = Number(u.id); }
  if (!u.username || typeof u.username !== 'string') { errors.push('Username é obrigatório'); }
  else { normalized.username = sanitizeString(u.username); }
  if (!u.email) { errors.push('Email é obrigatório'); }
  else if (!isValidEmail(u.email)) { errors.push('Email inválido'); }
  else { normalized.email = sanitizeString(u.email).toLowerCase(); }
  normalized.nome = sanitizeString(u.nome || u.name || '');
  normalized.name = normalized.nome;
  normalized.nome_completo = sanitizeString(u.nome_completo || '');
  normalized.nome_resumido = sanitizeString(u.nome_resumido || '');
  const validStatus = ['active', 'inactive', 'disabled', 'suspended', 'pending'];
  normalized.status = validStatus.indexOf(u.status) !== -1 ? u.status : 'active';
  normalized.roles = Array.isArray(u.roles) ? u.roles : [];
  normalized.role = typeof u.role === 'string' ? sanitizeString(u.role) : '';
  normalized.userLevel = typeof u.userLevel === 'number' ? u.userLevel : 1;
  normalized.createdAt = u.createdAt || u.created_at || null;
  normalized.created_at = u.created_at || u.createdAt || null;
  normalized.lastLoginAt = u.lastLoginAt || u.last_login_at || null;
  normalized.last_login_at = u.last_login_at || u.lastLoginAt || null;
  normalized.updatedAt = u.updatedAt || u.updated_at || null;
  normalized.updated_at = u.updated_at || u.updatedAt || null;
  normalized.avatar_url = u.avatar_url || u.avatar || null;
  normalized.avatar = u.avatar_url || u.avatar || null;
  normalized.funcao = sanitizeString(u.funcao || '');
  normalized.departamento = sanitizeString(u.departamento || '');
  normalized.id_cargo = u.id_cargo || null;
  normalized.id_matricula = u.id_matricula || null;
  normalized.locale = u.locale || 'pt-BR';
  return { valid: errors.length === 0, errors, normalizedUser: errors.length === 0 ? normalized : null };
}

// Valida role
export function validateRole(role: unknown) {
  const errors: string[] = [];
  const normalized: Record<string, any> = {};
  if (!role || typeof role !== 'object') {
    return { valid: false, errors: ['Dados de role inválidos'], normalizedRole: null };
  }
  const r = role as any;
  if (r.id === undefined) { errors.push('ID é obrigatório'); }
  else { normalized.id = Number(r.id); }
  if (!r.name && !r.role_name) { errors.push('Nome é obrigatório'); }
  else { normalized.name = sanitizeString(r.role_name || r.name || ''); }
  normalized.role_name = normalized.name;
  normalized.role_key = sanitizeString(r.role_key || '');
  normalized.description = sanitizeString(r.description || '');
  normalized.level = typeof r.level === 'number' ? r.level : 1;
  normalized.permissions = Array.isArray(r.permissions) ? r.permissions : [];
  return { valid: errors.length === 0, errors, normalizedRole: errors.length === 0 ? normalized : null };
}

// Valida sessão
export function validateSession(session: unknown) {
  const errors: string[] = [];
  const normalized: Record<string, any> = {};
  if (!session || typeof session !== 'object') {
    return { valid: false, errors: ['Dados de sessão inválidos'], normalizedSession: null };
  }
  const s = session as any;
  if (!s.id) { errors.push('ID é obrigatório'); }
  else { normalized.id = String(s.id); }
  normalized.userId = Number(s.userId || s.user_id);
  normalized.deviceType = sanitizeString(s.deviceType || s.device_type || 'Unknown');
  normalized.browser = sanitizeString(s.browser || 'Unknown');
  normalized.ip = sanitizeString(s.ip || s.origin_ip || '');
  normalized.createdAt = s.createdAt || s.created_at || null;
  normalized.lastActivity = s.lastActivity || s.last_activity_at || s.last_activity || null;
  normalized.isActive = s.is_active === 1 || s.is_active === true;
  return { valid: errors.length === 0, errors, normalizedSession: errors.length === 0 ? normalized : null };
}

// Valida filtros
export function validateFilters(filters: Record<string, unknown> | null) {
  const normalized = {
    search: sanitizeString(filters ? String(filters.search || '') : ''),
    status: ['', 'active', 'inactive', 'disabled', 'suspended', 'all'].indexOf(filters ? String(filters.status) : '') !== -1 ? String(filters?.status || '') : '',
    role: sanitizeString(filters ? String(filters.role || '') : ''),
    limit: Math.min(Math.max(Number(filters ? filters.limit : 20) || 20, 1), 100),
    offset: Math.max(Number(filters ? filters.offset : 0) || 0, 0)
  };
  return { valid: true, errors: [] as string[], normalizedFilters: normalized };
}

// Verifica se dados sensíveis estão sendo expostos
export function containsSensitiveData(obj: unknown) {
  const sensitiveKeys = ['password', 'senha', 'token', 'secret', 'hash', 'salt', 'apiKey', 'api_key'];
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as any;
  const objKeys = Object.keys(o);
  for (let i = 0; i < objKeys.length; i++) {
    const key = objKeys[i];
    for (let j = 0; j < sensitiveKeys.length; j++) {
      if (key.toLowerCase().indexOf(sensitiveKeys[j].toLowerCase()) !== -1) return true;
    }
  }
  return false;
}

// Remove dados sensíveis
export function removeSensitiveData(obj: unknown) {
  if (!obj || typeof obj !== 'object') return obj;
  const ro = obj as any;
  const sensitiveKeys = ['password', 'senha', 'token', 'secret', 'hash', 'salt', 'apiKey', 'api_key'];
  const cleaned: Record<string, any> = {};
  for (const k in ro) { if (ro.hasOwnProperty(k)) cleaned[k] = ro[k]; }
  for (let i = 0; i < sensitiveKeys.length; i++) {
    const sens = sensitiveKeys[i];
    const cleanedKeys = Object.keys(cleaned);
    for (let j = 0; j < cleanedKeys.length; j++) {
      if (cleanedKeys[j].toLowerCase().indexOf(sens.toLowerCase()) !== -1) {
        delete cleaned[cleanedKeys[j]];
      }
    }
  }
  return cleaned;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { MODULE_ID, VERSION, sanitizeString, truncate, isValidEmail, validateUser, validateRole, validateSession, validateFilters, containsSensitiveData, removeSensitiveData, info, healthCheck };
