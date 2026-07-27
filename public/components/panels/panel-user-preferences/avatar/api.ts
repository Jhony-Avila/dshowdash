// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences:avatar-api
// PURPOSE: Avatar System - API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   AVATAR_TYPES from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   clearCache() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
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

import { AVATAR_TYPES } from './constants.js';
import * as avatarState from './state.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-preferences:avatar-api';

const ENDPOINTS = { GET: '/api/user/avatar.php', SAVE: '/api/user/avatar.php', UPLOAD: '/api/user/avatar-upload.php', DELETE: '/api/user/avatar.php' };
let _metrics = { fetchCount: 0, saveCount: 0, uploadCount: 0, errorCount: 0, cacheHits: 0 };
let _cache: { data: unknown; timestamp: number; ttl: number } = { data: null, timestamp: 0, ttl: 60000 };

async function _fetch(url: string, options: Record<string, unknown> = {}) {
  const defaultOptions = { credentials: 'include', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };
  const mergedOptions = { ...defaultOptions, ...options };
  if (options.headers) { mergedOptions.headers = { ...defaultOptions.headers, ...(options.headers as Record<string, string>) }; }
  const response = await fetch(url, mergedOptions as RequestInit);

  if (!response.ok) { const error = Object.assign(new Error(`HTTP ${response.status}: ${response.statusText}`), { status: response.status }); throw error; }
  return response.json();
}

export async function loadAvatar(options: Record<string, unknown> = {}) {
  const { forceRefresh = false, userId = null } = options;
  if (!forceRefresh && _cache.data && (Date.now() - _cache.timestamp) < _cache.ttl) { _metrics.cacheHits++; avatarState.setCurrent(_cache.data as Record<string, unknown>); return { ok: true, data: _cache.data, cached: true }; }
  _metrics.fetchCount++; avatarState.setLoading(true); avatarState.clearError();
  try {
    const url = userId ? `${ENDPOINTS.GET}?user_id=${userId}` : ENDPOINTS.GET;
    const result = await _fetch(url, { signal: options.signal });
    if (result.ok && result.data) { const avatar = normalizeAvatar(result.data); _cache.data = avatar; _cache.timestamp = Date.now(); avatarState.setCurrent(avatar); return { ok: true, data: avatar, cached: false }; }
    const fallback = createFallbackAvatar(result.data?.user); avatarState.setCurrent(fallback); return { ok: true, data: fallback, isFallback: true };
  } catch (err) { const error = err as Error; _metrics.errorCount++; avatarState.setError(error.message); const fallback = createFallbackAvatar(); avatarState.setCurrent(fallback); return { ok: false, error: error.message, data: fallback }; }
  finally { avatarState.setLoading(false); }
}

export async function saveAvatar(config: Record<string, unknown>, { signal }: { signal?: AbortSignal } = {}) {
  if (!config) return { ok: false, error: 'no-config' };
  _metrics.saveCount++; avatarState.setSaving(true); avatarState.clearError();
  try {
    const payload = { avatar_type: AVATAR_TYPES.GENERATED, avatar_config: config, version: (avatarState.getCurrent()?.version || 0) + 1 };
    const result = await _fetch(ENDPOINTS.SAVE, { method: 'POST', body: JSON.stringify(payload), signal });
    if (result.ok) { const avatar = normalizeAvatar(result.data); _cache.data = avatar; _cache.timestamp = Date.now(); avatarState.closeEditor(true); return { ok: true, data: avatar }; }
    throw new Error(result.error || 'Erro ao salvar avatar');
  } catch (err) { const error = err as Error; _metrics.errorCount++; avatarState.setError(error.message); return { ok: false, error: error.message }; }
  finally { avatarState.setSaving(false); }
}

