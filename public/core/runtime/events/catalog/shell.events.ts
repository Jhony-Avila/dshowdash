// Migrado para TypeScript: 2026-02-25
// Re-export from events-catalog.bundle.js (Lote 11)
export * from "./dist/events-catalog.bundle.js";

// Exports missing from bundle — defined in runtime.bundle.js
export const SHELL_INTENTS: Readonly<Record<string, string>> = Object.freeze({
  MOUNT_HEADER: "shell.header.mount.request",
  MOUNT_SIDEBAR: "shell.sidebar.mount.request",
  MOUNT_FOOTER: "shell.footer.mount.request",
  TOGGLE_SIDEBAR: "shell.sidebar.toggle.request"
});
