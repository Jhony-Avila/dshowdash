// Migrado para TypeScript: 2026-02-25
// Router Global - Utils v7.1.0
// @version 7.1.0-ENTERPRISE

// ═══════════════════════════════════════════════════════════════
// Interfaces
// ═══════════════════════════════════════════════════════════════

export interface RouteInfo {
  path: string;
  page?: string;
  id?: string;
  title?: string;
  layout?: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
  hash?: string;
  public?: boolean;
  requiresAuth?: boolean;
  permissions?: string[];
  defaultView?: string;
  defaultHash?: string;
  virtualDefaults?: Record<string, unknown>;
  timestamp?: number;
  [key: string]: unknown;
}

export interface NavigationResult {
  ok: boolean;
  reason: string | null;
  blockedBy: string | null;
  route: RouteInfo | null;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
// Funções
// ═══════════════════════════════════════════════════════════════

export function normalizePath(path: unknown): string {
  if (!path || typeof path !== 'string') return '/';
  let normalized = path.trim();
  if (normalized.startsWith('#')) normalized = normalized.substring(1);
  const queryIndex = normalized.indexOf('?');
  if (queryIndex !== -1) normalized = normalized.substring(0, queryIndex);
  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  normalized = normalized.replace(/\/+/g, '/');
  if (normalized.length > 1 && normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  return normalized || '/';
}

export function createNavigationResult(
  ok: boolean,
  reason: string | null = null,
  blockedBy: string | null = null,
  route: RouteInfo | null = null
): NavigationResult {
  return { ok, reason, blockedBy, route, timestamp: Date.now() };
}
