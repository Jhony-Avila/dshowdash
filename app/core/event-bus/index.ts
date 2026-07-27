// App Core: EventBus Wrapper
// Reexporta de public/core/js/EventBus.js
// Versão: 1.0.0-ENTERPRISE
// Migrado para TypeScript: 2026-02-25

export type EventHandler<T = unknown> = (data: T) => void;
export type Unsubscribe = () => void;

export interface EventBusInstance {
  emit: (event: string, data?: unknown) => boolean;
  on: (event: string, handler: EventHandler) => Unsubscribe;
  off: (event: string, handler: EventHandler) => void;
  once: (event: string, handler: EventHandler) => Unsubscribe;
  [key: string]: unknown;
}

const getEventBusCore = (): EventBusInstance | null => (window.EventBus as EventBusInstance | undefined) || null;

export function getEventBus(): EventBusInstance | null {
  return getEventBusCore();
}

export function emit(event: string, data: unknown = {}): boolean {
  const bus = getEventBusCore();
  if (bus && typeof bus.emit === 'function') {
    return bus.emit(event, data);
  }
  return false;
}

export function on(event: string, handler: EventHandler): Unsubscribe {
  const bus = getEventBusCore();
  if (bus && typeof bus.on === 'function') {
    return bus.on(event, handler);
  }
  return () => {};
}

export function off(event: string, handler: EventHandler): void {
  const bus = getEventBusCore();
  if (bus && typeof bus.off === 'function') {
    return bus.off(event, handler);
  }
}

export function once(event: string, handler: EventHandler): Unsubscribe {
  const bus = getEventBusCore();
  if (bus && typeof bus.once === 'function') {
    return bus.once(event, handler);
  }
  return () => {};
}

export default { getEventBus, emit, on, off, once };
