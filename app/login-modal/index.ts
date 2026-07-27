// Migrado para TypeScript: 2026-02-25
'use strict';
// Login Modal - Adapter Bridge v1.0.0-ENTERPRISE
// Bridge para /public/components/login-modal/index.js

// ---------- Interfaces ----------

interface LoginModalStatus {
  open: boolean;
  [key: string]: unknown;
}

interface LoginModalInfo {
  version: string;
  moduleId: string;
  legacy: string;
}

interface LoginModalComponentType {
  show?: (source: string) => void;
  hide?: () => void;
  isOpen?: () => boolean;
  getStatus?: () => LoginModalStatus;
  mount?: (container: HTMLElement) => void;
  unmount?: () => void;
  [key: string]: unknown;
}

interface LoginModalAPI {
  show: (source: string) => void | undefined;
  hide: () => void | undefined;
  isOpen: () => boolean;
  getStatus: () => LoginModalStatus;
  mount: (container: HTMLElement) => void | undefined;
  unmount: () => void | undefined;
  info: () => LoginModalInfo;
}

// ---------- Imports ----------

import LoginModalComponent from '/components/login-modal/index.js';

const _component = LoginModalComponent as LoginModalComponentType | undefined;

// ---------- Constants ----------

export const VERSION: string = '1.0.0-ENTERPRISE';
export const MODULE_ID: string = 'login-modal-adapter';

// Re-export tudo do componente legado
export * from '/components/login-modal/index.js';
export { LoginModalComponent };

// ---------- API Principal ----------

export const LoginModal: LoginModalAPI = {
  show: (source: string) => _component?.show?.(source),
  hide: () => _component?.hide?.(),
  isOpen: () => _component?.isOpen?.() ?? false,
  getStatus: () => _component?.getStatus?.() || { open: false },

  // Lifecycle
  mount: (container: HTMLElement) => _component?.mount?.(container),
  unmount: () => _component?.unmount?.(),

  // Info
  info: () => ({ version: VERSION, moduleId: MODULE_ID, legacy: '/components/login-modal/index.js' })
};

// ---------- Funcoes de conveniencia ----------

export const showLoginModal = (source: string): void | undefined => LoginModal.show(source);
export const hideLoginModal = (): void | undefined => LoginModal.hide();
export const isLoginModalOpen = (): boolean => LoginModal.isOpen();
export const getLoginModalStatus = (): LoginModalStatus => LoginModal.getStatus();

export default LoginModal;
