// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — defined in runtime.bundle.js
export const AUTH_DATA_ATTRIBUTES: Readonly<Record<string, string>> = Object.freeze({
  AUTH_READY: "data-auth-ready",
  AUTH_STATE: "data-state",
  USER_LEVEL: "data-user-level",
  USER_ID: "data-user-id"
});

export const LOGIN_MODAL_EVENTS: Readonly<Record<string, string>> = Object.freeze({
  OPEN: "login-modal.open",
  CLOSE: "login-modal.close",
  MOUNTED: "login-modal.mounted",
  UNMOUNTED: "login-modal.unmounted",
  READY: "login-modal.ready",
  SUBMIT: "login-modal.submit",
  CANCEL: "login-modal.cancel",
  ERROR: "login-modal.error",
  SUCCESS: "login-modal.success"
});

export const LOGIN_MODAL_INTENTS: Readonly<Record<string, string>> = Object.freeze({
  OPEN: "login-modal.open",
  CLOSE: "login-modal.close",
  SUBMIT: "login-modal.submit",
  CANCEL: "login-modal.cancel"
});
