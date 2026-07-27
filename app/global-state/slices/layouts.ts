// Migrado para TypeScript: 2026-02-25
// Global State: Layouts Slice
// Estado de layouts e UI
// Versao: 1.0.0-ENTERPRISE

export type ThemeMode = 'dark' | 'light';
export type DensityMode = 'compact' | 'normal' | 'comfortable';

export interface LayoutsState {
  readonly sidebarCollapsed: boolean;
  readonly sidebarVisible: boolean;
  readonly headerVisible: boolean;
  readonly footerVisible: boolean;
  readonly currentPanel: string | null;
  readonly currentView: string;
  readonly theme: ThemeMode;
  readonly density: DensityMode;
}

interface GlobalStateInstance {
  getState(slice: string): LayoutsState | undefined;
  dispatch(action: string, payload?: Record<string, unknown>): unknown;
}

export const LAYOUTS_SLICE = 'layouts' as const;

export const initialState: LayoutsState = {
  sidebarCollapsed: false,
  sidebarVisible: true,
  headerVisible: true,
  footerVisible: true,
  currentPanel: null,
  currentView: 'default',
  theme: 'dark',
  density: 'normal'
} as const;

export const actions = {
  TOGGLE_SIDEBAR: 'layouts/toggleSidebar',
  SET_SIDEBAR_COLLAPSED: 'layouts/setSidebarCollapsed',
  SET_CURRENT_PANEL: 'layouts/setCurrentPanel',
  SET_CURRENT_VIEW: 'layouts/setCurrentView',
  SET_THEME: 'layouts/setTheme'
} as const;

function getGS(): GlobalStateInstance | undefined {
  return (window as unknown as { GlobalState?: GlobalStateInstance }).GlobalState;
}

export function getLayoutsState(): LayoutsState {
  const gs = getGS();
  return gs?.getState?.(LAYOUTS_SLICE) || initialState;
}

export function isSidebarCollapsed(): boolean {
  return getLayoutsState().sidebarCollapsed === true;
}

export function getCurrentPanel(): string | null {
  return getLayoutsState().currentPanel;
}

export function getCurrentView(): string {
  return getLayoutsState().currentView;
}

export function getTheme(): ThemeMode {
  return getLayoutsState().theme || 'dark';
}

export function toggleSidebar(): unknown {
  const gs = getGS();
  return gs?.dispatch?.(actions.TOGGLE_SIDEBAR);
}

export function setCurrentPanel(panelId: string | null): unknown {
  const gs = getGS();
  return gs?.dispatch?.(actions.SET_CURRENT_PANEL, { panelId });
}

export default { LAYOUTS_SLICE, initialState, actions, getLayoutsState, isSidebarCollapsed, getCurrentPanel, getCurrentView, getTheme, toggleSidebar, setCurrentPanel };
