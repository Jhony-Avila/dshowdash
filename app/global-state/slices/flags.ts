// Migrado para TypeScript: 2026-02-25
// Global State: Feature Flags Slice
// Estado de feature flags
// Versao: 1.0.0-ENTERPRISE

export interface FlagMap {
  readonly [flag: string]: boolean;
}

export interface FlagsState {
  readonly enabled: FlagMap;
  readonly overrides: FlagMap;
  readonly lastUpdated: string | null;
}

interface GlobalStateInstance {
  getState(slice: string): FlagsState | undefined;
  dispatch(action: string, payload?: Record<string, unknown>): unknown;
}

export const FLAGS_SLICE = 'flags' as const;

export const initialState: FlagsState = {
  enabled: {},
  overrides: {},
  lastUpdated: null
} as const;

export const actions = {
  SET_FLAG: 'flags/set',
  CLEAR_FLAGS: 'flags/clear',
  SET_OVERRIDE: 'flags/setOverride',
  REMOVE_OVERRIDE: 'flags/removeOverride'
} as const;

function getGS(): GlobalStateInstance | undefined {
  return (window as unknown as { GlobalState?: GlobalStateInstance }).GlobalState;
}

export function getFlagsState(): FlagsState {
  const gs = getGS();
  return gs?.getState?.(FLAGS_SLICE) || initialState;
}

export function isFeatureEnabled(flag: string): boolean {
  const state = getFlagsState();
  if (state.overrides?.[flag] !== undefined) {
    return state.overrides[flag] === true;
  }
  return state.enabled?.[flag] === true;
}

export function getAllFlags(): FlagMap {
  return getFlagsState().enabled || {};
}

export function setFlag(flag: string, enabled: boolean = true): unknown {
  const gs = getGS();
  return gs?.dispatch?.(actions.SET_FLAG, { flag, enabled });
}

export function setFlagOverride(flag: string, value: boolean): unknown {
  const gs = getGS();
  return gs?.dispatch?.(actions.SET_OVERRIDE, { flag, value });
}

export default { FLAGS_SLICE, initialState, actions, getFlagsState, isFeatureEnabled, getAllFlags, setFlag, setFlagOverride };
