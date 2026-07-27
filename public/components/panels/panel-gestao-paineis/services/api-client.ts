/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/services/api-client.ts
 * @version 1.1.0
 * API client for /api/admin/panels/*
 * FIX: triggerScreenshot aceita url para paineis sem rota
 * ═══════════════════════════════════════════════════════════════ */

import { API } from '../core/config.js';
import type { PanelData, PanelCategory, FilterState, PaginationState, ApiResponse } from '../core/types.js';

declare const window: Window & Record<string, any>;

function getCsrfToken(): string {
  if (window.SecurityCSRF?.getToken) {
    return window.SecurityCSRF.getToken();
  }
  const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  if (meta?.content) return meta.content;
  const cookie = document.cookie.split(';').find(c => c.trim().startsWith('csrf_token='));
  if (cookie) return cookie.split('=')[1]?.trim() ?? '';
  return '';
}

function buildHeaders(write = false): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (write) {
    const token = getCsrfToken();
    if (token) headers['X-CSRF-Token'] = token;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (response.status === 401) {
    window.location.href = '/login';
    throw new Error('AUTH_REQUIRED');
  }
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || json.meta?.message || `HTTP ${response.status}`);
  }
  return json as ApiResponse<T>;
}

export async function fetchPanels(
  filters: FilterState,
  pagination: Partial<PaginationState>,
  signal?: AbortSignal
): Promise<ApiResponse<PanelData[]>> {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (pagination.page) params.set('page', String(pagination.page));
  if (pagination.per_page) params.set('per_page', String(pagination.per_page));

  const url = `${API.panels}?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(),
    credentials: 'same-origin',
    signal,
  });
  return handleResponse<PanelData[]>(response);
}

export async function updatePanel(
  panelId: string,
  data: Partial<PanelData>,
  signal?: AbortSignal
): Promise<ApiResponse<{ updated_fields: string[]; updated_at: string }>> {
  const url = `${API.panels}?id=${encodeURIComponent(panelId)}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: buildHeaders(true),
    credentials: 'same-origin',
    body: JSON.stringify(data),
    signal,
  });
  return handleResponse<{ updated_fields: string[]; updated_at: string }>(response);
}

export async function fetchCategories(
  signal?: AbortSignal
): Promise<ApiResponse<PanelCategory[]>> {
  const response = await fetch(API.categories, {
    method: 'GET',
    headers: buildHeaders(),
    credentials: 'same-origin',
    signal,
  });
  return handleResponse<PanelCategory[]>(response);
}

export async function fetchScreenshotHistory(
  panelId: string,
  signal?: AbortSignal
): Promise<ApiResponse<Array<{ id: number; created_at: string; file_size: number; path: string }>>> {
  const url = `${API.panels}/${encodeURIComponent(panelId)}/screenshots`;
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(),
    credentials: 'same-origin',
    signal,
  });
  return handleResponse<Array<{ id: number; created_at: string; file_size: number; path: string }>>(response);
}

export async function triggerScreenshot(
  panelId: string,
  options?: { width?: number; height?: number; format?: string; url?: string },
  signal?: AbortSignal
): Promise<ApiResponse<{ screenshot_id: number; panel_id: string; status: string; estimated_seconds: number; capture_url?: string }>> {
  const url = API.screenshot(panelId);
  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(true),
    credentials: 'same-origin',
    body: JSON.stringify(options ?? {}),
    signal,
  });
  return handleResponse<{ screenshot_id: number; panel_id: string; status: string; estimated_seconds: number; capture_url?: string }>(response);
}
