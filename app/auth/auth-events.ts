// Migrado para TypeScript: 2026-02-25
// App Auth: Auth Events Facade
// @version 2.0.0-ENTERPRISE
// Reexporta de /app/events/events-contracts.js (FONTE CANONICA)
// Adiciona helpers para emitir/ouvir eventos

import { AUTH_EVENTS, AUTH_STATES, AUTH_DATA_ATTRIBUTES } from '../events/events-contracts.ts';
import type { EventBusInstance, EventHandler, Unsubscribe } from '../core/event-bus/index.ts';

// ---------------------------------------------------------------
// Tipos derivados das constantes canonicas
// ---------------------------------------------------------------

/** Valores validos de AUTH_EVENTS */
export type AuthEventName = typeof AUTH_EVENTS[keyof typeof AUTH_EVENTS];

/** Valores validos de AUTH_STATES */
export type AuthStateName = typeof AUTH_STATES[keyof typeof AUTH_STATES];

/** Valores validos de AUTH_DATA_ATTRIBUTES */
export type AuthDataAttribute = typeof AUTH_DATA_ATTRIBUTES[keyof typeof AUTH_DATA_ATTRIBUTES];

// ---------------------------------------------------------------
// Interfaces para payloads de eventos
// ---------------------------------------------------------------

export interface AuthEventPayload {
  timestamp: number;
  [key: string]: unknown;
}

export interface UserData {
  id?: string | number;
  name?: string;
  username?: string;
  level?: string;
  role?: string;
  [key: string]: unknown;
}

export interface LogoutPayload extends AuthEventPayload {
  reason: string;
}

export interface LoginRequiredPayload extends AuthEventPayload {
  source: string;
}

export interface SessionCheckedPayload extends AuthEventPayload {
  authenticated: boolean;
}

// Window types declarados em app/events/events-contracts.ts e app/core/event-bus/index.ts

// ---------------------------------------------------------------
// Reexportar da fonte canonica
// ---------------------------------------------------------------

export { AUTH_EVENTS, AUTH_STATES, AUTH_DATA_ATTRIBUTES };

// ---------------------------------------------------------------
// Helpers para emitir eventos
// ---------------------------------------------------------------

export function emitAuthEvent(event: AuthEventName, data: Record<string, unknown> = {}): boolean {
  const bus: EventBusInstance | undefined = window.EventBus;
  if (bus && typeof bus.emit === 'function') {
    return bus.emit(event, { ...data, timestamp: Date.now() } satisfies AuthEventPayload);
  }
  return false;
}

// ---------------------------------------------------------------
// Helper para ouvir eventos
// ---------------------------------------------------------------

export function onAuthEvent(event: AuthEventName, handler: EventHandler): Unsubscribe {
  const bus: EventBusInstance | undefined = window.EventBus;
  if (bus && typeof bus.on === 'function') {
    return bus.on(event, handler);
  }
  return () => {};
}

// ---------------------------------------------------------------
// Helper para remover listener
// ---------------------------------------------------------------

export function offAuthEvent(event: AuthEventName, handler: EventHandler): void {
  const bus: EventBusInstance | undefined = window.EventBus;
  if (bus && typeof bus.off === 'function') {
    return bus.off(event, handler);
  }
}

// ---------------------------------------------------------------
// Emitir eventos especificos
// ---------------------------------------------------------------

export function emitLoginSuccess(userData: Record<string, unknown> = {}): boolean {
  return emitAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, userData);
}

export function emitLogout(reason: string = 'user'): boolean {
  return emitAuthEvent(AUTH_EVENTS.LOGOUT, { reason });
}

export function emitLoginRequired(source: string = 'unknown'): boolean {
  return emitAuthEvent(AUTH_EVENTS.LOGIN_REQUIRED, { source });
}

export function emitSessionChecked(authenticated: boolean = false): boolean {
  return emitAuthEvent(AUTH_EVENTS.SESSION_CHECKED, { authenticated });
}

// ---------------------------------------------------------------
// Default export (preserva contrato original)
// ---------------------------------------------------------------

export default {
  AUTH_EVENTS,
  AUTH_STATES,
  AUTH_DATA_ATTRIBUTES,
  emitAuthEvent,
  onAuthEvent,
  offAuthEvent,
  emitLoginSuccess,
  emitLogout,
  emitLoginRequired,
  emitSessionChecked
} as const;
