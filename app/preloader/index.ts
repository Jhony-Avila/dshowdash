// Migrado para TypeScript: 2026-02-25
'use strict';
// Preloader - Adapter Bridge v1.0.0-ENTERPRISE
// Bridge para /public/components/preloader/index.js

// ---------- Interfaces ----------

interface PreloaderStatus {
  visible: boolean;
  progress: number;
  [key: string]: unknown;
}

interface PreloaderInfo {
  version: string;
  moduleId: string;
  legacy: string;
}

interface PreloaderComponentType {
  show?: (message: string) => void;
  hide?: () => void;
  updateProgress?: (percent: number, message: string) => void;
  isVisible?: () => boolean;
  getStatus?: () => PreloaderStatus;
  mount?: (container: HTMLElement) => void;
  unmount?: () => void;
  [key: string]: unknown;
}

interface PreloaderAPI {
  show: (message: string) => void | undefined;
  hide: () => void | undefined;
  updateProgress: (percent: number, message: string) => void | undefined;
  isVisible: () => boolean;
  getStatus: () => PreloaderStatus;
  mount: (container: HTMLElement) => void | undefined;
  unmount: () => void | undefined;
  info: () => PreloaderInfo;
}

// ---------- Imports ----------

import PreloaderComponent from '/components/preloader/index.js';

const _component = PreloaderComponent as unknown as PreloaderComponentType | undefined;

// ---------- Constants ----------

export const VERSION: string = '1.0.0-ENTERPRISE';
export const MODULE_ID: string = 'preloader-adapter';

// Re-export tudo do componente legado
export * from '/components/preloader/index.js';
export { PreloaderComponent };

// ---------- API Principal ----------

export const Preloader: PreloaderAPI = {
  show: (message: string) => _component?.show?.(message),
  hide: () => _component?.hide?.(),
  updateProgress: (percent: number, message: string) => _component?.updateProgress?.(percent, message),
  isVisible: () => _component?.isVisible?.() ?? false,
  getStatus: () => _component?.getStatus?.() || { visible: false, progress: 0 },

  // Lifecycle
  mount: (container: HTMLElement) => _component?.mount?.(container),
  unmount: () => _component?.unmount?.(),

  // Info
  info: () => ({ version: VERSION, moduleId: MODULE_ID, legacy: '/components/preloader/index.js' })
};

// ---------- Funcoes de conveniencia ----------

export const showPreloader = (message: string): void | undefined => Preloader.show(message);
export const hidePreloader = (): void | undefined => Preloader.hide();
export const updatePreloaderProgress = (percent: number, message: string): void | undefined => Preloader.updateProgress(percent, message);
export const isPreloaderVisible = (): boolean => Preloader.isVisible();
export const getPreloaderStatus = (): PreloaderStatus => Preloader.getStatus();

export default Preloader;
