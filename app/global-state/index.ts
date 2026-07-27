// Migrado para TypeScript: 2026-02-25
// App Global State - Central Export
// Versao: 2.0.0-ENTERPRISE

export * from './slices/index.ts';

interface GlobalStateInstance {
  getState(slice?: string): Record<string, unknown> | undefined;
  dispatch(action: string, payload?: Record<string, unknown>): unknown;
  subscribe(listener: (state: Record<string, unknown>) => void): () => void;
}

function getGlobalStateCore(): GlobalStateInstance | null {
  return (window as unknown as { GlobalState?: GlobalStateInstance }).GlobalState || null;
}

export function getGlobalState(): GlobalStateInstance | null {
  return getGlobalStateCore();
}

export function getState(slice: string | null = null): Record<string, unknown> | null | undefined {
  const gs = getGlobalStateCore();
  if (!gs) return null;
  return slice ? gs.getState?.(slice) : gs.getState?.();
}

export function dispatch(action: string, payload: Record<string, unknown> = {}): unknown {
  const gs = getGlobalStateCore();
  return gs?.dispatch?.(action, payload);
}

export function subscribe(listener: (state: Record<string, unknown>) => void): () => void {
  const gs = getGlobalStateCore();
  return gs?.subscribe?.(listener) || (() => {});
}

export default { getGlobalState, getState, dispatch, subscribe };
