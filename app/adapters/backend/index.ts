// Migrado para TypeScript: 2026-02-25
// App Adapters: Backend Adapter
// Abstração para comunicação com APIs PHP
// Versão: 1.0.0-ENTERPRISE

import { get, post, put, del } from '../http/index.ts';
import type { HttpRequestOptions } from '../http/index.ts';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiErrorResponse {
  success: false;
  error: string;
}

const API_BASE = '/api' as const;

export async function apiCall(
  endpoint: string,
  method: HttpMethod = 'GET',
  data: Record<string, unknown> | null = null,
  options: HttpRequestOptions = {}
): Promise<unknown | ApiErrorResponse> {
  const url = `${API_BASE}/${endpoint}`.replace(/\/+/g, '/');

  try {
    switch (method.toUpperCase() as HttpMethod) {
      case 'GET':
        return await get(url, options);
      case 'POST':
        return await post(url, data ?? {}, options);
      case 'PUT':
        return await put(url, data ?? {}, options);
      case 'DELETE':
        return await del(url, options);
      default:
        throw new Error(`Método não suportado: ${method}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[BackendAdapter] API Error:', error);
    return { success: false, error: message } satisfies ApiErrorResponse;
  }
}

export async function fetchModule(
  moduleName: string,
  action: string,
  params: Record<string, unknown> = {}
): Promise<unknown | ApiErrorResponse> {
  return apiCall(`modules/${moduleName}/${action}.php`, 'POST', params);
}

export async function fetchData(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<unknown | ApiErrorResponse> {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  return apiCall(url, 'GET');
}

export async function saveData(
  endpoint: string,
  data: Record<string, unknown>
): Promise<unknown | ApiErrorResponse> {
  return apiCall(endpoint, 'POST', data);
}

export async function updateData(
  endpoint: string,
  data: Record<string, unknown>
): Promise<unknown | ApiErrorResponse> {
  return apiCall(endpoint, 'PUT', data);
}

export async function deleteData(
  endpoint: string
): Promise<unknown | ApiErrorResponse> {
  return apiCall(endpoint, 'DELETE');
}

export default { apiCall, fetchModule, fetchData, saveData, updateData, deleteData };
