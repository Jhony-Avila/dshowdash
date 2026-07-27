// Migrado para TypeScript: 2026-02-25
'use strict';
// App Shell - Adapter Bridge v1.0.0-ENTERPRISE
// Bridge para /public/components/app-shell/index.js

// ---------- Interfaces ----------

interface AppShellStatus {
  mounted: boolean;
  [key: string]: unknown;
}

interface AppShellInfo {
  version: string;
  moduleId: string;
  legacy: string;
}

interface AppShellComponentType {
  mount?: (container: HTMLElement) => void;
  unmount?: () => void;
  getStatus?: () => AppShellStatus;
  isReady?: () => boolean;
  adapter?: unknown;
  layoutManager?: unknown;
  [key: string]: unknown;
}

interface AppShellAPI {
  mount: (container: HTMLElement) => void | undefined;
  unmount: () => void | undefined;
  getStatus: () => AppShellStatus;
  isReady: () => boolean;
  getAdapter: () => unknown;
  getLayoutManager: () => unknown;
  info: () => AppShellInfo;
}

// ---------- Imports ----------

import AppShellComponent from '/components/app-shell/index.js';

const _component = AppShellComponent as AppShellComponentType | undefined;

// ---------- Constants ----------

export const VERSION: string = '1.0.0-ENTERPRISE';
export const MODULE_ID: string = 'app-shell-adapter';

// Re-export tudo do componente legado
export * from '/components/app-shell/index.js';
export { AppShellComponent };

// ---------- API Principal ----------

export const AppShell: AppShellAPI = {
  mount: (container: HTMLElement) => _component?.mount?.(container),
  unmount: () => _component?.unmount?.(),
  getStatus: () => _component?.getStatus?.() || { mounted: false },
  isReady: () => _component?.isReady?.() ?? false,

  // Adapter especifico
  getAdapter: () => _component?.adapter || null,
  getLayoutManager: () => _component?.layoutManager || null,

  // Info
  info: () => ({ version: VERSION, moduleId: MODULE_ID, legacy: '/components/app-shell/index.js' })
};

// ---------- Funcoes de conveniencia ----------

export const mountAppShell = (container: HTMLElement): void | undefined => AppShell.mount(container);
export const unmountAppShell = (): void | undefined => AppShell.unmount();
export const getAppShellStatus = (): AppShellStatus => AppShell.getStatus();
export const isAppShellReady = (): boolean => AppShell.isReady();

export default AppShell;