export async function uploadAvatarImage(file: File, { signal }: { signal?: AbortSignal } = {}) {
  if (!file) return { ok: false, error: 'no-file' };
  const maxSize = 5 * 1024 * 1024; const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (file.size > maxSize) { return { ok: false, error: 'file-too-large', maxSize }; }
  if (!allowedTypes.includes(file.type)) { return { ok: false, error: 'invalid-type', allowedTypes }; }
  _metrics.uploadCount++; avatarState.setSaving(true); avatarState.clearError();
  try {
    const formData = new FormData(); formData.append('avatar', file);
    const response = await fetch(ENDPOINTS.UPLOAD, { method: 'POST', credentials: 'include', body: formData, signal });
    if (!response.ok) { throw new Error(`HTTP ${response.status}: ${response.statusText}`); }
    const result = await response.json();
    if (result.ok) { const avatar = normalizeAvatar(result.data); _cache.data = avatar; _cache.timestamp = Date.now(); avatarState.setCurrent(avatar); return { ok: true, data: avatar }; }
    throw new Error(result.error || 'Erro ao fazer upload');
  } catch (err) { const error = err as Error; _metrics.errorCount++; avatarState.setError(error.message); return { ok: false, error: error.message }; }
  finally { avatarState.setSaving(false); }
}

export async function deleteAvatar({ signal }: { signal?: AbortSignal } = {}) {
  _metrics.saveCount++; avatarState.setSaving(true); avatarState.clearError();
  try {
    const result = await _fetch(ENDPOINTS.DELETE, { method: 'DELETE', signal });
    if (result.ok) { const fallback = createFallbackAvatar(result.data?.user); _cache.data = fallback; _cache.timestamp = Date.now(); avatarState.setCurrent(fallback); return { ok: true, data: fallback }; }
    throw new Error(result.error || 'Erro ao remover avatar');
  } catch (err) { const error = err as Error; _metrics.errorCount++; avatarState.setError(error.message); return { ok: false, error: error.message }; }
  finally { avatarState.setSaving(false); }
}

function normalizeAvatar(data: Record<string, unknown> | null) {
  if (!data) return createFallbackAvatar();
  const user = data.user as Record<string, unknown> | undefined;
  return { id: data.id || null, userId: data.user_id || data.userId || null, type: data.avatar_type || data.type || AVATAR_TYPES.FALLBACK, config: data.avatar_config || data.config || null, imageUrl: data.avatar_image_url || data.imageUrl || null, version: data.version || 1, isActive: data.is_active !== false && data.isActive !== false, createdAt: data.created_at || data.createdAt || null, updatedAt: data.updated_at || data.updatedAt || null, initials: data.initials || extractInitials((user?.name as string) || (data.userName as string)), backgroundColor: data.backgroundColor || generateColor(data.user_id || data.userId) };
}

function createFallbackAvatar(user: Record<string, unknown> | null = null): { id: null; userId: unknown; type: string; config: null; imageUrl: null; version: number; isActive: boolean; initials: string; backgroundColor: string } {
  const name = (user?.name as string) || (user?.userName as string) || 'User'; const userId = user?.id || user?.userId || 0;
  return { id: null, userId, type: AVATAR_TYPES.FALLBACK, config: null, imageUrl: null, version: 0, isActive: true, initials: extractInitials(name), backgroundColor: generateColor(userId) };
}

function extractInitials(name: string) { if (!name) return '??'; const parts = name.trim().split(/\s+/); if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase(); return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase(); }
function generateColor(id: unknown) { const colors = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6']; const index = typeof id === 'number' ? id % colors.length : 0; return colors[index]; }
export function clearCache() { _cache = { data: null, timestamp: 0, ttl: 60000 }; }
export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { _metrics = { fetchCount: 0, saveCount: 0, uploadCount: 0, errorCount: 0, cacheHits: 0 }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, endpoints: ENDPOINTS, cacheStatus: { hasData: !!_cache.data, age: _cache.timestamp ? Date.now() - _cache.timestamp : null, ttl: _cache.ttl }, metrics: getMetrics() }; }
export function healthCheck() { const checks = { endpointsConfigured: !!ENDPOINTS.GET, stateAvailable: !!avatarState, noRecentErrors: _metrics.errorCount === 0 || _metrics.fetchCount > _metrics.errorCount * 2 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID }; }

export default { loadAvatar, saveAvatar, uploadAvatarImage, deleteAvatar, clearCache, getMetrics, resetMetrics, info, healthCheck, VERSION, MODULE_ID };
