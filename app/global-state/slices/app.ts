// Migrado para TypeScript: 2026-02-25
// Global State: App Slice
// Estado da aplicacao principal
// Versao: 1.0.0-ENTERPRISE

export interface AppState {
  readonly ready: boolean;
  readonly loading: boolean;
  readonly error: string | null;
  readonly environment: 'production' | 'staging' | 'development';
  readonly version: string;
  readonly debug: boolean;
  readonly initialized: boolean;
}

interface GlobalStateInstance {
  getState(slice: string): AppState | undefined;
  dispatch(action: string, payload?: Record<string, unknown>): unknown;
}

export const APP_SLICE = 'app' as const;

export const initialState: AppState = {
  ready: false,
  loading: false,
  error: null,
  environment: 'production',
  version: '3.0.0',
  debug: false,
  initialized: false
} as const;

export const actions = {
  SET_READY: 'app/setReady',
  SET_LOADING: 'app/setLoading',
  SET_ERROR: 'app/setError',
  SET_DEBUG: 'app/setDebug',
  INITIALIZE: 'app/initialize'
} as const;

function getGS(): GlobalStateInstance | undefined {
  return (window as unknown as { GlobalState?: GlobalStateInstance }).GlobalState;
}

export function getAppState(): AppState {
  const gs = getGS();
  return gs?.getState?.(APP_SLICE) || initialState;
}

export function setAppReady(ready: boolean = true): unknown {
  const gs = getGS();
  return gs?.dispatch?.(actions.SET_READY, { ready });
}

export function setAppLoading(loading: boolean = true): unknown {
  const gs = getGS();
  return gs?.dispatch?.(actions.SET_LOADING, { loading });
}

export function setAppError(error: string | null): unknown {
  const gs = getGS();
  return gs?.dispatch?.(actions.SET_ERROR, { error });
}

export default { APP_SLICE, initialState, actions, getAppState, setAppReady, setAppLoading, setAppError };
