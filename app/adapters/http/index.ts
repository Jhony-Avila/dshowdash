// Migrado para TypeScript: 2026-02-25
// App Adapters: HTTP Client Wrapper
// Abstração para requisições HTTP
// Versão: 1.0.0-ENTERPRISE

export interface HttpRequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  headers?: Record<string, string>;
}

export interface HttpClient {
  get(url: string, options?: HttpRequestOptions): Promise<unknown>;
  post(url: string, data?: Record<string, unknown>, options?: HttpRequestOptions): Promise<unknown>;
  put(url: string, data?: Record<string, unknown>, options?: HttpRequestOptions): Promise<unknown>;
  delete(url: string, options?: HttpRequestOptions): Promise<unknown>;
}

const getApiClient = (): HttpClient | null =>
  (window as { ApiClient?: HttpClient }).ApiClient || null;

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
} as const;

export async function get(url: string, options: HttpRequestOptions = {}): Promise<unknown> {
  const client = getApiClient();
  if (client?.get) {
    return client.get(url, options);
  }
  const response = await fetch(url, {
    method: 'GET',
    headers: { ...DEFAULT_HEADERS, ...options.headers },
    ...options
  });
  return response.json();
}

export async function post(url: string, data: Record<string, unknown> = {}, options: HttpRequestOptions = {}): Promise<unknown> {
  const client = getApiClient();
  if (client?.post) {
    return client.post(url, data, options);
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { ...DEFAULT_HEADERS, ...options.headers },
    body: JSON.stringify(data),
    ...options
  });
  return response.json();
}

export async function put(url: string, data: Record<string, unknown> = {}, options: HttpRequestOptions = {}): Promise<unknown> {
  const client = getApiClient();
  if (client?.put) {
    return client.put(url, data, options);
  }
  const response = await fetch(url, {
    method: 'PUT',
    headers: { ...DEFAULT_HEADERS, ...options.headers },
    body: JSON.stringify(data),
    ...options
  });
  return response.json();
}

export async function del(url: string, options: HttpRequestOptions = {}): Promise<unknown> {
  const client = getApiClient();
  if (client?.delete) {
    return client.delete(url, options);
  }
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { ...DEFAULT_HEADERS, ...options.headers },
    ...options
  });
  return response.json();
}

export function createAbortController(): AbortController {
  return new AbortController();
}

export default { get, post, put, del, createAbortController };
