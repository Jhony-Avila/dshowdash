// App DTOs - Data Transfer Objects v1.0.0
// Migrado para TypeScript: 2026-02-25

export const MODULE_ID = 'app-dto' as const;
export const VERSION = '1.0.0' as const;

// User DTO Interface
export interface IUserDTO {
  id: number;
  username: string;
  email: string;
  name: string;
  level: number;
  roles: string[];
  permissions: string[];
  avatar: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

// User DTO schema (mantido para compatibilidade)
export const UserDTO = {
  id: 'number',
  username: 'string',
  email: 'string',
  name: 'string',
  level: 'number',
  roles: ['string'],
  permissions: ['string'],
  avatar: 'string|null',
  createdAt: 'string',
  lastLoginAt: 'string|null'
} as const;

// Session DTO Interface
export interface ISessionDTO {
  id: string;
  userId: number;
  token: string;
  expiresAt: string;
  createdAt: string;
  ip: string;
  userAgent: string;
}

// Session DTO schema (mantido para compatibilidade)
export const SessionDTO = {
  id: 'string',
  userId: 'number',
  token: 'string',
  expiresAt: 'string',
  createdAt: 'string',
  ip: 'string',
  userAgent: 'string'
} as const;

// Route DTO Interface
export interface IRouteDTO {
  path: string;
  id: string;
  name: string;
  title: string;
  public: boolean;
  requiresAuth: boolean;
  permissions: string[];
  layout: string;
  defaultView: string;
  virtualDefaults: Record<string, unknown>;
}

// Route DTO schema (mantido para compatibilidade)
export const RouteDTO = {
  path: 'string',
  id: 'string',
  name: 'string',
  title: 'string',
  public: 'boolean',
  requiresAuth: 'boolean',
  permissions: ['string'],
  layout: 'string',
  defaultView: 'string',
  virtualDefaults: 'object'
} as const;

// Virtual Route DTO Interface
export interface IVirtualRouteDTO {
  view: string;
  tab: string | null;
  section: string | null;
  entity: string | null;
  id: string | null;
  mode: string;
  page: number;
  sort: string | null;
  filters: string | null;
  extras: Record<string, unknown>;
}

// Virtual Route DTO schema (mantido para compatibilidade)
export const VirtualRouteDTO = {
  view: 'string',
  tab: 'string|null',
  section: 'string|null',
  entity: 'string|null',
  id: 'string|null',
  mode: 'string',
  page: 'number',
  sort: 'string|null',
  filters: 'string|null',
  extras: 'object'
} as const;
